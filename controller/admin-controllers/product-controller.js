const categoryModel = require("../../models/category");
const productModel = require("../../models/products");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const product = async (req, res) => {
  try {
    const productData = await productModel.find({}).populate("category");

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
        .isNumeric()
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
        .isNumeric()
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
        .isNumeric()
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
        .isNumeric()
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {

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
      };
      return res.redirect("/admin/product");
    }
  } catch (error) {
    console.error("productOffer entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};


module.exports = {
  product,
  productAdd,
  productAddPost,
  productAction,
  productEdit,
  productEditIn,
  productImageDelete,
  productDetailAdmin,
  productOffer,
};
