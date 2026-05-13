import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const FILTER_TABS = ['All', 'Focus', 'Calm', 'Inspire'];

const FEATURED_COURSES = [
  {
    id: '1',
    title: 'Beat Overthinking',
    sessions: 5,
    image: require('../../assets/hyper-focus.png'),
    category: 'Focus',
  },
  {
    id: '2',
    title: 'Inner Peace Reset',
    sessions: 4,
    image: require('../../assets/calm.png'),
    category: 'Calm',
  },
  {
    id: '3',
    title: 'Morning Mind Mastery',
    sessions: 3,
    image: require('../../assets/infinite-inspiration.png'),
    category: 'Inspire',
  },
];

const LIBRARY_SECTIONS = [
  {
    id: 'courses',
    icon: '📚',
    title: 'All Courses',
    description: '12 programs to transform your mind',
    screen: 'Courses',
    gradient: ['#4c1d95', '#7c3aed'],
  },
  {
    id: 'audio',
    icon: '🎵',
    title: 'Audio Library',
    description: 'Binaural beats, guided talks & affirmations',
    screen: 'AudioLibrary',
    gradient: ['#0d9488', '#14b8a6'],
  },
  {
    id: 'insights',
    icon: '🧠',
    title: 'Brainwave Insights',
    description: 'Learn about frequencies & mental states',
    screen: 'BrainwaveInsights',
    gradient: ['#3b82f6', '#60a5fa'],
  },
  {
    id: 'journal',
    icon: '📖',
    title: 'Mind Journal',
    description: 'Record thoughts, track moods & reflect',
    screen: 'Journal',
    gradient: ['#8b5cf6', '#a78bfa'],
  },
];

export const LibraryScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('All');

  const filteredCourses =
    selectedTab === 'All'
      ? FEATURED_COURSES
      : FEATURED_COURSES.filter((course) => course.category === selectedTab);

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
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSubtitle}>
            Explore courses, audio content & insights
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContent}
          >
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  selectedTab === tab && styles.filterTabActive,
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedTab === tab && styles.filterTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Featured Courses</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredCoursesContent}
          >
            {filteredCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.featuredCourseCard}
                onPress={() =>
                  navigation.navigate('CourseDetail', { courseId: course.id })
                }
                activeOpacity={0.8}
              >
                <Image source={course.image} style={styles.featuredCourseImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                  style={styles.featuredCourseGradient}
                >
                  <Text style={styles.featuredCourseTitle}>{course.title}</Text>
                  <Text style={styles.featuredCourseSessions}>
                    {course.sessions} Sessions
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Library Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.librarySectionsContainer}>
            {LIBRARY_SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.librarySectionCard}
                onPress={() => navigation.navigate(section.screen)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={section.gradient}
                  style={styles.librarySectionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.librarySectionEmoji}>{section.icon}</Text>
                </LinearGradient>
                <View style={styles.librarySectionContent}>
                  <Text style={styles.librarySectionTitle}>{section.title}</Text>
                  <Text style={styles.librarySectionDescription}>
                    {section.description}
                  </Text>
                </View>
                <Text style={styles.librarySectionArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Courses Enrolled</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Sessions Complete</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8h</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
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
  filterTabs: {
    marginBottom: theme.spacing.xl,
  },
  filterTabsContent: {
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  filterTabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: theme.colors.alpha,
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
  featuredCoursesContent: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  featuredCourseCard: {
    width: 200,
    height: 240,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
  },
  featuredCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredCourseGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  featuredCourseTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  featuredCourseSessions: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  librarySectionsContainer: {
    gap: theme.spacing.md,
  },
  librarySectionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  librarySectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  librarySectionEmoji: {
    fontSize: 28,
  },
  librarySectionContent: {
    flex: 1,
  },
  librarySectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  librarySectionDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  librarySectionArrow: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
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
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default LibraryScreen;
