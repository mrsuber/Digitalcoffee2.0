-- Seed Professional Coaches with complete data
-- This will update existing coaches and add more

-- Update existing coaches with complete information
UPDATE professional_coaches SET
    bio = 'Dr. Sarah Mitchell is a licensed clinical psychologist with over 15 years of experience helping individuals overcome anxiety and stress. She specializes in mindfulness-based cognitive therapy and has helped thousands of clients achieve mental clarity and emotional balance.',
    avatar_url = 'https://i.pravatar.cc/300?img=47',
    years_experience = 15,
    rating = 4.9,
    total_students = 234,
    total_sessions_completed = 1250,
    hourly_rate = 0.00,
    certifications = '[
        {"name": "Licensed Clinical Psychologist", "issuer": "American Psychological Association", "year": 2008},
        {"name": "Mindfulness-Based Stress Reduction", "issuer": "University of Massachusetts", "year": 2010},
        {"name": "Cognitive Behavioral Therapy Specialist", "issuer": "Beck Institute", "year": 2012}
    ]'::jsonb,
    credentials = 'Ph.D. in Clinical Psychology, Licensed Psychologist (CA), MBSR Certified Teacher',
    availability = '{
        "monday": ["09:00-12:00", "14:00-18:00"],
        "tuesday": ["09:00-12:00", "14:00-18:00"],
        "wednesday": ["09:00-12:00", "14:00-18:00"],
        "thursday": ["09:00-12:00", "14:00-18:00"],
        "friday": ["09:00-15:00"]
    }'::jsonb,
    timezone = 'America/Los_Angeles',
    languages = ARRAY['English', 'Spanish']
WHERE id = 1;

UPDATE professional_coaches SET
    bio = 'Michael Chen is a high-performance coach who has worked with Fortune 500 executives, entrepreneurs, and peak performers. His focus-based coaching methodology has been featured in Forbes and Harvard Business Review. He combines neuroscience, behavioral psychology, and mindfulness to help clients achieve extraordinary results.',
    avatar_url = 'https://i.pravatar.cc/300?img=12',
    years_experience = 12,
    rating = 4.95,
    total_students = 187,
    total_sessions_completed = 980,
    hourly_rate = 0.00,
    certifications = '[
        {"name": "Certified Executive Coach", "issuer": "International Coach Federation (ICF)", "year": 2011},
        {"name": "Neuroscience of Leadership", "issuer": "NeuroLeadership Institute", "year": 2015},
        {"name": "Peak Performance Specialist", "issuer": "High Performance Institute", "year": 2013}
    ]'::jsonb,
    credentials = 'ICF-PCC, MBA Stanford, Neuroscience Certificate',
    availability = '{
        "monday": ["06:00-09:00", "18:00-21:00"],
        "tuesday": ["06:00-09:00", "18:00-21:00"],
        "wednesday": ["06:00-09:00", "18:00-21:00"],
        "thursday": ["06:00-09:00", "18:00-21:00"],
        "friday": ["06:00-09:00"],
        "saturday": ["08:00-12:00"]
    }'::jsonb,
    timezone = 'America/New_York',
    languages = ARRAY['English', 'Mandarin']
WHERE id = 2;

UPDATE professional_coaches SET
    bio = 'Emma Rodriguez is a sleep medicine specialist and wellness coach with a passion for helping people achieve restorative sleep and optimal health. She combines evidence-based sleep science with holistic wellness practices. Her gentle, compassionate approach has helped hundreds of clients overcome insomnia and sleep disorders.',
    avatar_url = 'https://i.pravatar.cc/300?img=38',
    years_experience = 10,
    rating = 4.85,
    total_students = 156,
    total_sessions_completed = 890,
    hourly_rate = 0.00,
    certifications = '[
        {"name": "Board Certified Sleep Specialist", "issuer": "American Board of Sleep Medicine", "year": 2013},
        {"name": "Certified Health Coach", "issuer": "National Board for Health & Wellness Coaching", "year": 2014},
        {"name": "Yoga & Meditation Instructor", "issuer": "Yoga Alliance", "year": 2012}
    ]'::jsonb,
    credentials = 'M.S. Sleep Medicine, NBC-HWC, RYT-500',
    availability = '{
        "monday": ["10:00-14:00", "16:00-20:00"],
        "tuesday": ["10:00-14:00", "16:00-20:00"],
        "wednesday": ["10:00-14:00"],
        "thursday": ["10:00-14:00", "16:00-20:00"],
        "friday": ["10:00-14:00", "16:00-20:00"],
        "sunday": ["14:00-18:00"]
    }'::jsonb,
    timezone = 'America/Chicago',
    languages = ARRAY['English', 'Spanish', 'Portuguese']
