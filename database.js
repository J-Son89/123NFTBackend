const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const Order = require("./models/Order");
dotenv.config();

const PAID = "Paid";
const FULFILLING = "Fulfilling";
const QUOTED = "Quoted";
const DELIVERED = "Delivered";

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
    orderStatus: QUOTED,
    orderDateTimeStatusLastUpdated: Date.now(),
    orderData: orderData,
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
  orderId,
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
        orderStatus: PAID,
        orderDateTimeStatusLastUpdated: Date.now(),
      }
    ),
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Paid");
    }
  });
  return collection
    .findOne(query)
    .then((result) => {
      if (result) {
        console.log(`Successfully found document: ${result}.`);
      } else {
        console.log("No document matches the provided query.");
      }
      client.close();

      return result;
    })
    .catch((err) => {
      client.close();

      console.error(`Failed to find document: ${err}`);
    });
};

const markDatabaseOrderAsDelivered = async (orderId) => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
    orderStatus: FULFILLING,
  };
  const newValues = {
    $set: {
      orderStatus: DELIVERED,
      orderDateTimeStatusLastUpdated: Date.now(),
    },
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Delivered");
    }
  });
  return collection
    .findOne({
      _id: String(orderId),
      orderStatus: PAID,
    })
    .then((result) => {
      if (result) {
        console.log(`Successfully found document: ${result}.`);
      } else {
        console.log("No document matches the provided query.");
      }
      return result;
    })
    .catch((err) => console.error(`Failed to find document: ${err}`));
};

const markDatabaseOrderAsFulfilling = async (orderId) => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
    orderStatus: PAID,
  };
  const newValues = {
    $set: {
      orderStatus: FULFILLING,
      orderDateTimeStatusLastUpdated: Date.now(),
    },
  };
  collection.updateOne(query, newValues, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Customer Order Being Processed");
      client.close();
    }
  });
};

const getOrderDataFromDatabase = async (orderId = "1234") => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  const query = {
    _id: String(orderId),
  };

  return collection
    .findOne(query)
    .then((result) => {
      if (result) {
        console.log(`Successfully found document: ${result}.`);
      } else {
        console.log("No document matches the provided query.");
      }
      return result;
    })
    .catch((err) => console.error(`Failed to find document: ${err}`));
};

const getOpenPaidOrdersFromDatabase = async () => {
  const x = await client.connect();

  const collection = client.db("Development").collection("Orders");
  const query = {
    $or: [
      {
        orderStatus: PAID,
      },
      {
        orderStatus: FULFILLING,
      },
    ],
  };

  const orders = await collection.find(query).toArray();
  client.close();

  return orders;
};

module.exports = {
  addOrderDataToDatabase,
  markDatabaseOrderAsCancelled,
  markDatabaseOrderAsPaid,
  markDatabaseOrderAsDelivered,
  getOrderDataFromDatabase,
  getOpenPaidOrdersFromDatabase,
  markDatabaseOrderAsFulfilling,
};
