const pool = require('../config/database');

class KYCModel {
  static async submit(userId, kycData, idDocumentUrl, selfieUrl) {
    const {
      id_document_type,
      id_number,
      full_name_on_id,
      date_of_birth_on_id,
    } = kycData;

    const query = `
      INSERT INTO kyc_submissions (
        user_id, id_document_type, id_number, full_name_on_id,
        date_of_birth_on_id, id_document_url, selfie_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET
        id_document_type = $2,
        id_number = $3,
        full_name_on_id = $4,
        date_of_birth_on_id = $5,
        id_document_url = $6,
        selfie_url = $7,
        status = 'pending',
        submission_date = NOW()
      RETURNING *;
    `;

    const result = await pool.query(query, [
      userId,
      id_document_type,
      id_number,
      full_name_on_id,
      date_of_birth_on_id,
      idDocumentUrl,
      selfieUrl,
    ]);

    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM kyc_submissions WHERE user_id = $1;';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async getPendingSubmissions() {
    const query = `
      SELECT k.*, u.first_name, u.last_name, u.email, u.phone_number
      FROM kyc_submissions k
      JOIN users u ON k.user_id = u.id
      WHERE k.status = 'pending'
      ORDER BY k.submission_date ASC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async approve(submissionId, reviewedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the KYC submission
      const kycResult = await client.query(
        'SELECT user_id FROM kyc_submissions WHERE id = $1',
        [submissionId]
      );
      const userId = kycResult.rows[0].user_id;

      // Update KYC submission
      await client.query(
        `UPDATE kyc_submissions
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
         WHERE id = $2`,
        [reviewedBy, submissionId]
      );

      // Update user verification status
      await client.query(
        `UPDATE users
         SET kyc_status = 'approved', is_verified = true, updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      // Add trust score for KYC approval
      await client.query(
        `INSERT INTO trust_score_log (user_id, previous_score, new_score, score_change, reason)
         SELECT $1, trust_score, LEAST(100, trust_score + 30), 30, 'kyc_verified'
         FROM users WHERE id = $1`,
        [userId]
      );

      await client.query('UPDATE users SET trust_score = LEAST(100, trust_score + 30) WHERE id = $1', [userId]);
      await client.query('COMMIT');

      return { success: true, userId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async reject(submissionId, reviewedBy, rejectionReason) {
    const query = `
      UPDATE kyc_submissions
      SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, rejection_reason = $2
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [reviewedBy, rejectionReason, submissionId]);
    return result.rows[0];
  }
}

module.exports = KYCModel;
