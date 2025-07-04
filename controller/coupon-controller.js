const userModel = require("../models/user");
const cartModel = require("../models/cart");
const couponModel = require("../models/coupon");
const httpStatus = require('../constants/status')
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const couponList = async (req, res) => {
  try {
    const couponData = await couponModel.find({});
    return res.status(httpStatus.OK).render("admin/coupon", { couponData });
  } catch (error) {
    console.error("couponList entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponAdd = async (req, res) => {
  try {
    const couponData = await couponModel.find({});
    return res.status(httpStatus.OK).render("admin/add-coupon", {
      couponData,
      errors: null,
      mes: "",
    });
  } catch (error) {
    console.error("couponAdd entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponAddPost = async (req, res) => {
  try {
    await Promise.all([
      body("coupon_code")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("discount_percentage")
        .trim()
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
      body("coupon_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("expire_date")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("minimum_amount")
        .trim()
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(httpStatus.BAD_REQUEST).render("admin/add-coupon", {
        errors: errors.mapped(),
        mes: "",
      });
    }

    const data = {
      coupon_name: req.body.coupon_name,
      coupon_code: req.body.coupon_code,
      discount_percentage: req.body.discount_percentage,
      expire_date: new Date(req.body.expire_date),
      min_amount: req.body.minimum_amount,
    };

    const existingCouponCode = await couponModel.findOne({
      coupon_code: data.coupon_code,
    });

    if(data.expire_date < Date.now()){
      return res.status(httpStatus.BAD_REQUEST).render("admin/add-coupon", {
        errors: null,
        mes: "Select a valid expire date",
      });
    }

    if (!existingCouponCode) {
      const newCoupon = new couponModel(data);
      await newCoupon.save();

      return res.redirect("/admin/coupon");
    } else {
      return res.status(httpStatus.CONFLICT).render("admin/add-coupon", {
        errors: null,
        mes: "existing coupon",
      });
    }
  } catch (error) {
    console.error("couponAddPost entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponAction = async (req, res) => {
  try {
    const couponId = req.params.coupon_id;
    const foundCoupon = await couponModel.findById(couponId);

    if (!foundCoupon) {
      return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
    }
    if (foundCoupon.status === "active") {
      foundCoupon.status = "deactive";
    } else if (foundCoupon.status === "deactive") {
      foundCoupon.status = "active";
    }

    await foundCoupon.save();
    
    return res.status(httpStatus.OK).json({
      success: true,
      status: foundCoupon.status,
      coupon_id: foundCoupon._id,
    });

    //return res.redirect("/admin/coupon");
  } catch (error) {
    console.error("couponAction entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponDelete = async (req, res) => {
  try {
    const couponId = req.params.coupon_id;
    await couponModel.findByIdAndDelete(couponId);
    return res.redirect("/admin/coupon");
  } catch (error) {
    console.error("couponDelete entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponApply = async (req, res) => {
  try {
    const couponId  = req.body.coupon_value;
    const couponData = await couponModel.findOne({_id:couponId})
    const couponValue = couponData.discount_percentage

    if(couponValue === 0 || !couponValue){
      return res.redirect("/product_cart");
    }
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const cartData = await cartModel
      .findOne({ user: user._id })
      .populate("items.product");

    const percentage = couponValue / 100;
    let cartTotal = cartData.total_price;

    for (let item of cartData.items) {
      const itemDiscount = Math.floor(item.total * percentage);
      item.each_discount = itemDiscount;
      item.total -= itemDiscount;
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    for (let item of cartData.items) {
      totalPrice += item.total;
      totalQuantity += item.quantity;
    }

    let discountedAmount = cartTotal - totalPrice;

    cartData.total_price = totalPrice;
    cartData.total_quantity = totalQuantity;
    cartData.applied_coupon = true;
    cartData.coupon_id = couponId;
    cartData.discount_percentage = percentage;
    cartData.discount_amount = discountedAmount;

    await cartData.save();
    return res.redirect("/product_cart");
  } catch (error) {
    console.error("couponDelete entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const couponRemove = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email: email });

    const cartData = await cartModel
      .findOne({ user: user._id })
      .populate("items.product");

    for (let item of cartData.items) {
      item.total = item.each_discount + item.total;
      item.each_discount = 0
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    for (let item of cartData.items) {
      totalPrice += item.total;
      totalQuantity += item.quantity;
    }

    cartData.total_price = totalPrice;
    cartData.total_quantity = totalQuantity;
    cartData.applied_coupon = false;
    cartData.discount_percentage = 0;
    cartData.discount_amount = 0;

    await cartData.save();
    return res.redirect("/product_cart");

  } catch (error) {
    console.error("couponDelete entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};
module.exports = {
  couponList,
  couponAdd,
  couponAddPost,
  couponAction,
  couponDelete,
  couponApply,
  couponRemove,
};
