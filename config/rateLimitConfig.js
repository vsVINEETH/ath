
const rateLimitConfig = {
  max: 1000,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this IP, please try again later.'
}

module.exports = rateLimitConfig;