const express = require("express");
const app = express();
const { set, get, cloneDeep, findIndex } = require("lodash");
const { generateKey } = require("./util");
const querystring = require("query-string");
const router = express.Router();
var bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const { generateUploadURL, getURLPrefix } = require("./s3");
const { addOrderDataToDatabase } = require("./database");
const stripe = require('stripe');


const endpointSecret = "whsec_77d252ab0fc0973c4752267502b7a2aa7b922601408e0c7ffb563073e3ee2a5a";


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

app.use(function (req, res, next) {
  express.json();
  bodyParser.json();
  next();
});

app.get("/getURLPrefix", async (req, res) => {
  const urlPrefix = await getURLPrefix();

  res.send({ urlPrefix });
});

app.get("/getURLForFileUpload", async (req, res) => {
  const params = req.url.split("?");
  const fileName = params[1];
  console.log(fileName);
  const url = await generateUploadURL(fileName);

  res.send({ url });
});

app.post("/setCustomerOrderToQuoted", async (req, res) => {
  const data = req.data;
  const response = await addOrderDataToDatabase(data)

  res.send({ response });
});

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;
  console.log('22222sdas')

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  console.log('dasdasdas')
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('hallo', paymentIntent)
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

const server = http.createServer({}, app).listen(port, () => {
  console.log("server running at " + port);
});
