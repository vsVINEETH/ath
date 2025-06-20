const userModel = require("../../models/user");
const bcrypt = require("bcrypt");
const sendOTPEmail = require('../../service/nodeMailer');
const passwordValidator = require('../../utils/passwordValidator');
const { body, validationResult, sanitizeBody } = require("express-validator");

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

const logout = (req, res) => {
  try {
    req.session.user = false;
    return res.redirect("/login");
  } catch (err) {
    console.error("Something happed while logout issue", err);
    return res.status(404).render("user/error-page");
  }
};

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

    const result = passwordValidator.validatePassword(data.password);

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

module.exports = {
  login,
  loginPost,
  logout,

  signup,
  signupPost,
};