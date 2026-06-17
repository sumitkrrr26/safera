const express = require('express');
const SwipeController = require('../controllers/swipeController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { swipeSchema } = require('../schemas/swipeSchema');

const router = express.Router();

// Swipe routes
router.get('/feed', authMiddleware, SwipeController.getSwipeFeed);
router.post('/swipe', authMiddleware, validate(swipeSchema), SwipeController.swipe);
router.get('/history', authMiddleware, SwipeController.getSwipeHistory);

// Match routes
router.get('/matches', authMiddleware, SwipeController.getMatches);
router.get('/matches/:match_id', authMiddleware, SwipeController.getMatch);
router.delete('/matches/:match_id', authMiddleware, SwipeController.unmatch);

module.exports = router;
