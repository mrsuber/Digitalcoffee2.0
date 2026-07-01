import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { theme } from '../utils/theme';
import { videoCallsAPI, professionalCoachesAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';

export const BookCallScreen = ({ navigation, route }) => {
  const { coachId: initialCoachId } = route.params || {};
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [coachWeeklyAvailability, setCoachWeeklyAvailability] = useState([]); // Days coach works (0-6)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Coach, 2: Select Date, 3: Select Time, 4: Confirm

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    if (initialCoachId) {
      const coach = coaches.find(c => c.id === initialCoachId);
      if (coach) {
        setSelectedCoach(coach);
        setStep(2);
      }
    }
  }, [initialCoachId, coaches]);

  useEffect(() => {
    if (selectedCoach) {
      loadCoachWeeklyAvailability();
    }
  }, [selectedCoach]);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      loadAvailability();
    }
  }, [selectedCoach, selectedDate]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const response = await professionalCoachesAPI.getAll(null, null, 50);

      if (response.success) {
        setCoaches(response.data || []);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load coaches',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCoachWeeklyAvailability = async () => {
    try {
      const response = await videoCallsAPI.getCoachWeeklySchedule(selectedCoach.id);

      if (response.success) {
        const availableDays = response.data || [];
        setCoachWeeklyAvailability(availableDays);
        console.log('Coach available on days:', availableDays);
      }
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
      setCoachWeeklyAvailability([]);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await videoCallsAPI.getCoachAvailability(
        selectedCoach.id,
        selectedDate
      );

      if (response.success) {
        setAvailability(response.data || []);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load coach availability',
      });
    }
  };

  const handleCoachSelect = (coach) => {
    setSelectedCoach(coach);
    setStep(2);
  };

  const handleDateSelect = (date) => {
    console.log('Date selected:', date.dateString);

    // Create date at noon to avoid timezone issues
    const selectedDateTime = new Date(date.dateString + 'T12:00:00');
    const now = new Date();
    const hoursDifference = (selectedDateTime - now) / (1000 * 60 * 60);

    console.log('Hours difference:', hoursDifference);

    if (hoursDifference < 48) { // 48 hours = 2 days for safety
      showAlert({
        type: 'warning',
        title: 'Date Too Soon',
        message: 'Sessions must be booked at least 24 hours in advance. Please select a date that is at least 2 days away.',
      });
      return;
    }

    setSelectedDate(date.dateString);
    setSelectedTimeSlot(null);
    setStep(3);
  };

  const handleTimeSlotSelect = (slot) => {
    console.log('Selected time slot:', slot);
    console.log('Selected date:', selectedDate);
    setSelectedTimeSlot(slot);
    setStep(4);
  };

  const handleBooking = async () => {
    if (!selectedCoach || !selectedDate || !selectedTimeSlot) {
      showAlert({
        type: 'warning',
        title: 'Incomplete Selection',
        message: 'Please select a coach, date, and time slot',
      });
      return;
    }

    try {
      setBookingLoading(true);

      // Create timestamp from selected date and time
      const scheduledAt = `${selectedDate}T${selectedTimeSlot.start_time}:00`;

      const response = await videoCallsAPI.createBooking(
        selectedCoach.id,
        scheduledAt,
        bookingNotes
      );

      if (response.success) {
        // Reset form
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setBookingNotes('');
        setStep(1);

        showAlert({
          type: 'success',
          title: '✅ Booking Confirmed!',
          message: `Your video session with ${selectedCoach.full_name} is confirmed!\n\nTap OK to view your bookings or visit Profile → My Video Sessions.`,
          onConfirm: () => {
            // Navigate to MyBookings
            navigation.navigate('MyBookings');
          },
        });
      } else {
        throw new Error(response.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showAlert({
        type: 'error',
        title: 'Booking Failed',
        message: error.response?.data?.message || 'Failed to book session. Please try again.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime || datetime.includes('undefined') || datetime.includes('null')) {
      return 'Please select date and time';
    }

    try {
      const date = new Date(datetime);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error, datetime);
      return 'Invalid date format';
    }
  };

  const getMinDate = () => {
    const minDate = new Date();
    // Add 24 hours + 1 day to ensure we're always past the 24-hour requirement
    minDate.setDate(minDate.getDate() + 2);
    return minDate.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60); // 60 days ahead
    return maxDate.toISOString().split('T')[0];
  };

  // Generate marked dates with disabled days where coach has no availability
  const getMarkedDates = () => {
    const marked = {};

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    // Disable dates where coach has no availability
    if (coachWeeklyAvailability.length > 0) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2); // Start from 2 days ahead
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 60);

      // Iterate through all dates in range
      for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toISOString().split('T')[0];

        // If coach doesn't work on this day of week, disable it
        if (!coachWeeklyAvailability.includes(dayOfWeek)) {
          marked[dateString] = {
            ...marked[dateString],
            disabled: true,
            disableTouchEvent: true,
            textColor: '#666666',
          };
        }
      }
    }

    return marked;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((num) => (
        <View key={num} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            step >= num && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              step >= num && styles.stepNumberActive
            ]}>
              {num}
            </Text>
          </View>
          {num < 4 && (
            <View style={[
              styles.stepLine,
              step > num && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderCoachSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select a Professional Coach</Text>
      <Text style={styles.stepSubtitle}>
        Choose a coach for your 30-minute video session
      </Text>

      <ScrollView style={styles.coachList}>
        {coaches.map((coach) => (
          <TouchableOpacity
            key={coach.id}
            style={[
              styles.coachCard,
              selectedCoach?.id === coach.id && styles.coachCardSelected
            ]}
            onPress={() => handleCoachSelect(coach)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedCoach?.id === coach.id
                  ? ['rgba(124, 58, 237, 0.3)', 'rgba(76, 29, 149, 0.2)']
                  : ['rgba(76, 29, 149, 0.1)', 'rgba(124, 58, 237, 0.05)']
              }
              style={styles.coachCardGradient}
            >
              <View style={styles.coachCardContent}>
                <View style={styles.coachAvatar}>
                  {coach.avatar_url ? (
                    <Image source={{ uri: coach.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>
                      {coach.full_name.substring(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{coach.full_name}</Text>
                  <Text style={styles.coachSpecialties}>
                    {coach.specialties?.join(', ') || 'General Wellness'}
                  </Text>
                  <View style={styles.coachStats}>
                    <Text style={styles.coachRating}>
                      ⭐ {coach.rating || '5.0'}
                    </Text>
                    <Text style={styles.coachExperience}>
                      {coach.years_experience} years exp
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCoach && (
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue to Date Selection</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDateSelection = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← Back to Coaches</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Select a Date</Text>
      <Text style={styles.stepSubtitle}>
        Booking with {selectedCoach?.full_name}
      </Text>
      <Text style={styles.requirementText}>
        ⏰ Sessions must be booked at least 24 hours in advance
      </Text>

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
          textDisabledColor: '#666666',
          monthTextColor: theme.colors.text,
          arrowColor: theme.colors.primary,
        }}
        minDate={getMinDate()}
        maxDate={getMaxDate()}
        onDayPress={handleDateSelect}
        markedDates={getMarkedDates()}
        enableSwipeMonths={true}
        disableAllTouchEventsForDisabledDays={true}
      />
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(2)}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← Back to Calendar</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Select a Time Slot</Text>
      <Text style={styles.stepSubtitle}>
        Available times for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}
      </Text>

      <ScrollView style={styles.timeSlotList}>
        {availability.length > 0 ? (
          availability.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlotCard,
                selectedTimeSlot?.start_time === slot.start_time && styles.timeSlotSelected
              ]}
              onPress={() => handleTimeSlotSelect(slot)}
              activeOpacity={0.8}
            >
              <View style={styles.timeSlotContent}>
                <Text style={styles.timeSlotTime}>
                  {slot.start_time} - {slot.end_time}
                </Text>
                <Text style={styles.timeSlotDuration}>30 minutes</Text>
              </View>
              {selectedTimeSlot?.start_time === slot.start_time && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAvailability}>
            <Text style={styles.noAvailabilityIcon}>📅</Text>
            <Text style={styles.noAvailabilityText}>
              No available time slots for this date
            </Text>
            <Text style={styles.noAvailabilitySubtext}>
              This coach may not have availability on this day of the week
            </Text>
            <TouchableOpacity
              style={styles.selectDifferentDateButton}
              onPress={() => setStep(2)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectDifferentDateText}>Select Different Date</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {selectedTimeSlot && (
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue to Confirmation</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderConfirmation = () => {
    // Format date separately for better reliability
    const getFormattedDate = () => {
      if (!selectedDate) return 'No date selected';

      try {
        const dateObj = new Date(selectedDate + 'T12:00:00');
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      } catch (error) {
        return 'Invalid date';
      }
    };

    const getFormattedTime = () => {
      if (!selectedTimeSlot) return 'No time selected';
      return `${selectedTimeSlot.start_time} - ${selectedTimeSlot.end_time}`;
    };

    return (
      <View style={styles.stepContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(3)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back to Time Selection</Text>
        </TouchableOpacity>

        <Text style={styles.stepTitle}>Confirm Your Booking</Text>

        <View style={styles.confirmationCard}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.1)', 'rgba(76, 29, 149, 0.05)']}
            style={styles.confirmationGradient}
          >
            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>Coach</Text>
              <Text style={styles.confirmationValue}>{selectedCoach?.full_name}</Text>
            </View>

            <View style={styles.confirmationDivider} />

            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>Date & Time</Text>
              <Text style={styles.confirmationValue}>
                {getFormattedDate()}
              </Text>
              <Text style={[styles.confirmationValue, { marginTop: 4 }]}>
                {getFormattedTime()}
              </Text>
            </View>

          <View style={styles.confirmationDivider} />

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>Duration</Text>
            <Text style={styles.confirmationValue}>30 minutes</Text>
          </View>

          <View style={styles.confirmationDivider} />

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>Session Type</Text>
            <Text style={styles.confirmationValue}>Video Call (Audio + Chat)</Text>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.notesLabel}>Session Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="What would you like to focus on in this session?"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        numberOfLines={4}
        value={bookingNotes}
        onChangeText={setBookingNotes}
        maxLength={500}
      />

      <View style={styles.recordingNotice}>
        <Text style={styles.recordingNoticeText}>
          🎥 This session will be recorded for quality and training purposes
        </Text>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleBooking}
        disabled={bookingLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.buttonGradient}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Confirm Booking</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading coaches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Book Video Session</Text>

          {renderStepIndicator()}

          {step === 1 && renderCoachSelection()}
          {step === 2 && renderDateSelection()}
          {step === 3 && renderTimeSelection()}
          {step === 4 && renderConfirmation()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  requirementText: {
    fontSize: 14,
    color: theme.colors.accent,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  backButton: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  backButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coachList: {
    flex: 1,
    marginBottom: 16,
  },
  coachCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coachCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  coachCardGradient: {
    padding: 16,
  },
  coachCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  coachSpecialties: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  coachStats: {
    flexDirection: 'row',
    gap: 16,
  },
  coachRating: {
    fontSize: 14,
    color: theme.colors.text,
  },
  coachExperience: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  calendar: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeSlotList: {
    flex: 1,
    marginBottom: 16,
  },
  timeSlotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  timeSlotContent: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  timeSlotDuration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectedIcon: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  noAvailability: {
    padding: 40,
    alignItems: 'center',
  },
  noAvailabilityIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAvailabilityText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAvailabilitySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectDifferentDateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  selectDifferentDateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmationGradient: {
    padding: 20,
  },
  confirmationSection: {
    paddingVertical: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  confirmationDivider: {
    height: 1,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.2,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  recordingNotice: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  recordingNoticeText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
