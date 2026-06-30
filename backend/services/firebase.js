const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
let messaging = null;

try {
  const serviceAccount = require('../config/firebase-service-account.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  // Get Firebase Messaging reference
  messaging = admin.messaging();
  firebaseInitialized = true;
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.log('Push notifications will be disabled');
}

/**
 * Send push notification to a single device
 * @param {string} fcmToken - The FCM token of the device
 * @param {object} notification - The notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<boolean>} - True if sent successfully
 */
async function sendToDevice(fcmToken, notification, data = {}) {
  if (!firebaseInitialized || !messaging) {
    console.log('Firebase not initialized, skipping notification');
    return false;
  }

  if (!fcmToken) {
    console.log('No FCM token provided');
    return false;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      token: fcmToken
    };

    await messaging.send(message);
    console.log(`✅ Push notification sent to device: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error.message);

    // If token is invalid, we should mark it for removal
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.log(`Invalid FCM token, should be removed: ${fcmToken.substring(0, 20)}...`);
    }

    return false;
  }
}

/**
 * Send push notification to multiple devices
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {object} notification - The notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
async function sendToMultipleDevices(fcmTokens, notification, data = {}) {
  if (!firebaseInitialized || !messaging) {
    console.log('Firebase not initialized, skipping notifications');
    return { successCount: 0, failureCount: fcmTokens.length };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    console.log('No FCM tokens provided');
    return { successCount: 0, failureCount: 0 };
  }

  try {
    // FCM has a limit of 500 tokens per batch
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: data,
        tokens: batch
      };

      const response = await messaging.sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      console.log(`✅ Push notification batch sent: ${response.successCount}/${batch.length} successful`);

      // Log any errors
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${idx}:`, resp.error.message);
          }
        });
      }
    }

    return { successCount: totalSuccess, failureCount: totalFailure };
  } catch (error) {
    console.error('❌ Failed to send multicast notification:', error.message);
    return { successCount: 0, failureCount: fcmTokens.length };
  }
}

/**
 * Send incoming call notification
 * @param {string} fcmToken - The FCM token of the student
 * @param {object} callData - Call information
 * @param {string} callData.coachName - Name of the coach
 * @param {string} callData.sessionId - Session ID
 * @param {string} callData.roomId - Room ID for the call
 * @returns {Promise<boolean>}
 */
async function sendIncomingCallNotification(fcmToken, callData) {
  return sendToDevice(
    fcmToken,
    {
      title: 'Incoming Call',
      body: `${callData.coachName} is calling you`
    },
    {
      type: 'incoming_call',
      sessionId: String(callData.sessionId),
      roomId: callData.roomId,
      coachName: callData.coachName,
      timestamp: new Date().toISOString()
    }
  );
}

/**
 * Send call ended notification
 * @param {string} fcmToken - The FCM token
 * @param {string} coachName - Name of the coach
 * @returns {Promise<boolean>}
 */
async function sendCallEndedNotification(fcmToken, coachName) {
  return sendToDevice(
    fcmToken,
    {
      title: 'Call Ended',
      body: `${coachName} has ended the call`
    },
    {
      type: 'call_ended',
      timestamp: new Date().toISOString()
    }
  );
}

module.exports = {
  admin,
  messaging,
  firebaseInitialized,
  sendToDevice,
  sendToMultipleDevices,
  sendIncomingCallNotification,
  sendCallEndedNotification
};
