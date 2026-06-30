const db = require('../config/database');

const audioContent = [
  // BINAURAL BEATS - Alpha (8-12 Hz) - Relaxation & Light Meditation
  {
    title: 'Alpha Wave Relaxation',
    description: 'Gentle alpha waves for deep relaxation and stress relief. Perfect for unwinding after a long day.',
    type: 'binaural',
    brainwave_type: 'alpha',
    duration: 900, // 15 minutes
    audio_url: 'https://example.com/audio/alpha-relaxation.mp3',
    thumbnail_url: 'https://example.com/thumbnails/alpha-wave.jpg',
    tags: ['relaxation', 'stress-relief', 'beginner']
  },
  {
    title: 'Alpha Focus & Calm',
    description: 'Boost concentration while staying calm. Ideal for creative work and study sessions.',
    type: 'binaural',
    brainwave_type: 'alpha',
    duration: 1200, // 20 minutes
    audio_url: 'https://example.com/audio/alpha-focus.mp3',
    thumbnail_url: 'https://example.com/thumbnails/alpha-focus.jpg',
    tags: ['focus', 'creativity', 'study']
  },
  {
    title: 'Morning Alpha Awakening',
    description: 'Start your day with gentle alpha frequencies for a peaceful, energized morning.',
    type: 'binaural',
    brainwave_type: 'alpha',
    duration: 600, // 10 minutes
    audio_url: 'https://example.com/audio/morning-alpha.mp3',
    thumbnail_url: 'https://example.com/thumbnails/morning.jpg',
    tags: ['morning', 'awakening', 'energy']
  },

  // BINAURAL BEATS - Beta (12-30 Hz) - Focus & Alertness
  {
    title: 'Beta Power Focus',
    description: 'High-performance beta waves for intense focus and productivity. Perfect for important tasks.',
    type: 'binaural',
    brainwave_type: 'beta',
    duration: 1800, // 30 minutes
    audio_url: 'https://example.com/audio/beta-power.mp3',
    thumbnail_url: 'https://example.com/thumbnails/beta-power.jpg',
    tags: ['focus', 'productivity', 'work']
  },
  {
    title: 'Beta Concentration Boost',
    description: 'Enhance mental clarity and concentration for studying or complex problem-solving.',
    type: 'binaural',
    brainwave_type: 'beta',
    duration: 1500, // 25 minutes
    audio_url: 'https://example.com/audio/beta-concentration.mp3',
    thumbnail_url: 'https://example.com/thumbnails/concentration.jpg',
    tags: ['concentration', 'study', 'mental-clarity']
  },

  // BINAURAL BEATS - Theta (4-8 Hz) - Deep Meditation & Creativity
  {
    title: 'Theta Deep Meditation',
    description: 'Enter profound meditative states with theta waves. Experience deep inner peace.',
    type: 'binaural',
    brainwave_type: 'theta',
    duration: 1800, // 30 minutes
    audio_url: 'https://example.com/audio/theta-meditation.mp3',
    thumbnail_url: 'https://example.com/thumbnails/theta-meditation.jpg',
    tags: ['meditation', 'deep', 'peace']
  },
  {
    title: 'Theta Creative Flow',
    description: 'Unlock creativity and intuition with theta frequency. Perfect for artists and innovators.',
    type: 'binaural',
    brainwave_type: 'theta',
    duration: 1200, // 20 minutes
    audio_url: 'https://example.com/audio/theta-creative.mp3',
    thumbnail_url: 'https://example.com/thumbnails/creative-flow.jpg',
    tags: ['creativity', 'intuition', 'flow']
  },
  {
    title: 'Theta Healing Journey',
    description: 'Deep healing frequencies for emotional release and inner transformation.',
    type: 'binaural',
    brainwave_type: 'theta',
    duration: 2100, // 35 minutes
    audio_url: 'https://example.com/audio/theta-healing.mp3',
    thumbnail_url: 'https://example.com/thumbnails/healing.jpg',
    tags: ['healing', 'emotional', 'transformation']
  },

  // BINAURAL BEATS - Delta (0.5-4 Hz) - Deep Sleep
  {
    title: 'Delta Deep Sleep',
    description: 'Ultra-deep delta waves for restful, rejuvenating sleep. Fall asleep naturally.',
    type: 'binaural',
    brainwave_type: 'delta',
    duration: 3600, // 60 minutes
    audio_url: 'https://example.com/audio/delta-sleep.mp3',
    thumbnail_url: 'https://example.com/thumbnails/sleep.jpg',
    tags: ['sleep', 'rest', 'recovery']
  },
  {
    title: 'Delta Healing Sleep',
    description: 'Promote physical healing and restoration during sleep with delta frequencies.',
    type: 'binaural',
    brainwave_type: 'delta',
    duration: 2700, // 45 minutes
    audio_url: 'https://example.com/audio/delta-healing-sleep.mp3',
    thumbnail_url: 'https://example.com/thumbnails/healing-sleep.jpg',
    tags: ['sleep', 'healing', 'restoration']
  },

  // BINAURAL BEATS - Gamma (30+ Hz) - Peak Performance
  {
    title: 'Gamma Peak Performance',
    description: 'High-frequency gamma waves for peak mental performance and heightened awareness.',
    type: 'binaural',
    brainwave_type: 'gamma',
    duration: 900, // 15 minutes
    audio_url: 'https://example.com/audio/gamma-peak.mp3',
    thumbnail_url: 'https://example.com/thumbnails/peak-performance.jpg',
    tags: ['performance', 'awareness', 'advanced']
  },
  {
    title: 'Gamma Cognitive Enhancement',
    description: 'Boost cognitive function, memory, and information processing with gamma frequencies.',
    type: 'binaural',
    brainwave_type: 'gamma',
    duration: 1200, // 20 minutes
    audio_url: 'https://example.com/audio/gamma-cognitive.mp3',
    thumbnail_url: 'https://example.com/thumbnails/cognitive.jpg',
    tags: ['cognitive', 'memory', 'learning']
  },

  // GUIDED TALKS - Motivation & Inspiration
  {
    title: 'Morning Motivation Boost',
    description: 'Start your day with powerful motivation and positive affirmations. Set your intentions for success.',
    type: 'guided-talk',
    brainwave_type: 'beta',
    duration: 600, // 10 minutes
    audio_url: 'https://example.com/audio/morning-motivation.mp3',
    thumbnail_url: 'https://example.com/thumbnails/motivation.jpg',
    tags: ['motivation', 'morning', 'success']
  },
  {
    title: 'Overcoming Self-Doubt',
    description: 'Guided talk to help you overcome self-doubt and build unshakeable confidence.',
    type: 'guided-talk',
    brainwave_type: 'alpha',
    duration: 900, // 15 minutes
    audio_url: 'https://example.com/audio/overcome-doubt.mp3',
    thumbnail_url: 'https://example.com/thumbnails/confidence.jpg',
    tags: ['confidence', 'self-improvement', 'mindset']
  },
  {
    title: 'Finding Your Purpose',
    description: 'Reflective guided session to help you discover your true purpose and passion in life.',
    type: 'guided-talk',
    brainwave_type: 'theta',
    duration: 1200, // 20 minutes
    audio_url: 'https://example.com/audio/find-purpose.mp3',
    thumbnail_url: 'https://example.com/thumbnails/purpose.jpg',
    tags: ['purpose', 'reflection', 'life-goals']
  },
  {
    title: 'Embracing Change',
    description: 'Learn to welcome change and transformation with this empowering guided talk.',
    type: 'guided-talk',
    brainwave_type: 'alpha',
    duration: 840, // 14 minutes
    audio_url: 'https://example.com/audio/embrace-change.mp3',
    thumbnail_url: 'https://example.com/thumbnails/change.jpg',
    tags: ['change', 'growth', 'transformation']
  },

  // AFFIRMATIONS
  {
    title: 'I Am Worthy',
    description: 'Powerful affirmations to reinforce self-worth and self-love. Repeat daily for best results.',
    type: 'affirmation',
    brainwave_type: 'alpha',
    duration: 420, // 7 minutes
    audio_url: 'https://example.com/audio/i-am-worthy.mp3',
    thumbnail_url: 'https://example.com/thumbnails/worthy.jpg',
    tags: ['self-love', 'affirmations', 'daily']
  },
  {
    title: 'Abundance Mindset',
    description: 'Cultivate an abundance mindset with these prosperity and success affirmations.',
    type: 'affirmation',
    brainwave_type: 'theta',
    duration: 600, // 10 minutes
    audio_url: 'https://example.com/audio/abundance.mp3',
    thumbnail_url: 'https://example.com/thumbnails/abundance.jpg',
    tags: ['abundance', 'prosperity', 'success']
  },
  {
    title: 'Healing Affirmations',
    description: 'Gentle affirmations for emotional and physical healing. Support your wellness journey.',
    type: 'affirmation',
    brainwave_type: 'theta',
    duration: 720, // 12 minutes
    audio_url: 'https://example.com/audio/healing-affirmations.mp3',
    thumbnail_url: 'https://example.com/thumbnails/healing-affirm.jpg',
    tags: ['healing', 'wellness', 'recovery']
  },
  {
    title: 'Confidence Builder',
    description: 'Build unshakeable confidence with these powerful daily affirmations.',
    type: 'affirmation',
    brainwave_type: 'beta',
    duration: 480, // 8 minutes
    audio_url: 'https://example.com/audio/confidence-builder.mp3',
    thumbnail_url: 'https://example.com/thumbnails/confidence-affirm.jpg',
    tags: ['confidence', 'self-esteem', 'empowerment']
  },

  // MEDITATION GUIDES
  {
    title: 'Body Scan Meditation',
    description: 'Complete body scan meditation for deep relaxation and body awareness.',
    type: 'meditation',
    brainwave_type: 'alpha',
    duration: 1200, // 20 minutes
    audio_url: 'https://example.com/audio/body-scan.mp3',
    thumbnail_url: 'https://example.com/thumbnails/body-scan.jpg',
    tags: ['meditation', 'body-awareness', 'relaxation']
  },
  {
    title: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion and love for yourself and others with this guided practice.',
    type: 'meditation',
    brainwave_type: 'theta',
    duration: 900, // 15 minutes
    audio_url: 'https://example.com/audio/loving-kindness.mp3',
    thumbnail_url: 'https://example.com/thumbnails/loving-kindness.jpg',
    tags: ['meditation', 'compassion', 'love']
  },
  {
    title: 'Mindful Breathing',
    description: 'Simple yet powerful breath-focused meditation for beginners and experts alike.',
    type: 'meditation',
    brainwave_type: 'alpha',
    duration: 600, // 10 minutes
    audio_url: 'https://example.com/audio/mindful-breathing.mp3',
    thumbnail_url: 'https://example.com/thumbnails/breathing.jpg',
    tags: ['meditation', 'breathing', 'mindfulness']
  },
  {
    title: 'Gratitude Meditation',
    description: 'Cultivate a grateful heart with this uplifting meditation practice.',
    type: 'meditation',
    brainwave_type: 'alpha',
    duration: 720, // 12 minutes
    audio_url: 'https://example.com/audio/gratitude.mp3',
    thumbnail_url: 'https://example.com/thumbnails/gratitude.jpg',
    tags: ['gratitude', 'positivity', 'appreciation']
  },

  // BREATHING EXERCISES
  {
    title: 'Box Breathing for Calm',
    description: 'Guided box breathing technique to reduce anxiety and promote calmness.',
    type: 'breathing',
    brainwave_type: 'alpha',
    duration: 300, // 5 minutes
    audio_url: 'https://example.com/audio/box-breathing.mp3',
    thumbnail_url: 'https://example.com/thumbnails/box-breathing.jpg',
    tags: ['breathing', 'anxiety', 'calm']
  },
  {
    title: '4-7-8 Sleep Breathing',
    description: 'Fall asleep faster with the 4-7-8 breathing technique. Simple and effective.',
    type: 'breathing',
    brainwave_type: 'delta',
    duration: 360, // 6 minutes
    audio_url: 'https://example.com/audio/478-breathing.mp3',
    thumbnail_url: 'https://example.com/thumbnails/sleep-breathing.jpg',
    tags: ['breathing', 'sleep', 'insomnia']
  },
  {
    title: 'Energizing Breath Work',
    description: 'Boost energy and alertness with this invigorating breathing exercise.',
    type: 'breathing',
    brainwave_type: 'beta',
    duration: 240, // 4 minutes
    audio_url: 'https://example.com/audio/energizing-breath.mp3',
    thumbnail_url: 'https://example.com/thumbnails/energy-breath.jpg',
    tags: ['breathing', 'energy', 'vitality']
  }
];

