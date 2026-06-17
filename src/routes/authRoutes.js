const express = require('express');
const AuthController = require('../controllers/authController');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { registerSchema, loginSchema, phoneVerificationSchema, otpVerificationSchema } = require('../schemas/authSchema');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/send-otp', validate(phoneVerificationSchema), AuthController.sendOTP);
router.post('/verify-otp', AuthController.verifyOTPAndRegister);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, AuthController.getCurrentUser);

module.exports = router;
