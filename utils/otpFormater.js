
const otpFormatter = (otp) => {
    const otpNumbers = {
        otp1: otp.otp1,
        otp2: otp.otp2,
        otp3: otp.otp3,
        otp4: otp.otp4,
        otp5: otp.otp5,
        otp6: otp.otp6,
      };
      const otpCode =
        `${otpNumbers.otp1}` +
        `${otpNumbers.otp2}` +
        `${otpNumbers.otp3}` +
        `${otpNumbers.otp4}` +
        `${otpNumbers.otp5}` +
        `${otpNumbers.otp6}`;
    
    return otpCode;
};

module.exports = {
    otpFormatter
}