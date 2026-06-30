# Professional Coaching System - Implementation Guide

## Overview
The Digital Coffee app now has a two-tier coaching system:

### Free Tier (Community Coaching)
- **Peer-to-peer coaching** - Users can coach each other (unlimited, always free)
- No payment required
- Available to all users

### Premium Tier (Professional Coaching) - **$9.99/month**
- **Professional coaches** - Certified coaches hired by Digital Coffee
- **Verified badges** with certifications and credentials
- **Scheduled 1-on-1 sessions** with your coach
- **Custom programs** designed by professional coaches
- **Priority support** with guaranteed response times
- Requires Premium subscription

---

## Database Structure

### Tables Created:

1. **`subscription_plans`** - Available subscription tiers (Free, Premium)
2. **`user_subscriptions`** - Tracks which users have Premium access
3. **`professional_coaches`** - Digital Coffee's hired coaches (NOT regular users)
4. **`professional_coaching_relationships`** - Premium users working with professional coaches
5. **`professional_coaching_sessions`** - Scheduled 1-on-1 sessions
6. **`coaching_programs`** - Custom programs created by professional coaches
7. **`program_enrollments`** - Users enrolled in custom programs
8. **`professional_coach_reviews`** - Ratings and reviews for professional coaches

### Sample Professional Coaches Installed:

1. **Dr. Sarah Mitchell** - Anxiety & Stress specialist (15 years experience)
2. **Michael Chen** - Focus & Productivity coach (8 years experience)
3. **Emma Rodriguez** - Sleep & Wellness specialist (10 years experience)

---

## API Endpoints

### Public Endpoints (No authentication)

#### Get All Professional Coaches
```
GET /api/professional-coaching/coaches
Query params:
  - specialty: Filter by specialty (anxiety, focus, sleep, etc.)
  - limit: Results per page (default: 20)
  - offset: Pagination offset (default: 0)
```

#### Get Specific Coach Details
```
GET /api/professional-coaching/coaches/:coachId
```

---

### Protected Endpoints (Require Premium Subscription)

#### Request a Professional Coach
```
POST /api/professional-coaching/request-coach
Body: {
  "coach_id": 1,
  "goals": ["Overcome anxiety", "Improve focus"]
}
```

#### Get My Professional Coaches
```
GET /api/professional-coaching/my-coaches
```

#### Get Available Programs
```
GET /api/professional-coaching/my-programs
```

#### Enroll in a Program
```
POST /api/professional-coaching/programs/:programId/enroll
```

#### Submit Coach Review
```
POST /api/professional-coaching/coaches/:coachId/review
Body: {
  "rating": 5,
  "review": "Amazing coach! Helped me overcome my anxiety."
}
```

---

### Subscription Endpoints

#### Get Subscription Plans
```
GET /api/professional-coaching/subscription/plans
```

#### Check User's Subscription Status
```
GET /api/professional-coaching/subscription/status
```

---

## Frontend Integration

### Update Mobile API Service

Add to `mobile/src/services/api.js`:

```javascript
// Professional Coaching endpoints
export const professionalCoachingAPI = {
  // Public endpoints
  getCoaches: (specialty, limit = 20, offset = 0) => {
    let url = `/professional-coaching/coaches?limit=${limit}&offset=${offset}`;
    if (specialty) url += `&specialty=${specialty}`;
    return api.get(url);
  },

  getCoach: (coachId) =>
    api.get(`/professional-coaching/coaches/${coachId}`),

  // Premium endpoints
  requestCoach: (coach_id, goals) =>
    api.post('/professional-coaching/request-coach', { coach_id, goals }),

  getMyCoaches: () =>
    api.get('/professional-coaching/my-coaches'),

  getMyPrograms: () =>
    api.get('/professional-coaching/my-programs'),

  enrollInProgram: (programId) =>
    api.post(`/professional-coaching/programs/${programId}/enroll`),

  reviewCoach: (coachId, rating, review) =>
    api.post(`/professional-coaching/coaches/${coachId}/review`, { rating, review }),

  // Subscription
  getSubscriptionPlans: () =>
    api.get('/professional-coaching/subscription/plans'),

  getSubscriptionStatus: () =>
    api.get('/professional-coaching/subscription/status'),
};
```

---

## Admin Management

### Adding New Professional Coaches

```sql
INSERT INTO professional_coaches (
  full_name, email, bio, specialties, certifications,
  years_experience, languages, timezone, is_active, is_accepting_students
) VALUES (
  'Coach Name',
  'coach@digitalcoffee.cafe',
  'Bio and experience description...',
  ARRAY['anxiety', 'focus', 'sleep'], -- specialties
  '[{"name": "Certification Name", "issuer": "Organization", "year": 2020}]'::jsonb,
  10, -- years of experience
  ARRAY['English', 'Spanish'],
  'America/New_York',
  true, -- is_active
  true  -- is_accepting_students
);
```

### Activating Premium for Testing

To give a user Premium access for testing:

