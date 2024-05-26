const userModel = require("../models/user");
const productModel = require("../models/products");
const ratingModel = require("../models/rating");
const categoryModel = require("../models/category");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const walletModel = require("../models/wallet");
const nodemailer = require("nodemailer");
const easyinvoice = require("easyinvoice");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { trusted } = require("mongoose");

const orderHistory = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const userId = user._id;

    const orderData = await orderModel
      .find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    if (orderData) {
      res.render("user/orders-page", {
        home: true,
        mes: "",
        orderData: orderData || [],
      });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Something happed to orderDetail entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const orderDetail = async (req, res) => {
  try {
    req.session.orderId = req.params.order_id;
    const orderId = req.session.orderId;

    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const userId = user._id;

    const orderData = await orderModel
      .find({ user: userId, _id: orderId })
      .populate("items.product");

    if (orderData) {
      return res.render("user/orders-view", {
        home: true,
        mes: "",
        orderData: orderData || [],
      });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Something happed to orderDetail entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const orderCancel = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const itemId = req.params.item_id;
    const orderId = req.session.orderId;
    const cancelReason = req.body.cancelReason.toUpperCase();
    const otherReason = req.body.otherCancelReason;
    let actualReason = cancelReason + "," + otherReason;

    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const userId = user._id;

    const orderData = await orderModel.findOneAndUpdate(
      { user: userId, _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.status": "cancelled",
          "items.$.cancellation_reason": actualReason,
        },
      },

      { new: true }
    );

    let productQuantity = 0;
    let cancellAmount = 0;
    orderData.items.forEach((item) => {
      if (item._id.toString() === itemId) {
        productQuantity = item.quantity;
        cancellAmount = item.total;
      }
    });

    await orderModel.findOneAndUpdate(
      { _id: orderId, "items._id": itemId },
      {$set:{"items.$.quantity":-productQuantity, "items.$.total":-cancellAmount}}
    )

    await walletModel.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: cancellAmount },
        $push: {
          transactions: {
            type: "credited",
            amount: cancellAmount,
            description: "Product cancelled",
          },
        },
      },

      { upsert: true, new: true }
    );

    await productModel.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: productQuantity } }, // Increase quantity
      { new: true }
    );

    if (orderData) {
      return res.redirect("/order_history");
    }

  } catch (error) {
    console.error("Something happed to orderCancel entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const orderReturn = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const itemId = req.params.item_id;
    const orderId = req.session.orderId;
    const returnReason = req.body.returnReason.toUpperCase();
    const otherReason = req.body.otherReturnReason;
    let actualReason = returnReason + "," + otherReason;

    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const userId = user._id;

     await orderModel.findOneAndUpdate(
      { user: userId, _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.status": "return_requested",
          "items.$.return_reason": actualReason,
        },
      },

      { new: true }
    );

    return res.redirect("/order_history");
  } catch (error) {
    console.error("Something happed to orderReturn entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const ratingAndReview = async (req, res) => {
  try {
    console.log("hello");
    const productId = req.params.product_id;
    console.log(productId)
    const rating = req.body.rating * 1 || 5;
    const review = req.body.reviewComment.toString() || "good";
    const email = req.session.user; 

    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.redirect("/home");
    }

    const existingRating = await ratingModel.findOne({
      product: productId
    });

    if (existingRating) {
      await ratingModel.findOneAndUpdate(
        { product: productId, user: user._id },
        { rating: rating, review: review }
      );

      return res.redirect(`/product_detail/${productId}`);
    } else {
     
      const newRating = new ratingModel({
        product: productId,
        user: user._id,
        rating: rating,
        review: review,
      });

      await newRating.save();
      return res.redirect(`/product_detail/${productId}`);
    }

  } catch (error) {
    console.error("Something happed to ratingAndReview entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const ratingDelete = async (req, res) => {
  try {
    console.log('hello vineeth delete', req.params.rating_id)
    const ratingId = req.params.rating_id
    const productId = req.params.product_id
    const ratingData = await ratingModel.findByIdAndDelete(ratingId)
     return res.redirect(`/product_detail/${productId}`)
  } catch (error) {
    console.error("Something happed to ratingDelete entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const retryOrderPayment = async (req, res) => {
  try {
    console.log("hel waht");
    const paymentState = true;
    const orderId = req.body.order_id;
    const amount = req.body.amount;
    const status = req.body.status;

    if (status) {
      console.log("vanakkam");
      await orderModel.findOneAndUpdate(
        { _id: orderId },
        { "payment_details.payment_status": "completed" }
      );

      return res.json(paymentState);
    } else {
      console.log("namasthe");
      await orderModel.findOneAndUpdate(
        { _id: orderId },
        { "payment_details.payment_status": "failed" }
      );

      return res.json(paymentState);
    }
  } catch (error) {
    console.error("Something happed to retryOrderPayment entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const downloadOrderInvoice = async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const orderData = await orderModel
      .findOne({ _id: orderId })
      .populate("items.product");

    // Prepare invoice data
    const products = orderData.items.map((product) => ({
      quantity: Math.abs(product.quantity),
      description: product.product.product_name + " " + product.product.model,
      price: Math.abs(product.total) /Math.abs(product.quantity) , // dividing by quantity to get unit price
      total: Math.abs(product.total),
    }));

    // Prepare invoice data
    const data = {
      sender: {
        company: "ath.",
        email: "ath@gmail.com",
        address: "ath. Trivandrum, kerala, India",
        zip: "605036",
        city: "Thiruvananthapuram",
        state: "Kerala",
        country: "India",
      },
      client: {
        company: orderData.shipping_address.full_name,
        address: "Shipping address",
        zip: orderData.shipping_address.zip_code,
        city: orderData.shipping_address.city,
        country: orderData.shipping_address.country,
      },
      information: {
        number: orderData._id.toString().slice(-6),
        date: orderData.createdAt.toLocaleDateString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      },
      products: products,
      bottomNotice: "Happy shopping.",
      settings: {
        currency: "INR",
      },
    };

    // Create the invoice
    easyinvoice.createInvoice(data, function (result) {
      // Convert base64 encoded PDF to buffer
      const pdfBuffer = Buffer.from(result.pdf, "base64");

      // Stream the buffer to response for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment;filename=invoice.pdf");
      res.send(pdfBuffer);
    });
  } catch (error) {
    console.error(
      "Something happed to downloadOrderInvoice entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};

const orderListAdmin = async (req, res) => {
  try {
    const orderData = await orderModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.render("admin/order-list", {
      orderData: orderData || [],
    });
  } catch (error) {
    console.error("Something happed to orderListAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const orderDetailAdmin = async (req, res) => {
  try {
    req.session.adOrderId = req.params.order_id;

    const orderId = req.session.adOrderId;

    const orderData = await orderModel
      .find({ _id: orderId })
      .populate("items.product");
    res.render("admin/order-detail", {
      orderData: orderData || [],
    });
  } catch (error) {
    console.error("Something happed to orderDetailAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const orderCancelAdmin = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const itemId = req.params.item_id;
    const orderId = req.session.adOrderId;
    console.log(productId, itemId, orderId);

    const orderData = await orderModel.findOneAndUpdate(
      { _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.status": "cancelled",
        },
      },

      { new: true }
    );

    let productQuantity = 0;
    let cancellAmount = 0;
    const userId = orderData.user;
    
    orderData.items.forEach((item) => {
      if (item._id.toString() === itemId) {
        productQuantity = item.quantity;
        cancellAmount = item.total;
      }
    });

    await orderModel.findOneAndUpdate(
      { _id: orderId, "items._id": itemId },
      {$set:{"items.$.quantity":-productQuantity, "items.$.total":-cancellAmount}}
    )

    await walletModel.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: cancellAmount },
        $push: {
          transactions: {
            type: "credited",
            amount: cancellAmount,
            description: "Product cancelled",
          },
        },
      },

      { upsert: true, new: true }
    );

    await productModel.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: productQuantity } }, // Increase quantity
      { new: true }
    );

    if (orderData) {
      return res.redirect("/admin/order_list");
    }
    console.log(orderData);
  } catch (error) {
    console.error("Something happed to orderCancelAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const orderStatusAdmin = async (req, res) => {
  try {
    const itemId = req.body.itemId;
    const newStatus = req.body.newStatus.toString();
    const orderId = req.body.orderId;
    const productId = req.body.productId || 1;//it is only for return 
    
    console.log(orderId, newStatus, itemId, productId);

    if (newStatus == "returned") {
      const orderData = await orderModel
        .findOne({ _id: orderId, "items._id": itemId })
        .populate("items.product");

      let quantity = 0;
      let amount = 0;

      const userId = orderData.user;

      orderData.items.forEach((item) => {
        if (item.product._id == productId) {
          quantity = item.quantity;
          amount = item.total;
        }
      });

      await orderModel.findOneAndUpdate(
        {
          _id: orderId,
          "items._id": itemId,
        },
        {
          $set: {
            "items.$.status": newStatus,
            "items.$.return_amount": amount,
            "items.$.return_quantity": quantity,
          },
        }
      );

      await orderModel.findOneAndUpdate(
        { _id: orderId, "items._id": itemId },
        {$set:{"items.$.quantity":-quantity, "items.$.total":-amount}}
      )

      const productData = await productModel.findByIdAndUpdate(productId, {
        $inc: { quantity: quantity },
      });
      // toWallet = items.total
      await walletModel.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              type: "credited",
              amount: amount,
              description: "Order returned",
            },
          },
        },

        { upsert: true, new: true }
      );
    }

    await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        "items._id": itemId,
      },
      {
        $set: { "items.$.status": newStatus },
      }
    );

    return res.redirect("/admin/order_list");
  } catch (error) {
    console.error("Something happed to orderStatusAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const returnOrderAdmin = async (req, res) => {
  try {
    const orderData = await orderModel.find({}).populate("items.product");
    res.render("admin/return-detail", {
      orderData: orderData || [],
    });
  } catch (error) {
    console.error("Something happed to returnOrderAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

module.exports = {
  orderHistory,
  orderDetail,
  orderCancel,
  orderReturn,
  ratingAndReview,
  ratingDelete,
  retryOrderPayment,
  downloadOrderInvoice,

  orderListAdmin,
  orderDetailAdmin,
  orderCancelAdmin,
  orderStatusAdmin,
  returnOrderAdmin,
};
