const { check } = require("express-validator");
const userModel = require("../models/user");
const multer = require("multer");
const path = require("path");
const categoryModel = require("../models/category");


// global Error handling middleware
const globalErrorHandler = async (err, req, res, next) => {
  console.error(err.stack);
  return res.status(404).render("user/error-page");
};

const blockCheck = async (req, res, next) => {
  const email = req.session.user;
  const user = await userModel.findOne({ email: email });
  if (user && user.is_block === true) {
    console.log("hoi");
    return res.render("user/login", {
      mes: "You are blocked",
      home: false,
    });
  } else {
    next();
  }
};

const adminCheck = (req, res, next) => {
  const admin = req.session.admin;
  if (!admin) {
    return res.redirect("/admin/admin_login");
  } else {
    next();
  }
};

const userCheck = (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login");
  } else { 
    next();
  }
};

const ignoreFavicon = (req, res, next) => {
  if (req.originalUrl.includes("favicon.ico")) {
    res.status(204).end();
  } else {
    next();
  }
};

const uploadMiddle = async (req, res, next) => {
  const categoryData = await categoryModel.find({});
  const storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    },
  }).array("image", 4);

  function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images only");
    }
  }

  upload(req, res, (err) => {
    if (err) {
      res.render("admin/add-product", {
        errors: null,
        mes: err,
        categoryData,
      });
    } else {
      next();
    }
  });
};

module.exports = {
  blockCheck,
  ignoreFavicon,
  adminCheck,
  uploadMiddle,
  userCheck,
  globalErrorHandler
};
