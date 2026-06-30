import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { coachingAPI, professionalCoachesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MessagingScreen = ({ route, navigation }) => {
  const { relationshipId, partnerName, isProfessionalCoach, coachId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Debug logging
  console.log('💬 MessagingScreen initialized with:', {
    relationshipId,
    partnerName,
    isProfessionalCoach,
    willUseAPI: isProfessionalCoach ? 'professionalCoachesAPI' : 'coachingAPI'
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [relationshipId]);

  const loadMessages = async () => {
    try {
      const api = isProfessionalCoach ? professionalCoachesAPI : coachingAPI;
      const response = await api.getMessages(relationshipId);
      if (response.success) {
        setMessages(response.data || []);
        // Scroll to bottom when messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const api = isProfessionalCoach ? professionalCoachesAPI : coachingAPI;
      const response = await api.sendMessage(relationshipId, messageText);
      if (response.success) {
        await loadMessages();
      } else {
        Alert.alert('Error', 'Failed to send message');
        setNewMessage(messageText); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceCall = () => {
    Alert.alert(
      'Voice Call',
      'Voice calling feature is coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleVideoCall = () => {
    // This function is only called for professional coaches
    if (coachId) {
      navigation.navigate('BookCall', {
        coachId: coachId,
        coachName: partnerName,
      });
    } else {
      Alert.alert(
        'Error',
        'Unable to initiate video call. Coach information missing.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id;

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowRight]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000614', '#000614', '#000614']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000614', '#000614', '#000614']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{partnerName}</Text>
            <Text style={styles.headerSubtitle}>
              {isProfessionalCoach ? 'Professional Coach' : 'Coaching Chat'}
            </Text>
          </View>
          {/* Only show call buttons for professional coaches */}
          {isProfessionalCoach && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleVideoCall}
                activeOpacity={0.7}
              >
                <Ionicons name="videocam" size={24} color={theme.colors.alpha} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleVoiceCall}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={22} color={theme.colors.alpha} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />

        {/* Input Box */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.alpha,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  messagesList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  messageRow: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
  },
  myMessage: {
    backgroundColor: theme.colors.alpha,
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: theme.fonts.sizes.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(26, 20, 72, 0.4)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.alpha,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginLeft: theme.spacing.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 3,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default MessagingScreen;
