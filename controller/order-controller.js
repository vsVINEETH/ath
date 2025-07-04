const userModel = require("../models/user");
const productModel = require("../models/products");
const ratingModel = require("../models/rating");
const orderModel = require("../models/order");
const walletModel = require("../models/wallet");
const easyinvoice = require("easyinvoice");
const httpStatus = require('../constants/status')
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
      res.status(httpStatus.OK).render("user/orders-page", {
        home: true,
        mes: "",
        orderData: orderData || [],
      });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Something happed to orderDetail entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      return res.status(httpStatus.OK).render("user/orders-view", {
        home: true,
        mes: "",
        orderData: orderData || [],
      });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Something happed to orderDetail entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const ratingAndReview = async (req, res) => {
  try {
    const productId = req.params.product_id;
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const ratingDelete = async (req, res) => {
  try {
    const ratingId = req.params.rating_id;
    const productId = req.params.product_id;
    await ratingModel.findByIdAndDelete(ratingId);

    return res.redirect(`/product_detail/${productId}`)
  } catch (error) {
    console.error("Something happed to ratingDelete entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const retryOrderPayment = async (req, res) => {
  try {
    const paymentState = true;
    const orderId = req.body.order_id;
    const amount = req.body.amount;
    const status = req.body.status;

    if (status) {
      await orderModel.findOneAndUpdate(
        { _id: orderId },
        { "payment_details.payment_status": "completed" }
      );

      return res.status(httpStatus.OK).json(paymentState);
    } else {

      await orderModel.findOneAndUpdate(
        { _id: orderId },
        { "payment_details.payment_status": "failed" }
      );

      return res.status(httpStatus.OK).json(paymentState);
    }
  } catch (error) {
    console.error("Something happed to retryOrderPayment entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      price: Math.abs(product.total) /Math.abs(product.quantity) ,
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
};
