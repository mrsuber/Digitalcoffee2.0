import { notificationService } from './firebase';
import { videoCallsAPI } from './api';

class BookingNotificationService {
  constructor() {
    this.scheduledNotifications = new Map(); // Store notification IDs by booking ID
  }

  /**
   * Schedule notifications for an upcoming booking
   * Creates multiple notifications at different intervals before the call
   */
  async scheduleBookingNotifications(booking, coach) {
    try {
      const scheduledTime = new Date(booking.scheduled_at).getTime();
      const now = Date.now();
      const timeUntilCall = scheduledTime - now;

      console.log('📅 Scheduling notifications for booking:', {
        bookingId: booking.id,
        scheduledAt: booking.scheduled_at,
        coach: coach?.name,
        timeUntilCall: Math.floor(timeUntilCall / 1000 / 60) + ' minutes'
      });

      // Don't schedule if the call is in the past or happening very soon (< 1 minute)
      if (timeUntilCall < 60000) {
        console.log('⚠️ Call is happening very soon or in past, skipping notifications');
        return;
      }

      const notificationIds = [];

      // Schedule notification 1 hour before (if enough time)
      if (timeUntilCall > 3600000) {
        const id = await notificationService.scheduleNotification(
          'Upcoming Session',
          `Your session with ${coach?.name || 'your coach'} starts in 1 hour`,
          {
            type: 'scheduled_call_reminder',
            bookingId: booking.id,
            coachName: coach?.name,
            timeUntil: '1 hour'
          },
          Math.floor((timeUntilCall - 3600000) / 1000) // 1 hour before
        );
        if (id) notificationIds.push(id);
      }

      // Schedule notification 15 minutes before (if enough time)
      if (timeUntilCall > 900000) {
        const id = await notificationService.scheduleNotification(
          'Session Starting Soon',
          `Your session with ${coach?.name || 'your coach'} starts in 15 minutes`,
          {
            type: 'scheduled_call_reminder',
            bookingId: booking.id,
            coachName: coach?.name,
            timeUntil: '15 minutes'
          },
          Math.floor((timeUntilCall - 900000) / 1000) // 15 minutes before
        );
        if (id) notificationIds.push(id);
      }

      // Schedule incoming call notification 1 minute before
      if (timeUntilCall > 60000) {
        const id = await notificationService.scheduleNotification(
          'Incoming Call',
          `${coach?.name || 'Your coach'} is calling you`,
          {
            type: 'scheduled_call_incoming',
            bookingId: booking.id,
            coachId: coach?.id,
            coachName: coach?.name,
            sessionToken: booking.session_token,
            booking: JSON.stringify(booking)
          },
          Math.floor((timeUntilCall - 60000) / 1000) // 1 minute before
        );
        if (id) notificationIds.push(id);
      }

      // Store notification IDs for this booking
      this.scheduledNotifications.set(booking.id, notificationIds);

      console.log('✅ Scheduled', notificationIds.length, 'notifications for booking', booking.id);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling booking notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications for a booking
   */
  async cancelBookingNotifications(bookingId) {
    try {
      const notificationIds = this.scheduledNotifications.get(bookingId);
      if (!notificationIds || notificationIds.length === 0) {
        console.log('No notifications to cancel for booking', bookingId);
        return;
      }

      console.log('📅 Cancelling', notificationIds.length, 'notifications for booking', bookingId);

      for (const id of notificationIds) {
        await notificationService.cancelNotification(id);
      }

      this.scheduledNotifications.delete(bookingId);
      console.log('✅ Cancelled notifications for booking', bookingId);
    } catch (error) {
      console.error('Error cancelling booking notifications:', error);
    }
  }

  /**
   * Schedule notifications for all upcoming bookings
   */
  async scheduleAllUpcomingBookings() {
    try {
      console.log('📅 Fetching upcoming bookings...');
      const response = await videoCallsAPI.getMyBookings(null, true); // Get upcoming bookings

      if (!response.success || !response.data.bookings) {
        console.log('No upcoming bookings found');
        return;
      }

      const bookings = response.data.bookings;
      console.log('📅 Found', bookings.length, 'upcoming bookings');

      for (const booking of bookings) {
        // Get coach info
        const coach = {
          id: booking.coach_id,
          name: booking.coach_name || 'Coach'
        };

        await this.scheduleBookingNotifications(booking, coach);
      }

      console.log('✅ Scheduled notifications for all upcoming bookings');
    } catch (error) {
      console.error('Error scheduling all upcoming bookings:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      for (const bookingId of this.scheduledNotifications.keys()) {
        await this.cancelBookingNotifications(bookingId);
      }
      console.log('✅ Cancelled all booking notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }
}

export const bookingNotificationService = new BookingNotificationService();
