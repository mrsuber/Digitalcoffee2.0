import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { moodAPI } from '../services/api';

const MOOD_DATA = {
  clear: { emoji: '😌', label: 'Clear', color: '#0d9488' },
  calm: { emoji: '🧘', label: 'Calm', color: '#3b82f6' },
  tired: { emoji: '😤', label: 'Tired', color: '#f59e0b' },
  anxious: { emoji: '😨', label: 'Anxious', color: '#ef4444' },
  foggy: { emoji: '😴', label: 'Foggy', color: '#8b5cf6' },
};

const FOCUS_LEVELS = {
  low: { label: 'Low', color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#10b981' },
};

export const MoodHistoryScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMoodHistory();
  }, [selectedPeriod]);

  const loadMoodHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get different limits based on period
      const limit = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;

      const response = await moodAPI.getCheckins(limit);

      if (response.success) {
        // Transform backend data to match expected format
        const transformedData = response.data.map(checkin => ({
          date: new Date(checkin.created_at).toISOString().split('T')[0],
          mood: checkin.mood,
          focusLevel: checkin.focus_level,
          goal: checkin.daily_goal || 'No goal set',
          completed: true, // We can add completion tracking later
          emoji_rating: checkin.emoji_rating,
        }));

        setMoodHistory(transformedData);
      } else {
        setError('Failed to load mood history');
      }
    } catch (err) {
      console.error('Error loading mood history:', err);
      setError('Unable to load mood history');
      setMoodHistory([]); // Show empty state
    } finally {
      setLoading(false);
    }
  };

  // Calculate mood distribution
  const moodCounts = moodHistory.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const totalEntries = moodHistory.length;
  const mostCommonMood = totalEntries > 0
    ? Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b
      )
    : 'clear';

  // Calculate focus level distribution
  const focusCounts = moodHistory.reduce((acc, entry) => {
    acc[entry.focusLevel] = (acc[entry.focusLevel] || 0) + 1;
    return acc;
  }, {});

  // Calculate goal completion rate
  const completedGoals = moodHistory.filter((e) => e.completed).length;
  const completionRate = totalEntries > 0 ? Math.round((completedGoals / totalEntries) * 100) : 0;

  // Calculate current streak (consecutive days)
  const calculateStreak = () => {
    if (moodHistory.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const sortedHistory = [...moodHistory].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    for (let i = 0; i < sortedHistory.length; i++) {
      const checkDate = new Date(sortedHistory[i].date);
      checkDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - checkDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  const renderCalendar = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Create a map of dates to mood data
    const moodMap = {};
    moodHistory.forEach(entry => {
      moodMap[entry.date] = entry;
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    return (
      <View style={styles.calendar}>
        {/* Days of week header */}
        <View style={styles.calendarHeader}>
          {daysOfWeek.map((day) => (
            <Text key={day} style={styles.calendarDay}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {[...Array(35)].map((_, index) => {
            const dayNumber = index - firstDay + 1;
            const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
            const dateStr = isValidDay
              ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
              : null;
            const isToday = dateStr === today.toISOString().split('T')[0];
            const moodForDay = dateStr ? moodMap[dateStr] : null;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarCell,
                  isToday && styles.calendarCellToday,
                ]}
                activeOpacity={moodForDay ? 0.7 : 1}
                disabled={!isValidDay}
              >
                {isValidDay && (
                  <>
                    <Text style={styles.calendarCellDate}>{dayNumber}</Text>
                    {moodForDay && (
                      <Text style={styles.calendarCellEmoji}>
                        {MOOD_DATA[moodForDay.mood]?.emoji || '😌'}
                      </Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mood History</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'all'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>{MOOD_DATA[mostCommonMood].emoji}</Text>
              <Text style={styles.statLabel}>Most Common</Text>
              <Text style={styles.statValue}>{MOOD_DATA[mostCommonMood].label}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statLabel}>Goal Complete</Text>
              <Text style={styles.statValue}>{completionRate}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
              <Text style={styles.statValue}>{totalEntries}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statValue}>{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </View>

        {/* Mood Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Distribution</Text>
          <View style={styles.moodDistribution}>
            {Object.keys(moodCounts).map((moodKey) => {
              const percentage = Math.round((moodCounts[moodKey] / totalEntries) * 100);
              return (
                <View key={moodKey} style={styles.moodDistributionItem}>
                  <View style={styles.moodDistributionHeader}>
                    <View style={styles.moodDistributionLabel}>
                      <Text style={styles.moodDistributionEmoji}>
                        {MOOD_DATA[moodKey].emoji}
                      </Text>
                      <Text style={styles.moodDistributionText}>
                        {MOOD_DATA[moodKey].label}
                      </Text>
                    </View>
                    <Text style={styles.moodDistributionPercentage}>
                      {percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: MOOD_DATA[moodKey].color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Focus Levels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Levels</Text>
          <View style={styles.focusGrid}>
            {Object.keys(focusCounts).map((focusKey) => {
              const count = focusCounts[focusKey];
              const percentage = Math.round((count / totalEntries) * 100);
              return (
                <View key={focusKey} style={styles.focusCard}>
                  <View
                    style={[
                      styles.focusIndicator,
                      { backgroundColor: FOCUS_LEVELS[focusKey].color },
                    ]}
                  />
                  <Text style={styles.focusLabel}>
                    {FOCUS_LEVELS[focusKey].label}
                  </Text>
                  <Text style={styles.focusValue}>{percentage}%</Text>
                  <Text style={styles.focusCount}>{count} times</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Calendar View */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          {renderCalendar()}
        </View>

        {/* Recent Check-ins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.alpha} />
            </View>
          ) : moodHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>😌</Text>
              <Text style={styles.emptyStateText}>No mood check-ins yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tracking your mood to see your history here
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {moodHistory.slice(0, 5).map((entry, index) => (
                <View key={index} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyEmoji}>
                    {MOOD_DATA[entry.mood].emoji}
                  </Text>
                  <View>
                    <Text style={styles.historyDate}>{entry.date}</Text>
                    <Text style={styles.historyGoal}>{entry.goal}</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <View
                    style={[
                      styles.focusBadge,
                      { backgroundColor: FOCUS_LEVELS[entry.focusLevel].color + '30' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.focusBadgeText,
                        { color: FOCUS_LEVELS[entry.focusLevel].color },
                      ]}
                    >
                      {FOCUS_LEVELS[entry.focusLevel].label}
                    </Text>
                  </View>
                  {entry.completed && (
                    <Text style={styles.completedIcon}>✓</Text>
                  )}
                </View>
              </View>
            ))}
            </View>
          )}
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
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  periodButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: theme.colors.alpha,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  statValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  moodDistribution: {
    gap: theme.spacing.md,
  },
  moodDistributionItem: {
    gap: theme.spacing.xs,
  },
  moodDistributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodDistributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  moodDistributionEmoji: {
    fontSize: 20,
  },
  moodDistributionText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  moodDistributionPercentage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  focusGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  focusCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  focusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: theme.spacing.xs,
  },
  focusLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs / 2,
  },
  focusValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  focusCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  calendar: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  calendarDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xs / 2,
  },
  calendarCellToday: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderRadius: theme.borderRadius.sm,
  },
  calendarCellDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  calendarCellEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  historyList: {
    gap: theme.spacing.sm,
  },
  historyCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  historyEmoji: {
    fontSize: 32,
  },
  historyDate: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  historyGoal: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  focusBadge: {
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  focusBadgeText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
  },
  completedIcon: {
    fontSize: 20,
    color: theme.colors.alpha,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

export default MoodHistoryScreen;
