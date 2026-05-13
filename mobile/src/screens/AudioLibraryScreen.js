import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const TYPE_FILTERS = ['All', 'Binaural Beats', 'Guided', 'Affirmations', 'Meditation'];

const BRAINWAVE_FILTERS = [
  { id: 'all', label: 'All', color: '#ffffff' },
  { id: 'alpha', label: 'Alpha', color: '#0d9488', frequency: '8-12 Hz' },
  { id: 'beta', label: 'Beta', color: '#3b82f6', frequency: '12-30 Hz' },
  { id: 'theta', label: 'Theta', color: '#8b5cf6', frequency: '4-8 Hz' },
  { id: 'delta', label: 'Delta', color: '#6366f1', frequency: '0.5-4 Hz' },
  { id: 'gamma', label: 'Gamma', color: '#ec4899', frequency: '30+ Hz' },
];

const AUDIO_CONTENT = [
  {
    id: '1',
    title: 'Rewire Your Focus',
    type: 'Guided Talk',
    duration: '15 min',
    brainwave: 'alpha',
    frequency: '8.6 Hz',
    plays: 1234,
    liked: false,
  },
  {
    id: '2',
    title: 'Alpha Waves - Deep Focus',
    type: 'Binaural Beats',
    duration: '30 min',
    brainwave: 'alpha',
    frequency: '10 Hz',
    plays: 2456,
    liked: true,
  },
  {
    id: '3',
    title: 'Beta Boost - Active Thinking',
    type: 'Binaural Beats',
    duration: '20 min',
    brainwave: 'beta',
    frequency: '18 Hz',
    plays: 987,
    liked: false,
  },
  {
    id: '4',
    title: 'Theta Dreams - Creativity',
    type: 'Binaural Beats',
    duration: '25 min',
    brainwave: 'theta',
    frequency: '6 Hz',
    plays: 1567,
    liked: false,
  },
  {
    id: '5',
    title: 'Morning Affirmations',
    type: 'Affirmations',
    duration: '10 min',
    brainwave: 'alpha',
    frequency: '9 Hz',
    plays: 3421,
    liked: true,
  },
  {
    id: '6',
    title: 'Delta Sleep - Deep Rest',
    type: 'Binaural Beats',
    duration: '45 min',
    brainwave: 'delta',
    frequency: '2 Hz',
    plays: 5678,
    liked: false,
  },
  {
    id: '7',
    title: 'Gamma Peak - Awareness',
    type: 'Binaural Beats',
    duration: '15 min',
    brainwave: 'gamma',
    frequency: '40 Hz',
    plays: 876,
    liked: false,
  },
  {
    id: '8',
    title: 'Guided Body Scan',
    type: 'Meditation',
    duration: '20 min',
    brainwave: 'theta',
    frequency: '5 Hz',
    plays: 2109,
    liked: false,
  },
];

export const AudioLibraryScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrainwave, setSelectedBrainwave] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedAudios, setLikedAudios] = useState(
    AUDIO_CONTENT.filter((a) => a.liked).map((a) => a.id)
  );

  const filteredContent = AUDIO_CONTENT.filter((audio) => {
    const matchesType =
      selectedType === 'All' || audio.type === selectedType;
    const matchesBrainwave =
      selectedBrainwave === 'all' || audio.brainwave === selectedBrainwave;
    const matchesSearch =
      searchQuery === '' ||
      audio.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesBrainwave && matchesSearch;
  });

  const toggleLike = (audioId) => {
    setLikedAudios((prev) =>
      prev.includes(audioId)
        ? prev.filter((id) => id !== audioId)
        : [...prev, audioId]
    );
  };

  const handlePlayAudio = (audio) => {
    navigation.navigate('Focus', {
      screen: 'AudioPlayer',
      params: { audioId: audio.id },
    });
  };

  const getBrainwaveColor = (brainwave) => {
    return BRAINWAVE_FILTERS.find((f) => f.id === brainwave)?.color || '#ffffff';
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
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audio Library</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search audio..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Type Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFiltersContent}
          >
            {TYPE_FILTERS.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeFilterChip,
                  selectedType === type && styles.typeFilterChipActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.typeFilterText,
                    selectedType === type && styles.typeFilterTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Brainwave Filters */}
          <View style={styles.brainwaveFiltersContainer}>
            <Text style={styles.filterLabel}>Brainwave Frequency</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brainwaveFiltersContent}
            >
              {BRAINWAVE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.brainwaveChip,
                    selectedBrainwave === filter.id && styles.brainwaveChipActive,
                    selectedBrainwave === filter.id && {
                      borderColor: filter.color,
                    },
                  ]}
                  onPress={() => setSelectedBrainwave(filter.id)}
                >
                  <View
                    style={[
                      styles.brainwaveChipDot,
                      { backgroundColor: filter.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.brainwaveChipText,
                      selectedBrainwave === filter.id && styles.brainwaveChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {filter.frequency && (
                    <Text style={styles.brainwaveChipFrequency}>
                      {filter.frequency}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Audio List */}
        <View style={styles.audioList}>
          <Text style={styles.resultsCount}>
            {filteredContent.length} audio{filteredContent.length !== 1 ? 's' : ''} found
          </Text>
          {filteredContent.map((audio) => (
            <TouchableOpacity
              key={audio.id}
              style={styles.audioCard}
              onPress={() => handlePlayAudio(audio)}
              activeOpacity={0.8}
            >
              <View style={styles.audioLeft}>
                <LinearGradient
                  colors={[getBrainwaveColor(audio.brainwave), getBrainwaveColor(audio.brainwave) + '80']}
                  style={styles.audioIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.audioIconText}>▶</Text>
                </LinearGradient>
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>{audio.title}</Text>
                  <View style={styles.audioMeta}>
                    <Text style={styles.audioType}>{audio.type}</Text>
                    <Text style={styles.audioDot}>•</Text>
                    <Text style={styles.audioDuration}>{audio.duration}</Text>
                    <Text style={styles.audioDot}>•</Text>
                    <Text style={styles.audioFrequency}>{audio.frequency}</Text>
                  </View>
                  <View style={styles.audioStats}>
                    <Text style={styles.audioPlays}>
                      {audio.plays.toLocaleString()} plays
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(audio.id);
                }}
              >
                <Text style={styles.likeIcon}>
                  {likedAudios.includes(audio.id) ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {filteredContent.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎵</Text>
              <Text style={styles.emptyStateText}>No audio found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters
              </Text>
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
  filtersSection: {
    backgroundColor: theme.colors.gradientStart,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
  },
  clearIcon: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    padding: theme.spacing.xs,
  },
  typeFiltersContent: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  typeFilterChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeFilterChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  typeFilterText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  typeFilterTextActive: {
    color: theme.colors.alpha,
  },
  brainwaveFiltersContainer: {
    marginBottom: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  brainwaveFiltersContent: {
    gap: theme.spacing.xs,
  },
  brainwaveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: theme.spacing.xs / 2,
  },
  brainwaveChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  brainwaveChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brainwaveChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  brainwaveChipTextActive: {
    color: theme.colors.text,
  },
  brainwaveChipFrequency: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  audioList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  resultsCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  audioCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  audioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  audioIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  audioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  audioType: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  audioDot: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs / 2,
  },
  audioDuration: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  audioFrequency: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  audioStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioPlays: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  likeButton: {
    padding: theme.spacing.xs,
  },
  likeIcon: {
    fontSize: 24,
    color: theme.colors.alpha,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default AudioLibraryScreen;
