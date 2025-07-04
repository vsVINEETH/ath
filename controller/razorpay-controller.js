const userModel = require("../models/user");
const Razorpay = require("razorpay");
const cartModel = require("../models/cart");
const httpStatus = require('../constants/status')
require("dotenv").config();

const razorpay = async (req, res) => {
  try {

    const index = req.session.checkoutIndex;
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    const userId = user._id;

    await cartModel
      .findOne({ user: userId })
      .populate("items.product");

      if (!index) {
        const address = true;
        return res.status(httpStatus.BAD_REQUEST).json({ address });
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

    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating order");
        return;
      }

      res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating Razorpay order");
  }
};

const razorpayWallet = (req, res) => {
  try {

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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating order");
        return;
      }
      res.send({ orderId: order.id });
    });

  } catch (error) {
    console.error("Error creating razorpayWallet:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating Razorpay order");
  }
}

const razorpayPaymentRetry = async (req, res) => {
  try {

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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating order");
        return;
      }
     return  res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error creating razorpayPaymentRetry", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error creating Razorpay order");
  }
}

module.exports = {
  razorpay,
  razorpayWallet,
  razorpayPaymentRetry
};
