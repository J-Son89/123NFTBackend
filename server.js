const express = require("express");
const app = express();
const { get } = require("lodash");
const bodyParser = require("body-parser");
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
  markDatabaseOrderAsFulfilling,
} = require("./database");
const { createStripeSession } = require("./stripe");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const { sendEmail } = require("./email");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const frontendURL = process.env.FRONTEND_URL;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", frontendURL);

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

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
    res.setHeader("Access-Control-Allow-Origin", frontendURL);

    return res.send(session);
  }
);

app.post(
  "/orderComplete",
  bodyParser.json({ limit: "5mb" }),
  async (req, res) => {
    const orderID = get(req.body, "orderID");

    res.setHeader("Access-Control-Allow-Origin", process.env.GENERATE_URL);

    const orderData = await markDatabaseOrderAsDelivered(orderID);
    const collectionName = get(orderData, [
      "orderData",
      "collectionDetails",
      "collectionName",
    ]);
    const s3Key = `${orderID}/order/${collectionName}.zip`;
    const downloadLink = await generateDownloadURL(s3Key);
    await sendEmail({
      to: orderData.customerEmail,
      subject: "Your NFT Collection is ready",
      text: getEmailLinkText({
        customerId: orderData.customerId,
        downloadLink: String(downloadLink),
      }),
    });
    response.json({ received: true });
    response.status(200);
  }
);

const getEmailLinkText = ({ customerId, downloadLink }) => {
  return `Hi,\nThank you for ordering with 123NFT.\n\nYour order - #${customerId} can be downloaded at the following link: \n${downloadLink}. \n\n This link will remain valid for 7 days. \n\n Regards, \n\n 123NFT `;
};

const getEmailPaymnetFailedText = ({ customerId }) => {
  return `Hi,\nThank you for ordering with 123NFT.\n\nUnfortunately your payment method failed for your order - #${customerId}.\n\n Nothing will be charged to your account but please visit https://123-nft.io to create a new order\n\n Regards, \n\n 123NFT `;
};

const fulfillOrder = async (orderData, id) => {
  const result = await fetch(`${process.env.GENERATE_URL}/generateOrder`, {
    method: "POST",
    body: JSON.stringify({ data: orderData }),
    headers: { "Content-Type": "application/json" },
  });
  if (get(result, "status") !== 200) {
    return sendEmail({
      to: process.env.ADMIN_EMAIL_ACC,
      subject: `Issue with order id: ${id}`,
      text: JSON.stringify(result),
    });
  }
  if (get(orderData, "orderStatus") == "Paid") {
    await sendEmail({
      to: orderData.customerEmail,
      subject: `Your Order with 123NFT has been received`,
      text: `Your Order (#${id}) of ${get(orderData, [
        "orderData",
        "collectionDetails",
        "totalImages",
      ])} images and ${get(orderData, [
        "orderData",
        "orderDetails",
        "metadata",
        "value",
      ])} metadata is being processed and will be with you shortly.\n\nThanks,\n123NFT`,
    });
    markDatabaseOrderAsFulfilling(id);
  }
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
