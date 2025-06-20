const otpGenerator = () => {
  const randomNumber = Math.floor(Math.random() * (999999 - 100000) + 100000);
  return randomNumber;
};

module.exports = {
    otpGenerator,
}

