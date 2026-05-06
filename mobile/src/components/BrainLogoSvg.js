import React from 'react';
import Svg, {
  Circle,
  Path,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export const BrainLogoSvg = ({ size = 200, color1 = '#0d9488', color2 = '#9333ea', color3 = '#ec4899' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        {/* Gradient for brain */}
        <LinearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color1} stopOpacity="1" />
          <Stop offset="50%" stopColor={color2} stopOpacity="1" />
          <Stop offset="100%" stopColor={color3} stopOpacity="1" />
        </LinearGradient>

        {/* Outer ring gradient */}
        <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </LinearGradient>
      </Defs>

      {/* Outer glow ring */}
      <Circle
        cx="100"
        cy="100"
        r="95"
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Brain outline - simplified stylized brain */}
      <G>
        {/* Left hemisphere */}
        <Path
          d="M 70 60 Q 50 65, 45 80 Q 42 95, 48 110 Q 52 125, 62 135 Q 72 145, 85 148 Q 85 140, 85 130 Q 83 115, 80 100 Q 77 85, 75 70 Q 73 62, 70 60 Z"
          fill="url(#brainGradient)"
          opacity="0.9"
        />

        {/* Right hemisphere */}
        <Path
          d="M 130 60 Q 150 65, 155 80 Q 158 95, 152 110 Q 148 125, 138 135 Q 128 145, 115 148 Q 115 140, 115 130 Q 117 115, 120 100 Q 123 85, 125 70 Q 127 62, 130 60 Z"
          fill="url(#brainGradient)"
          opacity="0.9"
        />

        {/* Center connection corpus callosum */}
        <Ellipse
          cx="100"
          cy="100"
          rx="15"
          ry="45"
          fill="url(#brainGradient)"
          opacity="0.7"
        />

        {/* Brain folds/details - left */}
        <Path
          d="M 55 75 Q 60 80, 55 85"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 58 90 Q 63 95, 58 100"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 62 105 Q 67 110, 62 115"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />

        {/* Brain folds/details - right */}
        <Path
          d="M 145 75 Q 140 80, 145 85"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 142 90 Q 137 95, 142 100"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 138 105 Q 133 110, 138 115"
          stroke={color2}
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </G>

      {/* Waveform through brain center */}
      <G>
        <Path
          d="M 30 100 L 45 100 L 55 85 L 65 115 L 75 90 L 85 110 L 100 100 L 115 90 L 125 110 L 135 85 L 145 115 L 155 100 L 170 100"
          stroke="#06b6d4"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
      </G>

      {/* Center glow point */}
      <Circle cx="100" cy="100" r="8" fill="#ffffff" opacity="0.8" />
    </Svg>
  );
};

export default BrainLogoSvg;
