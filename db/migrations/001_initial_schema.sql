-- ============================================
-- SAFERA: Safety-First Dating Platform
-- Initial Database Schema
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  city VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  trust_score INT DEFAULT 0,
  account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, banned, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_account_status ON users(account_status);

-- ============================================
-- KYC SUBMISSIONS TABLE
-- ============================================
CREATE TABLE kyc_submissions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  id_document_url VARCHAR(500),
  id_document_type VARCHAR(50), -- aadhaar, pan, passport
  selfie_url VARCHAR(500),
  id_number VARCHAR(100),
  full_name_on_id VARCHAR(200),
  date_of_birth_on_id DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_kyc_user ON kyc_submissions(user_id);
CREATE INDEX idx_kyc_status ON kyc_submissions(status);

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  bio TEXT,
  occupation VARCHAR(100),
  interests TEXT[], -- array of interests as strings
  looking_for VARCHAR(50), -- male, female, other
  profile_complete BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_user ON profiles(user_id);

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_user ON photos(user_id);
CREATE INDEX idx_photos_primary ON photos(user_id, is_primary);

-- ============================================
-- SWIPES TABLE
-- ============================================
CREATE TABLE swipes (
  id SERIAL PRIMARY KEY,
  swiper_id INT NOT NULL,
  swiped_on_id INT NOT NULL,
  swipe_type VARCHAR(20), -- like, pass
  swiped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (swiper_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (swiped_on_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(swiper_id, swiped_on_id)
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped_on ON swipes(swiped_on_id);
CREATE INDEX idx_swipes_type ON swipes(swipe_type);

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  unmatched_by INT,
  unmatched_at TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_active ON matches(is_active);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted_by_user BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(is_read);

-- ============================================
-- EMERGENCY CONTACTS TABLE
-- ============================================
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price_tier VARCHAR(50), -- tier1: ₹100–500, tier2: ₹500–1500, tier3: ₹1500+
  cuisine_type VARCHAR(100),
  google_maps_url VARCHAR(500),
  phone_number VARCHAR(20),
  website_url VARCHAR(500),
  is_approved BOOLEAN DEFAULT FALSE,
  applicant_user_id INT,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_approved ON venues(is_approved);
CREATE INDEX idx_venues_tier ON venues(price_tier);

-- ============================================
-- DATE BOOKINGS TABLE
-- ============================================
CREATE TABLE date_bookings (
  id SERIAL PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  venue_id INT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  estimated_duration_minutes INT DEFAULT 120,
  bill_split_type VARCHAR(50), -- split_equal, user1_pays, user2_pays, custom
  bill_split_percentage_user1 INT,
  status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, contract_pending, contract_signed, completed, cancelled
  proposed_by INT NOT NULL,
  proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  accepted_by INT,
  contract_signed_at_user1 TIMESTAMP,
  contract_signed_at_user2 TIMESTAMP,
  contract_pdf_url VARCHAR(500),
  contract_locked_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_by INT,
  cancellation_reason TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT,
  FOREIGN KEY (proposed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_date_bookings_user1 ON date_bookings(user1_id);
CREATE INDEX idx_date_bookings_user2 ON date_bookings(user2_id);
CREATE INDEX idx_date_bookings_status ON date_bookings(status);
CREATE INDEX idx_date_bookings_date ON date_bookings(booking_date);

-- ============================================
-- DATE CHECK-INS TABLE
-- ============================================
CREATE TABLE date_checkins (
  id SERIAL PRIMARY KEY,
  date_booking_id INT NOT NULL,
  user_id INT NOT NULL,
  qr_code VARCHAR(255),
  checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy_meters INT,
  FOREIGN KEY (date_booking_id) REFERENCES date_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_checkins_date_booking ON date_checkins(date_booking_id);
CREATE INDEX idx_checkins_user ON date_checkins(user_id);

-- ============================================
-- SAFETY EVENTS TABLE
-- ============================================
CREATE TABLE safety_events (
  id SERIAL PRIMARY KEY,
  date_booking_id INT NOT NULL,
  user_id INT NOT NULL,
  event_type VARCHAR(50), -- timer_alert, safety_check_response, sos_activated, sos_resolved
  event_details JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date_booking_id) REFERENCES date_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_safety_events_date_booking ON safety_events(date_booking_id);
CREATE INDEX idx_safety_events_user ON safety_events(user_id);
CREATE INDEX idx_safety_events_type ON safety_events(event_type);

-- ============================================
-- DATE RECEIPTS TABLE
-- ============================================
CREATE TABLE date_receipts (
  id SERIAL PRIMARY KEY,
  date_booking_id INT NOT NULL,
  uploader_user_id INT NOT NULL,
  receipt_photo_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_by_other_user BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP,
  disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date_booking_id) REFERENCES date_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_receipts_date_booking ON date_receipts(date_booking_id);
CREATE INDEX idx_receipts_uploader ON date_receipts(uploader_user_id);

-- ============================================
-- DATE RATINGS TABLE
-- ============================================
CREATE TABLE date_ratings (
  id SERIAL PRIMARY KEY,
  date_booking_id INT NOT NULL,
  rater_user_id INT NOT NULL,
  rated_user_id INT NOT NULL,
  rating_score INT NOT NULL CHECK (rating_score >= 1 AND rating_score <= 5),
  comment TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date_booking_id) REFERENCES date_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(date_booking_id, rater_user_id)
);

CREATE INDEX idx_ratings_date_booking ON date_ratings(date_booking_id);
CREATE INDEX idx_ratings_rater ON date_ratings(rater_user_id);
CREATE INDEX idx_ratings_rated ON date_ratings(rated_user_id);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_user_id INT NOT NULL,
  reported_user_id INT NOT NULL,
  date_booking_id INT,
  report_category VARCHAR(50), -- harassment, assault, financial_fraud, fake_identity, other
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  evidence_package_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, resolved, dismissed
  resolution_action VARCHAR(50), -- warn, suspend, ban, no_action
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (date_booking_id) REFERENCES date_bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_date_booking ON reports(date_booking_id);

-- ============================================
-- ADMIN ACTIONS TABLE (AUDIT LOG)
-- ============================================
CREATE TABLE admin_actions (
  id SERIAL PRIMARY KEY,
  admin_user_id INT NOT NULL,
  action_type VARCHAR(100), -- kyc_approved, kyc_rejected, user_suspended, user_banned, venue_approved, etc.
  target_user_id INT,
  target_venue_id INT,
  target_report_id INT,
  action_details JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_venue_id) REFERENCES venues(id) ON DELETE SET NULL,
  FOREIGN KEY (target_report_id) REFERENCES reports(id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_date ON admin_actions(created_at);

-- ============================================
-- TRUST SCORE LOG TABLE (AUDIT TRAIL)
-- ============================================
CREATE TABLE trust_score_log (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  previous_score INT,
  new_score INT,
  score_change INT,
  reason VARCHAR(100), -- kyc_verified, date_completed, complaint_filed, etc.
  related_entity_type VARCHAR(50), -- date_booking, report, etc.
  related_entity_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_trust_score_log_user ON trust_score_log(user_id);
CREATE INDEX idx_trust_score_log_date ON trust_score_log(created_at);

-- ============================================
-- INDEXES FOR OPTIMIZATION
-- ============================================

-- Search active users by city and verification status
CREATE INDEX idx_users_city_verified ON users(city, is_verified, account_status);

-- Quick lookup of pending KYC reviews
CREATE INDEX idx_kyc_pending_review ON kyc_submissions(status, submission_date);

-- Fast lookup of upcoming dates
CREATE INDEX idx_upcoming_dates ON date_bookings(booking_date, booking_time) WHERE status IN ('contract_signed', 'accepted');

-- Performance for date history lookups
CREATE INDEX idx_date_history_user ON date_bookings(user1_id, completed_at);
CREATE INDEX idx_date_history_user2 ON date_bookings(user2_id, completed_at);

-- Message retrieval optimization
CREATE INDEX idx_messages_match_sent ON messages(match_id, sent_at DESC);

-- ============================================
-- EXTENSIONS FOR ADVANCED FEATURES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- END OF SCHEMA
-- ============================================