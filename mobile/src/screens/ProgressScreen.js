import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { progressAPI } from '../services/api';

const { width } = Dimensions.get('window');

const TIME_RANGES = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Year', days: 365 },
  { label: 'All Time', days: 9999 },
];

export const ProgressScreen = ({ navigation }) => {
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[0]);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({
    totals: {
      total_sessions: 0,
      total_minutes: 0,
      average_mood: 0,
      focus_score: 0,
    },
    streaks: {
      current_streak: 0,
      longest_streak: 0,
    },
    courses: {
      courses_completed: 0,
      courses_in_progress: 0,
    },
    weekly_activity: [],
    mood_trends: [],
  });

  useEffect(() => {
    loadProgressData();
  }, [selectedRange]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getStats(selectedRange.days);
      if (response.success) {
        setProgressData(response.data);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const maxSessions = progressData.weekly_activity.length > 0
    ? Math.max(...progressData.weekly_activity.map((d) => d.sessions || 0))
    : 1;

  if (loading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.colors.gradientMid,
          theme.colors.gradientEnd,
        ]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </LinearGradient>
    );
  }

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSubtitle}>Track your journey to mastery</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeRangeContent}
          >
            {TIME_RANGES.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.timeRangeChip,
                  selectedRange.label === range.label && styles.timeRangeChipActive,
                ]}
                onPress={() => setSelectedRange(range)}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    selectedRange.label === range.label && styles.timeRangeTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Key Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4c1d95', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <Text style={styles.statIcon}>🔥</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{progressData.streaks.current_streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <Text style={styles.statIcon}>⏱️</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{formatTime(progressData.totals.total_minutes)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3b82f6', '#60a5fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <Text style={styles.statIcon}>📚</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{progressData.totals.total_sessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <Text style={styles.statIcon}>🎯</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{progressData.totals.focus_score}%</Text>
            <Text style={styles.statLabel}>Focus Score</Text>
          </View>
        </View>

        {/* Weekly Goal */}
        {selectedRange.label === 'Week' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Goal</Text>
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalText}>
                  {progressData.totals.total_sessions} of 5 sessions
                </Text>
                <Text style={styles.goalPercentage}>
                  {Math.min(Math.round((progressData.totals.total_sessions / 5) * 100), 100)}%
                </Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View
                  style={[
                    styles.goalProgressFill,
                    {
                      width: `${Math.min((progressData.totals.total_sessions / 5) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.goalSubtext}>
                {progressData.totals.total_sessions >= 5
                  ? 'Goal achieved! 🎉'
                  : `${5 - progressData.totals.total_sessions} sessions to go`}
              </Text>
            </View>
          </View>
        )}

        {/* Weekly Activity Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedRange.label === 'Week' ? 'Weekly Activity' : 'Recent Activity'}
          </Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {progressData.weekly_activity.map((day, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: day.sessions > 0 ? `${(day.sessions / maxSessions) * 100}%` : 8,
                          backgroundColor:
                            day.sessions > 0 ? theme.colors.alpha : 'rgba(255, 255, 255, 0.1)',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.chartLegendText}>Sessions per day</Text>
            </View>
          </View>
        </View>

        {/* Mood Trends */}
        {progressData.mood_trends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Trends</Text>
            <View style={styles.moodCard}>
              <View style={styles.moodChart}>
                {progressData.mood_trends.map((item, index) => (
                  <View key={index} style={styles.moodPoint}>
                    <View
                      style={[
                        styles.moodDot,
                        {
                          width: 8 + (item.mood || 0) * 2,
                          height: 8 + (item.mood || 0) * 2,
                          opacity: 0.4 + (item.mood || 0) * 0.12,
                        },
                      ]}
                    />
                    <Text style={styles.moodDate}>{item.date}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.moodAverage}>
                <Text style={styles.moodAverageLabel}>Average Mood</Text>
                <Text style={styles.moodAverageValue}>
                  {progressData.totals.average_mood.toFixed(1)}/5.0
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Course Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Progress</Text>
          <View style={styles.courseProgressCard}>
            <View style={styles.courseProgressRow}>
              <View style={styles.courseProgressItem}>
                <Text style={styles.courseProgressValue}>
                  {progressData.courses.courses_completed}
                </Text>
                <Text style={styles.courseProgressLabel}>Completed</Text>
              </View>
              <View style={styles.courseProgressDivider} />
              <View style={styles.courseProgressItem}>
                <Text style={styles.courseProgressValue}>
                  {progressData.courses.courses_in_progress}
                </Text>
                <Text style={styles.courseProgressLabel}>In Progress</Text>
              </View>
              <View style={styles.courseProgressDivider} />
              <View style={styles.courseProgressItem}>
                <Text style={styles.courseProgressValue}>
                  {progressData.courses.courses_completed + progressData.courses.courses_in_progress}
                </Text>
                <Text style={styles.courseProgressLabel}>Total Enrolled</Text>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  timeRangeSection: {
    marginBottom: theme.spacing.xl,
  },
  timeRangeContent: {
    gap: theme.spacing.sm,
  },
  timeRangeChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeRangeChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  timeRangeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: theme.colors.alpha,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  goalCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  goalText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 4,
  },
  goalSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  chartCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: theme.spacing.md,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    height: '80%',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  chartLegend: {
    alignItems: 'center',
  },
  chartLegendText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  moodCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  moodPoint: {
    alignItems: 'center',
  },
  moodDot: {
    backgroundColor: theme.colors.alpha,
    borderRadius: 100,
    marginBottom: theme.spacing.xs / 2,
  },
  moodDate: {
    fontSize: theme.fonts.sizes.xs - 2,
    color: theme.colors.textSecondary,
  },
  moodAverage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  moodAverageLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  moodAverageValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  milestonesContainer: {
    gap: theme.spacing.sm,
  },
  milestoneCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  milestoneCardCompleted: {
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  milestoneIconContainer: {
    marginRight: theme.spacing.md,
  },
  milestoneIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIconText: {
    fontSize: 24,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  milestoneTitleLocked: {
    color: theme.colors.textSecondary,
  },
  milestoneDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  milestoneDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    marginTop: theme.spacing.xs / 2,
  },
  courseProgressCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  courseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  courseProgressItem: {
    alignItems: 'center',
  },
  courseProgressValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  courseProgressLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  courseProgressDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ProgressScreen;
