require("dotenv").config();
const httpStatus = require('../../constants/status')


const login = (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin/admin_dashboard");
    } else {
      return res.status(httpStatus.OK).render("admin/login", { mes: "" });
    }
  } catch (error) {
    console.error("Login entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const loginpost = (req, res) => {
 
  try {
    const admin_user_name = process.env.ADMIN_USER_NAME;
    const admin_password = process.env.ADMIN_PASSWORD;
    if (
      admin_user_name === req.body.email &&
      admin_password === req.body.password
    ) {
      req.session.admin = req.body.email;
      return res.redirect("/admin/admin_dashboard");
    } else {
      return res.status(httpStatus.UNAUTHORIZED).render("admin/login", { mes: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Loginpost entry issue", error);
    return res.status(httpStatus.NOT_FOUND).render("admin/error-page");
  }
};

const logout = (req, res) => {
  try {
    req.session.admin = false;
    return res.redirect("/admin/admin_login");
  } catch (error) {
    console.error("Logout issue", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).render("admin/error-page");
  }
};

module.exports = {
  login,
  loginpost,
  logout,
};