```sql
-- Get the premium plan ID
SELECT id FROM subscription_plans WHERE name = 'premium';

-- Grant premium subscription to user (use actual user_id and plan_id)
INSERT INTO user_subscriptions (user_id, plan_id, status, expires_at)
VALUES (
  26, -- user_id (replace with actual user ID)
  2,  -- plan_id for premium (from previous query)
  'active',
  NOW() + INTERVAL '1 year'
);

-- Update user's subscription status
UPDATE users
SET subscription_status = 'premium',
    subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE id = 26;
```

---

## Payment Integration (TODO)

The current system has the infrastructure ready but needs payment integration.

### Recommended: Stripe Integration

1. **Create Stripe Products & Prices**
   - Premium Monthly: $9.99/month
   - Premium Yearly: $99.99/year (save $20)

2. **Add Stripe Checkout**
   - Create checkout session endpoint
   - Handle successful payment webhooks
   - Create/update `user_subscriptions` record
   - Update `users.subscription_status`

3. **Handle Subscription Events**
   - `customer.subscription.created` → Activate premium
   - `customer.subscription.deleted` → Cancel premium
   - `invoice.payment_failed` → Suspend premium
   - `customer.subscription.updated` → Update expiry date

---

## Testing the System

### Test Flow:

1. **Browse Professional Coaches** (No auth required)
   ```bash
   curl http://76.13.41.99:5000/api/professional-coaching/coaches
   ```

2. **Get Coach Details**
   ```bash
   curl http://76.13.41.99:5000/api/professional-coaching/coaches/1
   ```

3. **Check Subscription Status** (Requires auth)
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://76.13.41.99:5000/api/professional-coaching/subscription/status
   ```

4. **Try to Request Coach Without Premium** (Should fail with 403)
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"coach_id": 1, "goals": ["Test goal"]}' \
     http://76.13.41.99:5000/api/professional-coaching/request-coach
   ```

5. **Grant Premium Access** (Run SQL from Admin Management section above)

6. **Request Coach With Premium** (Should succeed)
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"coach_id": 1, "goals": ["Reduce anxiety", "Improve focus"]}' \
     http://76.13.41.99:5000/api/professional-coaching/request-coach
   ```

---

## Mobile UI Screens to Create

### 1. Professional Coaches Browse Screen
- List all professional coaches with:
  - Profile photo
  - Name, credentials, years of experience
  - Specialties (tags)
  - Rating and number of reviews
  - "View Profile" button

### 2. Coach Profile Screen
- Full bio and background
- Certifications with badges
- Languages spoken
- Availability
- Reviews from other users
- "Connect with Coach" button (shows Premium paywall if not subscribed)

### 3. Subscription/Paywall Screen
- Show Free vs Premium comparison
- Benefits of Premium:
  - ✅ Access to professional coaches
  - ✅ Scheduled 1-on-1 sessions
  - ✅ Custom programs
  - ✅ Priority support
- Monthly: $9.99/month
- Yearly: $99.99/year (save $20)
- "Subscribe Now" button → Stripe Checkout

### 4. My Professional Coaches Screen
- List of coaches user is working with
- Quick stats (sessions completed, next session, progress)
- Message coach button
- Schedule session button

### 5. Programs Screen
- Available programs from user's coaches
- Enrolled programs with progress
- Browse new programs

---

## Key Features Summary

### For Users:
- ✅ Free peer-to-peer coaching (always free)
- ✅ Browse professional coaches (no subscription needed)
- ✅ Premium subscription for professional coaches ($9.99/month)
- ✅ Multiple coach specialties (anxiety, focus, sleep, productivity, etc.)
- ✅ Verified coaches with credentials and badges
- ✅ Custom programs designed by coaches
- ✅ Review and rate coaches

### For Professional Coaches:
- ✅ Profile with bio, certifications, specialties
- ✅ Accept students (with optional max capacity)
- ✅ Create custom programs for students
- ✅ Schedule 1-on-1 sessions
- ✅ Track student progress and sessions
- ✅ Receive ratings and reviews

### For Admins:
- ✅ Add/manage professional coaches via SQL
- ✅ Grant/revoke premium subscriptions
- ✅ View subscription analytics
- ✅ Monitor coach performance

---

## Next Steps

1. **Integrate Stripe** for payment processing
2. **Create mobile UI screens** for professional coaching
3. **Add scheduling system** for 1-on-1 sessions (integrate Calendly or build custom)
4. **Build admin panel** for managing professional coaches
5. **Create notifications** for session reminders, new programs, etc.
6. **Add messaging system** between users and professional coaches

---

## Status

✅ **Backend API**: Complete and deployed
✅ **Database**: All tables created with sample data
✅ **Premium check middleware**: Implemented
⏳ **Payment integration**: Pending (Stripe recommended)
⏳ **Mobile UI**: Pending
⏳ **Admin panel**: Pending
⏳ **Scheduling system**: Pending

---

## Support

For questions or issues:
- Check backend logs: `ssh root@76.13.41.99 "pm2 logs digitalcoffee-v2"`
- Query database: `PGPASSWORD='digitalcoffee2024' psql -h localhost -U postgres -d digitalcoffee`
- Test API: `curl http://76.13.41.99:5000/api/professional-coaching/coaches`
