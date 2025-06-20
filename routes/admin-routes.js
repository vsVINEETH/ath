const express = require('express');
const router = express.Router();
//const adminController = require('../controller/admin-controller');
const authController = require('../controller/admin-controllers/auth-controller');
const dashboardController = require('../controller/admin-controllers/dashboard-controller');
const customerController = require('../controller/admin-controllers/customer-controller');
const categoryController = require('../controller/admin-controllers/category-controller');
const productController = require('../controller/admin-controllers/product-controller');
const salesController = require('../controller/admin-controllers/sales-controller');
//const orderController = require('../controller/order-controller');
const orderController = require('../controller/admin-controllers/order-controller');
const couponController = require('../controller/coupon-controller');

const {adminCheck, uploadMiddle} = require('../middle-ware/middle-wares');


router.get('/admin_login',authController.login);
router.post('/admin_login',authController.loginpost);
router.get('/admin_logout',authController.logout);

router.get('/admin_dashboard', adminCheck, dashboardController.dashboard);
router.post('/dashboard_filter', adminCheck, dashboardController.dashBoardFilter);

router.get('/customers', adminCheck, customerController.customers)
router.get('/customers_action/:user_id', adminCheck, customerController.customerAction) 

router.get('/category', adminCheck, categoryController.category)
router.get('/add_category', adminCheck, categoryController.categoryAdd)
router.post('/add_category', adminCheck, categoryController.categoryAddPost)
router.get('/category_action/:category_id', adminCheck, categoryController.categoryAction)
router.get('/edit_category/:category_id', adminCheck, categoryController.categoryEdit)
router.post('/edit_category/', adminCheck, categoryController.categoryEditIn)
router.post('/category_offer', adminCheck, categoryController.categoryOffer)

router.get('/product', adminCheck, productController.product);
router.get('/add_product', adminCheck, uploadMiddle, productController.productAdd);
router.post('/add_product', adminCheck, uploadMiddle, productController.productAddPost);
router.get('/product_action/:product_id', adminCheck, productController.productAction);
router.get('/edit_product/:product_id', adminCheck, uploadMiddle, productController.productEdit);
router.get('/product_image_delete/:product_id/:image_name', adminCheck, productController.productImageDelete)
router.post('/edit_product', adminCheck, uploadMiddle, productController.productEditIn);
router.get("/product_detail/:product_id", adminCheck, productController.productDetailAdmin);
router.post("/product_offer", adminCheck, productController.productOffer);

router.get('/order_list', adminCheck, orderController.orderListAdmin)
router.get('/order_detail/:order_id', adminCheck, orderController.orderDetailAdmin);
router.post("/order_cancel/:product_id/:item_id", adminCheck, orderController.orderCancelAdmin);
router.post("/update_order_status", adminCheck, orderController.orderStatusAdmin)
router.get('/order_return_order', adminCheck, orderController.returnOrderAdmin)

router.get('/coupon', adminCheck, couponController.couponList);
router.get('/add_coupon', adminCheck, couponController.couponAdd)
router.post('/add_coupon', adminCheck, couponController.couponAddPost);
router.get('/coupon_action/:coupon_id', adminCheck, couponController.couponAction);
router.get('/delete_coupon/:coupon_id', adminCheck, couponController.couponDelete);

router.get('/sales_report', adminCheck, salesController.salesReport);
router.post("/filter_report", adminCheck, salesController.salesReportFilter);
router.get('/download_report_pdf', adminCheck, salesController.downloadReportPDF);
router.get('/download_report_excel', adminCheck, salesController.downloadReportExcel);
router.get('/download_report_csv', adminCheck, salesController.downloadReportCSV);

module.exports = router;