const userModel = require("../models/user");
const productModel = require("../models/products");
const cartModel = require("../models/cart");
const couponModel = require("../models/coupon");
const httpStatus = require('../constants/status')
require("dotenv").config();

const productCart = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const couponData = await couponModel.find({status:"active"});

    const cartData = await cartModel
      .find({ user: user._id })
      .populate("items.product");

    if (cartData) {
      return res.status(httpStatus.OK).render("user/product-cart", {
        errors: null,
        home: true,
        mes: "",
        cartData: cartData || [],
        couponData,
      });
    }
  } catch (error) {
    console.error("Something happed to productCart entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const productCartAdd = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const productData = await productModel.findById(productId);

    const cartItems = await cartModel
      .find({ user: user._id, "items.product": productId,})
      .populate("items.product");

    let total = productData.price * 1 || 0;
    let productCount = 0;
    let limit = false;
    let productQuantity = 1;
    cartItems.forEach((cartItem) => {
      cartItem.items.forEach((item) => {
        if (item.product._id.toString() === productId.toString()) {
          productCount++;
          productQuantity += item.quantity;
          if (item.quantity === 5) {
            limit = true;
            productQuantity += item.quantity;
          }
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

    const cartData = await cartModel
    .find({ user: user._id })
    .populate("items.product");

      if(cartData !== null && cartData !== undefined && cartData[0]?.applied_coupon == true ){

      for (const cartItem of cartData) {
        for (const item of cartItem.items) {
          if (item.product._id == productId) {

            let productPrice = item.product.price;
            let eachDiscount = item.each_discount;
            let itemTotal = item.total
            let discountPercentage = cartItem.discount_percentage;
            let newTotalPrice = 0;
            let newCartTotal = 0;
            let newDiscountAmount = 0;

            if(discountPercentage !== 0){
              let newTotal = Math.round(productPrice * 1)

              eachDiscount = Math.round(newTotal * discountPercentage)

              newDiscountAmount = Math.round(eachDiscount / 1)
              newTotalPrice = newTotal - eachDiscount;
              newCartTotal = Math.round(newTotalPrice - itemTotal)

            }else{
              newTotalPrice = productPrice;
              newCartTotal = productPrice;
            }
            await cartModel.updateOne(
              { _id: cartItem._id, "items._id": item._id },
              {
                $set:{
                  "items.$.total": newTotalPrice,
                  "items.$.each_discount": eachDiscount
                },
                $inc: {
                   total_price: newCartTotal,
                   discount_amount: newDiscountAmount,
                },
              },
              { upsert: true, new: true }
            );

            break;

          }
        }
      }
      return res.redirect("/product_cart");
    }

      return res.redirect("/product_cart");

    } else if (productCount !== 0 && !limit && productData.quantity > 0 && productQuantity <= productData.quantity) {

      const cartData = await cartModel
      .find({ user: user._id })
      .populate("items.product");
  
      if(cartData[0]?.applied_coupon === true ){

      for (const cartItem of cartData) {
        for (const item of cartItem.items) {
          if (item.product._id.toString() === productId) {

            let productPrice = item.product.price;
            let productCartCount = item.quantity;
            let eachDiscount = item.each_discount;
            let discountPercentage = cartItem.discount_percentage;
            let newTotalPrice = 0;
            let newCartTotal = 0;
            let newDiscountAmount = 0;

            if(discountPercentage !== 0){

              let newTotal = Math.round(productPrice * (productCartCount+1))

              eachDiscount = Math.round(newTotal * discountPercentage)
              
              newDiscountAmount = Math.round(eachDiscount /(productCartCount+1) )
              newTotalPrice = newTotal - eachDiscount;
              newCartTotal = Math.round(newTotalPrice / (productCartCount+1))

            }else{
              newTotalPrice = productPrice;
              newCartTotal = productPrice;
            }

            await cartModel.updateOne(
              { _id: cartItem._id, "items._id": item._id },
              {
                $inc: {
                  "items.$.quantity": 1,
                   total_price: newCartTotal,
                   discount_amount: newDiscountAmount,
                   total_quantity: 1,

                },
                $set:{
                  "items.$.total": newTotalPrice,
                  "items.$.each_discount": eachDiscount
                }
              },
              { new: true }
            );
            break;

          }
        }
      }

      return res.redirect("/product_cart");
    }

      await cartModel.findOneAndUpdate(
        { user: user._id, "items.product": productId },
        {
          $inc: {
            "items.$.quantity": 1,
            "items.$.total": total,
            total_price: total,
            total_quantity: 1,
          },
        },
        { new: true }
      );
      
      return res.redirect("/product_cart");
      
    } else {
      let productLimit = true;
      return res.redirect("/product_cart?productLimit=" + productLimit);
    }
  } catch (error) {
    console.error("Something happed to productCartAdd entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const productQuantityUpdate = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const quantityChange = parseInt(req.query.quantityChange);

    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const cartItems = await cartModel
      .find({ user: user._id })
      .populate("items.product");

    // Loop through cart items and update quantity for matching product
    for (const cartItem of cartItems) {
      for (const item of cartItem.items) {
        if (item.product._id.toString() === productId) {
          let productPrice = item.product.price;
          let productCartCount = item.quantity;
          let productCount = item.product.quantity;
          let currentQuantity = item.quantity;
          let eachDiscount = item.each_discount;
          let discountPercentage = cartItem.discount_percentage;

          if (quantityChange < 0 && currentQuantity > 1 && productCount >= 1) {

            let newTotalPrice = 0;
            let newCartTotal = 0;
            let newDiscountAmount = 0;
            if(discountPercentage !== 0){

              let newTotal = Math.round(productPrice * (productCartCount-1))

              eachDiscount = Math.floor(newTotal * discountPercentage)
              newDiscountAmount = Math.ceil(eachDiscount /(productCartCount-1) )
              newTotalPrice = newTotal - eachDiscount;
              newCartTotal = Math.floor(newTotalPrice / (productCartCount-1))

            }else{

              newTotalPrice = productPrice;
              newCartTotal = productPrice;

              await cartModel.updateOne(
                { _id: cartItem._id, "items._id": item._id },
                {
                  $inc: {
                    "items.$.quantity": quantityChange,
                    "items.$.total": -productPrice,
                    total_price: -productPrice,
                    total_quantity: quantityChange,
                  },
                },
                { new: true }
              );
              break;
            }

            await cartModel.updateOne(
              { _id: cartItem._id, "items._id": item._id },
              {
                $inc: {
                  "items.$.quantity": quantityChange,
                  total_price: -newCartTotal,
                  discount_amount: -newDiscountAmount,
                  total_quantity: quantityChange,
                  
                },
                $set:{
                  "items.$.total": newTotalPrice,
                  "items.$.each_discount": eachDiscount
                }
              },
              { new: true }
            );
            break; // Exit inner loop after updating the matching product

          } else if (
            quantityChange > 0 &&
            currentQuantity <= 4 &&
            productCount >= 1 &&
            currentQuantity < productCount
          ) {

            let newTotalPrice = 0;
            let newCartTotal = 0;
            let newDiscountAmount = 0;
            if(discountPercentage !== 0){

              let newTotal = Math.round(productPrice * (productCartCount+1))

              eachDiscount = Math.floor(newTotal * discountPercentage);
              newDiscountAmount = Math.ceil(eachDiscount /(productCartCount+1) );
              newTotalPrice = newTotal - eachDiscount;
              newCartTotal = Math.floor(newTotalPrice / (productCartCount+1));
            }else{

              newTotalPrice = productPrice;
              newCartTotal = productPrice;

              await cartModel.updateOne(
                { _id: cartItem._id, "items._id": item._id },
                {
                  $inc: {
                    "items.$.quantity": quantityChange,
                    "items.$.total": productPrice,
                    total_price: productPrice,
                    total_quantity: quantityChange,
                  },
                },
                { new: true }
              );
              break;
            }
          
            await cartModel.updateOne(
              { _id: cartItem._id, "items._id": item._id },
              {
                $inc: {
                  "items.$.quantity": quantityChange,
                   total_price: newCartTotal,
                   discount_amount: newDiscountAmount,
                  total_quantity: quantityChange,

                },
                $set:{
                  "items.$.total": newTotalPrice,
                  "items.$.each_discount": eachDiscount
                }
              },
              { new: true }
            );
            break;

          } else {
            let productLimit = true;
            return res.status(httpStatus.BAD_REQUEST).json({productLimit:productLimit});
          }
        }
      }
    }

    const cartData = await cartModel
      .find({ user: user._id ,"items.product":productId})
      .populate("items.product");

    if (cartData) {
      const couponData = await couponModel.find({});
      let updatedCartData = {
        cartData : cartData || [],
        couponData: couponData || []
      }
      res.json(updatedCartData);
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.error("Error in productQuantityUpdate:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).render("user/error-page");
  }
};

const productCartRemove = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const cartItems = await cartModel
      .find({
        user: user._id,
        "items.product": productId,
      })
      .populate("items.product");

    let productTotalPrice = 0;
    let productQuantity = 0;
    let totalDiscount = 0;
    let cartId = null;
    let itemslength = null;

    cartItems.forEach((cartItem) => {
      cartId = cartItem._id;
      itemslength = cartItem.items.length;
      cartItem.items.forEach((item) => {
        if (item.product._id.toString() === productId.toString()) {
          productTotalPrice = item.total//item.product.price * item.quantity;
          productQuantity = item.quantity;
          totalDiscount = item.each_discount;
        }
      });
    });

    if (cartItems.length == itemslength) {

      await cartModel.findByIdAndDelete(cartId);
      return res.redirect("/product_cart");
    }

    await cartModel.findOneAndUpdate(
      { user: user._id },
      {
        $pull: { items: { product: productId } },
        $inc: {
          discount_amount : -totalDiscount,
          total_price: -productTotalPrice,
          total_quantity: -productQuantity,
        },
      },
      { new: true }
    );

    return res.redirect("/product_cart");
  } catch (error) {
    console.error("Something happed to productCartRemove entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

module.exports = {
  productCart,
  productCartAdd,
  productCartRemove,
  productQuantityUpdate,
};
