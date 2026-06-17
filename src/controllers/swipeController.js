const SwipeModel = require('../models/swipeModel');
const MatchModel = require('../models/matchModel');
const pool = require('../config/database');

const DAILY_SWIPE_LIMIT = 20;

class SwipeController {
  static async getSwipeFeed(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 10, offset = 0 } = req.query;

      // Check if user is verified
      const userResult = await pool.query(
        'SELECT is_verified, kyc_status FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];
      if (!user.is_verified || user.kyc_status !== 'approved') {
        return res.status(403).json({
          error: 'KYC verification required to access swipe feed',
        });
      }

      // Get already swiped profiles
      const swipedIds = await SwipeModel.getAlreadySwiped(userId);

      // Get user info for filtering
      const userInfoResult = await pool.query(
        'SELECT gender FROM users WHERE id = $1',
        [userId]
      );
      const userGender = userInfoResult.rows[0].gender;

      // Determine what gender to show based on user preferences
      const profileQuery = `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.gender,
          u.age,
          u.city,
          u.is_verified,
          u.trust_score,
          p.bio,
          p.occupation,
          p.interests,
          ph.photo_url,
          (SELECT COUNT(*) FROM date_bookings WHERE (user1_id = u.id OR user2_id = u.id) AND status = 'completed') as date_count
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN photos ph ON u.id = ph.user_id AND ph.is_primary = true
        WHERE u.id != $1
        AND u.account_status = 'active'
        AND u.is_verified = true
        AND u.id NOT IN (${swipedIds.length > 0 ? swipedIds.join(',') : 'NULL'})
        AND u.city = (SELECT city FROM users WHERE id = $1)
        ORDER BY u.trust_score DESC, u.created_at DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await pool.query(profileQuery, [userId, limit, offset]);

      return res.status(200).json({
        profiles: result.rows,
      });
    } catch (error) {
      console.error('Get swipe feed error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async swipe(req, res) {
    try {
      const userId = req.user.userId;
      const { swiped_on_id, swipe_type } = req.validatedData;

      // Check daily swipe limit (free tier: 20 swipes/day)
      const swipesToday = await SwipeModel.getSwipesToday(userId);
      if (swipesToday >= DAILY_SWIPE_LIMIT) {
        return res.status(429).json({
          error: `Daily swipe limit (${DAILY_SWIPE_LIMIT}) reached. Premium users get unlimited swipes.`,
        });
      }

      // Perform swipe
      const swipe = await SwipeModel.swipe(userId, swiped_on_id, swipe_type);

      let matchData = null;
      if (swipe_type === 'like') {
        // Check if it's a mutual match
        const match = await MatchModel.checkMatch(userId, swiped_on_id);
        if (match) {
          matchData = match;
        }
      }

      return res.status(201).json({
        message: 'Swipe recorded',
        swipe,
        match: matchData,
      });
    } catch (error) {
      console.error('Swipe error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getMatches(req, res) {
    try {
      const userId = req.user.userId;

      const matches = await MatchModel.getMatches(userId);

      return res.status(200).json({
        count: matches.length,
        matches,
      });
    } catch (error) {
      console.error('Get matches error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getMatch(req, res) {
    try {
      const userId = req.user.userId;
      const { match_id } = req.params;

      const match = await MatchModel.getMatch(match_id, userId);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Get matched user profile
      const matchedUserProfile = await pool.query(
        `SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.gender,
          u.age,
          u.city,
          u.is_verified,
          u.trust_score,
          p.bio,
          p.occupation,
          p.interests,
          json_agg(
            json_build_object(
              'id', ph.id,
              'photo_url', ph.photo_url,
              'is_primary', ph.is_primary
            )
            ORDER BY ph.display_order
          ) FILTER (WHERE ph.id IS NOT NULL) as photos
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN photos ph ON u.id = ph.user_id
        WHERE u.id = $1
        GROUP BY u.id, p.id`,
        [match.other_user_id]
      );

      return res.status(200).json({
        match: matchedUserProfile.rows[0],
      });
    } catch (error) {
      console.error('Get match error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async unmatch(req, res) {
    try {
      const userId = req.user.userId;
      const { match_id } = req.params;

      const unmatchedData = await MatchModel.unmatch(match_id, userId);
      if (!unmatchedData) {
        return res.status(404).json({ error: 'Match not found' });
      }

      return res.status(200).json({
        message: 'Unmatched successfully',
      });
    } catch (error) {
      console.error('Unmatch error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getSwipeHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 50, offset = 0 } = req.query;

      const history = await SwipeModel.getSwipeHistory(userId, limit, offset);

      return res.status(200).json({
        history,
      });
    } catch (error) {
      console.error('Get swipe history error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SwipeController;
