const mongoose = require("mongoose");

mongoose
  .connect(process.env.DATA_BASE_KEY)

  .then((con) => {
    console.log("DB connected successfully to otp collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your otp collection");
  });

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  otp: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60,
  },
});

const otpModel = mongoose.model("otp", otpSchema);

module.exports = otpModel;
