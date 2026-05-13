import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const MOOD_TAGS = [
  { id: 'clear', emoji: '😌', label: 'Clear' },
  { id: 'calm', emoji: '🧘', label: 'Calm' },
  { id: 'tired', emoji: '😤', label: 'Tired' },
  { id: 'anxious', emoji: '😨', label: 'Anxious' },
  { id: 'foggy', emoji: '😴', label: 'Foggy' },
  { id: 'inspired', emoji: '✨', label: 'Inspired' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful' },
  { id: 'focused', emoji: '🎯', label: 'Focused' },
];

const SAMPLE_ENTRIES = [
  {
    id: '1',
    date: '2024-01-15',
    time: '09:30 AM',
    title: 'Morning Clarity',
    content:
      'Woke up feeling refreshed after yesterday\'s meditation session. The breathing exercises really helped me fall asleep faster. Today I want to focus on finishing the project proposal.',
    mood: 'clear',
    isFavorite: true,
  },
  {
    id: '2',
    date: '2024-01-14',
    time: '08:15 PM',
    title: 'Evening Reflection',
    content:
      'Completed 2 deep work sessions today. Feeling productive but also a bit tired. Need to remember to take more breaks between sessions.',
    mood: 'tired',
    isFavorite: false,
  },
  {
    id: '3',
    date: '2024-01-13',
    time: '07:00 AM',
    title: 'Grateful Morning',
    content:
      'Grateful for the peaceful morning and the opportunity to practice mindfulness. The alpha waves audio was particularly effective today.',
    mood: 'grateful',
    isFavorite: true,
  },
];

export const JournalScreen = ({ navigation }) => {
  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [filterMood, setFilterMood] = useState('all');

  const filteredEntries =
    filterMood === 'all'
      ? entries
      : entries.filter((entry) => entry.mood === filterMood);

  const handleCreateEntry = () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim()) return;

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: newEntryTitle,
      content: newEntryContent,
      mood: selectedMood || 'clear',
      isFavorite: false,
    };

    setEntries([newEntry, ...entries]);
    setShowNewEntryModal(false);
    setNewEntryTitle('');
    setNewEntryContent('');
    setSelectedMood(null);
  };

  const toggleFavorite = (entryId) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, isFavorite: !entry.isFavorite }
          : entry
      )
    );
  };

  const deleteEntry = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const getMoodEmoji = (moodId) => {
    return MOOD_TAGS.find((m) => m.id === moodId)?.emoji || '😌';
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
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Mind Journal</Text>
              <Text style={styles.headerSubtitle}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewEntryModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Filter */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.moodFilterChip,
                filterMood === 'all' && styles.moodFilterChipActive,
              ]}
              onPress={() => setFilterMood('all')}
            >
              <Text
                style={[
                  styles.moodFilterText,
                  filterMood === 'all' && styles.moodFilterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {MOOD_TAGS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodFilterChip,
                  filterMood === mood.id && styles.moodFilterChipActive,
                ]}
                onPress={() => setFilterMood(mood.id)}
              >
                <Text style={styles.moodFilterEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodFilterText,
                    filterMood === mood.id && styles.moodFilterTextActive,
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Entries List */}
        <View style={styles.entriesList}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📖</Text>
              <Text style={styles.emptyStateText}>No entries yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start journaling your thoughts and feelings
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryHeaderLeft}>
                    <Text style={styles.entryMoodEmoji}>
                      {getMoodEmoji(entry.mood)}
                    </Text>
                    <View>
                      <Text style={styles.entryDate}>{entry.date}</Text>
                      <Text style={styles.entryTime}>{entry.time}</Text>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(entry.id)}
                      style={styles.entryActionButton}
                    >
                      <Text style={styles.entryActionIcon}>
                        {entry.isFavorite ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteEntry(entry.id)}
                      style={styles.entryActionButton}
                    >
                      <Text style={styles.entryActionIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              <TouchableOpacity onPress={() => setShowNewEntryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Mood Selection */}
              <Text style={styles.inputLabel}>How are you feeling?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moodSelectorContent}
              >
                {MOOD_TAGS.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodSelectorChip,
                      selectedMood === mood.id && styles.moodSelectorChipActive,
                    ]}
                    onPress={() => setSelectedMood(mood.id)}
                  >
                    <Text style={styles.moodSelectorEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodSelectorLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your entry a title..."
                placeholderTextColor={theme.colors.textMuted}
                value={newEntryTitle}
                onChangeText={setNewEntryTitle}
              />

              {/* Content Input */}
              <Text style={styles.inputLabel}>What's on your mind?</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Write your thoughts here..."
                placeholderTextColor={theme.colors.textMuted}
                value={newEntryContent}
                onChangeText={setNewEntryContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newEntryTitle.trim() || !newEntryContent.trim()) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={handleCreateEntry}
              disabled={!newEntryTitle.trim() || !newEntryContent.trim()}
            >
              <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <View style={styles.saveButtonInner}>
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
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
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  moodFilterContent: {
    gap: theme.spacing.xs,
  },
  moodFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: theme.spacing.xs / 2,
  },
  moodFilterChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  moodFilterEmoji: {
    fontSize: 16,
  },
  moodFilterText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  moodFilterTextActive: {
    color: theme.colors.alpha,
  },
  entriesList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  entryCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  entryMoodEmoji: {
    fontSize: 32,
  },
  entryDate: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  entryActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  entryActionButton: {
    padding: theme.spacing.xs,
  },
  entryActionIcon: {
    fontSize: 20,
  },
  entryTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  entryContent: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
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
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  modalScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  moodSelectorContent: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  moodSelectorChip: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  moodSelectorChipActive: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
  },
  moodSelectorEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.xs / 2,
  },
  moodSelectorLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  contentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  saveButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default JournalScreen;
