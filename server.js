const express = require("express");
const app = express();
const { set, get, cloneDeep, findIndex } = require("lodash");
const { generateKey } = require("./util");
const querystring = require("query-string");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const { generateUploadURL, getURLPrefix } = require("./s3");
const {
  addOrderDataToDatabase,
  markDatabaseOrderAsCancelled,
  markDatabaseOrderAsPaid,
  markDatabaseOrderAsDelivered,
} = require("./database");
const { createStripeSession } = require("./stripe");
const dotenv = require("dotenv");

dotenv.config();

const stripe = require("stripe")(
  "sk_test_51KQCr8Evk7QqcYLkQ3zj2bLMder2CwEeDg4aJrNLSoM8jF7mBFCSY7S8OJb0bqCOsod5N3Uk4HlBLnv00scsRRvf00iI6EhoEy"
);

const jsonParser = bodyParser.json();

const port = process.env.PORT || 5000;

app.get("/", (request, response) => {
  response.send("Hello from Express!");
});

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

const fulfillOrder = async (session) => {
  const id = get(session, ["client_reference_id"]);
  const email = get(session, ["customer_details", "email"]);
  const customerId = get(session, ["customer"]);

  await markDatabaseOrderAsPaid(id, {
    customerId: customerId,
    customerName: undefined,
    customerEmail: email,
  });
  console.log("Fulfilling order", session);
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
    const sig = request.headers["stripe-signature"];

    let event;

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
          fulfillOrder(session);
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;

        // Fulfill the purchase...
        fulfillOrder(session);

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;

        // Send an email to the customer asking them to retry their order
        emailCustomerAboutFailedPayment(session);

        break;
      }
      case "checkout.session.expired": {
        cancelOrder(session);
        console.log("session expired");
      }
    }

    response.status(200);
  }
);

const server = http.createServer({}, app).listen(port, () => {
  console.log("server running at " + port);
});
