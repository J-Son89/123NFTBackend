const express = require("express");
const app = express();
const { set, get, cloneDeep, findIndex } = require("lodash");
const { generateKey } = require("./util");
const querystring = require("query-string");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
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

const stripe = require("stripe")(
  "sk_test_51KQCr8Evk7QqcYLkQ3zj2bLMder2CwEeDg4aJrNLSoM8jF7mBFCSY7S8OJb0bqCOsod5N3Uk4HlBLnv00scsRRvf00iI6EhoEy"
);

const jsonParser = bodyParser.json();

const port = process.env.PORT || 5000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
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

const emailCustomerAboutOrderFulfilled = (email, or) => {};

app.post(
  "/orderGenerated",
  bodyParser.json({ limit: "5mb" }),
  async (req, res) => {
    const orderId = id;
    const orderData = await getOrderDataFromDatabase(get(order, "_id"));
    const { customerEmail } = orderData;
    console.log("get link for customer", link);

    console.log("email", customerEmail);
    console.log("update database to complete", customerEmail);

    // const fileName = params[1];
    // const url = await generateUploadURL(fileName);

    response.status(200);
  }
);

const getEmailLinkText = ({customerId, downloadLink}) =>{
  return `Hi, thank you for your ordering with 123NFT.\n Your order - ${customerId} can be download at the following link: \n${downloadLink}. \n This link will remain valid for 7 days. \n Regards, \n 123NFT `
  
  
}

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
    text: String(downloadLink),
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
  console.log("Creating order", session);
};

const emailCustomerAboutFailedPayment = (session) => {
  console.log("Emailing customer", session);
};

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (request, response) => {
    console.log("dsadsa");

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

        // Fulfill the purchase...
        changeOrderToPaidAndFulfill(session);

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;

        // Send an email to the customer asking them to retry their order
        emailCustomerAboutFailedPayment(session);

        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;

        cancelOrder(session);
        console.log("session expired");
      }
    }
    // Return a 200 response to acknowledge receipt of the event
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
