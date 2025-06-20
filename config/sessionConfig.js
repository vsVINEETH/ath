const oneday = 1000 * 60 * 60 * 24;
const sessionConfig = {
  secret: process.env.SECRET,
  resave: false,
  cookie: { maxAge: oneday },
  saveUninitialized: true,
}

module.exports = sessionConfig
