const pool = require('../config/database');

class ProfileModel {
  static async getOrCreate(userId) {
    const query = `
      SELECT * FROM profiles WHERE user_id = $1;
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // Create default profile
      await pool.query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [userId]
      );
      return this.getOrCreate(userId);
    }

    return result.rows[0];
  }

  static async update(userId, profileData) {
    const { bio, occupation, interests, looking_for } = profileData;

    const query = `
      UPDATE profiles
      SET
        bio = COALESCE($1, bio),
        occupation = COALESCE($2, occupation),
        interests = COALESCE($3, interests),
        looking_for = COALESCE($4, looking_for),
        updated_at = NOW()
      WHERE user_id = $5
      RETURNING *;
    `;

    const result = await pool.query(query, [
      bio,
      occupation,
      interests || [],
      looking_for,
      userId,
    ]);

    return result.rows[0];
  }

  static async markComplete(userId) {
    const query = `
      UPDATE profiles
      SET profile_complete = true, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async updateLastActive(userId) {
    await pool.query(
      'UPDATE profiles SET last_active = NOW() WHERE user_id = $1',
      [userId]
    );
  }

  static async getProfileWithPhotos(userId) {
    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.age,
        u.gender,
        u.city,
        u.is_verified,
        u.trust_score,
        p.bio,
        p.occupation,
        p.interests,
        p.looking_for,
        COALESCE(COUNT(db.id), 0) as date_count,
        json_agg(
          json_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'is_primary', ph.is_primary,
            'display_order', ph.display_order
          )
          ORDER BY ph.display_order
        ) FILTER (WHERE ph.id IS NOT NULL) as photos
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN photos ph ON u.id = ph.user_id
      LEFT JOIN date_bookings db ON (u.id = db.user1_id OR u.id = db.user2_id) AND db.status = 'completed'
      WHERE u.id = $1 AND u.account_status = 'active'
      GROUP BY u.id, p.id;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = ProfileModel;
