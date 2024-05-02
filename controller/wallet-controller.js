const userModel = require("../models/user");
const productModel = require("../models/products");
const categoryModel = require("../models/category");
const otpModel = require("../models/otp");
const wishListModel = require("../models/wish-list");
const walletModel = require("../models/wallet");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { trusted } = require("mongoose");


const wallet = async (req, res) => {
    try {
        const email = req.session.user;
        const user = await userModel.findOne({email: email})
        const walletData = await walletModel.find({user:user._id}).sort({ "transactions.createdAt": -1 })
        
        return res.render("user/wallet-page",{
            errors:null,
            home:true,
            mes:"",
            walletData: walletData || []
        })
    } catch (error) {
        console.error("Something happed to wallet entry issue", error);
        return res.status(404).render("user/error-page");
    }
}

const walletAddMoney = async (req, res) => {
    try {
        console.log("success");
        let walletData = true;
        const email = req.session.user;
        const amount = req.body.amount;
        const status = req.body.status;
        const user = await userModel.findOne({email:email});

        if(status){
        const walletDatas = await walletModel.findOneAndUpdate(
            { user: user._id },
            { $inc: { balance: amount },
              $push:{ transactions:{type:"credited", amount:amount,description:"Razorpay"}} 
            },
            { upsert: true, new: true } // upsert option and new option to return the updated document
        );
        return res.json(walletData)
        } else {
            console.log('jake')
            const walletDatas = await walletModel.findOneAndUpdate(
                { user: user._id },
                { $push:{ transactions:{type:"failed", amount:amount,description:"Razorpay"}} 
                },
                { upsert: true, new: true } // upsert option and new option to return the updated document
            );
            return res.json(walletData)
        }

    } catch (error) {
      console.error(
        "Something happed to walletAddMoney entry issue",
        error
      );
      return res.status(404).render("user/error-page");
    }
}

const refferalToWallet = async (req, res) => {
    try {
      const refferalCode = req.body.refferal_code;
      const email = req.session.user;//current user
      const reffererUser = await userModel.findOne({refferalId: refferalCode});//refferer
  
      if(reffererUser){
  
        const currentUser = await userModel.findOneAndUpdate({email:email},{refferal_applied:true})//current user
  
        await walletModel.findOneAndUpdate(
          { user: currentUser._id },
          { $inc: { balance: 50 },
            $push:{ transactions:{type:"credited", amount:50 ,description:"Refferel joining bonus"}} 
          },
          { upsert: true, new: true } 
        );
        
        await walletModel.findOneAndUpdate(
          { user: reffererUser._id },
          { $inc: { balance: 100 },
            $push:{ transactions:{type:"credited", amount:100 ,description:"Reffered user has joined "}} 
          },
          { upsert: true, new: true }
        );
        
       return res.redirect("/wallet");
      } else {
        console.log('invalid refferal id')
         return res.redirect("/user_profile");
 
      }
      
    } catch (error) {
      console.error(
        "Something happed to refferalToWallet entry issue",
        error
      );
      return res.status(404).render("user/error-page");
    }
  }
module.exports = {
    wallet,
    walletAddMoney,
    refferalToWallet
}