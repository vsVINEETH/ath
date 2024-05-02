const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to coupon collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your coupon collection");
  });

const couponSchema = new mongoose.Schema({
  coupon_name: {
    type: String,
  },
  coupon_code: {
    type: String,
    required: true,
    unique: true,
  },
  discount_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  expire_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "deactive", "expired"],
    default: "active",
  },
    min_amount: {
      type: Number,
      default: 0,
    },
});

couponSchema.index({ code: 1, expire_date: 1 });

// Pre-save middleware to update the status based on the expiration date
couponSchema.pre("save", function (next) {
  if (this.isModified("expire_data") || this.isNew) {
    const currentDate = new Date();
    if (currentDate > this.expire_date) {
      this.status = "expired";
    }
  }
  next();
});

const couponModel = mongoose.model("coupon", couponSchema);

module.exports = couponModel;
