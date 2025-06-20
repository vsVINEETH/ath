const userModel = require("../../models/user");
const productModel = require("../../models/products");
const cartModel = require("../../models/cart");
const orderModel = require("../../models/order");
const walletModel = require("../../models/wallet");
require("dotenv").config();
const { body, validationResult } = require("express-validator");

const productCheckout = async (req, res) => {
  try {
    const user = await userModel.findOne({
      email: req.session.user,
    });

    const cartId = req.params.cart_id;
    req.session.cartId = cartId;

    const cartData = await cartModel.findById(cartId).populate("items.product");
    const cartItems = await cartModel.findById(cartId,{"items.product":1,"items.quantity":1})
    const productData = await productModel.find({}, { _id: 1,quantity:1});

   let stockAvailable = true;
    cartItems.items.forEach(item => {
      const foundProduct = productData.find(product => product._id.toString() === item.product.toString());
      if (foundProduct) {

          const productQuantity = foundProduct.quantity;
          if (productQuantity >= item.quantity) {
            stockAvailable = true
          } else {
              stockAvailable = false;
              return; 
          }
      } else {
          console.log(`Product ${item.product} not found in productData.`);
      }
  });

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
    const productData = await productModel.find({}, { _id: 1,quantity:1});

    let stockAvailable = true;
    cartItems.items.forEach(item => {
      const foundProduct = productData.find(product => product._id.toString() === item.product.toString());
      if (foundProduct) {
          const productQuantity = foundProduct.quantity;
          if (productQuantity >= item.quantity) {
              stockAvailable = true
          } else {
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
    req.session.cartId = req.params.cart_id
    const cartId = req.session.cartId;

    const payment_status = req.body.paymentStatus || false;

    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    const userId = user._id;
    const cartData = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

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

      };
    };

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
  productCheckout,
  checkoutAddressAddEditUpdate,
  placeOrderCheckout,
};
