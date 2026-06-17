const jwt = require('jsonwebtoken');

const generateTokens = (userId, userRole = 'user') => {
  const accessToken = jwt.sign(
    { userId, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
  );

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyToken };
