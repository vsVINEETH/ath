const express = require('express');
const router = express.Router();
const userController = require('../controller/user-controller');
const otpController = require('../controller/otp-controller')
const cartController = require('../controller/cart-controller')
const orderController = require('../controller/order-controller')
const wishListController = require('../controller/wish-list-controller')
const razorpayController = require("../controller/razorpay-controller")
const couponController = require('../controller/coupon-controller')
const walletController = require('../controller/wallet-controller')
const {blockCheck, userCheck, globalErrorHandler} = require('../middle-ware/middle-wares');

router.post('/razorpayInstance/:cart_id', userCheck, razorpayController.razorpay);

router.get('/', userController.landing);
router.get('/home', blockCheck, userCheck, userController.home);

router.get('/login', userController.login);
router.post('/login', userController.loginPost);

router.get('/auth/google', blockCheck, userController.loginAuth);
router.get('/auth/google/redirect', blockCheck, userController.loginAuthRedirect)
router.get('/auth/facebook', blockCheck, userController.loginAuthFacebook);
router.get('/auth/facebook/redirect', blockCheck, userController.loginAuthFacebookRedirect)

router.get('/logout', userController.logout);

router.get('/user_signup', userController.signup);
router.post('/user_signup', userController.signupPost);

router.get('/signup_otp', otpController.getOtp);
router.post('/signup_otp', otpController.postOtp);
router.get('/signup_otp/resend', otpController.signUpResendOtp);

router.get('/forgot_password', blockCheck, userController.forgotPassword);
router.post('/forgot_password', blockCheck, userController.forgotPasswordPost);

router.get('/forgot_password_otp', blockCheck, otpController.forgotPasswordGetOtp);
router.post('/forgot_password_otp', blockCheck, otpController.forgotPasswordOtp);
router.get('/forgot_password_otp/resend', blockCheck, otpController.forgotResendOtp);

router.get('/user_profile', blockCheck, userCheck, userController.userProfile);
router.post('/user_profile/:user_id', blockCheck, userCheck, userController.userProfileUpdate);

router.get('/user_profile_address', blockCheck, userCheck, userController.userProfileAddress);
router.post('/user_profile_address/:user_id', blockCheck, userCheck, userController.userProfileAddressAdd);
router.get('/user_profile_address_edit/:index', blockCheck, userCheck, userController.userProfileAddressEdit);
router.post('/user_profile_address_edit/:address_id', blockCheck, userCheck, userController.userProfileAddressEditIn);
router.get('/user_profile_address_delete/:address_id', blockCheck, userCheck, userController.userProfileAddressDelete);

router.get('/user_profile_security', blockCheck, userCheck,userController.userProfileSecurity);
router.post('/user_profile_security', blockCheck, userCheck,userController.userProfileSecurityPost);

router.get('/filter', blockCheck, userCheck,userController.filterSortSearch);

router.get('/product_detail/:product_id', blockCheck, userCheck, userController.productDetail);

router.get('/product_cart', blockCheck, userCheck, cartController.productCart);
router.post('/product_cart/:product_id?', blockCheck, userCheck, cartController.productCartAdd);

router.get('/product_cart_delete/:product_id', blockCheck, userCheck, cartController.productCartRemove);
router.get('/product_cart_update/:product_id', blockCheck, userCheck, cartController.productQuantityUpdate);

router.get("/checkout/:cart_id?", blockCheck, userCheck, cartController.productCheckout);
router.post("/checkout_address_add_edit_update", blockCheck, userCheck, cartController.checkoutAddressAddEditUpdate);
router.post("/place_order_checkout/:cart_id?", blockCheck, userCheck, cartController.placeOrderCheckout);

router.post("/retry_payment", blockCheck, userCheck, orderController.retryOrderPayment)
router.post("/retry_payment_razorpayInstance", blockCheck, userCheck, razorpayController.razorpayPaymentRetry);


router.get("/order_history", blockCheck, userCheck,orderController.orderHistory);
router.get("/order_detail/:order_id", blockCheck, userCheck,orderController.orderDetail);
router.post("/order_cancel/:product_id/:item_id", blockCheck, userCheck,orderController.orderCancel);
router.post("/order_return/:product_id/:item_id", blockCheck, userCheck,orderController.orderReturn);
router.get('/download_order_invoice/:order_id', blockCheck, userCheck, orderController.downloadOrderInvoice);
router.post('/product_rating/:product_id', blockCheck, userCheck, orderController.ratingAndReview);
router.get("/rating_delete/:rating_id/:product_id", blockCheck, userCheck, orderController.ratingDelete)

router.post("/coupon_apply",blockCheck, userCheck,couponController.couponApply);
router.get("/coupon_remove",blockCheck, userCheck,couponController.couponRemove);

router.get("/wish_list_view",blockCheck, userCheck,wishListController.wishList);
router.post("/wish_list_add/:product_id",blockCheck, userCheck,wishListController.wishListAdd)
router.post("/wish_list_action",blockCheck, userCheck,wishListController.wishListAction);//front end icon 
router.get("/wish_list_remove/:item_id",blockCheck, userCheck,wishListController.wishListRemove)
router.post("/wishlist_to_cart/:product_id",blockCheck, userCheck,wishListController.wishListToCart)

router.get("/wallet", blockCheck, userCheck,walletController.wallet);
router.post("/wallet_add_money", blockCheck, userCheck, walletController.walletAddMoney)
router.post("/wallet_razorpayInstance/:user_id?",blockCheck, userCheck, razorpayController.razorpayWallet);

router.post('/refferal', blockCheck, userCheck, walletController.refferalToWallet);

router.get('*',globalErrorHandler)

module.exports = router;