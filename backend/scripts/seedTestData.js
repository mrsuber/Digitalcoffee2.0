const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedTestData() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Create test users
    console.log('👥 Creating test users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [];
    for (let i = 1; i <= 5; i++) {
      const result = await db.query(
        `INSERT INTO users (email, username, password_hash, name, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, email, name`,
        [`user${i}@test.com`, `user${i}`, hashedPassword, `Test User ${i}`, false]
      );
      users.push(result.rows[0]);
    }
    console.log(`✓ Created ${users.length} test users`);

    // 2. Create courses
    console.log('\n📚 Creating courses...');
    const coursesData = [
      {
        title: 'Quick Focus Boost',
        description: 'Short, intense sessions to help you lock into deep work mode. Perfect for busy professionals who need to maximize productivity.',
        mode: 'hyper-focus',
        duration_days: 3,
        image_url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800'
      },
      {
        title: 'Calm Mind Reset',
        description: 'Relaxation and breathing exercises to reset your mental state. Reduce stress and anxiety through proven mindfulness techniques.',
        mode: 'calm-down',
        duration_days: 5,
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800'
      },
      {
        title: 'Inspiration Journey',
        description: 'Long-form talks and affirmations to expand your mindset. Unlock your creative potential and overcome mental blocks.',
        mode: 'infinite-inspiration',
        duration_days: 7,
        image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800'
      },
      {
        title: 'Deep Sleep Mastery',
        description: 'Achieve restful, rejuvenating sleep every night. Combat insomnia and improve sleep quality naturally.',
        mode: 'calm-down',
        duration_days: 7,
        image_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800'
      },
      {
        title: 'Anxiety Relief Protocol',
        description: 'Evidence-based techniques to manage and reduce anxiety. Take control of your mental wellness.',
        mode: 'calm-down',
        duration_days: 14,
        image_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800'
      },
      {
        title: 'Peak Performance Protocol',
        description: 'Advanced focus training for high achievers. Push your mental limits and achieve flow states consistently.',
        mode: 'hyper-focus',
        duration_days: 21,
        image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
      }
    ];

    const courses = [];
    for (const course of coursesData) {
      const result = await db.query(
        `INSERT INTO courses (title, description, mode, duration_days, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title`,
        [course.title, course.description, course.mode, course.duration_days, course.image_url]
      );
      courses.push(result.rows[0]);
    }
    console.log(`✓ Created ${courses.length} courses`);

    // 3. Create audio content
    console.log('\n🎵 Creating audio content...');
    const audioData = [
      {
        title: 'Alpha Focus - 8.6 Hz',
        description: 'Perfect for relaxed focus and learning. The alpha frequency promotes a calm yet alert mental state.',
        type: 'meditation',
        brainwave_type: 'alpha',
        frequency_hz: 8.6,
        duration_seconds: 1800,
        audio_url: 'https://www.soundhealing.com/audio/alpha-8.6hz.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400'
      },
      {
        title: 'Theta Deep Meditation',
        description: 'Enter deep meditative states and enhanced creativity. Theta waves facilitate deep relaxation and insight.',
        type: 'meditation',
        brainwave_type: 'theta',
        frequency_hz: 6.0,
        duration_seconds: 2400,
        audio_url: 'https://www.soundhealing.com/audio/theta-6hz.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400'
      },
      {
        title: 'Beta Alert Focus',
        description: 'High-performance focus for intensive work. Beta frequencies enhance active thinking and problem-solving.',
        type: 'meditation',
        brainwave_type: 'beta',
        frequency_hz: 18.0,
        duration_seconds: 1800,
        audio_url: 'https://www.soundhealing.com/audio/beta-18hz.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'
      },
      {
        title: 'Delta Deep Sleep',
        description: 'Promote deep, restorative sleep. Delta waves are associated with the deepest stages of sleep.',
        type: 'meditation',
        brainwave_type: 'delta',
        frequency_hz: 2.5,
        duration_seconds: 3600,
        audio_url: 'https://www.soundhealing.com/audio/delta-2.5hz.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400'
      },
      {
        title: 'Gamma Peak Performance',
        description: 'Ultimate focus and cognitive enhancement. Gamma frequencies are linked to peak mental performance.',
        type: 'meditation',
        brainwave_type: 'gamma',
        frequency_hz: 40.0,
        duration_seconds: 1200,
        audio_url: 'https://www.soundhealing.com/audio/gamma-40hz.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
      },
      {
        title: 'Morning Motivation Affirmations',
        description: 'Start your day with powerful affirmations. Reprogram your subconscious mind for success.',
        type: 'affirmation',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 900,
        audio_url: 'https://www.motivation.com/audio/morning-affirmations.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400'
      },
      {
        title: 'Control Your Thoughts',
        description: 'Master your inner dialogue. Learn to direct your thoughts rather than being controlled by them.',
        type: 'guided-talk',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 1200,
        audio_url: 'https://www.mindcontrol.com/audio/thought-control.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400'
      },
      {
        title: 'Rewire Your Mind',
        description: 'Neuroplasticity and mental reprogramming. Understand how to reshape your brain for success.',
        type: 'guided-talk',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 1800,
        audio_url: 'https://www.neuroplasticity.com/audio/rewire-mind.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400'
      },
      {
        title: 'Box Breathing Guide',
        description: 'Master the 4-4-4-4 breathing technique. Used by Navy SEALs for stress management and focus.',
        type: 'breathing',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 600,
        audio_url: 'https://www.breathing.com/audio/box-breathing.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'
      },
      {
        title: 'Confidence Builder',
        description: 'Build unshakeable self-confidence. Powerful affirmations to boost your self-esteem.',
        type: 'affirmation',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 1200,
        audio_url: 'https://www.confidence.com/audio/confidence-builder.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'
      },
      {
        title: 'Sleep Hypnosis - Deep Rest',
        description: 'Guided hypnosis for profound sleep. Wake up refreshed and energized.',
        type: 'meditation',
        brainwave_type: 'delta',
        frequency_hz: 1.5,
        duration_seconds: 2700,
        audio_url: 'https://www.sleephypnosis.com/audio/deep-rest.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400'
      },
      {
        title: 'Abundance Mindset',
        description: 'Shift from scarcity to abundance thinking. Attract prosperity and opportunities.',
        type: 'affirmation',
        brainwave_type: null,
        frequency_hz: null,
        duration_seconds: 1500,
        audio_url: 'https://www.abundance.com/audio/abundance-mindset.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400'
      }
    ];

    const audioContent = [];
    for (const audio of audioData) {
      const result = await db.query(
        `INSERT INTO audio_content (title, description, type, brainwave_type, frequency_hz, duration_seconds, audio_url, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title, duration_seconds`,
        [audio.title, audio.description, audio.type, audio.brainwave_type,
         audio.frequency_hz, audio.duration_seconds, audio.audio_url, audio.thumbnail_url]
      );
      audioContent.push(result.rows[0]);
    }
    console.log(`✓ Created ${audioContent.length} audio content items`);

    // 4. Enroll users in courses
    console.log('\n📝 Enrolling users in courses...');
    let enrollmentCount = 0;
    for (const user of users) {
      // Each user enrolls in 1-3 random courses
      const numCourses = Math.floor(Math.random() * 3) + 1;
      const selectedCourses = courses.sort(() => 0.5 - Math.random()).slice(0, numCourses);

      for (const course of selectedCourses) {
        await db.query(
          `INSERT INTO user_courses (user_id, course_id, current_day, is_active)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, course_id, is_active) WHERE (is_active = true) DO NOTHING`,
          [user.id, course.id, Math.floor(Math.random() * 3) + 1, true]
        );
        enrollmentCount++;
      }
    }
    console.log(`✓ Created ${enrollmentCount} course enrollments`);

    // 5. Create mood check-ins
    console.log('\n😊 Creating mood check-ins...');
    const moods = ['clear', 'tired', 'anxious', 'foggy', 'inspired'];
    const focusLevels = ['low', 'medium', 'high'];
    let moodCount = 0;

    for (const user of users) {
      // Create 5-10 mood check-ins per user over the last 7 days
      const numMoods = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < numMoods; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        await db.query(
          `INSERT INTO mood_checkins (user_id, mood, focus_level, daily_goal, emoji_rating, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${daysAgo} days')`,
          [
            user.id,
            moods[Math.floor(Math.random() * moods.length)],
            focusLevels[Math.floor(Math.random() * focusLevels.length)],
            'Focus on work tasks',
            Math.floor(Math.random() * 5) + 1
          ]
        );
        moodCount++;
      }
    }
    console.log(`✓ Created ${moodCount} mood check-ins`);

    // 6. Create listening sessions
    console.log('\n🎧 Creating listening sessions...');
    let sessionCount = 0;

    for (const user of users) {
      // Create 3-8 listening sessions per user
      const numSessions = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < numSessions; i++) {
        const audio = audioContent[Math.floor(Math.random() * audioContent.length)];
        const daysAgo = Math.floor(Math.random() * 14);
        const duration = Math.floor(Math.random() * audio.duration_seconds);
        const completed = duration >= audio.duration_seconds * 0.9;

        if (completed) {
          await db.query(
            `INSERT INTO listening_sessions (user_id, audio_content_id, duration_listened_seconds, completed, started_at, completed_at)
             VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '${daysAgo} days' + INTERVAL '${duration} seconds')`,
            [user.id, audio.id, duration, completed]
          );
        } else {
          await db.query(
            `INSERT INTO listening_sessions (user_id, audio_content_id, duration_listened_seconds, completed, started_at, completed_at)
             VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${daysAgo} days', NULL)`,
            [user.id, audio.id, duration, completed]
          );
        }
        sessionCount++;
      }
    }
    console.log(`✓ Created ${sessionCount} listening sessions`);

    // 7. Create journal entries
    console.log('\n📔 Creating journal entries...');
    const journalTemplates = [
      'Today I felt really productive. Managed to complete all my tasks.',
      'Feeling grateful for the progress I\'m making on my mental health journey.',
      'Had some anxiety today but the meditation helped calm me down.',
      'Amazing breakthrough during today\'s session. Finally understanding my patterns.',
      'Struggled with focus today. Need to be more consistent with practice.',
      'The breathing exercises are really making a difference in my stress levels.',
      'Noticed I\'m sleeping better since starting the program.',
      'Feeling more inspired and creative than I have in months.',
      'Today was challenging but I\'m proud of myself for showing up.',
      'The affirmations are starting to shift my mindset in a positive way.'
    ];

    let journalCount = 0;
    for (const user of users) {
      const numEntries = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < numEntries; i++) {
        const daysAgo = Math.floor(Math.random() * 10);
        await db.query(
          `INSERT INTO journal_entries (user_id, content, mood, tags, created_at)
           VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${daysAgo} days')`,
          [
            user.id,
            journalTemplates[Math.floor(Math.random() * journalTemplates.length)],
            moods[Math.floor(Math.random() * moods.length)],
            JSON.stringify(['meditation', 'progress', 'reflection'].sort(() => 0.5 - Math.random()).slice(0, 2))
          ]
        );
        journalCount++;
      }
    }
    console.log(`✓ Created ${journalCount} journal entries`);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  - ${users.length} users`);
    console.log(`  - ${courses.length} courses`);
    console.log(`  - ${audioContent.length} audio content items`);
    console.log(`  - ${enrollmentCount} course enrollments`);
    console.log(`  - ${moodCount} mood check-ins`);
    console.log(`  - ${sessionCount} listening sessions`);
    console.log(`  - ${journalCount} journal entries`);
    console.log('\n🎉 Your app is now ready for testing!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedTestData();
