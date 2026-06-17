const pool = require('../config/database');

class MatchModel {
  static async getMatches(userId) {
    const query = `
      SELECT
        m.id,
        m.matched_at,
        CASE
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END as matched_user_id,
        u.first_name,
        u.last_name,
        u.is_verified,
        u.trust_score,
        p.bio,
        ph.photo_url,
        (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND is_read = false AND sender_id != $1) as unread_count
      FROM matches m
      JOIN users u ON (
        CASE
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END = u.id
      )
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN photos ph ON u.id = ph.user_id AND ph.is_primary = true
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
      AND m.is_active = true
      ORDER BY m.matched_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getMatch(matchId, userId) {
    const query = `
      SELECT
        m.*,
        CASE
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END as other_user_id
      FROM matches m
      WHERE m.id = $2
      AND (m.user1_id = $1 OR m.user2_id = $1);
    `;

    const result = await pool.query(query, [userId, matchId]);
    return result.rows[0];
  }

  static async unmatch(matchId, userId) {
    const query = `
      UPDATE matches
      SET is_active = false, unmatched_by = $1, unmatched_at = NOW()
      WHERE id = $2
      AND (user1_id = $1 OR user2_id = $1)
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, matchId]);
    return result.rows[0];
  }

  static async checkMatch(user1Id, user2Id) {
    const [smaller, larger] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    const query = `
      SELECT * FROM matches
      WHERE user1_id = $1 AND user2_id = $2 AND is_active = true;
    `;

    const result = await pool.query(query, [smaller, larger]);
    return result.rows[0];
  }
}

module.exports = MatchModel;
