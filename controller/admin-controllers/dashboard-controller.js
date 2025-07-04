const categoryModel = require("../../models/category");
const productModel = require("../../models/products");
const orderModel = require("../../models/order");
const httpStatus = require('../../constants/status');

require("dotenv").config();

const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {

      const orderData = await orderModel.find();
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

      return res.status(httpStatus.OK).render("admin/dashboard", {
        orderData: orderData || [],
        topProduct: topProduct || [],
        topCategory: topCategory || [],
      });
    } else {
      return res.redirect("/admin/admin_login");
    }
  } catch (error) {
    console.error("dashboard entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
        startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);

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
    return res.status(httpStatus.OK).render("admin/dashboard", {
      orderData,
      topProduct,
      topCategory,
    });
  } catch (error) {
    console.error("dashBoardFilter entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

module.exports = {
  dashboard,
  dashBoardFilter,
};

