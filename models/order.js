const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to order collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your order collection");
  });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        
      },
      quantity: {
        type: Number,
        default: 1,
      },
      total: {
        type: Number,
        
      },
      each_discount :{
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: [
          "pending",
          "shipped",
          "delivered",
          "cancelled",
          "return_requested",
          "returned",
          "return_reject",
        ],
        default: "pending",
      },
      cancellation_reason: {
        type: String,
      },
      return_reason: {
        type: String,
      },
      return_amount:{
        type:Number,
        default:0
      },
      return_quantity:{
        type:Number,
        default:0
      }
    },
  ],
  shipping_address: {
    full_name: { type: String },
    phone_number:{type:Number},
    street: { type: String, required: true },
    city: { type: String, required: true },
    district:{type: String, required: true},
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip_code: { type: String, required: true },
  },
  payment_details:{

    payment_method:{
      type:String
    },
    payment_status:{
      type: String,
      enum: [
        "pending",
        "failed",
        "completed",
        "cancelled",
        "return_requested",
        "returned",
      ],
      default: "pending",
    }
  },
  applied_coupon: {
    type: Boolean,
    default:false
  },
  discount_amount: {
    type: Number,
    default: 0,
  },
  discount_percentage:{
    type:Number,
    default:0
  },
  total_price: {
     type: Number,
      required: true
    },
    total_quantity:{
      type:Number,
      required: true,
    },
  createdAt: {
    type: Date,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  },
});

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;