const userModel = require("../models/user");
const productModel = require("../models/products");
const categoryModel = require("../models/category");
const cartModel = require("../models/cart");
const wishListModel = require("../models/wish-list");
const httpStatus = require('../constants/status');

const wishList = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const categoryData = await categoryModel.find({is_listed:true});
    const categoryIds = categoryData.map(category => category._id);

    const productData = await productModel.find({is_listed:true,category: { $in: categoryIds }})
    const productIds = productData.map(product => product._id);

    const wishListData = await wishListModel
      .find({
        user: user._id,
        "items.product":{ $in: productIds }
      })
      .populate("items.product");

    return res.status(httpStatus.OK).render("user/wish-list", {
      errors: null,
      home: true,
      mes: "",
      wishListData: wishListData || [],
    });
  } catch (error) {
    console.error("Something happed to wishList entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const wishListAdd = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const wishListData = await wishListModel
      .find({
        user: user._id,
        "items.product": productId,
      })
      .populate("items.product");

    let limit = true;
    wishListData.forEach((wishListItem) => {
      wishListItem.items.forEach((item) => {
        if (item.product._id.toString() === productId.toString()) {
          limit = false;
        }
      });
    });

    if (limit) {
      await wishListModel.findOneAndUpdate(
        { user: user._id },
        {
          $push: {
            items: {
              product: productId,
              quantity: 1,
            },
          },
        },
        { upsert: true, new: true }
      );
      return res.redirect("/wish_list_view");
    }
    return res.redirect("/wish_list_view");
  } catch (error) {
    console.error("Something happed to wishListAdd entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const wishListAction = async (req, res) => {
  try {
    const productId = req.body.itemId;
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const wishListData = await wishListModel.findOneAndUpdate(
      { user: user._id, "items.product": productId },
      { $set: { "items.$.is_added": false } },
      { new: true }
    );

    if (!wishListData) {
      await wishListModel.findOneAndUpdate(
        { user: user._id },
        {
          $push: {
            items: {
              product: productId,
              quantity: 1,
              is_wish: true
            },
          },
        },
        { upsert: true, new: true }
      );
      return res.redirect("/wish_list_view");

    } else {
      await wishListModel.findOneAndUpdate(
        { user: user._id },
        {
          $pull: {
            items: {
              product: productId,
              quantity: 1,
            },
          },
        }
      );
      return res.redirect("/wish_list_view"), console.log("redirceting");
    }
  } catch (error) {
    console.error("Something happed to wishListAction entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const wishListRemove = async (req, res) => {
  try {
    const productId = req.params.item_id;
    const email = req.session.user;

    const user = await userModel.findOne({ email: email });

    await wishListModel.findOneAndUpdate(
      { user: user._id, "items.product": productId },
      { $pull: { items: { product: productId } } },
      { new: true }
    );

    const wishListData = await wishListModel
      .find({
        user: user._id,
      })
      .populate("items.product");

    return res.status(httpStatus.OK).render("user/wish-list", {
      home: true,
      mes: "",
      errors: null,
      wishListData,
    });
  } catch (error) {
    console.error("Error in wishListRemove:", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const wishListToCart = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const productData = await productModel.findById(productId);

    const cartItems = await cartModel
      .find({
        user: user._id,
        "items.product": productId,
      })
      .populate("items.product");

    let total = productData.price * 1 || 0;
    let productCount = 0;
    let productQuantity = 1;

    cartItems.forEach((cartItem) => {
      cartItem.items.forEach((item) => {
        if (item.product._id.toString() === productId.toString()) {
          productCount++;
          productQuantity += item.quantity;
        }
      });
    });

    if (productCount === 0 && productData.quantity > 0) {
      await cartModel.findOneAndUpdate(
        { user: user._id },
        {
          $push: {
            items: {
              product: productId,
              quantity: 1,
              total: total,
            },
          },
          $inc: {
            total_price: total,
            total_quantity: 1,
          },
        },
        { upsert: true, new: true }
      );

      return res.redirect("/product_cart");
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Error in whishListToCart:", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

module.exports = {
  wishList,
  wishListAction,
  wishListAdd,
  wishListToCart,
  wishListRemove,
};
