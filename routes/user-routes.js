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

router.post('/razorpayInstance/:cart_id',userCheck,razorpayController.razorpay);

router.get('/', userController.landing);
router.get('/home',blockCheck,userCheck, userController.home);

router.get('/login', userController.login);
router.post('/login', userController.loginPost);

router.get('/auth/google',blockCheck, userController.loginAuth);
router.get("/auth/google/redirect", userController.loginAuthRedirect)
router.get('/auth/facebook',blockCheck, userController.loginAuthFacebook);
router.get('/auth/facebook/redirect', userController.loginAuthFacebookRedirect)

router.get('/logout', userController.logout);

router.get('/user_signup', userController.signup);
router.post('/user_signup', userController.signupPost);

router.get('/signup_otp', otpController.getOtp);
router.post('/signup_otp', otpController.postOtp);
router.get('/signup_otp/resend', otpController.signUpResendOtp);

router.get('/forgot_password', userController.forgotPassword);
router.post('/forgot_password', userController.forgotPasswordPost);

router.get('/forgot_password_otp', otpController.forgotPasswordGetOtp);
router.post('/forgot_password_otp', otpController.forgotPasswordOtp);
router.get('/forgot_password_otp/resend', otpController.forgotResendOtp);

router.get('/user_profile',userCheck, userController.userProfile);
router.post('/user_profile/:user_id',userCheck, userController.userProfileUpdate);
//hell0
router.get('/user_profile_address',userCheck,userController.userProfileAddress);
router.post('/user_profile_address/:user_id',userCheck, userController.userProfileAddressAdd);
router.get('/user_profile_address_edit/:index',userCheck, userController.userProfileAddressEdit);
router.post('/user_profile_address_edit/:address_id',userCheck, userController.userProfileAddressEditIn);
router.get('/user_profile_address_delete/:address_id',userCheck,userController.userProfileAddressDelete);

router.get('/user_profile_security',userCheck,userController.userProfileSecurity);
router.post('/user_profile_security',userCheck,userController.userProfileSecurityPost);

router.get('/filter',userCheck,userController.filterSortSearch);

router.get('/product_detail/:product_id',userCheck, userController.productDetail);

router.get('/product_cart',userCheck, cartController.productCart);
router.post('/product_cart/:product_id?',userCheck, cartController.productCartAdd);

router.get('/product_cart_delete/:product_id',userCheck, cartController.productCartRemove);
router.get('/product_cart_update/:product_id',userCheck, cartController.productQuantityUpdate);

router.get("/checkout/:cart_id?",userCheck,cartController.productCheckout);
router.post("/checkout_address_add_edit_update",userCheck,cartController.checkoutAddressAddEditUpdate);
router.post("/place_order_checkout/:cart_id?",userCheck,cartController.placeOrderCheckout);

router.post("/retry_payment",userCheck, orderController.retryOrderPayment)
router.post("/retry_payment_razorpayInstance",userCheck,razorpayController.razorpayPaymentRetry);


router.get("/order_history",userCheck,orderController.orderHistory);
router.get("/order_detail/:order_id",userCheck,orderController.orderDetail);
router.post("/order_cancel/:product_id/:item_id",userCheck,orderController.orderCancel);
router.post("/order_return/:product_id/:item_id",userCheck,orderController.orderReturn);
router.get('/download_order_invoice/:order_id', userCheck, orderController.downloadOrderInvoice);
router.post('/product_rating/:product_id', userCheck, orderController.ratingAndReview);
router.get("/rating_delete/:rating_id/:product_id",userCheck, orderController.ratingDelete)

router.post("/coupon_apply",userCheck,couponController.couponApply);
router.get("/coupon_remove",userCheck,couponController.couponRemove);

router.get("/wish_list_view",userCheck,wishListController.wishList);
router.post("/wish_list_add/:product_id",userCheck,wishListController.wishListAdd)
router.post("/wish_list_action",userCheck,wishListController.wishListAction);//front end icon 
router.get("/wish_list_remove/:item_id",userCheck,wishListController.wishListRemove)
router.post("/wishlist_to_cart/:product_id",userCheck,wishListController.wishListToCart)

router.get("/wallet",userCheck,walletController.wallet);
router.post("/wallet_add_money",userCheck, walletController.walletAddMoney)
router.post("/wallet_razorpayInstance/:user_id?", userCheck, razorpayController.razorpayWallet);

router.post('/refferal',userCheck,walletController.refferalToWallet);

router.get('*',globalErrorHandler)

module.exports = router;