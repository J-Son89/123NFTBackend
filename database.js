const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const Order = require("./models/Order");
dotenv.config();

const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const addOrderDataToDatabase = ({}) => {
  client.connect((err) => {
    const collection = client.db("test").collection("devices");
    const orderDetails = {
      orderId: {},
      customerId: {},
      customerName: {},
      customerEmail: {},
      orderDateTimeCreated: {},
      orderStatus: "Quoted",
      orderDateTimeStatusLastUpdated: {},
    };
    const newOrder = new Order(orderDetails);

    // perform actions on the collection object
    client.close();
  });
};

module.exports = {
  addOrderDataToDatabase,
};
