const userModel = require("../models/user");
const walletModel = require("../models/wallet")
const productModel = require("../models/products");
const categoryModel = require("../models/category");
const otpModel = require("../models/otp");
const ratingModel = require("../models/rating")
const wishListModel = require("../models/wish-list");
const nodemailer = require("nodemailer");
const { body, validationResult, sanitizeBody } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcrypt");
const sendOTPEmail = require('../service/nodeMailer');

const login = (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/home");
    } else {
      return res.render("user/login", { mes: "", home: false });
    }
  } catch (error) {
    console.error("User login entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const loginPost = async (req, res) => {
  try {
    const email = req.body.email;
    let user = ""

    if(email){
       user = await userModel.findOne({ email: email });
    }else{
      return res.render("user/login", {
        mes: "User not found",
        home: false,
      });
    }

    if (!user) {
      return res.render("user/login", {
        mes: "User not found",
        home: false,
      });
    }

    if (user.is_block) {
      return res.render("user/login", {
        mes: "You are blocked",
        home: false,
      });
    }

    const password = req.body.password;
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (passwordMatch) {
      req.session.user = req.body.email; //session creation

      return res.redirect("/home");
    } else {
      return res.render("user/login", {
        mes: "Incorrect password",
        home: false,
      });
    }
  } catch (error) {
    console.error("User login post entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

//---------------
const otpGenerator = () => {
  const randomNumber = Math.floor(Math.random() * (999999 - 100000) + 100000);
  return randomNumber;
};

function sendOtpEmail(email) {
  try {
    const generatedOtp = otpGenerator().toString();

    const otpData = {
      email: email,
      otp: generatedOtp,
    };

    otpModel.insertMany(otpData);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_MAIL,
        pass: process.env.APP_MAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.APP_MAIL,
      to: otpData.email,
      subject: "your OTP is here..!",
      text: otpData.otp,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.error("Something happed while mailing otp entry issue", error);
    return res.status(404).render("user/error-page");
  }
}
//---------------

const forgotPassword = (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/home");
    } else {
      return res.render("user/forgot-password", {
        errors: null,
        mes: "",
        home: false,
      });
    }
  } catch (error) {
    console.error("User forgot password entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const forgotPasswordPost = async (req, res) => {
  try {
    await Promise.all([
      body("email")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("new_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("confirm_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("user/forgot-password", {
        errors: errors.mapped(),
        mes: "",
        home: false,
      });
    }

    const data = {
      email: req.body.email,
      password: req.body.new_password,
    };

    function validatePassword(password) {
      if (password.length < 5 || password.length > 20) {
        return false;
      }

      let hasDigit = false;
      let hasLowercase = false;
      let hasUppercase = false;
      let hasSpecialChar = false;
      const specialChars = "!@#$%^&*()-+.";

      for (let i = 0; i < password.length; i++) {
        const char = password[i];

        if (/[0-9]/.test(char)) {
          hasDigit = true;
        } else if (/[a-z]/.test(char)) {
          hasLowercase = true;
        } else if (/[A-Z]/.test(char)) {
          hasUppercase = true;
        } else if (specialChars.includes(char)) {
          hasSpecialChar = true;
        }

        if (hasDigit && hasLowercase && hasUppercase && hasSpecialChar) {
          return true;
        }
      }
      return false;
    }

    const result = validatePassword(data.password);
    if (result !== true) {
      return res.render("user/forgot-password", {
        errors: null,
        checkPass: true,
        home: false,
        mes: "poor password",
      });
    }
    req.session.newPassword = data;

    const existinUser = await userModel.findOne({ email: data.email });

    if (!existinUser) {
      return res.render("user/forgot-password", {
        errors: null,
        mes: "User not found",
        home: false,
      });
    }

    if (data.password === req.body.confirm_password && existinUser) {
      sendOtpEmail(data.email);
      return res.redirect("/forgot_password_otp");
    } else {
      return res.render("user/forgot-password", {
        errors: null,
        mes: "Password mismatch",
        home: false,
      });
    }
  } catch (error) {
    console.error("User forgot password post entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

//---------------------
const loginAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const loginAuthRedirect = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.log(user, "hello auth1.1");
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    } // Redirect to login if authentication fails
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.session.user = user.email;
      return res.redirect("/home"); // Redirect to profile page if authentication is successful
    });
  })(req, res, next);
};

// const loginAuthFacebook = passport.authenticate("facebook");

// const loginAuthFacebookRedirect = (req, res, next) => {
//   passport.authenticate("facebook", (err, user, info) => {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return res.redirect("/login");
//     } // Redirect to login if authentication fails
//     req.logIn(user, (err) => {
//       if (err) {
//         return next(err);
//       }
//       req.session.user = user.email;
//       return res.redirect("/home"); // Redirect to profile page if authentication is successful
//     });
//   })(req, res, next);
// };

//-------------
const signup = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/home");
    } else {
      return res.render("user/signup", {
        errors: null,
        checkPass: true,
        home: false,
        mes: "",
      });
    }
  } catch (error) {
    console.error("User signup entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const signupPost = async (req, res) => {
  try {
    await Promise.all([
      body("first_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("last_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("This field is required")
        .run(req),
      body("password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("confirm_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("user/signup", {
        errors: errors.mapped(),
        checkPass: true,
        home: false,
        mes: "",
      });
    }

    const data = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
    };

    req.session.signupData = data;

    function validatePassword(password) {
      if (password.length < 5 || password.length > 20) {
        return false;
      }

      let hasDigit = false;
      let hasLowercase = false;
      let hasUppercase = false;
      let hasSpecialChar = false;
      const specialChars = "!@#$%^&*()-+.";

      for (let i = 0; i < password.length; i++) {
        const char = password[i];

        if (/[0-9]/.test(char)) {
          hasDigit = true;
        } else if (/[a-z]/.test(char)) {
          hasLowercase = true;
        } else if (/[A-Z]/.test(char)) {
          hasUppercase = true;
        } else if (specialChars.includes(char)) {
          hasSpecialChar = true;
        }

        if (hasDigit && hasLowercase && hasUppercase && hasSpecialChar) {
          return true;
        }
      }
      return false;
    }

    const result = validatePassword(data.password);

    if (result !== true) {
      return res.render("user/signup", {
        errors: null,
        checkPass: true,
        home: false,
        mes: "poor password",
      });
    }

    const existinUser = await userModel.findOne({ email: data.email });

    if (existinUser) {
      return res.render("user/signup", {
        errors: null,
        checkPass: true,
        home: false,
        mes: "Existing user",
      });
    }

    if (req.body.confirm_password === data.password && !existinUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      data.password = hashedPassword;
      sendOTPEmail.sendOtpEmail(data.email)
      //sendOtpEmail(data.email);
      res.redirect("/signup_otp");
    } else {
      return res.render("user/signup", {
        errors: null,
        checkPass: false,
        home: false,
        mes: "",
      });
    }
  } catch (error) {
    console.error("Something happed  signup-post entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const landing = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.user });
    const productData = await productModel.find({}).populate("category");
    const categoryData = await categoryModel.find({});
    
    if (user) {
      return res.render("user/home", {
        home: true,
        productData,
        categoryData,
      });
    } else {
      return res.render("user/landing", {
        home: false,
        productData,
        categoryData,
      });
    }
  } catch (error) {
    console.error("Something happed to landing page entry issue", error);
    return res.status(404).render("user/error-page");
  }
};//---

const home = async (req, res) => {
  try {
    const categoryData = await categoryModel.find({is_listed:true});
    const categoryIds = categoryData.map(category => category._id);

    const page = parseInt(req.query.page) || 1;
    const limit =  2;
    let totalProduct = await productModel.find({is_listed:true,category: { $in: categoryIds }}).countDocuments();
    const totalPage = Math.ceil(totalProduct / limit);
    const nextPage = page < totalPage ? page + 1 : null;

    const user = await userModel.findOne({ email: req.session.user });

    const productData = await productModel
    .find({is_listed:true,category: { $in: categoryIds }})
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("category")

    const wishListData = await wishListModel.find({user: user._id}).populate("items");

    req.session.old_query = false
    req.session.old_sortCriteria = false
    if (user) {
      
      return res.render("user/home", {
        home: true,
        page,
        limit,
        totalProduct,
        totalPage,
        nextPage,
        productData,
        categoryData,
        wishListData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Something happed to home page entry issue", error);
    return res.status(404).render("user/error-page");
  }
};//---

const productDetail = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.user });

    const productId = req.params.product_id;
    const productData = await productModel
      .findById(productId)
      .populate("category");

    const categoryId = productData.category._id;
    const productDatas = await productModel
      .find({ category: categoryId })
      .populate("category");

    const ratingData = await ratingModel.find({product:productId}).populate('user')

    const wishListData = await wishListModel.find({user: user._id}).populate("items")
    return res.render("user/product-detail", {
      home: true,
      user,
      productData,
      productDatas,
      wishListData,
      ratingData
    });
  } catch (error) {
    console.error("Something happed to productDetail page entry issue", error);
    return res.status(404).render("user/error-page");
  }
};//----

const userProfile = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");
    if (user) {
      return res.render("user/profile-main", {
        home: true,
        errors: null,
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfile page entry issue", error);
    return res.status(404).render("user/error-page");
  }
};//----------

const userProfileUpdate = async (req, res) => {
  try {
   
    const userId = req.params.user_id;
    await Promise.all([
      body("first_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("last_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("gender")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("phone_number")
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    if (!errors.isEmpty()) {
      return res.render("user/profile-main", {
        errors: errors.mapped(),
        home: true,
        mes: "",
        user,
      });
    }

    const data = {
      first_name: req.body.first_name.toLowerCase(),
      last_name: req.body.last_name.toLowerCase(),
      gender: req.body.gender.toLowerCase(),
      phone_number: req.body.phone_number,
    };

    await userModel.findByIdAndUpdate(userId, data);

    if (user) {
      return res.redirect("/user_profile");
    } else {
      return res.render("user/profile-main", {
        errors: null,
        home: true,
        mes: "user not found",
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfileUpdate entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const userProfileAddress = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    if (user) {
      return res.render("user/profile-address", {
        errors: null,
        home: true,
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfileAddress entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const userProfileAddressAdd = async (req, res) => {
  try {
    const userId = req.params.user_id;
    await Promise.all([
      body("street")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("city")
      .trim()
      .notEmpty()
      .withMessage()
      .run(req),
      body("district")
        .trim()
        .notEmpty()
        .withMessage("This  field is required")
        .run(req),
      body("state")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("country")
        .trim()
        .notEmpty()
        .withMessage("This field is requirec")
        .run(req),
      body("zip_code")
        .trim()
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const user = await userModel.findById(userId).populate("address");
      return res.render("user/profile-address", {
        errors: errors.mapped(),
        home: true,
        mes:'',
        user,
      });
    }

    const data = {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      zip_code: req.body.zip_code,
    };

    const user = await userModel.findOneAndUpdate(
      { _id: userId }, // Query by user's email
      { $push: { address: data } }, // Add new address to the addresses array
      { new: true } // Return the updated user document
    );

    if (user) {
      const user = await userModel.findById(userId).populate("address");
      return res.render("user/profile-address", {
        errors: null,
        home: true,
        mes: "",
        user,
      });
    }
  } catch (error) {
    console.error(
      "Something happed to userProfileAddressAdd entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};

const userProfileAddressEdit = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");
    const index = req.params.index;
    return res.render("user/profile-address-edit", {
      errors: null,
      home: true,
      index,
      user,
    });
  } catch (error) {
    console.error(
      "Something happed to userProfileAddressEdit entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};

const userProfileAddressEditIn = async (req, res) => {
  try {
    const addressId = req.params.address_id;
    await Promise.all([
      body("street")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("city")
      .trim()
      .notEmpty()
      .withMessage("This field is required")
      .run(req),
      body("district")
        .trim()
        .notEmpty()
        .withMessage("This  field is required")
        .run(req),
      body("state")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("country")
        .trim()
        .notEmpty()
        .withMessage("This field is requirec")
        .run(req),
      body("zip_code")
        .trim()
        .notEmpty()
        .isNumeric()
        .withMessage("This field is required")
        .run(req),
    ]);

    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");
    const errors = validationResult(req);

    if (!errors.isEmpty) {
      return res.render("user/profile-address-edit", {
        errors: errors.mapped(),
        home: true,
        mes: "",
        index,
        user,
      });
    }

    const data = {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      zip_code: req.body.zip_code,
    };

    const userData = await userModel
      .findOneAndUpdate(
        {
          email: req.session.user, // Query by user's email
          "address._id": addressId, // Match the specific address within the array
        },
        {
          $set: {
            "address.$.street": data.street,
            "address.$.city": data.city,
            "address.$.district": data.district,
            "address.$.state": data.state,
            "address.$.country": data.country,
            "address.$.zip_code": data.zip_code,
          },
        },
        { new: true }
      )
      .populate("address");

    if (userData) {
      return res.redirect("/user_profile_address");
    }
  } catch (error) {
    console.error(
      "Something happed to userProfileAddressEditIn entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};

const userProfileAddressDelete = async (req, res) => {
  try {
    const addressId = req.params.address_id;
    const email = req.session.user;
    const user = await userModel
      .findOneAndUpdate(
        { email: email },
        { $pull: { address: { _id: addressId } } },
        { new: true }
      )
      .populate("address");

    if (user) {
      return res.render("user/profile-address", {
        errors: null,
        home: true,
        mes: "",
        user,
      });
    }
  } catch (error) {
    console.error(
      "Something happed to userProfileAddressDelete entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};//------

const userProfileSecurity = (req, res) => {
  try {
    return res.render("user/profile-change-password", {
      errors: null,
      home: true,
      mes: "",
    });
  } catch (error) {
    console.error("Something happed to userProfileSecurity entry issue", error);
    return res.status(404).render("user/error-page");
  }
};//---------

const userProfileSecurityPost = async (req, res) => {
  try {
    await Promise.all([
      body("current_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("new_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("confirm_password")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("user/profile-change-password", {
        errors: errors.mapped(),
        home: true,
        mes: "",
      });
    }

    const data = {
      current_password: req.body.current_password,
      new_password: req.body.new_password,
      confirm_password: req.body.confirm_password,
    };

    function validatePassword(password) {
      if (password.length < 5 || password.length > 20) {
        return false;
      }

      let hasDigit = false;
      let hasLowercase = false;
      let hasUppercase = false;
      let hasSpecialChar = false;
      const specialChars = "!@#$%^&*()-+.";

      for (let i = 0; i < password.length; i++) {
        const char = password[i];

        if (/[0-9]/.test(char)) {
          hasDigit = true;
        } else if (/[a-z]/.test(char)) {
          hasLowercase = true;
        } else if (/[A-Z]/.test(char)) {
          hasUppercase = true;
        } else if (specialChars.includes(char)) {
          hasSpecialChar = true;
        }

        if (hasDigit && hasLowercase && hasUppercase && hasSpecialChar) {
          return true;
        }
      }
      return false;
    }

    const result = validatePassword(data.new_password);
    if (result !== true) {
      return res.render("user/profile-change-password", {
        errors: null,
        home: true,
        mes: "poor password",
      });
    }

    const user = await userModel.findOne({ email: req.session.user });

    //password setting for user logged using auth.
    if (!user.password) {
      if (data.new_password !== data.confirm_password) {
        return res.render("user/profile-change-password", {
          errors: null,
          home: true,
          mes: "wrong confirm password",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.new_password, salt);

        await userModel.findByIdAndUpdate(
          user._id,
          { password: hashedPassword },
          { new: true }
        );

        return res.redirect("/user_profile");
      }
    }

    const passwordMatch = await bcrypt.compare(
      data.current_password,
      user.password
    );

    if (passwordMatch !== true) {
      return res.render("user/profile-change-password", {
        errors: null,
        home: true,
        mes: "Incorrect current password mismatch",
      });
    }

    if (data.new_password !== data.confirm_password) {
      return res.render("user/profile-change-password", {
        errors: null,
        home: true,
        mes: "wrong confirm password",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.new_password, salt);

      await userModel.findByIdAndUpdate(
        user._id,
        { password: hashedPassword },
        { new: true }
      );

      return res.redirect("/user_profile");
    }
  } catch (error) {
    console.error(
      "Something happed to userProfileSecurityPost entry issue",
      error
    );
    return res.status(404).render("user/error-page");
  }
};//-------------

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

const filterSortSearch = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit =  2;
    let totalProduct = await productModel.countDocuments();
    let totalPage = Math.ceil(totalProduct / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    
    const user = await userModel.findOne({ email: req.session.user });
    const wishListData = await wishListModel.find({user:user._id})

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const productData = await productModel.find({})
      .populate("category");
      const categoryData = await categoryModel.find({});
      return res.render("user/home", {
        home: true,
        productData,
        categoryData,
        wishListData,
        errors: errors.mapped(),
      });
    }

    const data = {
      quantity: parseInt(req.query.stock) || -1,
      category: req.query.category || "",
      colour: req.query.colour || "",
      price: parseInt(req.query["price-range"]) || 10000,
      search: req.query.search || "",
      sort: req.query.sort || 1,
    };

    let query = {};
    // Quantity
    if (!isNaN(data.quantity) && data.quantity == 1) {
      query.quantity = { $gt: data.quantity };
    }
    if (data.quantity == 2) {
      query.quantity = { $eq: 0 };
    }

    // Price
    if (!isNaN(data.price) && data.price > 0) {
      query.price = { $lte: data.price };
    }

    // Category
    if (data.category && data.category !== "") {
      const category = await categoryModel.findOne({
        category_name: data.category,
      });
      if (category) {
        query.category = category._id;
      }
    }

    // Colour
    if (data.colour && data.colour !== "") {
      query.colour = data.colour.toLowerCase();
    }

    //search  
    let search = {};
    if (data.search && data.search !== "") {
      search.$or = [
        { product_name: { $regex: data.search, $options: "i" } },
        { colour: { $regex: data.search, $options: "i" } },
        { model: { $regex: data.search, $options: "i" } },
        { description: { $regex: data.search, $options: "i" } },
      ];
    }

    //sorting area
    let sortCriteria = {};

    if (data.sort && data.sort == 2) {
      sortCriteria = { price: 1 };
    }

    if (data.sort && data.sort == 3) {
      sortCriteria = { price: -1 };
    }

    if (data.sort && data.sort == 4) {
      sortCriteria = { model: 1 };
    }

    if (data.sort && data.sort == 5) {
      sortCriteria = { model: -1 };
    }

    let productData = {};
    if(req.session.old_query || req.session.old_sortCriteria ){
      const currentQuery = {...search, ...req.session.old_query};

       productData = await productModel
      .find(currentQuery)
      .sort(req.session.old_sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category")

      totalProduct = await productModel.countDocuments(currentQuery);
      totalPage = Math.ceil(totalProduct / limit);
    }else {

      productData = await productModel
      .find(query)
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category")
      
    totalProduct = await productModel.countDocuments(query);
    totalPage = Math.ceil(totalProduct / limit);
    req.session.old_query = query
    req.session.old_sortCriteria = sortCriteria
    
    }
      
    const categoryData = await categoryModel.find({});
    if (user) {
      return res.render("user/home", {
        home: true,
        page,
        limit,
        totalProduct,
        totalPage,
        nextPage,
        productData,
        categoryData,
        wishListData:wishListData || [],
        errors: null,
      });
    }
  } catch (error) {
    console.error("Something happed to filter entry issue", error);
    return res.status(404).render("user/error-page");
  }
};

const logout = (req, res) => {
  try {
    req.session.user = false;
    return res.redirect("/login");
  } catch (err) {
    console.error("Something happed while logout issue", err);
    return res.status(404).render("user/error-page");
  }
};//--------
module.exports = {

  landing,
  home,

  login,
  loginPost,
  logout,

  signup,
  signupPost,

  forgotPassword,
  forgotPasswordPost,

  loginAuth,
  loginAuthRedirect,
  // loginAuthFacebook,
  // loginAuthFacebookRedirect,

  productDetail,

  userProfile,
  userProfileUpdate,
  userProfileAddress,
  userProfileAddressAdd,
  userProfileAddressEdit,
  userProfileAddressEditIn,
  userProfileAddressDelete,
  userProfileSecurity,
  userProfileSecurityPost,

  filterSortSearch,
  refferalToWallet
  
};
