const otpModel = require("../models/otp");
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const sendOTPEmail = require('../service/nodeMailer');
const formatOTP = require('../utils/otpFormater');
const httpStatus = require('../constants/status');

const getOtp = (req, res) => {
    try {
      return res.status(httpStatus.OK).render("user/otp", {
        errors: null,
        checkPass: true,
        home: false,
        mes:"",
      });
    } catch (error) {
      console.error("Something happed  get-otp entry issue", error);
      return res.status(httpStatus.NOT_FOUND).render("user/error-page");
    }
  };
  
 const postOtp = async (req, res) => {
    try {
      // const otpCode = formatOTP.otpFormatter(req.body);
      // console.log(otpCode,'hrere', req.body);
      const otpCode = req.body.otp;
      const otpDbCode = await otpModel.findOne({ otp: otpCode });
      const userData = req.session.signupData;

      if (!otpDbCode || otpCode !== otpDbCode.otp) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Incorrect OTP",
        });
      };

      const newUser = new userModel(userData);
      await newUser.save();

      req.session.user = userData.email;

      return res.status(httpStatus.OK).json({
        success: true,
        message: "OTP verified"
      });

    } catch (error) {
      console.error("Something happed  post-otp entry issue", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
    }
  };
  
  const signUpResendOtp = (req, res) => {
    try {
      const email = req.session.signupData;
      if (email) {
        sendOTPEmail.sendOtpEmail(email.email);
        return res.redirect("/signup_otp");
      }
    } catch (error) {
      console.error("Something happed  signUpResendOtp entry issue", error);
      return res.status(httpStatus.NOT_FOUND).render("user/error-page");
    }
  };
  
  const forgotPasswordGetOtp = (req, res) => {
    try {
      return res.status(httpStatus.OK).render("user/forgot-otp", {
        errors: null,
        checkPass: true,
        home: false,
        mes:""
      });
    } catch (error) {
      console.error("Something happed  forgotPasswordGetOtp entry issue", error);
      return res.status(httpStatus.NOT_FOUND).render("user/error-page");
    }
  };
  
  const forgotPasswordOtp = async (req, res) => {
    try {
      //const otpCode = formatOTP.otpFormatter(req.body);
      const otpCode = req.body.otp;
      const otpDbCode = await otpModel.findOne({ otp: otpCode });
      const userData = req.session.newPassword;

      if (!otpDbCode || otpCode !== otpDbCode.otp) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Incorrect OTP",
        });
      };

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      userData.password = hashedPassword;


      await userModel.updateOne(
        { email: userData.email },
        { password: userData.password }
      );

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Password reset successful",
      });
    
    } catch (error) {
      console.error("User forgot password otp entry issue", error);
      return res.status(httpStatus.NOT_FOUND).render("user/error-page");
    }
  };
  
  const forgotResendOtp = (req, res) => {
    try {
      const email = req.session.newPassword;
      if (email) {
        sendOTPEmail.sendOtpEmail(email.email);
        return res.redirect("/forgot_password_otp");
      }
    } catch (error) {
      console.error("Something happed  forgotResendOtp entry issue", error);
      return res.status(httpStatus.NOT_FOUND).render("user/error-page");
    }
  };

  module.exports = {
    getOtp,
    postOtp,
    signUpResendOtp,

    forgotPasswordOtp,
    forgotPasswordGetOtp,
    forgotResendOtp,
  }