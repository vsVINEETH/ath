const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to user collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your user collection", err);
  });

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
  },

  last_name: {
    type: String,
  },

  email: {
    type: String,
  },
  gender: {
    type: String,
  },
  password: {
    type: String,
  },
  phone_number: {
    type: Number,
  },
  address: [
    { street: String,
      city: String,
      district: String,
      state: String,
      country: String,
      zip_code: Number,
    },
  ],
  joinedAt: {
    type: Date,
    default: function () {
      const date = new Date();
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString("en-US", options);
    },
  },
  is_block: {
    type: Boolean,
    default: false,
  },
  refferalId:{
    type:String,
    default: uuidv4,
    
  },
  refferal_applied: {
    type:Boolean,
    default:false
  },
});
const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
