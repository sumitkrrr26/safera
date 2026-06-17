const express = require('express');
const VenueController = require('../controllers/venueController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { venueApplicationSchema, venueSearchSchema } = require('../schemas/venueSchema');

const router = express.Router();

// Public routes - Get approved venues
router.get('/approved', VenueController.getApprovedVenues);
router.get('/nearby', VenueController.getNearbyVenues);
router.get('/search', VenueController.searchVenues);
router.get('/:venue_id', VenueController.getVenueById);

// User routes - Apply for venue listing
router.post('/apply', authMiddleware, validate(venueApplicationSchema), VenueController.applyVenue);

// Admin routes
router.get('/admin/pending', authMiddleware, adminMiddleware, VenueController.getPendingApplications);
router.post('/admin/approve/:venue_id', authMiddleware, adminMiddleware, VenueController.approveVenue);
router.post('/admin/reject/:venue_id', authMiddleware, adminMiddleware, VenueController.rejectVenue);

module.exports = router;
