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

const addOrderDataToDatabase = async (orderID, orderData) => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  console.log(orderID);
  console.log(orderData.orderID);
  const orderDetails = {
    orderId: orderID,
    customerId: null,
    customerName: null,
    customerEmail: null,
    orderDateTimeCreated: Date.now(),
    orderStatus: "Quoted",
    orderDateTimeStatusLastUpdated: Date.now(),
    orderData,
    _id: String(orderID),
  };
  const newOrder = new Order(orderDetails);
  collection.insertOne(newOrder, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("New Customer Quote Received");
      client.close();
    }
  });
};

const markDatabaseOrderAsCancelled = async (orderId = "1234") => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
  };
  const newValues = {
    $set: {
      orderStatus: "Cancelled",
      orderDateTimeStatusLastUpdated: Date.now(),
    },
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Cancelled");
      client.close();
    }
  });
};

const markDatabaseOrderAsPaid = async (
  orderId = "1234",
  { customerId, customerName, customerEmail }
) => {
  const x = await client.connect();
  const updateObject = { customerId, customerName, customerEmail };

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
  };
  const newValues = {
    $set: Object.entries(updateObject).reduce(
      (acc, [key, val]) => (val ? { ...acc, [key]: val } : acc),
      {
        orderStatus: "Paid",
        orderDateTimeStatusLastUpdated: Date.now(),
      }
    ),
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Paid");
      client.close();
    }
  });
};

const markDatabaseOrderAsDelivered = async (
  orderId = "1234",
  customerId,
  customerName,
  customerEmail
) => {
  const x = await client.connect();
  const updateObject = { customerId, customerName, customerEmail };

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
  };
  const newValues = {
    $set: {
      orderStatus: "Delivered",
      orderDateTimeStatusLastUpdated: Date.now(),
    },
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Delivered");
      client.close();
    }
  });
};

module.exports = {
  addOrderDataToDatabase,
  markDatabaseOrderAsCancelled,
  markDatabaseOrderAsPaid,
  markDatabaseOrderAsDelivered,
};
