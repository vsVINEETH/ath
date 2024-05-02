const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to category collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your category collection");
  });

const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  offer_applied: {
    type:Boolean,
    default:false
  },
  offer_percentage:{
    type:Number,
    default:0
  }
});

const categoryModel = mongoose.model("category", categorySchema);

module.exports = categoryModel;
