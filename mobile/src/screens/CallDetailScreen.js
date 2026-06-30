import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const CallDetailScreen = ({ route, navigation }) => {
  const { callData } = route.params;

  const getReasonText = (reason) => {
    const reasonMap = {
      coach_cancelled: 'Coach cancelled the call',
      student_rejected: 'You declined the call',
      no_answer: 'Call was not answered',
      timeout: 'Call timed out',
    };
    return reasonMap[reason] || 'Call ended';
  };

  const getReasonIcon = (reason) => {
    const iconMap = {
      coach_cancelled: 'close-circle',
      student_rejected: 'hand-left',
      no_answer: 'time',
      timeout: 'timer',
    };
    return iconMap[reason] || 'information-circle';
  };

  const getReasonColor = (reason) => {
    const colorMap = {
      coach_cancelled: '#f59e0b',
      student_rejected: '#ef4444',
      no_answer: '#6b7280',
      timeout: '#6b7280',
    };
    return colorMap[reason] || '#6b7280';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diff = Math.floor((endTime - startTime) / 1000);

    if (diff < 60) return `${diff} seconds`;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  };

  const reasonColor = getReasonColor(callData.reason);

  return (
    <LinearGradient colors={['#000614', '#000614', '#000614']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Icon */}
        <View style={[styles.iconContainer, { backgroundColor: reasonColor + '20' }]}>
          <Ionicons name={getReasonIcon(callData.reason)} size={64} color={reasonColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Call Details</Text>
        <Text style={styles.subtitle}>{getReasonText(callData.reason)}</Text>

        {/* Coach Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="person-circle" size={24} color={theme.colors.alpha} />
            <Text style={styles.infoTitle}>Coach Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{callData.coachName || 'Professional Coach'}</Text>
          </View>
        </View>

        {/* Call Timeline */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="time" size={24} color={theme.colors.alpha} />
            <Text style={styles.infoTitle}>Call Timeline</Text>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Call Initiated</Text>
              <Text style={styles.timelineValue}>
                {formatTime(callData.startedAt || callData.timestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.timelineConnector} />

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: reasonColor }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Call {callData.reason === 'student_rejected' ? 'Declined' : 'Cancelled'}</Text>
              <Text style={styles.timelineValue}>
                {formatTime(callData.cancelledAt || callData.timestamp)}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>
              {calculateDuration(callData.startedAt, callData.cancelledAt)}
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        {callData.sessionId && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={theme.colors.alpha} />
              <Text style={styles.infoTitle}>Session Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Session ID</Text>
              <Text style={[styles.infoValue, styles.monospace]}>
                #{callData.sessionId}
              </Text>
            </View>
          </View>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl + 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  infoCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.4)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  monospace: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: theme.fonts.sizes.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.alpha,
    marginTop: 4,
    marginRight: theme.spacing.md,
  },
  timelineConnector: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginLeft: 5,
    marginBottom: theme.spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  timelineValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: theme.colors.alpha,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  closeButtonText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default CallDetailScreen;
