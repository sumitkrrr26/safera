const ProfileModel = require('../models/profileModel');
const PhotoModel = require('../models/photoModel');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const pool = require('../config/database');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const profile = await ProfileModel.getProfileWithPhotos(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Update last active
      await ProfileModel.updateLastActive(userId);

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;

      const profile = await ProfileModel.getProfileWithPhotos(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('Get public profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.validatedData;

      const updatedProfile = await ProfileModel.update(userId, profileData);

      return res.status(200).json({
        message: 'Profile updated successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async completeProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.validatedData;

      // Check if user has at least 1 photo
      const photos = await PhotoModel.getByUserId(userId);
      if (photos.length === 0) {
        return res.status(400).json({ error: 'Please upload at least 1 photo before completing profile' });
      }

      // Update profile with all required fields
      const updatedProfile = await ProfileModel.update(userId, profileData);

      // Mark profile as complete
      await ProfileModel.markComplete(userId);

      return res.status(200).json({
        message: 'Profile completed successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async uploadPhoto(req, res) {
    try {
      const userId = req.user.userId;

      if (!req.files || !req.files.photo) {
        return res.status(400).json({ error: 'No photo provided' });
      }

      // Check max 6 photos
      const photos = await PhotoModel.getByUserId(userId);
      if (photos.length >= 6) {
        return res.status(400).json({ error: 'Maximum 6 photos allowed' });
      }

      const result = await cloudinary.uploader.upload(
        req.files.photo.tempFilePath,
        {
          folder: `safera/profiles/${userId}/photos`,
          resource_type: 'auto',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );

      fs.unlinkSync(req.files.photo.tempFilePath);

      const displayOrder = photos.length;
      const photo = await PhotoModel.upload(
        userId,
        result.secure_url,
        result.public_id,
        displayOrder,
        displayOrder === 0 // First photo is primary
      );

      return res.status(201).json({
        message: 'Photo uploaded successfully',
        photo,
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPhotos(req, res) {
    try {
      const userId = req.user.userId;

      const photos = await PhotoModel.getByUserId(userId);

      return res.status(200).json({ photos });
    } catch (error) {
      console.error('Get photos error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async setPrimaryPhoto(req, res) {
    try {
      const userId = req.user.userId;
      const { photo_id } = req.params;

      const photo = await PhotoModel.setPrimary(photo_id, userId);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      return res.status(200).json({
        message: 'Primary photo updated',
        photo,
      });
    } catch (error) {
      console.error('Set primary photo error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async reorderPhotos(req, res) {
    try {
      const userId = req.user.userId;
      const { photo_ids } = req.body;

      if (!Array.isArray(photo_ids)) {
        return res.status(400).json({ error: 'photo_ids must be an array' });
      }

      await PhotoModel.reorder(userId, photo_ids);

      return res.status(200).json({
        message: 'Photos reordered successfully',
      });
    } catch (error) {
      console.error('Reorder photos error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async deletePhoto(req, res) {
    try {
      const userId = req.user.userId;
      const { photo_id } = req.params;

      const photo = await PhotoModel.delete(photo_id, userId);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(photo.cloudinary_public_id);

      return res.status(200).json({
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProfileController;
