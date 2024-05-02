const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB conneted successfully to products collection");
  })
  .catch((err) => {
    console.log("something went wrong in products collection");
  });

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
  },
  model: {
    type: String,
  },
  price: {
    type: Number,
  },
  mrp: {
    type: Number,
  },
  description: {
    type: String,
  },
  image: {
    type: Array,
  },
  colour: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  offer_applied:{
    type:Boolean,
    default:false
  },
  offer_percentage:{
    type:Number,
    default:0
  }

});

const productModel = mongoose.model("product", productSchema);

module.exports = productModel;
