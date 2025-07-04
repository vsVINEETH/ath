const userModel = require("../../models/user");
const httpStatus = require('../../constants/status')
const { body, validationResult, sanitizeBody } = require("express-validator");

const userProfile = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");
    if (user) {
      return res.status(httpStatus.OK).render("user/profile-main", {
        home: true,
        errors: null,
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfile page entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-main", {
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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-main", {
        errors: null,
        home: true,
        mes: "user not found",
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfileUpdate entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const userProfileAddress = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");

    if (user) {
      return res.status(httpStatus.OK).render("user/profile-address", {
        errors: null,
        home: true,
        user,
      });
    }
  } catch (error) {
    console.error("Something happed to userProfileAddress entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-address", {
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
      return res.status(httpStatus.OK).render("user/profile-address", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const userProfileAddressEdit = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.session.user })
      .populate("address");
    const index = req.params.index;
    return res.status(httpStatus.OK).render("user/profile-address-edit", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      return res.status(httpStatus.BAD_REQUEST).render("user/profile-address-edit", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      return res.status(httpStatus.OK).render("user/profile-address", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

module.exports = {
  userProfile,
  userProfileUpdate,
  userProfileAddress,
  userProfileAddressAdd,
  userProfileAddressEdit,
  userProfileAddressEditIn,
  userProfileAddressDelete,
};