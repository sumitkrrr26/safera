const pool = require('../config/database');

class PhotoModel {
  static async upload(userId, photoUrl, publicId, displayOrder = 0, isPrimary = false) {
    const query = `
      INSERT INTO photos (user_id, photo_url, cloudinary_public_id, display_order, is_primary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      userId,
      photoUrl,
      publicId,
      displayOrder,
      isPrimary,
    ]);

    return result.rows[0];
  }

  static async getByUserId(userId) {
    const query = `
      SELECT * FROM photos
      WHERE user_id = $1
      ORDER BY display_order ASC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async setPrimary(photoId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove primary from other photos
      await client.query(
        'UPDATE photos SET is_primary = false WHERE user_id = $1',
        [userId]
      );

      // Set this as primary
      const result = await client.query(
        'UPDATE photos SET is_primary = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [photoId, userId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async reorder(userId, photoIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < photoIds.length; i++) {
        await client.query(
          'UPDATE photos SET display_order = $1 WHERE id = $2 AND user_id = $3',
          [i, photoIds[i], userId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(photoId, userId) {
    const query = `
      DELETE FROM photos
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [photoId, userId]);
    return result.rows[0];
  }

  static async deleteAllByUser(userId) {
    const query = 'DELETE FROM photos WHERE user_id = $1;';
    await pool.query(query, [userId]);
  }
}

module.exports = PhotoModel;
