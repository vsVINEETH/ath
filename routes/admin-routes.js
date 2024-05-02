const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin-controller');
const orderController = require('../controller/order-controller')
const couponController = require('../controller/coupon-controller')
const {adminCheck, uploadMiddle} = require('../middle-ware/middle-wares');


router.get('/admin_login',adminController.login)
router.post('/admin_login',adminController.loginpost)
router.get('/admin_dashboard',adminCheck,adminController.dashboard)
router.post('/dashboard_filter',adminCheck,adminController.dashBoardFilter)
router.get('/admin_logout',adminController.logout)

router.get('/customers',adminCheck,adminController.customers)
router.get('/customers_action/:user_id',adminCheck,adminController.customerAction) 

router.get('/category',adminCheck,adminController.category)
router.get('/add_category',adminCheck,adminController.categoryAdd)
router.post('/add_category',adminCheck,adminController.categoryAddPost)
router.get('/category_action/:category_id',adminCheck,adminController.categoryAction)
router.get('/edit_category/:category_id',adminCheck,adminController.categoryEdit)
router.post('/edit_category/',adminCheck,adminController.categoryEditIn)
router.post('/category_offer',adminCheck,adminController.categoryOffer)

router.get('/product',adminCheck,adminController.product);
router.get('/add_product',adminCheck,uploadMiddle,adminController.productAdd);
router.post('/add_product',adminCheck,uploadMiddle,adminController.productAddPost);
router.get('/product_action/:product_id',adminCheck,adminController.productAction);
router.get('/edit_product/:product_id',adminCheck,uploadMiddle,adminController.productEdit);
router.get('/product_image_delete/:product_id/:image_name', adminCheck, adminController.productImageDelete)
router.post('/edit_product',adminCheck,uploadMiddle,adminController.productEditIn);
router.get("/product_detail/:product_id",adminCheck,adminController.productDetailAdmin);
router.post("/product_offer",adminCheck,adminController.productOffer);

router.get('/order_list',adminCheck,orderController.orderListAdmin)
router.get('/order_detail/:order_id',adminCheck,orderController.orderDetailAdmin);
router.post("/order_cancel/:product_id/:item_id",adminCheck,orderController.orderCancelAdmin);
router.post("/update_order_status",adminCheck,orderController.orderStatusAdmin)
router.get('/order_return_order',adminCheck,orderController.returnOrderAdmin)

router.get('/coupon',adminCheck,couponController.couponList);
router.get('/add_coupon',adminCheck,couponController.couponAdd)
router.post('/add_coupon',adminCheck,couponController.couponAddPost);
router.get('/coupon_action/:coupon_id',adminCheck,couponController.couponAction);
router.get('/delete_coupon/:coupon_id',adminCheck,couponController.couponDelete);

router.get('/sales_report', adminCheck,adminController.salesReport);
router.post("/filter_report",adminCheck, adminController.salesReportFilter);
router.get('/download_report_pdf',adminCheck, adminController.downloadReportPDF);
router.get('/download_report_excel',adminCheck, adminController.downloadReportExcel);
router.get('/download_report_csv',adminCheck, adminController.downloadReportCSV);
module.exports = router;