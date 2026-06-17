const pool = require('../config/database');

class SwipeModel {
  static async swipe(swiperId, swipedOnId, swipeType) {
    // Prevent self-swipes
    if (swiperId === swipedOnId) {
      throw new Error('Cannot swipe on yourself');
    }

    const query = `
      INSERT INTO swipes (swiper_id, swiped_on_id, swipe_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (swiper_id, swiped_on_id) DO UPDATE
      SET swipe_type = $3, swiped_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(query, [swiperId, swipedOnId, swipeType]);
    const swipe = result.rows[0];

    // Check for mutual like (match)
    if (swipeType === 'like') {
      await this.checkForMatch(swiperId, swipedOnId);
    }

    return swipe;
  }

  static async checkForMatch(userId1, userId2) {
    const query = `
      SELECT * FROM swipes
      WHERE (swiper_id = $1 AND swiped_on_id = $2 AND swipe_type = 'like')
      AND (SELECT COUNT(*) FROM swipes
           WHERE swiper_id = $2 AND swiped_on_id = $1 AND swipe_type = 'like') > 0;
    `;

    const result = await pool.query(query, [userId1, userId2]);

    if (result.rows.length > 0) {
      // Create match
      await this.createMatch(userId1, userId2);
    }
  }

  static async createMatch(userId1, userId2) {
    // Ensure consistent ordering (lower ID first)
    const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const query = `
      INSERT INTO matches (user1_id, user2_id, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (user1_id, user2_id) DO UPDATE
      SET is_active = true
      RETURNING *;
    `;

    const result = await pool.query(query, [user1, user2]);
    return result.rows[0];
  }

  static async getSwipesToday(userId) {
    const query = `
      SELECT COUNT(*) as swipe_count
      FROM swipes
      WHERE swiper_id = $1
      AND DATE(swiped_at) = CURRENT_DATE;
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].swipe_count);
  }

  static async getSwipeHistory(userId, limit = 100, offset = 0) {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.is_verified
      FROM swipes s
      JOIN users u ON s.swiped_on_id = u.id
      WHERE s.swiper_id = $1
      ORDER BY s.swiped_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getAlreadySwiped(userId) {
    const query = `
      SELECT swiped_on_id FROM swipes WHERE swiper_id = $1;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map((r) => r.swiped_on_id);
  }
}

module.exports = SwipeModel;
