import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { theme } from '../utils/theme';
import { videoCallsAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';
import { useFocusEffect } from '@react-navigation/native';

export const AvailabilitySetupScreen = ({ navigation }) => {
  const { showAlert, AlertComponent } = useAlert();

  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'blocked'

  // Add availability form
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Block slot form
  const [selectedDate, setSelectedDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadAvailability();
    }, [])
  );

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await videoCallsAPI.getMyAvailability();

      if (response.success) {
        setAvailability(response.data?.weeklyAvailability || []);
        setBlockedSlots(response.data?.blockedSlots || []);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load availability',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    if (!startTime || !endTime) {
      showAlert({
        type: 'warning',
        title: 'Incomplete Form',
        message: 'Please enter both start and end times',
      });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      showAlert({
        type: 'warning',
        title: 'Invalid Time',
        message: 'Please use HH:MM format (e.g., 09:00, 14:30)',
      });
      return;
    }

    // Validate end time is after start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      showAlert({
        type: 'warning',
        title: 'Invalid Time Range',
        message: 'End time must be after start time',
      });
      return;
    }

    try {
      const response = await videoCallsAPI.setAvailability(
        selectedDay,
        startTime,
        endTime
      );

      if (response.success) {
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Availability added successfully',
        });
        setShowAddForm(false);
        setStartTime('');
        setEndTime('');
        loadAvailability();
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to add availability',
      });
    }
  };

  const handleDeleteAvailability = (id) => {
    Alert.alert(
      'Delete Availability',
      'Are you sure you want to remove this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteAvailability(id),
        },
      ]
    );
  };

  const confirmDeleteAvailability = async (id) => {
    try {
      const response = await videoCallsAPI.deleteAvailability(id);

      if (response.success) {
        showAlert({
          type: 'success',
          title: 'Deleted',
          message: 'Time slot removed',
        });
        loadAvailability();
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete availability',
      });
    }
  };

  const handleBlockSlot = async () => {
    if (!selectedDate || !blockStartTime || !blockEndTime) {
      showAlert({
        type: 'warning',
        title: 'Incomplete Form',
        message: 'Please fill in all required fields',
      });
      return;
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(blockStartTime) || !timeRegex.test(blockEndTime)) {
      showAlert({
        type: 'warning',
        title: 'Invalid Time',
        message: 'Please use HH:MM format (e.g., 09:00, 14:30)',
      });
      return;
    }

    try {
      const response = await videoCallsAPI.blockSlot(
        selectedDate,
        blockStartTime,
        blockEndTime,
        blockReason
      );

      if (response.success) {
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Date/time blocked successfully',
        });
        setShowBlockForm(false);
        setSelectedDate('');
        setBlockStartTime('');
        setBlockEndTime('');
        setBlockReason('');
        loadAvailability();
      }
    } catch (error) {
      console.error('Error blocking slot:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to block slot',
      });
    }
  };

  const handleUnblockSlot = (id) => {
    Alert.alert(
      'Unblock Date/Time',
      'Are you sure you want to unblock this date and time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => confirmUnblockSlot(id),
        },
      ]
    );
  };

  const confirmUnblockSlot = async (id) => {
    try {
      const response = await videoCallsAPI.unblockSlot(id);

      if (response.success) {
        showAlert({
          type: 'success',
          title: 'Unblocked',
          message: 'Date/time unblocked',
        });
        loadAvailability();
      }
    } catch (error) {
      console.error('Error unblocking slot:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to unblock slot',
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDayLabel = (dayOfWeek) => {
    return daysOfWeek.find(d => d.value === dayOfWeek)?.label || '';
  };

  const renderWeeklyAvailability = () => {
    // Group availability by day of week
    const grouped = availability.reduce((acc, slot) => {
      if (!acc[slot.day_of_week]) {
        acc[slot.day_of_week] = [];
      }
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {});

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Cancel' : '+ Add Time Slot'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayChip,
                    selectedDay === day.value && styles.dayChipSelected
                  ]}
                  onPress={() => setSelectedDay(day.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.dayChipText,
                    selectedDay === day.value && styles.dayChipTextSelected
                  ]}>
                    {day.label.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="09:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="17:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={endTime}
                  onChangeText={setEndTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddAvailability}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Add Availability</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.availabilityList}>
          {daysOfWeek.map((day) => {
            const slots = grouped[day.value] || [];
            if (slots.length === 0) return null;

            return (
              <View key={day.value} style={styles.daySection}>
                <Text style={styles.daySectionTitle}>{day.label}</Text>
                {slots.map((slot) => (
                  <View key={slot.id} style={styles.slotCard}>
                    <View style={styles.slotInfo}>
                      <Text style={styles.slotTime}>
                        {slot.start_time} - {slot.end_time}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteAvailability(slot.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteButton}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

          {availability.length === 0 && !showAddForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No availability set yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Add your weekly available hours
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBlockedSlots = () => {
    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowBlockForm(!showBlockForm)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>
              {showBlockForm ? 'Cancel' : '+ Block Date/Time'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {showBlockForm && (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Select Date</Text>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.textSecondary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
              }}
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={selectedDate ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary
                }
              } : {}}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="09:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={blockStartTime}
                  onChangeText={setBlockStartTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="17:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={blockEndTime}
                  onChangeText={setBlockEndTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Reason (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g., Vacation, Personal appointment"
              placeholderTextColor={theme.colors.textSecondary}
              value={blockReason}
              onChangeText={setBlockReason}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleBlockSlot}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Block Date/Time</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.blockedList}>
          {blockedSlots.map((slot) => (
            <View key={slot.id} style={styles.blockedCard}>
              <View style={styles.blockedInfo}>
                <Text style={styles.blockedDate}>
                  {formatDate(slot.blocked_date)}
                </Text>
                <Text style={styles.blockedTime}>
                  {slot.start_time} - {slot.end_time}
                </Text>
                {slot.reason && (
                  <Text style={styles.blockedReason}>{slot.reason}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleUnblockSlot(slot.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.unblockButton}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))}

          {blockedSlots.length === 0 && !showBlockForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No blocked dates/times
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Block specific dates when you're unavailable
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Availability</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'weekly' && styles.tabActive
              ]}
              onPress={() => setActiveTab('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'weekly' && styles.tabTextActive
              ]}>
                Weekly Hours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'blocked' && styles.tabActive
              ]}
              onPress={() => setActiveTab('blocked')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'blocked' && styles.tabTextActive
              ]}>
                Blocked Dates
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'weekly' ? renderWeeklyAvailability() : renderBlockedSlots()}
        </ScrollView>

        <AlertComponent />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  tabContent: {
    flex: 1,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  addButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  daySelector: {
    marginBottom: 12,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  availabilityList: {
    marginTop: 8,
  },
  daySection: {
    marginBottom: 20,
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  deleteButton: {
    fontSize: 20,
    padding: 4,
  },
  calendar: {
    borderRadius: 12,
    marginVertical: 12,
  },
  blockedList: {
    marginTop: 8,
  },
  blockedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  blockedInfo: {
    flex: 1,
  },
  blockedDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  blockedTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  blockedReason: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  unblockButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
