# Safera - Safety-First Dating + Date-Booking Platform

**Safera** is a revolutionary dating platform that prioritizes user safety through mandatory date booking, digital contracts, and immutable evidence recording.

## 🎯 Core Differentiators

✅ **Every real-world date must be formally booked** through the platform  
✅ **Both parties sign a digital "Date Agreement"** before meeting  
✅ **Dates are logged, recorded, and kept as immutable evidence**  
✅ **Protects BOTH parties** — women from assault, men from fake restaurant scams  

## 🏗️ Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.io
- **File Storage:** Cloudinary
- **Payments:** Razorpay (India) / Stripe
- **Maps/Location:** Google Maps API

## 📋 Key Features

### 1. **Identity Verification (KYC)** 🆔
- Mandatory before platform access
- Government ID upload (Aadhaar/PAN/Passport)
- Live selfie with liveness check
- Admin review panel
- Verified badge on profiles

### 2. **Profile + Matching System** 👤
- Standard dating profile with safety twist
- Trust Score (0-100) based on verification, completed dates, complaints
- Swipe feed (20 swipes/day free tier)
- Mutual match → unlocks chat

### 3. **Date Booking System** 📅
- Select date, time, venue (from approved list only)
- Bill-split options (50/50, one pays, custom %)
- Digital contract signed with OTP verification
- Contract is immutable after both parties sign

### 4. **On-Date Safety** 🛡️
- **QR Code Check-in:** Both users scan at venue
- **Safety Timer:** Auto-alert if no response before end-time
- **SOS Button:** One tap sends GPS + date info to emergency contact + admins
- **Location Tracking:** Optional live location sharing during date

### 5. **Post-Date Record System** 📝
- Bill receipt photos + mutual confirmation
- Mutual rating (1-5 stars) + comments
- Immutable date log (frozen after completion)
- Evidence locked for 3 years (legal requirement)

### 6. **Dispute & Report System** ⚖️
- File complaint up to 30 days after date
- Categories: harassment, assault, financial fraud, fake identity
- Auto-attached evidence package (contract, check-in logs, chat, receipts, ratings)
- Evidence formatted for police filing
- Ban system with phone + ID deduplication

### 7. **Real-Time Chat** 💬
- Socket.io messaging between matched users
- Chat history archived with date booking
- Messages cannot be deleted (only hidden)
- Auto-locked once report is filed

## 🗄️ Database Schema

```
users
├── kyc_submissions
├── profiles
├── photos
├── swipes
├── matches
├── messages
├── emergency_contacts
├── venues
├── date_bookings
│   ├── date_checkins
│   ├── date_receipts
│   ├── date_ratings
│   └── safety_events
├── reports
├── admin_actions
└── trust_score_log
```

Full schema: [`db/migrations/001_initial_schema.sql`](db/migrations/001_initial_schema.sql)

## 🚀 Development Roadmap

- [ ] Step 1: Database schema (PostgreSQL migrations)
- [ ] Step 2: User auth + KYC submission
- [ ] Step 3: Profile + swipe + matching
- [ ] Step 4: Venue management (admin + user-facing)
- [ ] Step 5: Date booking wizard + contract signing
- [ ] Step 6: QR check-in + safety timer + SOS
- [ ] Step 7: Post-date: bill confirmation + ratings
- [ ] Step 8: Report system + evidence package generator
- [ ] Step 9: Admin dashboard
- [ ] Step 10: Real-time chat

## 🔒 Security & Compliance

- ✅ All KYC documents encrypted at rest (AES-256)
- ✅ HTTPS only
- ✅ Rate limiting on all auth + KYC routes
- ✅ Audit log for all admin actions
- ✅ GDPR-style data deletion (account deleted, date records retained 3 years)
- ✅ Platform as neutral evidence-keeper (not a judge)

## 🎨 Design Philosophy

- Mobile-first, clean UI
- Color scheme: Deep Navy + Coral Accent + White
- Trust badges & safety indicators prominent
- Tone: "Empowering and Safe" (not surveillance app)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Support

For questions or issues, please open a GitHub issue.
