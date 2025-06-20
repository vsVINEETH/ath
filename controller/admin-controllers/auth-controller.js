require("dotenv").config();

const login = (req, res) => {
  try {
    if (req.session.admin) {
      return res.status(200).redirect("/admin/admin_dashboard");
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
};