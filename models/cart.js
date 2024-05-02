const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to cart collection");
  })
  .catch((err) => {
    console.log("something went wrong in cart collection");
  });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      total: {
        type: Number,
        required: true,
      },
      each_discount: {
        type: Number,
        default: 0,
      },
    },
  ],
  applied_coupon: {
    type: Boolean,
    default: false,
  },
  discount_amount: {
    type: Number,
    default: 0,
  },
  discount_percentage: {
    type: Number,
    default: 0,
  },
  total_price: {
    type: Number,
    default: 0,
  },
  total_quantity: {
    type: Number,
    default: 0,
  },
});

const cartModel = mongoose.model("cart", cartSchema);

module.exports = cartModel;
