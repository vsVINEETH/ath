const userModel = require("../../models/user");
const bcrypt = require("bcrypt");
const sendOTPEmail = require('../../service/nodeMailer');
const passwordValidator = require('../../utils/passwordValidator');
const httpStatus = require('../../constants/status')
const { body, validationResult, sanitizeBody } = require("express-validator");

const forgotPassword = (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/home");
    } else {
      return res.status(httpStatus.OK).render("user/forgot-password", {
        errors: null,
        mes: "",
        home: false,
      });
    }
  } catch (error) {
    console.error("User forgot password entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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

    const result = passwordValidator.validatePassword(data.password);

    if (result !== true) {
      return res.status(httpStatus.BAD_REQUEST).render("user/forgot-password", {
        errors: null,
        checkPass: true,
        home: false,
        mes: "poor password",
      });
    }
    req.session.newPassword = data;

    const existinUser = await userModel.findOne({ email: data.email });

    if (!existinUser) {
      return res.status(httpStatus.CONFLICT).render("user/forgot-password", {
        errors: null,
        mes: "User not found",
        home: false,
      });
    }

    if (data.password === req.body.confirm_password && existinUser) {
      sendOTPEmail.sendOtpEmail(data.email);
      return res.redirect("/forgot_password_otp");
    } else {
      return res.status(httpStatus.BAD_REQUEST).render("user/forgot-password", {
        errors: null,
        mes: "Password mismatch",
        home: false,
      });
    }
  } catch (error) {
    console.error("User forgot password post entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const userProfileSecurity = (req, res) => {
  try {
    return res.status(httpStatus.OK).render("user/profile-change-password", {
      errors: null,
      home: true,
      mes: "",
    });
  } catch (error) {
    console.error("Something happed to userProfileSecurity entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-change-password", {
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

    const result = passwordValidator.validatePassword(data.new_password);
    if (result !== true) {
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-change-password", {
        errors: null,
        home: true,
        mes: "poor password",
      });
    }

    const user = await userModel.findOne({ email: req.session.user });

    //password setting for user logged using auth.
    if (!user.password) {
      if (data.new_password !== data.confirm_password) {
        return res.status(httpStatus.BAD_REQUEST).render("user/profile-change-password", {
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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-change-password", {
        errors: null,
        home: true,
        mes: "Incorrect current password mismatch",
      });
    }

    if (data.new_password !== data.confirm_password) {
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-change-password", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

module.exports = {
    forgotPassword,
    forgotPasswordPost,
    userProfileSecurity,
    userProfileSecurityPost,
};
