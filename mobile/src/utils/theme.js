// Digital Coffee - Theme Configuration
// Dark-mode control panel theme with deep blues, purples, and gradients

export const theme = {
  colors: {
    // Primary colors
    primary: '#0f172a',      // Deep blue background
    secondary: '#312e81',    // Dark purple
    accent: '#0d9488',       // Soft teal

    // Gradients
    gradientStart: '#0f172a',
    gradientMid: '#1e1b4b',
    gradientEnd: '#312e81',

    // Brain wave / pulse colors
    alpha: '#0d9488',       // Teal - calm focus
    beta: '#3b82f6',        // Blue - active thinking
    theta: '#8b5cf6',       // Purple - deep meditation
    delta: '#6366f1',       // Indigo - sleep
    gamma: '#ec4899',       // Pink - peak awareness

    // UI colors
    background: '#0a0e27',
    cardBackground: '#1a1f3a',
    border: '#2d3348',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',

    // Mood colors
    clear: '#60a5fa',      // Light blue
    tired: '#a78bfa',      // Purple
    anxious: '#f87171',    // Red
    foggy: '#94a3b8',      // Gray
    inspired: '#fbbf24',   // Gold
  },

  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 48,
    }
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 8,
    },
  }
};

export const brainwaveConfig = {
  alpha: {
    label: 'Alpha – Calm Focus',
    color: '#0d9488',
    frequency: '8-14 Hz',
    description: 'Ideal for relaxation and focus'
  },
  beta: {
    label: 'Beta – Active Thinking',
    color: '#3b82f6',
    frequency: '14-30 Hz',
    description: 'Active thinking and concentration'
  },
  theta: {
    label: 'Theta – Deep Meditation',
    color: '#8b5cf6',
    frequency: '4-8 Hz',
    description: 'Deep relaxation and meditation'
  },
  delta: {
    label: 'Delta – Deep Sleep',
    color: '#6366f1',
    frequency: '0.5-4 Hz',
    description: 'Deep sleep and healing'
  },
  gamma: {
    label: 'Gamma – Peak Awareness',
    color: '#ec4899',
    frequency: '30-100 Hz',
    description: 'High-level cognitive processing'
  }
};
