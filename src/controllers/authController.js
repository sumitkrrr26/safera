const UserModel = require('../models/userModel');
const { generateTokens } = require('../utils/jwt');
const { generateOTP, generateOTPExpiry, verifyOTP } = require('../utils/otp');
const pool = require('../config/database');

class AuthController {
  static async register(req, res) {
    try {
      const userData = req.validatedData;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Create user
      const user = await UserModel.create(userData);

      // Create profile
      await pool.query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [user.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, 'user');

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.validatedData;

      // Verify credentials
      const user = await UserModel.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is banned
      if (user.account_status === 'banned') {
        return res.status(403).json({ error: 'Your account has been banned' });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, 'user');

      // Store refresh token in DB
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
        [user.id, refreshToken]
      );

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          kyc_status: user.kyc_status,
          is_verified: user.is_verified,
          trust_score: user.trust_score,
        },
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async sendOTP(req, res) {
    try {
      const { phone_number } = req.validatedData;

      // Generate OTP
      const otp = generateOTP(6);
      const otpExpiry = generateOTPExpiry(10);

      // Store OTP in cache/DB (temporary table)
      await pool.query(
        'INSERT INTO otp_store (phone_number, otp, expiry) VALUES ($1, $2, $3) ON CONFLICT (phone_number) DO UPDATE SET otp = $2, expiry = $3',
        [phone_number, otp, otpExpiry]
      );

      // In production, send via Twilio
      // await sendSMS(phone_number, `Your Safera OTP is: ${otp}`);

      console.log(`[DEV] OTP for ${phone_number}: ${otp}`);

      return res.status(200).json({
        message: 'OTP sent successfully',
        // Remove in production:
        otp,
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async verifyOTPAndRegister(req, res) {
    try {
      const { phone_number, otp, ...userData } = req.body;

      // Verify OTP
      const otpRecord = await pool.query(
        'SELECT otp, expiry FROM otp_store WHERE phone_number = $1',
        [phone_number]
      );

      if (otpRecord.rows.length === 0) {
        return res.status(400).json({ error: 'OTP not found. Request a new one.' });
      }

      const { valid, message } = verifyOTP(
        otpRecord.rows[0].otp,
        otp,
        otpRecord.rows[0].expiry
      );

      if (!valid) {
        return res.status(400).json({ error: message });
      }

      // Create user with phone number
      const newUserData = { ...userData, phone_number };
      const user = await UserModel.create(newUserData);

      // Create profile
      await pool.query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [user.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, 'user');

      // Clean up OTP
      await pool.query('DELETE FROM otp_store WHERE phone_number = $1', [phone_number]);

      return res.status(201).json({
        message: 'User registered successfully',
        user,
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Verify refresh token exists in DB
      const tokenRecord = await pool.query(
        'SELECT user_id FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      if (tokenRecord.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const userId = tokenRecord.rows[0].user_id;

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);

      // Update refresh token
      await pool.query(
        'UPDATE refresh_tokens SET token = $1 WHERE user_id = $2',
        [newRefreshToken, userId]
      );

      return res.status(200).json({
        tokens: { accessToken, refreshToken: newRefreshToken },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
