const passport = require("passport");

const loginAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const loginAuthRedirect = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    } // Redirect to login if authentication fails
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.session.user = user.email;
      return res.redirect("/home"); // Redirect to profile page if authentication is successful
    });
  })(req, res, next);
};

module.exports = {
  loginAuth,
  loginAuthRedirect
}