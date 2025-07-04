const orderModel = require("../../models/order");
const PDFDocument = require("pdfkit");
const Excel = require("exceljs");
const json2csv = require("json2csv");
const httpStatus = require('../../constants/status')
require("dotenv").config();

const salesReport = async (req, res) => {
  try {
    req.session.reportData = false;
    const orderData = await orderModel.find({}).populate("items.product");
    return res.status(httpStatus.OK).render("admin/sales-report", { orderData: orderData });
  } catch (error) {
    console.error("salesReport entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const salesReportFilter = async (req, res) => {
  try {
    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;
    let currentDay = currentDate.getDate();

    const data = {
      period: parseInt(req.body.period),
      sort: parseInt(req.body.sort) || 1,
      from_date: `${req.body.fromDate || `${currentYear}-01-01`}T00:00:00`,
      end_date: `${req.body.endDate || `${currentYear}-12-31`}T23:59:59`,
    };

    let dateRange = {};
    //filter date range
    if (data.from_date <= data.end_date) {
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

    const orderData = await orderModel
      .find({ createdAt: dateRange })
      .sort(sortCriteria)
      .populate("items.product");

    req.session.reportData = orderData;

    return res.status(httpStatus.OK).render("admin/sales-report", { orderData: orderData });
  } catch (error) {
    console.error("salesReportFilter entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
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
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

module.exports = {
  salesReport,
  salesReportFilter,
  downloadReportPDF,
  downloadReportExcel,
  downloadReportCSV,
};
