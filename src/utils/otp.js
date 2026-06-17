const crypto = require('crypto');

const generateOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

const generateOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const verifyOTP = (storedOTP, providedOTP, expiryTime) => {
  if (new Date() > expiryTime) {
    return { valid: false, message: 'OTP expired' };
  }

  if (storedOTP !== providedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true, message: 'OTP verified' };
};

module.exports = { generateOTP, generateOTPExpiry, verifyOTP };
