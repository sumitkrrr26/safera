const KYCModel = require('../models/kycModel');
const UserModel = require('../models/userModel');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

class KYCController {
  static async submitKYC(req, res) {
    try {
      const userId = req.user.userId;
      const kycData = req.validatedData;

      // Check for existing approved KYC
      const existingKYC = await KYCModel.findByUserId(userId);
      if (existingKYC && existingKYC.status === 'approved') {
        return res.status(400).json({ error: 'KYC already approved. Cannot resubmit.' });
      }

      // Upload ID document to Cloudinary
      let idDocumentUrl = null;
      if (req.files && req.files.id_document) {
        const idResult = await cloudinary.uploader.upload(
          req.files.id_document.tempFilePath,
          {
            folder: `safera/kyc/${userId}/documents`,
            resource_type: 'auto',
          }
        );
        idDocumentUrl = idResult.secure_url;
        fs.unlinkSync(req.files.id_document.tempFilePath);
      }

      // Upload selfie to Cloudinary
      let selfieUrl = null;
      if (req.files && req.files.selfie) {
        const selfieResult = await cloudinary.uploader.upload(
          req.files.selfie.tempFilePath,
          {
            folder: `safera/kyc/${userId}/selfies`,
            resource_type: 'auto',
          }
        );
        selfieUrl = selfieResult.secure_url;
        fs.unlinkSync(req.files.selfie.tempFilePath);
      }

      if (!idDocumentUrl || !selfieUrl) {
        return res.status(400).json({ error: 'Both ID document and selfie are required' });
      }

      // Submit KYC
      const kycSubmission = await KYCModel.submit(userId, kycData, idDocumentUrl, selfieUrl);

      return res.status(201).json({
        message: 'KYC submitted successfully. Awaiting admin review.',
        kyc: {
          id: kycSubmission.id,
          status: kycSubmission.status,
          submission_date: kycSubmission.submission_date,
        },
      });
    } catch (error) {
      console.error('Submit KYC error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getKYCStatus(req, res) {
    try {
      const userId = req.user.userId;

      const kyc = await KYCModel.findByUserId(userId);
      if (!kyc) {
        return res.status(404).json({ error: 'No KYC submission found' });
      }

      return res.status(200).json({
        kyc: {
          id: kyc.id,
          status: kyc.status,
          submission_date: kyc.submission_date,
          reviewed_at: kyc.reviewed_at,
          rejection_reason: kyc.rejection_reason,
        },
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ADMIN ENDPOINTS

  static async getPendingKYC(req, res) {
    try {
      const submissions = await KYCModel.getPendingSubmissions();

      return res.status(200).json({
        count: submissions.length,
        submissions,
      });
    } catch (error) {
      console.error('Get pending KYC error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async approveKYC(req, res) {
    try {
      const { kyc_id } = req.params;
      const adminId = req.user.userId;

      const result = await KYCModel.approve(kyc_id, adminId);

      // Log admin action
      const pool = require('../config/database');
      await pool.query(
        `INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, notes)
         VALUES ($1, 'kyc_approved', $2, 'KYC submission approved')`,
        [adminId, result.userId]
      );

      return res.status(200).json({
        message: 'KYC approved successfully',
        result,
      });
    } catch (error) {
      console.error('Approve KYC error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async rejectKYC(req, res) {
    try {
      const { kyc_id } = req.params;
      const { rejection_reason } = req.body;
      const adminId = req.user.userId;

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const result = await KYCModel.reject(kyc_id, adminId, rejection_reason);

      // Log admin action
      const pool = require('../config/database');
      await pool.query(
        `INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, notes)
         VALUES ($1, 'kyc_rejected', $2, $3)`,
        [adminId, result.user_id, rejection_reason]
      );

      return res.status(200).json({
        message: 'KYC rejected successfully',
        result,
      });
    } catch (error) {
      console.error('Reject KYC error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = KYCController;
