const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to rating collection");
  })
  .catch((err) => {
    console.log("Something went wrong in rating collection");
  });

const ratingSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "product" 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user" 
  },
  rating: {
    type: Number, 
    min: 0,      
    max: 5
  },
  review:{
    type: String 
  }
});

const ratingModel = mongoose.model("rating", ratingSchema);
module.exports = ratingModel;
