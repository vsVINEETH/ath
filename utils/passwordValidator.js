const  validatePassword = (password) => {
      if (password.length < 5 || password.length > 20) {
        return false;
      }

      let hasDigit = false;
      let hasLowercase = false;
      let hasUppercase = false;
      let hasSpecialChar = false;
      const specialChars = "!@#$%^&*()-+.";

      for (let i = 0; i < password.length; i++) {
        const char = password[i];

        if (/[0-9]/.test(char)) {
          hasDigit = true;
        } else if (/[a-z]/.test(char)) {
          hasLowercase = true;
        } else if (/[A-Z]/.test(char)) {
          hasUppercase = true;
        } else if (specialChars.includes(char)) {
          hasSpecialChar = true;
        }

        if (hasDigit && hasLowercase && hasUppercase && hasSpecialChar) {
          return true;
        }
      }
      return false;
};

module.exports = {
    validatePassword
}