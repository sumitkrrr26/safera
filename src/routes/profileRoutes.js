const express = require('express');
const ProfileController = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { profileUpdateSchema, profileCompleteSchema } = require('../schemas/profileSchema');

const router = express.Router();

// Get profile routes
router.get('/me', authMiddleware, ProfileController.getProfile);
router.get('/:userId', ProfileController.getPublicProfile);

// Update profile
router.put('/me', authMiddleware, validate(profileUpdateSchema), ProfileController.updateProfile);
router.post('/me/complete', authMiddleware, validate(profileCompleteSchema), ProfileController.completeProfile);

// Photo routes
router.post('/photos/upload', authMiddleware, ProfileController.uploadPhoto);
router.get('/photos', authMiddleware, ProfileController.getPhotos);
router.put('/photos/:photo_id/primary', authMiddleware, ProfileController.setPrimaryPhoto);
router.post('/photos/reorder', authMiddleware, ProfileController.reorderPhotos);
router.delete('/photos/:photo_id', authMiddleware, ProfileController.deletePhoto);

module.exports = router;
