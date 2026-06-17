const pool = require('../config/database');

class VenueModel {
  static async apply(applicantUserId, venueData) {
    const {
      name,
      address,
      city,
      latitude,
      longitude,
      price_tier,
      cuisine_type,
      google_maps_url,
      phone_number,
      website_url,
    } = venueData;

    const query = `
      INSERT INTO venues (
        name, address, city, latitude, longitude, price_tier,
        cuisine_type, google_maps_url, phone_number, website_url,
        applicant_user_id, submitted_at, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), false)
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [
        name,
        address,
        city,
        latitude,
        longitude,
        price_tier,
        cuisine_type,
        google_maps_url,
        phone_number,
        website_url,
        applicantUserId,
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getApprovedVenues(filters = {}) {
    let query = `
      SELECT * FROM venues
      WHERE is_approved = true
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.city) {
      query += ` AND LOWER(city) = LOWER($${paramIndex})`;
      params.push(filters.city);
      paramIndex++;
    }

    if (filters.price_tier) {
      query += ` AND price_tier = $${paramIndex}`;
      params.push(filters.price_tier);
      paramIndex++;
    }

    if (filters.cuisine_type) {
      query += ` AND LOWER(cuisine_type) ILIKE LOWER($${paramIndex})`;
      params.push(`%${filters.cuisine_type}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getVenueById(venueId) {
    const query = `
      SELECT * FROM venues WHERE id = $1;
    `;

    const result = await pool.query(query, [venueId]);
    return result.rows[0];
  }

  static async getPendingApplications() {
    const query = `
      SELECT
        v.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number as applicant_phone
      FROM venues v
      LEFT JOIN users u ON v.applicant_user_id = u.id
      WHERE v.is_approved = false
      AND v.submitted_at IS NOT NULL
      ORDER BY v.submitted_at ASC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async approve(venueId, approvedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE venues
         SET is_approved = true, approved_at = NOW(), approved_by = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [approvedBy, venueId]
      );

      if (result.rows.length === 0) {
        throw new Error('Venue not found');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async reject(venueId, approvedBy, rejectionReason) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete rejected venue
      const result = await client.query(
        `DELETE FROM venues
         WHERE id = $1 AND is_approved = false
         RETURNING *`,
        [venueId]
      );

      if (result.rows.length === 0) {
        throw new Error('Venue not found or already approved');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getNearbyVenues(latitude, longitude, radiusKm = 5, limit = 20) {
    const query = `
      SELECT
        *,
        (
          6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) AS distance_km
      FROM venues
      WHERE is_approved = true
      HAVING (
        6371 * acos(
          cos(radians($1)) *
          cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) *
          sin(radians(latitude))
        )
      ) <= $3
      ORDER BY distance_km ASC
      LIMIT $4;
    `;

    const result = await pool.query(query, [latitude, longitude, radiusKm, limit]);
    return result.rows;
  }

  static async searchVenues(searchTerm, city, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM venues
      WHERE is_approved = true
      AND (
        LOWER(name) ILIKE LOWER($1)
        OR LOWER(cuisine_type) ILIKE LOWER($1)
      )
      AND LOWER(city) ILIKE LOWER($2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await pool.query(query, [
      `%${searchTerm}%`,
      `%${city}%`,
      limit,
      offset,
    ]);
    return result.rows;
  }
}

module.exports = VenueModel;
