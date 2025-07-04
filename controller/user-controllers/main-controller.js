const userModel = require("../../models/user");
const walletModel = require("../../models/wallet")
const productModel = require("../../models/products");
const categoryModel = require("../../models/category");
const ratingModel = require("../../models/rating")
const wishListModel = require("../../models/wish-list");
const httpStatus = require('../../constants/status')
const { body, validationResult, sanitizeBody } = require("express-validator");

const landing = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.user });
    const productData = await productModel.find({}).populate("category");
    const categoryData = await categoryModel.find({});
    
    if (user) {
      return res.status(httpStatus.OK).render("user/home", {
        home: true,
        productData,
        categoryData,
      });
    } else {
      return res.status(httpStatus.OK).render("user/landing", {
        home: false,
        productData,
        categoryData,
      });
    }
  } catch (error) {
    console.error("Something happed to landing page entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

const home = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.user });
    if (!user) return res.redirect("/login");

    const categoryData = await categoryModel.find({ is_listed: true });
    const categoryIds = categoryData.map(c => c._id);

    const page = parseInt(req.query.page) || 1;
    const limit = 2;

    const data = {
      quantity: parseInt(req.query.stock) || -1,
      category: req.query.category || "",
      colour: req.query.colour || "",
      price: parseInt(req.query["price-range"]) || 10000,
      search: req.query.search || "",
      sort: parseInt(req.query.sort) || 1,
    };

    let query = { is_listed: true, category: { $in: categoryIds } };
    if (data.quantity === 1) query.quantity = { $gt: 0 };
    else if (data.quantity === 2) query.quantity = { $eq: 0 };

    if (data.price > 0) query.price = { $lte: data.price };

    if (data.category) {
      const category = await categoryModel.findOne({ category_name: data.category });
      if (category) query.category = category._id;
    }

    if (data.colour) query.colour = data.colour.toLowerCase();

    // Search
    if (data.search) {
      query.$or = [
        { product_name: { $regex: data.search, $options: "i" } },
        { colour: { $regex: data.search, $options: "i" } },
        { model: { $regex: data.search, $options: "i" } },
        { description: { $regex: data.search, $options: "i" } },
      ];
    }

    // Sorting
    const sortOptions = {
      2: { price: 1 },
      3: { price: -1 },
      4: { model: 1 },
      5: { model: -1 },
    };
    const sortCriteria = sortOptions[data.sort] || {};

    // Pagination and fetch
    const totalProduct = await productModel.countDocuments(query);
    const totalPage = Math.ceil(totalProduct / limit);
    const nextPage = page < totalPage ? page + 1 : null;

    const productData = await productModel
      .find(query)
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category");

    const wishListData = await wishListModel.find({ user: user._id }).populate("items");

    res.render("user/home", {
      home: true,
      productData,
      categoryData,
      wishListData,
      page,
      totalProduct,
      totalPage,
      nextPage,
      limit,
      errors: null,
      query: req.query,
    });
  } catch (error) {
    console.error("Home page error:", error);
    return res.status(500).render("user/error-page");
  }
};


// const home = async (req, res) => {
//   try {
//     const categoryData = await categoryModel.find({is_listed:true});
//     const categoryIds = categoryData.map(category => category._id);

//     const page = parseInt(req.query.page) || 1;
//     const limit =  2;
//     let totalProduct = await productModel.find({is_listed:true,category: { $in: categoryIds }}).countDocuments();
//     const totalPage = Math.ceil(totalProduct / limit);
//     const nextPage = page < totalPage ? page + 1 : null;

//     const user = await userModel.findOne({ email: req.session.user });

//     const productData = await productModel
//     .find({is_listed:true,category: { $in: categoryIds }})
//     .skip((page - 1) * limit)
//     .limit(limit)
//     .populate("category")

//     const wishListData = await wishListModel.find({user: user._id}).populate("items");

//     req.session.old_query = false
//     req.session.old_sortCriteria = false
//     if (user) {
      
//       return res.status(httpStatus.OK).render("user/home", {
//         home: true,
//         page,
//         limit,
//         totalProduct,
//         totalPage,
//         nextPage,
//         productData,
//         categoryData,
//         wishListData,
//       });
//     } else {
//       res.redirect("/login");
//     }
//   } catch (error) {
//     console.error("Something happed to home page entry issue", error);
//     return res.status(httpStatus.NOT_FOUND).render("user/error-page");
//   }
// };

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
    return res.status(httpStatus.OK).render("user/product-detail", {
      home: true,
      user,
      productData,
      productDatas,
      wishListData,
      ratingData
    });
  } catch (error) {
    console.error("Something happed to productDetail page entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};


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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
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
      return res.status(httpStatus.PARTIAL_CONTENT).render("user/home", {
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
    return res.status(httpStatus.NOT_FOUND).render("user/error-page");
  }
};

module.exports = {
    home,
    landing,
    productDetail,
    refferalToWallet,
    filterSortSearch
};