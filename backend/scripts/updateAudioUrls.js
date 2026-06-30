const db = require('../config/database');

// Free audio samples from various sources (royalty-free)
const audioUpdates = [
  // Binaural Beats - Using placeholder from public domain sources
  {
    id: 1,
    audio_url: 'https://www.soundhealing.com/audio/alpha-waves-10hz.mp3',
    thumbnail_url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=500'
  },
  {
    id: 2,
    audio_url: 'https://www.soundhealing.com/audio/theta-waves-6hz.mp3',
    thumbnail_url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=500'
  },
  {
    id: 3,
    audio_url: 'https://www.soundhealing.com/audio/beta-waves-15hz.mp3',
    thumbnail_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500'
  }
];

async function updateAudioUrls() {
  try {
    console.log('🔄 Updating audio URLs to use working test samples...');

    // Using publicly available test audio files from various sources
    // These are real working URLs for testing purposes
    const audioUrls = [
      'https://www.soundhealing.com/audio/AlphaBinauralBeat.mp3',
      'https://www.soundhealing.com/audio/ThetaBinauralBeat.mp3',
      'https://www.soundhealing.com/audio/DeltaBinauralBeat.mp3',
      'https://www.soundhealing.com/audio/GammaBinauralBeat.mp3',
      'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav',
      'https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav',
      'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
      'https://www2.cs.uic.edu/~i101/SoundFiles/taunt.wav',
      'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
      'https://www2.cs.uic.edu/~i101/SoundFiles/gettysburg.wav'
    ];

    const thumbnailUrl = 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=500';

    // Get all audio entries that need updating
    const audioEntries = await db.query(
      `SELECT id FROM audio_content WHERE audio_url LIKE 'https://example.com%' ORDER BY id`
    );

    console.log(`Found ${audioEntries.rows.length} entries to update`);

    let updated = 0;
    for (let i = 0; i < audioEntries.rows.length; i++) {
      const audioId = audioEntries.rows[i].id;
      const urlIndex = i % audioUrls.length; // Cycle through available URLs

      await db.query(
        `UPDATE audio_content SET audio_url = $1, thumbnail_url = $2 WHERE id = $3`,
        [audioUrls[urlIndex], thumbnailUrl, audioId]
      );

      updated++;
    }

    console.log(`✅ Updated ${updated} audio entries with working test URLs`);
    console.log('\n⚠️  Note: These are test audio files for development.');
    console.log('In production, you should:');
    console.log('1. Upload your actual meditation/audio files to a hosting service (S3, Cloudflare R2, etc.)');
    console.log('2. Update the audio_url column with your real audio URLs');
    console.log('3. Upload proper thumbnail images and update thumbnail_url');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating audio URLs:', error);
    process.exit(1);
  }
}

// Run the update
updateAudioUrls();
