const otpModel = require("../models/otp");
const userModel = require("../models/user");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { trusted } = require("mongoose");

const otpGenerator = () => {
    const randomNumber = Math.floor(Math.random() * (999999 - 100000) + 100000);
    return randomNumber;
  };
  
  function sendOtpEmail(email) {
    try {
      const generatedOtp = otpGenerator().toString();
  
      const otpData = {
        email: email,
        otp: generatedOtp,
      };

      otpModel.insertMany(otpData);
  
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.APP_MAIL,
          pass: process.env.APP_MAIL_PASS,
        },
      });
  
      let mailOptions = {
        from: process.env.APP_MAIL,
        to: otpData.email,
        subject: "your OTP is here..!",
        text: otpData.otp,
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } catch (error) {
      console.error("Something happed while mailing otp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  }
  
  const getOtp = (req, res) => {
    try {
      return res.render("user/otp", {
        errors: null,
        checkPass: true,
        home: false,
        mes:"",
      });
    } catch (error) {
      console.error("Something happed  get-otp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  };
  
  const postOtp = async (req, res) => {
    try {
      const otpNumbers = {
        otp1: req.body.otp1,
        otp2: req.body.otp2,
        otp3: req.body.otp3,
        otp4: req.body.otp4,
        otp5: req.body.otp5,
        otp6: req.body.otp6,
      };
      const otpCode =
        `${otpNumbers.otp1}` +
        `${otpNumbers.otp2}` +
        `${otpNumbers.otp3}` +
        `${otpNumbers.otp4}` +
        `${otpNumbers.otp5}` +
        `${otpNumbers.otp6}`;
  
      const otpDbCode = await otpModel.findOne({ otp: otpCode });
      const userData = req.session.signupData;
      req.session.user = userData.email;
  
      if (!otpDbCode) {
        return res.render("user/otp",{
          errors:null,
          home:false,
          mes:"Incorrect OTP ..!",
          
        });
      } else if (otpCode === otpDbCode.otp) {
        const newUser = new userModel(userData);
        await newUser.save();
        return res.redirect("/home");
      } else {
        return res.render("user/otp",{
          errors:null,
          home:false,
          mes:"OTP not found",
        });
      }
    } catch (error) {
      console.error("Something happed  post-otp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  };
  
  const signUpResendOtp = (req, res) => {
    try {
      const email = req.session.signupData;
      if (email) {
        sendOtpEmail(email.email);
        return res.redirect("/signup_otp");
      }
    } catch (error) {
      console.error("Something happed  signUpResendOtp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  };
  
  const forgotPasswordGetOtp = (req, res) => {
    try {
      return res.render("user/forgot-otp", {
        errors: null,
        checkPass: true,
        home: false,
        mes:""
      });
    } catch (error) {
      console.error("Something happed  forgotPasswordGetOtp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  };
  
  const forgotPasswordOtp = async (req, res) => {
    try {
      const otpNumbers = {
        otp1: req.body.otp1,
        otp2: req.body.otp2,
        otp3: req.body.otp3,
        otp4: req.body.otp4,
        otp5: req.body.otp5,
        otp6: req.body.otp6,
      };
      const otpCode =
        `${otpNumbers.otp1}` +
        `${otpNumbers.otp2}` +
        `${otpNumbers.otp3}` +
        `${otpNumbers.otp4}` +
        `${otpNumbers.otp5}` +
        `${otpNumbers.otp6}`;
      const otpDbCode = await otpModel.findOne({ otp: otpCode });
      const userData = req.session.newPassword;
  
      if (!otpDbCode) {
        return res.render("user/forgot-otp",{
          errors:null,
          home:false,
          mes:"Incorrect OTP ..!",
        });
      } else if (otpCode === otpDbCode.otp) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        userData.password = hashedPassword;
  
        const updateResult = await userModel.updateOne(
          { email: userData.email },
          { password: userData.password }
        );
        return res.redirect("/login");
      }
    } catch (error) {
      console.error("User forgot password otp entry issue", error);
      return res.status(404).render("user/error-page");
    }
  };
  
  const forgotResendOtp = (req, res) => {
    try {
      const email = req.session.newPassword;
      console.log(email.email);
      if (email) {
        sendOtpEmail(email.email);
        return res.redirect("/forgot_password_otp");
      }
    } catch (error) {
      console.error("Something happed  forgotResendOtp entry issue", error);
      return res.status(404).render("user/error-page");
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