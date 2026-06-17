const express = require('express');
const KYCController = require('../controllers/kycController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { kycSubmissionSchema, kycApprovalSchema } = require('../schemas/kycSchema');

const router = express.Router();

// User routes
router.post('/submit', authMiddleware, validate(kycSubmissionSchema), KYCController.submitKYC);
router.get('/status', authMiddleware, KYCController.getKYCStatus);

// Admin routes
router.get('/admin/pending', authMiddleware, adminMiddleware, KYCController.getPendingKYC);
router.post('/admin/approve/:kyc_id', authMiddleware, adminMiddleware, KYCController.approveKYC);
router.post('/admin/reject/:kyc_id', authMiddleware, adminMiddleware, validate(kycApprovalSchema), KYCController.rejectKYC);

module.exports = router;
