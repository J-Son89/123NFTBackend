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

// const io = require("socket.io")(http);
// io.set("origins", "*:*");

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

const server = http.createServer({}, app).listen(port, () => {
  console.log("server running at " + port);
});