async function seedAudioContent() {
  try {
    console.log('🌱 Starting to seed audio content...');

    // Check if audio content already exists
    const existingCount = await db.query('SELECT COUNT(*) FROM audio_content');
    const count = parseInt(existingCount.rows[0].count);

    if (count > 0) {
      console.log(`⚠️  Found ${count} existing audio entries.`);
      console.log('✅ Skipping - audio content already exists.');
      console.log('If you need to re-seed, manually clear the audio_content table first.');
      process.exit(0);
    }

    console.log(`📝 Inserting ${audioContent.length} audio entries...`);

    for (const audio of audioContent) {
      await db.query(
        `INSERT INTO audio_content
        (title, description, type, brainwave_type, duration_seconds, audio_url, thumbnail_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          audio.title,
          audio.description,
          audio.type,
          audio.brainwave_type,
          audio.duration, // This maps to duration_seconds
          audio.audio_url,
          audio.thumbnail_url
        ]
      );
      console.log(`✅ Added: ${audio.title}`);
    }

    console.log('\n🎉 Audio content seeding completed successfully!');
    console.log(`📊 Total entries: ${audioContent.length}`);
    console.log('\n📋 Breakdown by type:');
    console.log(`   • Binaural Beats: ${audioContent.filter(a => a.type === 'binaural').length}`);
    console.log(`   • Guided Talks: ${audioContent.filter(a => a.type === 'guided-talk').length}`);
    console.log(`   • Affirmations: ${audioContent.filter(a => a.type === 'affirmation').length}`);
    console.log(`   • Meditations: ${audioContent.filter(a => a.type === 'meditation').length}`);
    console.log(`   • Breathing: ${audioContent.filter(a => a.type === 'breathing').length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding audio content:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAudioContent();
