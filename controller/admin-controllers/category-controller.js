const categoryModel = require("../../models/category");
const productModel = require("../../models/products");
const httpStatus = require('../../constants/status');
const { body, validationResult } = require("express-validator");
require("dotenv").config();


const category = async (req, res) => {
  try {
    const categoryData = await categoryModel.find({});
    return res.status(httpStatus.OK).render("admin/category", { categoryData });
  } catch (error) {
    console.error("category entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const categoryAdd = async (req, res) => {
  try {
    return res.status(httpStatus.OK).render("admin/add-category", {
      errors: null,
      mes: "",
    });
  } catch (error) {
    console.error("categoryAdd entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
      return res.status(httpStatus.BAD_REQUEST).render("admin/add-category", {
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
      
      return res.status(httpStatus.OK).render("admin/category", { categoryData });
    } else {
      return res.status(httpStatus.CONFLICT).render("admin/add-category", {
        mes: "This category already exists",
        errors: null,
      });
    }
  } catch (error) {
    console.error("categoryAddPost entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const categoryAction = async (req, res) => {
  try {
    const categoryId = req.params.category_id;
    const foundCategory = await categoryModel.findById(categoryId);

    if (!foundCategory) {
      return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
    }

    foundCategory.is_listed = !foundCategory.is_listed;
    await foundCategory.save();

    return res.status(httpStatus.OK).json({
      success: true,
      is_listed: foundCategory.is_listed,
      category_id: foundCategory._id,
    });

    //return res.redirect("/admin/category");
  } catch (error) {
    console.error("categoryAction entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const categoryEdit = async (req, res) => {
  try {
    const catData = {
      _id: req.params.category_id,
    };

    const categoryData = await categoryModel.findById(catData._id);
    req.session.catData = catData;
    return res.status(httpStatus.OK).render("admin/edit-category", {
      errors: null,
      categoryData,
    });
  } catch (error) {
    console.error("categoryEdit entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
      return res.status(httpStatus.BAD_REQUEST).render("admin/edit-category", {
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
      return res.status(httpStatus.CONFLICT).render("admin/add-category", {
        mes: "This category already exists",
        errors: null,
      });
    }

    const foundCategory = await categoryModel.findByIdAndUpdate(catData._id, {
      category_name: data.category_name,
    });
    if (!foundCategory) {
      
      return res.status(httpStatus.OK).render("admin/edit-category", {
        mes: "category not found",
        categoryData,
      });
    } else {
      return res.redirect("/admin/category");
    };
  } catch (error) {
    console.error("categoryEditIn entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const categoryOffer = async (req, res) => {
  try {
    const catData = req.session.catData;
    const offerPercentage = req.body.categoryOffer * 1;
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
        if (productData[i].offer_applied === false) {

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

module.exports = {
  category,
  categoryAdd,
  categoryAddPost,
  categoryAction,
  categoryEdit,
  categoryEditIn,
  categoryOffer,
};

