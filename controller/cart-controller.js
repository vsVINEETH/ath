const userModel = require("../models/user");
const Razorpay = require("razorpay");
const productModel = require("../models/products");
const categoryModel = require("../models/category");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const couponModel = require("../models/coupon");
const walletModel = require("../models/wallet");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcrypt");



const productCart = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });
    const couponData = await couponModel.find({status:"active"});

    const cartData = await cartModel
      .find({ user: user._id })
      .populate("items.product");

    if (cartData) {
      return res.render("user/product-cart", {
        errors: null,
        home: true,
        mes: "",
        cartData: cartData || [],
        couponData,
      });
    }
  } catch (error) {
    console.error("Something happed to productCart entry issue", error);
    return res.status(404).render("user/error-page");
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
    return res.status(404).render("user/error-page");
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
            return res.status(400).json({productLimit:productLimit});
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
    return res.status(500).render("user/error-page");
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
    return res.status(404).render("user/error-page");
  }
};

const productCheckout = async (req, res) => {
  try {
    const user = await userModel.findOne({
      email: req.session.user,
    });

    const cartId = req.params.cart_id;
    req.session.cartId = cartId;

    const cartData = await cartModel.findById(cartId).populate("items.product");

    const cartItems = await cartModel.findById(cartId,{"items.product":1,"items.quantity":1})
    console.log(cartItems)
    const productData = await productModel.find({}, { _id: 1,quantity:1});
    console.log(productData)

  let stockAvailable = true;
  cartItems.items.forEach(item => {
    const foundProduct = productData.find(product => product._id.toString() === item.product.toString());
    if (foundProduct) {
      console.log('hello')
        const productQuantity = foundProduct.quantity;
        if (productQuantity >= item.quantity) {
          stockAvailable = true
            console.log(`Product ${item.product} found in productData with sufficient quantity.`);
        } else {
            console.log(`Product ${item.product} found in productData but quantity is insufficient.`);
            stockAvailable = false;
            return 
        }
    } else {
        console.log(`Product ${item.product} not found in productData.`);
    }
});

console.log(stockAvailable);

    if (stockAvailable === true) {
      return res.render("user/checkout-page", {
        errors: null,
        home: true,
        mes: "",
        user: user,
        cartData,
        stockAvailable
      });
    } else {
      let queryString = "";
      if (stockAvailable === false) {
        queryString = "?stockAvailable=false";
       }
      return res.redirect("/product_cart"+queryString);
    }
  } catch (error) {
    console.log("Something happed to productCheckout entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const checkoutAddressAddEditUpdate = async (req, res) => {
  try {
    const index = req.body.address;
    if (index !== "new") {
      req.session.checkoutIndex = index;
    }

    const cartId = req.session.cartId;
    console.log(cartId)
    
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    const userId = user._id;

    const cartData = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

    await Promise.all([
      body("street")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("city")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("district")
        .trim()
        .notEmpty()
        .withMessage("This  field is required")
        .run(req),
      body("state")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("country")
        .trim()
        .notEmpty()
        .withMessage("This field is requirec")
        .run(req),
      body("zip_code")
        .trim()
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
    ]);

    const cartItems = await cartModel.findById(cartId,{"items.product":1,"items.quantity":1})
    console.log(cartItems)
    const productData = await productModel.find({}, { _id: 1,quantity:1});
    console.log(productData)

    let stockAvailable = true;
    cartItems.items.forEach(item => {
      const foundProduct = productData.find(product => product._id.toString() === item.product.toString());
      if (foundProduct) {
        console.log('hello')
          const productQuantity = foundProduct.quantity;
          if (productQuantity >= item.quantity) {
            stockAvailable = true
              console.log(`Product ${item.product} found in productData with sufficient quantity.`);
          } else {
              console.log(`Product ${item.product} found in productData but quantity is insufficient.`);
              stockAvailable = false;
              return 
          }
      } else {
          console.log(`Product ${item.product} not found in productData.`);
      }
  });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("user/checkout-page", {
        errors: errors.mapped(),
        home: true,
        mes: "",
        user,
        cartData,
        stockAvailable
      });
    }

    const data = {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      zip_code:req.body.zip_code, 
    };

    if (index !== "new") {
      const selectedAddressId = user.address[index]._id;
      console.log(selectedAddressId, "address");
      const userData = await userModel
        .findOneAndUpdate(
          {
            email: req.session.user, // Query by user's email
            "address._id": selectedAddressId, // Match the specific address within the array
          },
          {
            $set: {
              "address.$.street": data.street,
              "address.$.city": data.city,
              "address.$.district": data.district,
              "address.$.state": data.state,
              "address.$.country": data.country,
              "address.$.zip_code": data.zip_code,
            },
          },
          { new: true }
        )
        .populate("address");

      console.log("hello");
      if (userData) {
        return res.render("user/checkout-page", {
          errors: null,
          home: true,
          mes: "Address confirmed",
          user,
          cartData,
          stockAvailable
        });
      }
    } else {
      console.log(cartId)
      const user = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { address: data } }, 
        { new: true } 
      );
      return res.render("user/checkout-page", {
        errors: null,
        home: true,
        mes: "New address created",
        user,
        cartData,
        stockAvailable  
      });
    }
    
  } catch (error) {
    console.log(
      "Something happed to checkoutAddressAddEditUpdate entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};

const placeOrderCheckout = async (req, res) => {
  try {
    const index = req.session.checkoutIndex;
   // const cartId = req.params.cart_id;
   req.session.cartId = req.params.cart_id
   const cartId = req.session.cartId;
   console.log(cartId,"first")

    const payment_status = req.body.paymentStatus || false;

    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    const userId = user._id;

    const cartData = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

      console.log(cartData,"ithu aanu ivdde")

    const payment_details = {
      payment_method: req.body.paymentMethod || "COD",
    };

    const items = cartData.items.map((item) => ({
      order_price:item.product.price,
      product: item.product._id,
      quantity: item.quantity,
      total: item.total,
      each_discount: item.each_discount, // Calculate total for each item
    }));

    //payment method detection
    if (payment_details.payment_method.toString() === "online") {
      if (!index) {
        const address = true;
        return res.status(400).json({ address });
      }
      await confirm();
    } else if (payment_details.payment_method.toString() === "COD") {

      if(cartData.total_price > 1000){
        console.log("it is not working ")
        const minAmount = true;
        return res.status(400).json({ minAmount });
      }

      if (!index) {
        const address = true;
        return res.status(400).json({ address });
      }

      await confirm();
    } else if (payment_details.payment_method.toString() === "wallet") {
      
      if (!index) {
        const address = true;
        return res.status(400).json({ address });
      }

      const walletData = await walletModel.findOne({user:userId});
      console.log(walletData)

      if(walletData === null || walletData === undefined){
        const balance = true
        return res.status(400).json({balance})
      }

      if(walletData.balance < cartData.total_price) {
        const balance = true
        return res.status(400).json({balance})
      }

      if(cartData.total_price <= walletData.balance){
        await walletModel.updateMany(
          { user: userId },
          { $inc: { balance: -cartData.total_price },
            $push:{ transactions:{type:"debited", amount:cartData.total_price, description:"Purchase"}} 
          },
          { upsert: true, new: true } // upsert option and new option to return the updated document
        );
        await confirm();

      }
      
      
    }

    async function confirm() {
      if (payment_status) {
        payment_details.payment_status = "failed";
      } else if (payment_details.payment_method !== "COD" && !payment_status) {
        payment_details.payment_status = "completed";
      }

      const shipping_address = {
        full_name: user.first_name + " " + user.last_name,
        phone_number: user.phone_number,
        street: user.address[index].street,
        city: user.address[index].city,
        district: user.address[index].district,
        state: user.address[index].state,
        country: user.address[index].country,
        zip_code: user.address[index].zip_code,
      };

      const order = await orderModel.create({
        user: userId,
        items: items,
        shipping_address: shipping_address,
        payment_details: {
          payment_method: payment_details.payment_method,
          payment_status: payment_details.payment_status,
        },
        applied_coupon: cartData.applied_coupon,
        discount_amount: cartData.discount_amount,
        discount_percentage: cartData.discount_percentage,
        total_price: cartData.total_price,
        total_quantity: cartData.total_quantity,
      });

      for (const item of cartData.items) {
        await productModel.findByIdAndUpdate(
          item.product._id,
          { $inc: { quantity: -item.quantity } } 
        );
      }

      await cartModel.deleteOne({ _id: cartId });
      req.session.checkoutIndex = false;

      const showModal = true; 
      return res.status(200).json({ showModal });
    }
  } catch (error) {
    console.log("Something happed to placeOrderCheckout entry issue", error);
    return res.status(404).render("user/error-page");
  }
};



module.exports = {
  productCart,
  productCartAdd,
  productCartRemove,
  productQuantityUpdate,
  productCheckout,
  checkoutAddressAddEditUpdate,
  placeOrderCheckout,
  
};
