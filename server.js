const express = require("express");
const app = express();
const { get } = require("lodash");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const {
  generateUploadURL,
  getURLPrefix,
  generateDownloadURL,
} = require("./s3");
const {
  addOrderDataToDatabase,
  markDatabaseOrderAsCancelled,
  markDatabaseOrderAsPaid,
  markDatabaseOrderAsDelivered,
  getOrderDataFromDatabase,
  getOpenPaidOrdersFromDatabase,
} = require("./database");
const { createStripeSession } = require("./stripe");
const spawn = require("child_process").spawn;
const fetch = require("node-fetch");
const { getGeneratorEndpoint } = require("./generatorEndpoints");
const dotenv = require("dotenv");
const { sendEmail } = require("./email");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const jsonParser = bodyParser.json();

const port = process.env.PORT || 5000;

const whitelist = ["https://123-nft.io", "https://dashboard.stripe.com/"];

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", whitelist);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      if (!origin) return callback(null, true);
      if (whitelist.indexOf(origin) === -1) {
        var message =
          "The CORS policy for this origin doesn't " +
          "allow access from the particular origin.";
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  });
  next();
});

const router = express.Router();

app.get("/getURLPrefix", async (req, res) => {
  const urlPrefix = await getURLPrefix();

  res.send({ urlPrefix });
});

app.get(
  "/getURLForFileUpload",
  bodyParser.json({ limit: "5mb" }),
  async (req, res) => {
    const params = req.url.split("?");
    const fileName = params[1];
    const url = await generateUploadURL(fileName);

    res.send({ url });
  }
);

app.post(
  "/createCheckoutSession",
  bodyParser.json({ limit: "50mb" }),
  async (req, res) => {
    const totalImages = get(req.body, ["collectionDetails", "totalImages"]);
    const metadataFormat = get(req.body, ["orderDetails", "metadata", "value"]);
    const orderID = get(req.body, "orderID");

    const session = await createStripeSession(
      totalImages,
      metadataFormat,
      orderID
    );

    const result = await addOrderDataToDatabase(orderID, req.body);

    return res.send(session);
  }
);

const getEmailLinkText = ({ customerId, downloadLink }) => {
  return `Hi,\nThank you for ordering with 123NFT.\n\nYour order - #${customerId} can be downloaded at the following link: \n${downloadLink}. \n\n This link will remain valid for 7 days. \n\n Regards, \n\n 123NFT `;
};

const getEmailPaymnetFailedText = ({ customerId }) => {
  return `Hi,\nThank you for ordering with 123NFT.\n\nUnfortunately your payment method failed for your order - #${customerId}.\n\n Nothing will be charged to your account but please visit https://123-nft.io to create a new order\n\n Regards, \n\n 123NFT `;
};
const fulfillOrder = async (orderData, id) => {
  const result = await fetch(`${getGeneratorEndpoint()}/generateOrder`, {
    method: "POST",
    body: JSON.stringify({ data: orderData }),
    headers: { "Content-Type": "application/json" },
  });
  await markDatabaseOrderAsDelivered(id);
  const collectionName = get(
    orderData,
    ["orderData", "collectionDetails", "collectionName"],
    id
  );
  const s3Key = `${id}/order/${collectionName}.zip`;
  const downloadLink = await generateDownloadURL(s3Key);
  await sendEmail({
    to: orderData.customerEmail,
    subject: "Your NFT Collection is ready",
    text: getEmailLinkText({
      customerId: orderData.customerId,
      downloadLink: String(downloadLink),
    }),
  });
};

const changeOrderToPaidAndFulfill = async (session) => {
  const id = get(session, ["client_reference_id"]);
  const email = get(session, ["customer_details", "email"]);
  const customerId = get(session, ["customer"]);

  const orderData = await markDatabaseOrderAsPaid(id, {
    customerId: customerId,
    customerName: undefined,
    customerEmail: email,
  });

  await fulfillOrder(orderData, id);
};

const cancelOrder = async (session) => {
  const id = get(session, ["client_reference_id"]);
  await markDatabaseOrderAsCancelled(id);
};

const emailCustomerAboutFailedPayment = async (session) => {
  await cancelOrder(session);
  const id = get(session, ["client_reference_id"]);
  const email = get(session, ["customer_details", "email"]);
  const customerId = get(session, ["customer"]);

  await sendEmail({
    to: email,
    subject: "Payment Method Failed",
    text: getEmailPaymnetFailedText({
      customerId: customerId,
    }),
  });
};

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;
    console.log(request);

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_ENDPOINT_SECRET
      );
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(event);
    // Handle the event

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.payment_status === "paid") {
          changeOrderToPaidAndFulfill(session);
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        changeOrderToPaidAndFulfill(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        emailCustomerAboutFailedPayment(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        cancelOrder(session);
      }
    }
    response.json({ received: true });
    response.status(200);
  }
);

const server = http.createServer({}, app).listen(port, async () => {
  console.log("server running at " + port);

  const openOrders = await getOpenPaidOrdersFromDatabase();
  for (const order of openOrders) {
    const id = get(order, "_id");
    const orderData = await getOrderDataFromDatabase(id);
    await fulfillOrder(orderData, id);
  }
});