WHERE id = 3;

-- Add more professional coaches
INSERT INTO professional_coaches (
    full_name, email, bio, avatar_url, specialties, certifications,
    years_experience, rating, total_students, total_sessions_completed,
    hourly_rate, languages, timezone, availability, credentials,
    is_active, is_accepting_students, max_students
) VALUES
(
    'Dr. James Thompson',
    'james.thompson@digitalcoffee.coaches',
    'Dr. Thompson specializes in trauma-informed therapy and PTSD treatment using EMDR and somatic experiencing. He has extensive experience working with veterans, first responders, and trauma survivors. His compassionate, patient-centered approach creates a safe space for healing and recovery.',
    'https://i.pravatar.cc/300?img=33',
    ARRAY['trauma', 'PTSD', 'EMDR', 'anxiety'],
    '[
        {"name": "EMDR Certified Therapist", "issuer": "EMDR International Association", "year": 2009},
        {"name": "Somatic Experiencing Practitioner", "issuer": "SE Trauma Institute", "year": 2011},
        {"name": "Licensed Clinical Social Worker", "issuer": "State Board", "year": 2005}
    ]'::jsonb,
    18,
    4.92,
    298,
    1580,
    0.00,
    ARRAY['English'],
    'America/Denver',
    '{
        "tuesday": ["08:00-16:00"],
        "wednesday": ["08:00-16:00"],
        "thursday": ["08:00-16:00"],
        "friday": ["08:00-14:00"]
    }'::jsonb,
    'Ph.D. Clinical Psychology, LCSW, EMDR Certified',
    true,
    true,
    50
),
(
    'Lisa Patel',
    'lisa.patel@digitalcoffee.coaches',
    'Lisa is a mindfulness and meditation expert who has studied with renowned teachers in India and Thailand. She brings ancient wisdom into modern life, helping busy professionals find peace, clarity, and purpose. Her practical approach makes meditation accessible to everyone, regardless of experience level.',
    'https://i.pravatar.cc/300?img=49',
    ARRAY['meditation', 'mindfulness', 'spirituality', 'stress'],
    '[
        {"name": "Certified Meditation Teacher", "issuer": "The Chopra Center", "year": 2010},
        {"name": "Mindful Schools Curriculum Training", "issuer": "Mindful Schools", "year": 2012},
        {"name": "Vipassana Meditation Teacher", "issuer": "Spirit Rock Meditation Center", "year": 2015}
    ]'::jsonb,
    14,
    4.88,
    412,
    2100,
    0.00,
    ARRAY['English', 'Hindi', 'Gujarati'],
    'America/Los_Angeles',
    '{
        "monday": ["07:00-11:00", "17:00-20:00"],
        "tuesday": ["07:00-11:00", "17:00-20:00"],
        "wednesday": ["07:00-11:00", "17:00-20:00"],
        "thursday": ["07:00-11:00", "17:00-20:00"],
        "friday": ["07:00-11:00"],
        "saturday": ["08:00-12:00"],
        "sunday": ["08:00-12:00"]
    }'::jsonb,
    'M.A. Contemplative Psychology, Certified Meditation Teacher',
    true,
    true,
    75
),
(
    'David Park',
    'david.park@digitalcoffee.coaches',
    'David specializes in helping students and young professionals overcome academic stress, test anxiety, and imposter syndrome. As a former Wall Street analyst turned mindfulness coach, he understands the pressures of high-stakes environments and provides practical tools for success without burnout.',
    'https://i.pravatar.cc/300?img=15',
    ARRAY['academic_stress', 'test_anxiety', 'student_wellness', 'career'],
    '[
        {"name": "Academic Success Coach", "issuer": "International Association of Coaching", "year": 2014},
        {"name": "Mindfulness-Based Stress Reduction", "issuer": "UMass Medical School", "year": 2016},
        {"name": "Positive Psychology Coach", "issuer": "Wholebeing Institute", "year": 2015}
    ]'::jsonb,
    8,
    4.87,
    203,
    1050,
    0.00,
    ARRAY['English', 'Korean'],
    'America/New_York',
    '{
        "monday": ["16:00-21:00"],
        "tuesday": ["16:00-21:00"],
        "wednesday": ["16:00-21:00"],
        "thursday": ["16:00-21:00"],
        "friday": ["16:00-20:00"],
        "saturday": ["10:00-16:00"]
    }'::jsonb,
    'MBA Wharton, Certified Academic Coach, MBSR Teacher',
    true,
    true,
    40
);

-- Update total coach count for stats
COMMENT ON TABLE professional_coaches IS 'Professional certified coaches available for premium members ($0 during testing phase)';
