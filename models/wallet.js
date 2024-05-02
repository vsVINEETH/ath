const mongoose = require("mongoose");

mongoose
  .connect(process.env.DATA_BASE_KEY)
  .then((con) => {
    console.log("DB connected successfully to wallet collection");
  })
  .catch((err) => {
    console.log("Something went wrong check your wallet collection");
  });

  const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ["credited", "debited", "failed"],
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            }
        }
    ]
});



const walletModel = mongoose.model("wallet", walletSchema);

module.exports = walletModel;
