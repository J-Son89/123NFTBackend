const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderId: {
    type: Number,
    required: true,
  },
  customerId: {
    required: Number,
    type: String,
  },
  customerName: {
    required: true,
    type: String,
  },
  customerEmail: {
    required: true,
    type: String,
  },
  orderDateTimeCreated: {
    required: true,
    type: Date,
  },
  orderStatus: {
    required: true,
    type: ["Quoted", "Paid", "Order_Delivered"],
  },
  orderDateTimeStatusLastUpdated: {
    required: true,
    type: Date,
  },
});

module.exports = mongoose.model("Order", orderSchema);
