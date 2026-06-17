const pool = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHash');

class UserModel {
  static async create(userData) {
    const {
      phone_number,
      email,
      password,
      first_name,
      last_name,
      gender,
      date_of_birth,
      city,
    } = userData;

    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO users (
        phone_number, email, password_hash, first_name, last_name,
        gender, date_of_birth, city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, phone_number, email, first_name, last_name, created_at;
    `;

    try {
      const result = await pool.query(query, [
        phone_number,
        email,
        hashedPassword,
        first_name,
        last_name,
        gender,
        date_of_birth,
        city,
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email or phone number already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND account_status = \'active\';';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findByPhoneNumber(phone_number) {
    const query = 'SELECT * FROM users WHERE phone_number = $1 AND account_status = \'active\';';
    const result = await pool.query(query, [phone_number]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, phone_number, first_name, last_name, gender, city, kyc_status, trust_score, is_verified, created_at FROM users WHERE id = $1 AND account_status = \'active\';';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const isValid = await comparePassword(password, user.password_hash);
    return isValid ? user : null;
  }

  static async updateKYCStatus(userId, status, reviewedBy = null, rejectionReason = null) {
    const query = `
      UPDATE users
      SET kyc_status = $1, is_verified = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, kyc_status, is_verified;
    `;

    const result = await pool.query(query, [
      status,
      status === 'approved' ? true : false,
      userId,
    ]);
    return result.rows[0];
  }

  static async updateTrustScore(userId, scoreChange, reason, relatedEntityType = null, relatedEntityId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current score
      const currentScoreResult = await client.query(
        'SELECT trust_score FROM users WHERE id = $1',
        [userId]
      );
      const previousScore = currentScoreResult.rows[0].trust_score;
      const newScore = Math.max(0, Math.min(100, previousScore + scoreChange));

      // Update user trust score
      await client.query(
        'UPDATE users SET trust_score = $1, updated_at = NOW() WHERE id = $2',
        [newScore, userId]
      );

      // Log the change
      await client.query(
        `INSERT INTO trust_score_log (user_id, previous_score, new_score, score_change, reason, related_entity_type, related_entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, previousScore, newScore, scoreChange, reason, relatedEntityType, relatedEntityId]
      );

      await client.query('COMMIT');
      return { previousScore, newScore };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = UserModel;
