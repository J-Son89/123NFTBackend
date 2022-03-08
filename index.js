const express = require("express");
const initialGameState = require("./gameState");
const app = express();
const { set, get, cloneDeep, findIndex } = require("lodash");
const {
  generateKey,
} = require("./util");
const querystring = require("querystring");
const router = express.Router();
var bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const io = require("socket.io")(http);
io.set("origins", "*:*");

const port = process.env.PORT || 5000;

const games = [];
const newGame = (gameId) => ({
  gameId: gameId ? gameId : generateKey(),
  ...cloneDeep(initialGameState),
});

const gameOne = newGame();
games.unshift(gameOne);

const state = {
  gameNumber: 0,
  nextGameId: gameOne.gameId,
};

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

app.get('getURLForFileUpload', (req, res) => {

})

const server = http.createServer({}, app).listen(port, () => {
  console.log("server running at " + port);
});
