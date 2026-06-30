import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { professionalCoachesAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';

export const ProfessionalCoachesScreen = ({ navigation }) => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const { showAlert, AlertComponent } = useAlert();

  const specialties = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'anxiety', label: 'Anxiety', icon: '😌' },
    { id: 'stress', label: 'Stress', icon: '💆' },
    { id: 'focus', label: 'Focus', icon: '🎯' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'meditation', label: 'Meditation', icon: '🧘' },
    { id: 'performance', label: 'Performance', icon: '🚀' },
  ];

  useEffect(() => {
    loadCoaches();
  }, [selectedSpecialty]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const specialty = selectedSpecialty === 'all' ? null : selectedSpecialty;
      const response = await professionalCoachesAPI.getAll(specialty, null, 50);

      console.log('📊 Professional Coaches API Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Coaches loaded:', response.data?.length || 0);
        if (response.data && response.data.length > 0) {
          console.log('📝 First coach sample:', JSON.stringify(response.data[0], null, 2));
        }
        setCoaches(response.data || []);
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to load coaches',
        });
      }
    } catch (error) {
      console.error('❌ Error loading coaches:', error);
      console.error('Error details:', error.response?.data || error.message);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load coaches. Please try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCoaches();
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCoachCard = ({ item: coach }) => (
    <TouchableOpacity
      style={styles.coachCard}
      onPress={() => navigation.navigate('CoachProfile', { coachId: coach.id })}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(76, 29, 149, 0.2)', 'rgba(124, 58, 237, 0.05)']}
        style={styles.coachCardGradient}
      >
        <View style={styles.coachCardContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {coach.avatar_url ? (
              <Image
                source={{ uri: coach.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {coach.full_name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {(parseFloat(coach.rating) || 5.0).toFixed(1)}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{coach.full_name}</Text>
            <Text style={styles.coachCredentials} numberOfLines={1}>
              {coach.credentials || 'Professional Coach'}
            </Text>
            <Text style={styles.coachBio} numberOfLines={2}>
              {coach.bio}
            </Text>

            {/* Specialties */}
            <View style={styles.specialtiesContainer}>
              {coach.specialties?.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyTagText}>{specialty}</Text>
                </View>
              ))}
              {coach.specialties?.length > 3 && (
                <View style={styles.specialtyTag}>
                  <Text style={styles.specialtyTagText}>+{coach.specialties.length - 3}</Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{coach.total_students || 0}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{coach.years_experience || 0}</Text>
                <Text style={styles.statLabel}>Years Exp</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{coach.total_sessions_completed || 0}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>

            {/* Status */}
            {coach.is_accepting_students ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>✓ Accepting Students</Text>
              </View>
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Currently Full</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Text style={styles.arrowIcon}>→</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMid,
        theme.colors.gradientEnd,
      ]}
      style={styles.container}
    >
      <AlertComponent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Coaches</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Specialty Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={specialties}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedSpecialty === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSpecialty(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{item.icon}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  selectedSpecialty === item.id && styles.filterLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Coaches List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading coaches...</Text>
        </View>
      ) : filteredCoaches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No Coaches Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No coaches available for this specialty'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCoaches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCoachCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
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
  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    paddingRight: 50,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
    fontSize: 20,
  },
  filtersContainer: {
    marginBottom: theme.spacing.md,
  },
  filtersList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.alpha,
    borderColor: theme.colors.alpha,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  filterLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  coachCard: {
    marginBottom: theme.spacing.md,
  },
  coachCardGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachCardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.alpha,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.alpha,
  },
  ratingText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  coachCredentials: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  coachBio: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  specialtyTag: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  specialtyTagText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },
  availableBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  availableText: {
    fontSize: theme.fonts.sizes.xs,
    color: '#10b981',
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  unavailableText: {
    fontSize: theme.fonts.sizes.xs,
    color: '#ef4444',
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProfessionalCoachesScreen;
