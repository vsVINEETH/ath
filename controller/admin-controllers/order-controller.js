const productModel = require("../../models/products");
const orderModel = require("../../models/order");
const walletModel = require("../../models/wallet");

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

      await productModel.findByIdAndUpdate(productId, {
        $inc: { quantity: quantity },
      });

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
  orderListAdmin,
  orderDetailAdmin,
  orderCancelAdmin,
  orderStatusAdmin,
  returnOrderAdmin,
};
