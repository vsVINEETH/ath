const nodemailer = require("nodemailer");
const otpGetter = require('../utils/otpGenerator');
const otpModel = require("../models/otp");


const sendOtpEmail = (email) => {
  try {
    const generatedOtp = otpGetter.otpGenerator().toString();

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
    return;
  }
};

module.exports = {
    sendOtpEmail
}
