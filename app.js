const express = require("express");
const session = require("express-session");
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const nocache = require("nocache");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();
const passport = require("passport");
const passportSetup = require("./controller/auth");
const passportSetup2 = require("./controller/face-book-auth");
const { ignoreFavicon } = require("./middle-ware/middle-wares");

const userRouter = require("./routes/user-routes");
const adminRouter = require("./routes/admin-routes");

const app = express();
const port = process.env.PORT || 3000;

// Middleware

// Logging middleware
app.use(morgan("dev"));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files middleware
app.use(express.static("public"));

// Ignore Favicon middleware
app.use(ignoreFavicon);

// Session middleware
const oneday = 1000 * 60 * 60 * 24;
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  cookie: { maxAge: oneday },
  saveUninitialized: true,
}));

// Request rate limit middleware
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// XSS and MongoDB sanitization middleware
app.use(xss());
app.use(mongoSanitize());

// CORS middleware
app.use(cors());

// No cache middleware
app.use(nocache());

// Passport initialization middleware
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Routes
app.use("/", userRouter);
app.use("/admin", adminRouter);



// Start server
app.listen(port, (err) => {
  if (!err) {
    console.log(`Server running on http://localhost:${port}`);
  } else {
    console.log("Something went wrong");
  }
});
