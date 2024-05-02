const mongoose = require("mongoose");
mongoose
.connect(process.env.DATA_BASE_KEY)
.then((con) => {
    console.log("DB connected successfully to wish list collection")
})
.catch((err) => {
    console.log("something went wrong in cart collection");
});

const wishListSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    items: [
        {
            product: {
                type:mongoose.Schema.Types.ObjectId,
                ref:"product",
                required:true
            },
            quantity: {
                type: Number,
                default:1,
            },
            is_wish: {
                type: Boolean,
                default: false
              }
        },
    ],


})

const wishListModel = mongoose.model("wish-list", wishListSchema);

module.exports = wishListModel;