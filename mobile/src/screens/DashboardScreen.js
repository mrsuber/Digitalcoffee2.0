import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMid,
        theme.colors.gradientEnd,
      ]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning, Alex</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brainContainer}>
          <BrainPulse size={200} pulseSpeed={1800} />
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>How do you feel this morning?</Text>
          <View style={styles.moodButtons}>
            <TouchableOpacity style={styles.moodButton}>
              <Text style={styles.moodEmoji}>☀️</Text>
              <Text style={styles.moodLabel}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodButton}>
              <Text style={styles.moodEmoji}>🌙</Text>
              <Text style={styles.moodLabel}>Tired</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodButton}>
              <Text style={styles.moodEmoji}>⛈️</Text>
              <Text style={styles.moodLabel}>Anxious</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sessionCard}>
          <Text style={styles.cardTitle}>Today's Focus</Text>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Rewire Your Focus</Text>
            <Text style={styles.sessionDetails}>
              15 min guided talk{'\n'}+ 5 min focus-sprint
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <LinearGradient
              colors={[theme.colors.alpha, theme.colors.theta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playGradient}
            >
              <Text style={styles.playIcon}>▶</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.brainwaveCard}>
          <Text style={styles.cardTitle}>Brainwave</Text>
          <Text style={styles.brainwaveType}>Alpha State</Text>
          <Text style={styles.brainwaveFreq}>8.6 Hz</Text>

          {/* Simple waveform visualization */}
          <View style={styles.waveform}>
            {[...Array(20)].map((_, i) => {
              const height = Math.sin(i * 0.5) * 20 + 30;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: height,
                      backgroundColor: theme.colors.alpha,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  brainContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  moodSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
  },
  sessionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionInfo: {
    marginBottom: theme.spacing.md,
  },
  sessionTitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  sessionDetails: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  playButton: {
    alignSelf: 'flex-start',
  },
  playGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: theme.colors.text,
    marginLeft: 3,
  },
  brainwaveCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  brainwaveType: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  brainwaveFreq: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.alpha,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
});

export default DashboardScreen;
