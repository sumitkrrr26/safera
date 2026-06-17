const VenueModel = require('../models/venueModel');
const pool = require('../config/database');

class VenueController {
  static async applyVenue(req, res) {
    try {
      const applicantUserId = req.user.userId;
      const venueData = req.validatedData;

      const venue = await VenueModel.apply(applicantUserId, venueData);

      return res.status(201).json({
        message: 'Venue application submitted successfully. Awaiting admin approval.',
        venue,
      });
    } catch (error) {
      console.error('Apply venue error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getApprovedVenues(req, res) {
    try {
      const { city, price_tier, cuisine_type, limit = 20, offset = 0 } = req.query;

      const filters = {
        city,
        price_tier,
        cuisine_type,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };

      const venues = await VenueModel.getApprovedVenues(filters);

      return res.status(200).json({
        count: venues.length,
        venues,
      });
    } catch (error) {
      console.error('Get venues error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getVenueById(req, res) {
    try {
      const { venue_id } = req.params;

      const venue = await VenueModel.getVenueById(venue_id);
      if (!venue) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      return res.status(200).json({ venue });
    } catch (error) {
      console.error('Get venue error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNearbyVenues(req, res) {
    try {
      const { latitude, longitude, radius_km = 5, limit = 20 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'latitude and longitude are required',
        });
      }

      const venues = await VenueModel.getNearbyVenues(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius_km),
        parseInt(limit)
      );

      return res.status(200).json({
        count: venues.length,
        venues,
      });
    } catch (error) {
      console.error('Get nearby venues error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async searchVenues(req, res) {
    try {
      const { search, city, limit = 20, offset = 0 } = req.query;

      if (!search || !city) {
        return res.status(400).json({
          error: 'search and city parameters are required',
        });
      }

      const venues = await VenueModel.searchVenues(
        search,
        city,
        parseInt(limit),
        parseInt(offset)
      );

      return res.status(200).json({
        count: venues.length,
        venues,
      });
    } catch (error) {
      console.error('Search venues error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ADMIN ENDPOINTS

  static async getPendingApplications(req, res) {
    try {
      const applications = await VenueModel.getPendingApplications();

      return res.status(200).json({
        count: applications.length,
        applications,
      });
    } catch (error) {
      console.error('Get pending applications error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async approveVenue(req, res) {
    try {
      const { venue_id } = req.params;
      const adminId = req.user.userId;

      const venue = await VenueModel.approve(venue_id, adminId);

      // Log admin action
      await pool.query(
        `INSERT INTO admin_actions (admin_user_id, action_type, target_venue_id, notes)
         VALUES ($1, 'venue_approved', $2, 'Venue approved')`,
        [adminId, venue_id]
      );

      return res.status(200).json({
        message: 'Venue approved successfully',
        venue,
      });
    } catch (error) {
      console.error('Approve venue error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async rejectVenue(req, res) {
    try {
      const { venue_id } = req.params;
      const { rejection_reason } = req.body;
      const adminId = req.user.userId;

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const venue = await VenueModel.reject(venue_id, adminId, rejection_reason);

      // Log admin action
      await pool.query(
        `INSERT INTO admin_actions (admin_user_id, action_type, target_venue_id, notes)
         VALUES ($1, 'venue_rejected', $2, $3)`,
        [adminId, venue_id, rejection_reason]
      );

      return res.status(200).json({
        message: 'Venue rejected successfully',
      });
    } catch (error) {
      console.error('Reject venue error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = VenueController;
