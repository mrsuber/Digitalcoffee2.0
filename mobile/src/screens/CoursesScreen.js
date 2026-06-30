import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../utils/theme';
import { courseAPI } from '../services/api';

const { width } = Dimensions.get('window');

const COURSE_CATEGORIES = ['All', 'Focus', 'Calm', 'Sleep', 'Inspire'];

// Image mapping for course modes
const COURSE_IMAGES = {
  'hyper-focus': require('../../assets/course-overthinking.jpg'),
  'calm-down': require('../../assets/course-peace.jpg'),
  'infinite-inspiration': require('../../assets/course-inspiration.jpg'),
  'sleep': require('../../assets/course-sleep.jpg'),
  'anxiety': require('../../assets/course-anxiety.jpg'),
  'performance': require('../../assets/course-performance.jpg'),
};

// Map backend mode to category
const MODE_TO_CATEGORY = {
  'hyper-focus': 'Focus',
  'calm-down': 'Calm',
  'infinite-inspiration': 'Inspire',
};

export const CoursesScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enrolledCourseName, setEnrolledCourseName] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all courses and enrolled courses in parallel
      const [allCoursesRes, enrolledRes] = await Promise.all([
        courseAPI.getAllCourses(),
        courseAPI.getEnrolled().catch(() => ({ success: true, data: [] })), // Handle if user not logged in
      ]);

      if (allCoursesRes.success) {
        // Transform backend data to match our UI needs
        const transformedCourses = allCoursesRes.data.map((course) => {
          const category = MODE_TO_CATEGORY[course.mode] || 'Inspire';
          const imageKey = course.mode || 'hyper-focus';

          return {
            id: course.id.toString(),
            title: course.title,
            description: course.description,
            sessions: course.session_count || 0,
            duration: `${course.duration_days} days`,
            level: 'Beginner', // Default level
            image: COURSE_IMAGES[imageKey] || COURSE_IMAGES['hyper-focus'],
            category,
            mode: course.mode,
          };
        });

        setAllCourses(transformedCourses);

        // Track which courses are enrolled
        if (enrolledRes.success && enrolledRes.data) {
          const enrolledIds = new Set(enrolledRes.data.map((c) => c.id.toString()));
          setEnrolledCourseIds(enrolledIds);
        }
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const course = allCourses.find(c => c.id === courseId);
      const response = await courseAPI.enroll(courseId);
      if (response.success) {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
        setEnrolledCourseName(course?.title || 'course');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2500);
      }
    } catch (err) {
      console.error('Error enrolling:', err);
    }
  };

  const filteredCourses =
    selectedCategory === 'All'
      ? allCourses
      : allCourses.filter((course) => course.category === selectedCategory);

  const enrolledCourses = allCourses.filter((course) =>
    enrolledCourseIds.has(course.id)
  );
  const availableCourses = allCourses.filter(
    (course) => !enrolledCourseIds.has(course.id)
  );

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return theme.colors.alpha;
      case 'Intermediate':
        return '#f59e0b';
      case 'Advanced':
        return '#ef4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderCourseCard = (course) => {
    const isEnrolled = enrolledCourseIds.has(course.id);
    const progress = 0; // TODO: Get actual progress from backend

    return (
      <TouchableOpacity
        key={course.id}
        style={styles.courseCard}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
        activeOpacity={0.8}
      >
        <View style={styles.courseImageContainer}>
          <Image source={course.image} style={styles.courseImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
            style={styles.courseImageGradient}
          />
          {isEnrolled && progress > 0 && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progress}%</Text>
            </View>
          )}
        </View>

        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.courseMeta}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: `${getLevelColor(course.level)}20` },
                ]}
              >
                <Text style={[styles.levelText, { color: getLevelColor(course.level) }]}>
                  {course.level}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>

          <View style={styles.courseFooter}>
            <View style={styles.courseStats}>
              <Text style={styles.courseStatText}>{course.sessions} Sessions</Text>
              <Text style={styles.courseDivider}>•</Text>
              <Text style={styles.courseStatText}>{course.duration}</Text>
            </View>

            {isEnrolled ? (
              progress > 0 ? (
                <TouchableOpacity style={styles.continueButton}>
                  <LinearGradient
                    colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButtonGradient}
                  >
                    <Text style={styles.continueButtonText}>Continue →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.startButton}>
                  <LinearGradient
                    colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startButtonGradient}
                  >
                    <Text style={styles.startButtonText}>Start Course</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEnroll(course.id);
                }}
              >
                <Text style={styles.enrollButtonText}>Enroll</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEnrolled && progress > 0 && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.colors.gradientMid,
          theme.colors.gradientEnd,
        ]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" color={theme.colors.alpha} />
        <Text style={[styles.headerSubtitle, { marginTop: theme.spacing.md }]}>
          Loading courses...
        </Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.colors.gradientMid,
          theme.colors.gradientEnd,
        ]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }]}
      >
        <Text style={[styles.headerTitle, { marginBottom: theme.spacing.sm, textAlign: 'center' }]}>
          Oops!
        </Text>
        <Text style={[styles.headerSubtitle, { marginBottom: theme.spacing.lg, textAlign: 'center' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.enrollButton}
          onPress={loadCourses}
        >
          <Text style={styles.enrollButtonText}>Retry</Text>
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Courses</Text>
          <Text style={styles.headerSubtitle}>
            Transform your mind with guided programs
          </Text>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {COURSE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* My Courses Section */}
        {enrolledCourses.length > 0 && selectedCategory === 'All' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            {enrolledCourses.map(renderCourseCard)}
          </View>
        )}

        {/* Available Courses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Explore More' : `${selectedCategory} Courses`}
          </Text>
          {filteredCourses
            .filter((course) => selectedCategory === 'All' ? !course.enrolled : true)
            .map(renderCourseCard)}
        </View>

        {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No courses found</Text>
            <Text style={styles.emptyStateText}>
              Try selecting a different category
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <BlurView intensity={10} style={styles.blurView}>
            <TouchableOpacity
              style={styles.successModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowSuccessModal(false)}
            />
          </BlurView>
          <View style={styles.successModalContainer}>
            <LinearGradient
              colors={['rgba(13, 148, 136, 0.98)', 'rgba(6, 95, 70, 0.98)']}
              style={styles.successModalContent}
            >
              <View style={styles.successIconCircle}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.successIconInner}
                >
                  <Text style={styles.successIconText}>✓</Text>
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>Successfully Enrolled!</Text>
              <Text style={styles.successMessage}>
                Welcome to {enrolledCourseName}
              </Text>
              <View style={styles.successIndicator}>
                <View style={[styles.successDot, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} />
                <View style={[styles.successDot, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]} />
                <View style={[styles.successDot, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  categorySection: {
    marginBottom: theme.spacing.xl,
  },
  categoryScrollContent: {
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  categoryChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
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
  courseCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  courseImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  courseImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  progressBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  progressBadgeText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  courseContent: {
    padding: theme.spacing.md,
  },
  courseHeader: {
    marginBottom: theme.spacing.xs,
  },
  courseTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  levelBadge: {
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  levelText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  courseStatText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  courseDivider: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  continueButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  continueButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  startButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  startButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  enrollButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.alpha,
  },
  enrollButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: theme.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  successModalContainer: {
    width: width - 80,
    maxWidth: 360,
  },
  successModalContent: {
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.6)',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  successIconInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 45,
  },
  successIconText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  successTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: theme.fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  successIndicator: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CoursesScreen;
