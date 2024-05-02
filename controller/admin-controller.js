const userModel = require("../models/user");
const categoryModel = require("../models/category");
const productModel = require("../models/products");
const ratingModel = require("../models/rating");
const orderModel = require("../models/order");
const path = require("path");
const PDFDocument = require("pdfkit");
const Excel = require("exceljs");
const json2csv = require("json2csv");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const login = (req, res) => {
  try {
    if (req.session.admin) {
      return res.status(200).render("admin/dashboard");
    } else {
      return res.status(200).render("admin/login", { mes: "" });
    }
  } catch (error) {
    console.error("Login entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const loginpost = (req, res) => {
 
  try {
    const admin_user_name = process.env.ADMIN_USER_NAME;
    const admin_password = process.env.ADMIN_PASSWORD;
    console.log(admin_password);
    if (
      admin_user_name === req.body.email &&
      admin_password === req.body.password
    ) {
      req.session.admin = req.body.email;
      return res.status(200).redirect("/admin/admin_dashboard");
    } else {
      return res.render("admin/login", { mes: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Loginpost entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {
      const orderData = await orderModel.find();
      console.log(orderData, "ooooo");

      const result = await orderModel.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);

      const topProduct = await productModel.find({
        _id: { $in: result.map((item) => item._id) },
      });
      req.session.topProduct = topProduct;

      const categoryResult = await orderModel.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category._id",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);

      const topCategory = await categoryModel.find({
        _id: { $in: categoryResult.map((item) => item._id) },
      });
      req.session.topCategory = topCategory;

      return res.status(200).render("admin/dashboard", {
        orderData: orderData || [],
        topProduct: topProduct || [],
        topCategory: topCategory || [],
      });
    } else {
      return res.redirect("/admin/admin_login");
    }
  } catch (error) {
    console.error("dashboard entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const dashBoardFilter = async (req, res) => {
  try {
    const topProduct = req.session.topProduct;
    const topCategory = req.session.topCategory;
    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;
    let currentDay = currentDate.getDate();

    const data = {
      period: parseInt(req.body.period),
      
      from_date: `${req.body.fromDate || `${currentYear}-01-01`}T00:00:00`,
      end_date: `${req.body.endDate || `${currentYear}-12-31`}T23:59:59`,
    };

    let dateRange = {};
    //filter date range
    if (data.from_date <= data.end_date) {
      console.log("helllooo");
      dateRange = { $gte: data.from_date, $lte: data.end_date };
    } else {
      dateRange = {
        $gte: `${`${currentYear}-01-01`}T00:00:00`,
        $lte: `${`${currentYear}-12-31`}T23:59:59`,
      };
    }

    // period based
    if (data.period) {
      if (data.period == 1) {
        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else if (data.period == 7) {
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Adjust to Monday

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const startDay = startDate.getDate().toString().padStart(2, "0");
        const endDay = endDate.getDate().toString().padStart(2, "0");

        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${startDay}`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${endDay}`}T23:59:59`,
        };
      } else if (data.period == 30) {
        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-01`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else if (data.period == 365) {
        dateRange = {
          $gte: `${`${currentYear}-01-01`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else {
        dateRange = {
          $gte: `${`${currentYear}-01-01`}T00:00:00`,
          $lte: `${`${currentYear}-12-31`}T23:59:59`,
        };
      }
    }

    const orderData = await orderModel.find({ createdAt: dateRange });
    return res.status(200).render("admin/dashboard", {
      orderData,
      topProduct,
      topCategory,
    });
  } catch (error) {
    console.error("dashBoardFilter entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const customers = async (req, res) => {
  try {
    const customerData = await userModel.find({});
    //console.log(customerData);
    if (customerData) {
      return res.render("admin/users", { customerData });
    }
  } catch (error) {
    console.error("customers entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const customerAction = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const foundCustomer = await userModel.findById(userId); // Corrected findById usage

    if (!foundCustomer) {
      return res.status(404).render("admin/error-page");
    }

    // Toggle the value of is_block
    foundCustomer.is_block = !foundCustomer.is_block;

    // Save the updated customer
    await foundCustomer.save(); // Await the save operation

    console.log(foundCustomer);
    return res.redirect("/admin/customers");
  } catch (error) {
    console.error("customerAction entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const category = async (req, res) => {
  try {
    const categoryData = await categoryModel.find({});
    // console.log(categoryData);
    return res.render("admin/category", { categoryData });
  } catch (error) {
    console.error("category entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryAdd = async (req, res) => {
  try {
    return res.render("admin/add-category", {
      errors: null,
      mes: "",
    });
  } catch (error) {
    console.error("categoryAdd entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryAddPost = async (req, res) => {
  try {
    await Promise.all([
      body("category")
        .trim()
        .notEmpty()
        .withMessage("This field is requird")
        .run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("h");
      return res.render("admin/add-category", {
        errors: errors.mapped(),
        mes: "",
      });
    }

    const data = {
      category_name: req.body.category.toLowerCase().slice(0, 20),
    };

    const existinCategory = await categoryModel.findOne({
      category_name: data.category_name,
    });
    if (!existinCategory) {
      const newCategory = new categoryModel(data);
      await newCategory.save();
      const categoryData = await categoryModel.find({});
      
      return res.render("admin/category", { categoryData });
    } else {
      return res.render("admin/add-category", {
        mes: "This category already exists",
        errors: null,
      });
    }
  } catch (error) {
    console.error("categoryAddPost entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryAction = async (req, res) => {
  try {
    const categoryId = req.params.category_id;
    const foundCategory = await categoryModel.findById(categoryId);

    if (!foundCategory) {
      return res.status(404).render("admin/error-page");
    }

    foundCategory.is_listed = !foundCategory.is_listed;
    await foundCategory.save();

    console.log(foundCategory);
    return res.redirect("/admin/category");
  } catch (error) {
    console.error("categoryAction entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryEdit = async (req, res) => {
  try {
    const catData = {
      _id: req.params.category_id,
    };
    const categoryData = await categoryModel.findById(catData._id);
    console.log("catData", catData);
    req.session.catData = catData;
    return res.render("admin/edit-category", {
      errors: null,
      categoryData,
    });
  } catch (error) {
    console.error("categoryEdit entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryEditIn = async (req, res) => {
  try {
    const catData = req.session.catData;
    await Promise.all([
      body("categoryMod")
        .trim()
        .notEmpty()
        .withMessage("This field is requird")
        .run(req),
    ]);
    const categoryData = await categoryModel.findById(catData._id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("oh error");
      return res.render("admin/edit-category", {
        errors: errors.mapped(),
        categoryData,
      });
    }

    const data = {
      category_name: req.body.categoryMod.toLowerCase().slice(0, 20),
    };

    const existinCategory = await categoryModel.findOne({
      category_name: data.category_name,
    });

    if (existinCategory) {
      return res.render("admin/add-category", {
        mes: "This category already exists",
        errors: null,
      });
    }

    const foundCategory = await categoryModel.findByIdAndUpdate(catData._id, {
      category_name: data.category_name,
    });
    if (!foundCategory) {
      
      return res.render("admin/edit-category", {
        mes: "category not found",
        categoryData,
      });
    } else {
      console.log(foundCategory);
      return res.redirect("/admin/category");
    }
  } catch (error) {
    console.error("categoryEditIn entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const categoryOffer = async (req, res) => {
  try {
    const catData = req.session.catData;
    const offerPercentage = req.body.categoryOffer * 1;
    const categoryData = await categoryModel.findById(catData._id);
    const productData = await productModel.find({ category: catData._id });

    if (offerPercentage === 0) {
      for (let i = 0; i < productData.length; i++) {
        productData[i].price = productData[i].mrp;
        productData[i].offer_applied = false;
        await productData[i].save();
      }

      await categoryModel.findByIdAndUpdate(catData._id, {
        offer_applied: false,
        offer_percentage: offerPercentage,
      });
      return res.redirect("/admin/category");
    } else {
      for (let i = 0; i < productData.length; i++) {
        if (productData[i].offer_applied == false) {
          const mrp = productData[i].price;
          productData[i].mrp = productData[i].price;

          const discountedPrice = mrp - (mrp * offerPercentage) / 100;

          productData[i].price = parseInt(discountedPrice);
          productData[i].offer_applied = true;

          await productData[i].save();
        } else {
          const price = productData[i].mrp;
          productData[i].price = productData[i].mrp;
          const discountedPrice = price - (price * offerPercentage) / 100;
          productData[i].price = parseInt(discountedPrice);

          await productData[i].save();
        }
      }

      await categoryModel.findByIdAndUpdate(catData._id, {
        offer_applied: true,
        offer_percentage: offerPercentage,
      });
      return res.redirect("/admin/category");
    }
  } catch (error) {
    console.error("categoryOffer entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const product = async (req, res) => {
  try {
    const productData = await productModel.find({}).populate("category");

    console.log(productData);
    return res.render("admin/product", { productData });
  } catch (error) {
    console.error("product entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productAdd = async (req, res) => {
  try {
    const categoryData = await categoryModel.find({});

    return res.render("admin/add-product", {
      errors: null,
      mes: "",
      categoryData,
    });
  } catch (error) {
    console.error("Add product entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productAddPost = async (req, res) => {
  try {
    await Promise.all([
      body("product_name")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("model")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("price")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("colour")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("quantity")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("description")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("category")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
    ]);

    const categoryData = await categoryModel.find({});

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("oops");
      return res.render("admin/add-product", {
        errors: errors.mapped(),
        mes: "",
        categoryData,
      });
    }

    const image = req.files.map((file) => file.filename);

    const data = {
      product_name: req.body.product_name,
      model: req.body.model,
      price: req.body.price,
      colour: req.body.colour.toLowerCase(),
      quantity: req.body.quantity,
      category: req.body.category,
      description: req.body.description,
      image: image,
    };

    const existinCategory = await categoryModel.findOne({
      _id: data.category,
    });

    console.log(existinCategory.category_name);

    if (existinCategory) {
      const newProduct = new productModel(data);
      await newProduct.save();

      const productData = await productModel.find({});
      return res.render("admin/product", { productData });
    } else {
      return res.render("admin/add-product", {
        errors: null,
        mes: "",
      });
    }
  } catch (error) {
    console.error("productAddPost entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productAction = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const foundProduct = await productModel.findById(productId);

    if (!foundProduct) {
      return res.status(404).render("admin/error-page");
    }

    foundProduct.is_listed = !foundProduct.is_listed;
    await foundProduct.save();

    return res.redirect("/admin/product");
  } catch (error) {
    console.error("productAction entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productEdit = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const categoryData = await categoryModel.find({});
    const productData = await productModel
      .findById(productId)
      .populate("category");

    console.log("pro", productId);
    req.session.product_id = productId;
    return res.render("admin/edit-product", {
      errors: null,
      mes: "",
      categoryData,
      productData,
    });
  } catch (error) {
    console.error("productEdit entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productEditIn = async (req, res) => {
  try {
    const productId = req.session.product_id;
    console.log(productId);
    await Promise.all([
      body("product_name")
        .trim()
        .notEmpty()
        .withMessage("This fiel is required")
        .run(req),
      body("model")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("price")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("colour")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("quantity")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("category")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
      body("description")
        .trim()
        .notEmpty()
        .withMessage("This field is required")
        .run(req),
    ]);

    const categoryData = await categoryModel.find({});
    const productData = await productModel.find({});
    console.log(req.body.colour.toLowerCase(), req.body.category);

    const errors = validationResult(req);

    console.log(errors);

    if (!errors.isEmpty()) {
      console.log("oh you again");
      return res.render("admin/edit-product", {
        errors: errors.mapped(),
        mes: "",
        categoryData,
        productData: productData || [],
      });
    }
    const existinProduct = await productModel.findById(productId);

    const image = existinProduct.image.concat(
      req.files.map((file) => file.filename)
    );
    const data = {
      product_name: req.body.product_name,
      model: req.body.model,
      price: req.body.price,
      colour: req.body.colour.toLowerCase(),
      quantity: req.body.quantity,
      description: req.body.description,
      category: req.body.category,
      image: image,
    };
    console.log(data);
    console.log(data.image);

    if (existinProduct) {
      await productModel.findByIdAndUpdate(productId, data);
      const productData = await productModel.find({});
      const categoryData = await categoryModel.find({});
      return res.render("admin/product", {
        errors: null,
        mes: "",
        productData: productData || [],
        categoryData,
      });
    } else {
      return res.render("admin/edit-product", {
        errors: errors.mapped(),
        mes: "Unable to find product",
        categoryData,
        productData,
      });
    }
  } catch (error) {
    console.error("productEditIn entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productImageDelete = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const imageName = req.params.image_name;
    console.log(productId, imageName);
    const categoryData = await categoryModel.find({});
    const productData = await productModel.findOneAndUpdate(
      { _id: productId },
      { $pull: { image: imageName } },
      { new: true }
    );

  
    return res.render("admin/edit-product", {
      errors: null,
      mes: "",
      categoryData,
      productData,
    });
  } catch (error) {
    console.error("productImageDelete entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productDetailAdmin = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const productData = await productModel
      .findById(productId)
      .populate("category");

    return res.render("admin/product-detail", {
      productData: productData || [],
    });
  } catch (error) {
    console.error("productDetailAdmin entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const productOffer = async (req, res) => {
  try {
    const productId = req.session.product_id;
    const offerPercentage = req.body.productOffer * 1;
    const productData = await productModel.findById(productId);

    if (offerPercentage === 0) {
      productData.price = productData.mrp;
      productData.offer_applied = false;
      productData.offer_percentage = offerPercentage;
      await productData.save();
      return res.redirect("/admin/product");
    } else {
      if (productData.offer_applied == false) {
        const mrp = productData.price;
        productData.mrp = productData.price;

        const discountedPrice = mrp - (mrp * offerPercentage) / 100;

        productData.price = parseInt(discountedPrice);
        productData.offer_applied = true;
        productData.offer_percentage = offerPercentage;

        await productData.save();
      } else {
        const price = productData.mrp;
        productData.price = productData.mrp;
        const discountedPrice = price - (price * offerPercentage) / 100;
        productData.price = parseInt(discountedPrice);

        await productData.save();
      }
      return res.redirect("/admin/product");
    }
  } catch (error) {
    console.error("productOffer entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const salesReport = async (req, res) => {
  try {
    req.session.reportData = false
    const orderData = await orderModel.find({}).populate("items.product");
    return res.render("admin/sales-report", { orderData: orderData });
  } catch (error) {
    console.error("salesReport entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const salesReportFilter = async (req, res) => {
  try {
    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;
    let currentDay = currentDate.getDate();

    console.log(currentYear);
    const data = {
      period: parseInt(req.body.period),
      sort: parseInt(req.body.sort) || 1,
      from_date: `${req.body.fromDate || `${currentYear}-01-01`}T00:00:00`,
      end_date: `${req.body.endDate || `${currentYear}-12-31`}T23:59:59`,
    };

    console.log(data);

    let dateRange = {};
    //filter date range
    if (data.from_date <= data.end_date) {
      console.log("helllooo");
      dateRange = { $gte: data.from_date, $lte: data.end_date };
    } else {
      dateRange = {
        $gte: `${`${currentYear}-01-01`}T00:00:00`,
        $lte: `${`${currentYear}-12-31`}T23:59:59`,
      };
    }

    // period based
    if (data.period) {
      if (data.period == 1) {
        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else if (data.period == 7) {
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Adjust to Monday

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const startDay = startDate.getDate().toString().padStart(2, "0");
        const endDay = endDate.getDate().toString().padStart(2, "0");

        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${startDay}`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${endDay}`}T23:59:59`,
        };
      } else if (data.period == 30) {
        dateRange = {
          $gte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-01`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else if (data.period == 365) {
        dateRange = {
          $gte: `${`${currentYear}-01-01`}T00:00:00`,
          $lte: `${`${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}-${currentDay
            .toString()
            .padStart(2, "0")}`}T23:59:59`,
        };
      } else {
        dateRange = {
          $gte: `${`${currentYear}-01-01`}T00:00:00`,
          $lte: `${`${currentYear}-12-31`}T23:59:59`,
        };
      }
    }

    let sortCriteria = {};
    //sorting based on criteria
    if (data.sort) {
      sortCriteria = { createdAt: data.sort };
    }

    if (data.sort && data.sort == 2) {
      sortCriteria = { createdAt: 1 };
    }

    if (data.sort && data.sort == 3) {
      sortCriteria = { createdAt: -1 };
    }

    if (data.sort && data.sort == 4) {
      sortCriteria = { "items.quantity": 1 };
    }

    if (data.sort && data.sort == 5) {
      sortCriteria = { "items.quantity": -1 };
    }

    if (data.sort && data.sort == 6) {
      sortCriteria = { "items.each_discount": 1 };
    }

    if (data.sort && data.sort == 7) {
      sortCriteria = { "items.each_discount": -1 };
    }

    if (data.sort && data.sort == 8) {
      sortCriteria = { "items.total": 1 };
    }

    if (data.sort && data.sort == 9) {
      sortCriteria = { "items.total": -1 };
    }

    //    const orderData  = await orderModel.aggregate([{$match: {createdAt: dateRange}}])//its not working
    const orderData = await orderModel
      .find({ createdAt: dateRange })
      .sort(sortCriteria)
      .populate("items.product");

    req.session.reportData = orderData;

    console.log(orderData);
    return res.render("admin/sales-report", { orderData: orderData });
  } catch (error) {
    console.error("salesReportFilter entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const downloadReportPDF = async (req, res) => {
  try {
    const orderData = await orderModel.find({}).populate("items.product");
    const reportData = req.session.reportData || orderData;

    if (!reportData || reportData.length === 0) {
      return res.redirect("/admin/sales_report");
    }

    let totalQuantity = 0;
    let totalDiscount = 0;
    let totalPrice = 0;

    reportData.forEach((element) => {
      element.items.forEach((item) => {
        totalQuantity += item.quantity;
        totalDiscount += item.each_discount;
        totalPrice += item.total;
      });
    });

    let data = [];
    reportData.forEach((element) => {
      element.items.forEach((item) => {
        data.push([
          item.product._id.toString().slice(-6),
          new Date(element.createdAt).toLocaleDateString(),
          item.quantity,
          item.each_discount,
          item.total,
        ]);
      });
    });

    const doc = new PDFDocument({ size: "a4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment;filename=invoice.pdf");

    doc.pipe(res);

    const tableHeaders = [
      "ProId",
      "Date",
      "Total Quantity",
      "Discount",
      "Amount",
    ];
    const columnWidths = [50, 60, 80, 100, 80];
    let y = doc.y + 35;

    tableHeaders.forEach((header, i) => {
      doc.text(header, 10 + i * 125, y, {
        width: columnWidths[i],
        align: "center",
      });
      doc
        .moveTo(10 + i * 125, y + 15)
        .lineTo(10 + (i + 1) * 125, y + 15)
        .stroke();
      //  doc.moveTo(10 + i * 125, y + 15).lineTo(10 + i * 125, y + 30 + data.length * 15).stroke(); // Vertical line for each column
    });

    data.forEach((item, index) => {
      let x = 10;
      item.forEach((value, i) => {
        doc.text(value.toString(), x + i * 125, y + 30 + index * 15, {
          width: columnWidths[i],
          align: "center",
        });
        doc.lineTo(10 + (i + 1) * 125, y + 15).stroke();
        //  doc.lineTo(10 + (i + 1) * 125, y + 15 + index * 15).stroke();
      });
    });

    doc.text(
      totalQuantity.toString(),
      10 + 2 * 125,
      y + 30 + data.length * 15,
      { width: columnWidths[2], align: "center" }
    );
    doc.text(
      totalDiscount.toString(),
      10 + 3 * 125,
      y + 30 + data.length * 15,
      { width: columnWidths[3], align: "center" }
    );
    doc.text(totalPrice.toString(), 10 + 4 * 125, y + 30 + data.length * 15, {
      width: columnWidths[4],
      align: "center",
    });

    const footerText = "Report";
    const footerWidth = doc.widthOfString(footerText);
    const footerHeight = 20;
    doc.text(
      footerText,
      (doc.page.width - footerWidth) / 2,
      doc.page.height - 50,
      { width: footerWidth, height: footerHeight, align: "center" }
    );

    doc.fontSize(25);
    doc.end();
  } catch (error) {
    console.error("downloadReportPDF entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const downloadReportExcel = async (req, res) => {
  try {
    const orderData = await orderModel.find({});
    const reportData = req.session.reportData || orderData;

    if (!reportData || reportData.length === 0) {
      return res.redirect("/admin/sales_report");
    }

    let data = [];
    reportData.forEach((element) => {
      element.items.forEach((item) => {
        data.push([
          item.product._id.toString().slice(-6),
          new Date(element.createdAt).toLocaleDateString(),
          item.quantity,
          item.each_discount,
          item.total,
        ]);
      });
    });

    const workbook = new Excel.Workbook();

    const sheet = workbook.addWorksheet("Report");

    sheet.columns = [
      { header: "ProId", key: "orderid", width: 10 },
      { header: "Date", key: "date", width: 32 },
      { header: "Quantity", key: "quantity", width: 10, outlineLevel: 1 },
      { header: "Discount", key: "discount", width: 10, outlineLevel: 1 },
      { header: "Amount", key: "amount", width: 10, outlineLevel: 1 },
    ];

    // Add rows from data array
    data.forEach((row) => {
      sheet.addRow(row);
    });

    // Stream the workbook to the response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("downloadReportExcel entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const downloadReportCSV = async (req, res) => {
  try {
    const orderData = await orderModel.find({});
    const reportData = req.session.reportData || orderData;

    if (!reportData || reportData.length === 0) {
      return res.redirect("/admin/sales_report");
    }
    let data = [];
    reportData.forEach((element) => {
      element.items.forEach((item) => {
        data.push({
          ProId: item.product._id.toString().slice(-6),
          Date: new Date(element.createdAt).toLocaleDateString(),
          "Total Quantity": item.quantity,
          Discount: item.each_discount,
          Amount: item.total,
        });
      });
    });

    const csv = json2csv.parse(data);

    // Sending CSV as response
    res.header("Content-Type", "text/csv");
    res.attachment("report.csv");
    res.send(csv);
  } catch (error) {
    console.error("downloadReportCSV entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const logout = (req, res) => {
  try {
    req.session.admin = false;
    return res.redirect("/admin/admin_login");
  } catch (error) {
    console.error("Logout issue", error);
    return res.status(500).render("admin/error-page");
  }
};

module.exports = {
  login,
  loginpost,
  logout,
  dashboard,
  dashBoardFilter,

  customers,
  customerAction,
  category,
  categoryAdd,
  categoryAddPost,
  categoryAction,
  categoryEdit,
  categoryEditIn,
  categoryOffer,

  product,
  productAdd,
  productAddPost,
  productAction,
  productEdit,
  productEditIn,
  productImageDelete,
  productDetailAdmin,
  productOffer,

  salesReport,
  salesReportFilter,
  downloadReportPDF,
  downloadReportExcel,
  downloadReportCSV,
};
