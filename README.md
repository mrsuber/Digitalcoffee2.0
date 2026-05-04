# Digital Coffee v2.0

**Take Control of Your Mind**

A mindfulness and mental control application featuring personalized brain-wave courses, guided meditation, binaural beats, and progress tracking.

## Project Structure

```
Digitalcoffee2.0/
├── backend/              # Node.js/Express API server
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth and other middleware
│   ├── routes/          # API route handlers
│   ├── scripts/         # Setup scripts
│   ├── schema.sql       # PostgreSQL database schema
│   ├── index.js         # Main server file
│   └── package.json
│
└── mobile/              # React Native Expo app
    ├── src/
    │   ├── screens/     # App screens
    │   ├── components/  # Reusable components
    │   ├── navigation/  # Navigation setup
    │   ├── services/    # API services
    │   ├── context/     # React context (Auth, etc.)
    │   ├── utils/       # Theme and utilities
    │   └── assets/      # Images, audio files
    ├── App.js
    └── package.json
```

## Features

### Backend API
- **Authentication**: JWT-based user auth
- **Mood Tracking**: Daily mood check-ins with focus levels
- **Mind Courses**: 3-5 day personalized mental control programs
- **Audio Content**: Binaural beats, guided talks, breathing exercises
- **Progress Tracking**: Session history, streaks, insights
- **Journal**: Personal mind journal with mood tagging

### Mobile App
- **Splash Screen**: Animated brain pulse visualization
- **Onboarding**: Mood check-in and mind-mode selection
- **Mind Dashboard**: Central control panel with live visualizations
- **Brainwave Zone**: Frequency selection (Alpha, Beta, Theta, Delta, Gamma)
- **Course Library**: Browse and enroll in courses
- **Audio Player**: Integrated playback for guided content
- **Progress View**: Charts, stats, and insights
- **Mind Journal**: Record thoughts and reflections

## Design System

### Color Palette
- **Primary**: Deep blue (#0f172a) - Background
- **Secondary**: Dark purple (#312e81) - Accents
- **Accent**: Soft teal (#0d9488) - Interactive elements
- **Brainwave Colors**:
  - Alpha: #0d9488 (Calm Focus)
  - Beta: #3b82f6 (Active Thinking)
  - Theta: #8b5cf6 (Deep Meditation)
  - Delta: #6366f1 (Deep Sleep)
  - Gamma: #ec4899 (Peak Awareness)

### Typography
- Clean sans-serif fonts (System default)
- Sizes: 12px - 48px scale

### Visual Style
- Dark mode UI with gradients
- Soft pulse animations
- Minimal, focused interface
- Neural/space-themed imagery

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Setup Database**
```bash
# Create PostgreSQL database
createdb digitalcoffee

# Run schema
npm run db:setup
```

4. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Mobile App Setup

1. **Install Dependencies**
```bash
cd mobile
npm install
```

2. **Start Expo**
```bash
npm start
```

3. **Run on Device/Emulator**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Deployment

### VPS Deployment (Backend)

1. **Clone Repository on VPS**
```bash
ssh root@76.13.41.99
cd /var/www
git clone git@github.com:mrsuber/Digitalcoffee2.0.git
cd Digitalcoffee2.0/backend
```

2. **Install Dependencies**
```bash
npm install --production
```

3. **Setup Environment**
```bash
cp .env.example .env
nano .env  # Configure production values
```

4. **Setup Database**
```bash
npm run db:setup
```

5. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
```

6. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name digitalcoffee.cafe;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Enable SSL**
```bash
certbot --nginx -d digitalcoffee.cafe
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Mood
- `POST /api/mood/checkin` - Create mood check-in
- `GET /api/mood/checkins` - Get mood history
- `GET /api/mood/today` - Get today's mood

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/user/enrolled` - Get enrolled courses

### Audio
- `GET /api/audio` - Get audio content
- `GET /api/audio/:id` - Get specific audio
- `POST /api/audio/:id/start` - Start listening session
- `POST /api/audio/session/:id/complete` - Complete session

### Progress
- `GET /api/progress/overview` - Get progress overview
- `GET /api/progress/today` - Get today's progress
- `POST /api/progress/update` - Update progress
- `GET /api/progress/insights` - Get insights

### Journal
- `POST /api/journal` - Create journal entry
- `GET /api/journal` - Get journal entries
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

## Database Schema

See `backend/schema.sql` for complete schema including:
- Users and profiles
- Mood check-ins
- Courses and sessions
- Audio content
- Listening sessions
- Progress tracking
- Journal entries

## Technology Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing
- PM2 for process management

### Mobile
- React Native (Expo)
- React Navigation
- Reanimated 2 for animations
- Expo AV for audio playback
- Axios for API calls
- AsyncStorage for local data

## License

MIT

## Author

Digital Coffee Team

---

**Take Control of Your Mind** 🧠✨
