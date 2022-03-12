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
// const { addOrderDataToDatabase } = require("./database");
const stripe = require('stripe')('sk_test_51KQCr8Evk7QqcYLkQ3zj2bLMder2CwEeDg4aJrNLSoM8jF7mBFCSY7S8OJb0bqCOsod5N3Uk4HlBLnv00scsRRvf00iI6EhoEy')



const jsonParser = bodyParser.json()

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

app.use(bodyParser.json({ limit: '50mb' }));

const router = express.Router();


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


app.post('/createCheckoutSession', async (req, res) => {
  const orderDetails = req.body
  console.log(req.body, '======')

  collectionDetails: { collectionName: 'Katz', creator: 'James', totalImages: 2000 }
  imageUrlsMap,
    metadata,
    orderDetails: {
    metadata: { value }
    orderID: "1a5d44600110c0706d98b9720e14b168"

    projectLayersDepth: { hair: 0, face: 1, clothes: 2, background: 3 }

    uploadedFiles:


    const { collectionDetails: { totalImages } } = req.body
    const totalImages = get(req.body, ["collectionDetails", "totalImages"])
    const collectionName = get(req.body, ["collectionDetails", "collectionName"])
    const creatorName = get(req.body, ["collectionDetails", "creator"])

    const metadataFormat = get(req.body, ["orderDetails", "metadata", "value"])
    const metadata = get(req.body, 'metadata')


    const id = get(req.body, 'orderID')
    
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'T-shirt',
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      client_reference_id: '',
      mode: 'payment',
      success_url: 'https://123-nft.io',
      cancel_url: 'https://123-nft.io',

    });
    console.log(session)
    res.redirect(303, session.url);
  });



const server = http.createServer({}, app).listen(port, () => {
  console.log("server running at " + port);
});
