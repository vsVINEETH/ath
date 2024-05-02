const userModel = require("../models/user");
const Razorpay = require("razorpay");
const productModel = require("../models/products");
const categoryModel = require("../models/category");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcrypt");


const razorpay = async (req, res) => {
  try {

    const index = req.session.checkoutIndex;
    const cartId = req.params.cart_id;

    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    const userId = user._id;

    const cartData = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

      if (!index) {
        const address = true;
        return res.status(400).json({ address });
      }

    const { amount } = req.body;
    const instance = new Razorpay({
      key_id: process.env.PAYMENT_KEY_ID,
      key_secret: process.env.PAYMENT_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    // Creating the order
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating order");
        return;
      }

      // Send the order ID to the frontend
      res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating Razorpay order");
  }
};

const razorpayWallet = (req, res) => {
  try {

    console.log("njjjjj")
    const { amount } = req.body;
    const instance = new Razorpay({
      key_id: process.env.PAYMENT_KEY_ID,
      key_secret: process.env.PAYMENT_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating order");
        return;
      }
      res.send({ orderId: order.id });
    });

  } catch (error) {
    console.error("Error creating razorpayWallet:", error);
    res.status(500).send("Error creating Razorpay order");
  }
}

const razorpayPaymentRetry = async (req, res) => {
  try {

    console.log('hello raz')
    const { amount } = req.body;
    const instance = new Razorpay({
      key_id: process.env.PAYMENT_KEY_ID,
      key_secret: process.env.PAYMENT_KEY_SECRET,
    });

    console.log("rmesh")
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    console.log('janu')
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating order");
        return;
      }
      console.log("set aanu")
     return  res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error creating razorpayPaymentRetry", error);
    res.status(500).send("Error creating Razorpay order");
  }
}

module.exports = {
  razorpay,
  razorpayWallet,
  razorpayPaymentRetry
};
