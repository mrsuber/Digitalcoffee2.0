import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';
import RequestCoachModal from '../components/RequestCoachModal';

const PostDetailScreen = ({ navigation, route }) => {
  const { postId, post: initialPost } = route.params;
  const { user } = useAuth();

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  useEffect(() => {
    loadPostAndComments();
  }, []);

  const loadPostAndComments = async () => {
    // If post wasn't passed via navigation, fetch it
    if (!post && postId) {
      try {
        const postResponse = await communityAPI.getPost(postId);
        if (postResponse.success && postResponse.data) {
          setPost(postResponse.data);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        Alert.alert('Error', 'Failed to load post');
        navigation.goBack();
        return;
      }
    }

    await loadComments();
  };

  const loadComments = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await communityAPI.getComments(postId);

      if (response.success) {
        setComments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadComments(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Required', 'Please enter a comment');
      return;
    }

    if (commentText.length > 500) {
      Alert.alert('Too Long', 'Comment must be 500 characters or less');
      return;
    }

    try {
      setSubmitting(true);

      const response = await communityAPI.createComment(
        postId,
        commentText.trim(),
        replyTo?.id || null
      );

      if (response.success) {
        setCommentText('');
        setReplyTo(null);
        setComments([...comments, response.data]);

        // Update post comments count
        setPost(prev => ({
          ...prev,
          comments_count: (prev.comments_count || 0) + 1
        }));
      } else {
        Alert.alert('Error', response.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      setPost(prev => ({
        ...prev,
        user_has_liked: !prev.user_has_liked,
        likes_count: prev.user_has_liked
          ? prev.likes_count - 1
          : prev.likes_count + 1,
      }));

      const response = await communityAPI.likePost(postId);

      if (!response.success) {
        // Revert on failure
        setPost(prev => ({
          ...prev,
          user_has_liked: !prev.user_has_liked,
          likes_count: prev.user_has_liked
            ? prev.likes_count + 1
            : prev.likes_count - 1,
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setPost(prev => ({
        ...prev,
        user_has_liked: !prev.user_has_liked,
        likes_count: prev.user_has_liked
          ? prev.likes_count + 1
          : prev.likes_count - 1,
      }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await communityAPI.deleteComment(commentId);
              if (response.success) {
                // Remove comment and its replies
                setComments(prev => prev.filter(c => {
                  return c.id !== commentId && c.parent_comment_id !== commentId;
                }));

                // Update post comments count
                const deletedCount = comments.filter(c =>
                  c.id === commentId || c.parent_comment_id === commentId
                ).length;

                setPost(prev => ({
                  ...prev,
                  comments_count: Math.max((prev.comments_count || 0) - deletedCount, 0)
                }));
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getMoodEmoji = (mood) => {
    const moodMap = {
      clear: '😌',
      tired: '😤',
      anxious: '😨',
      foggy: '🌫️',
      inspired: '✨',
    };
    return moodMap[mood] || '💭';
  };

  const handleViewProfile = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowProfileModal(true);
  };

  const handleRequestCoach = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowRequestModal(true);
  };

  // Organize comments into tree structure
  const organizeComments = () => {
    const topLevel = comments.filter(c => !c.parent_comment_id);
    return topLevel.map(comment => ({
      ...comment,
      replies: comments.filter(c => c.parent_comment_id === comment.id),
    }));
  };

  const renderComment = (comment, isReply = false) => (
    <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.4)', 'rgba(147, 51, 234, 0.4)']}
          style={styles.commentAvatar}
        >
          <Text style={styles.commentAvatarText}>
            {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </LinearGradient>
        <View style={styles.commentInfo}>
          <Text style={styles.commentUserName}>{comment.user_name || 'Anonymous'}</Text>
          <Text style={styles.commentTime}>{getTimeAgo(comment.created_at)}</Text>
        </View>
        {comment.user_id === user?.id && (
          <TouchableOpacity
            onPress={() => handleDeleteComment(comment.id)}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      {!isReply && (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => {
            setReplyTo(comment);
            setCommentText('');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
        </View>
      </LinearGradient>
    );
  }

  const organizedComments = organizeComments();

  // Show loading state if post is not loaded yet
  if (loading && !post) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </LinearGradient>
    );
  }

  // If post still doesn't exist after loading, show error
  if (!post) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.alpha}
              colors={[theme.colors.alpha]}
            />
          }
        >
          {/* Post Card */}
          <View style={styles.postCard}>
            <TouchableOpacity
              style={styles.postHeader}
              onPress={() => handleViewProfile(post.user_id, post.user_name)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.4)', 'rgba(147, 51, 234, 0.4)']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.user_name || 'Anonymous'}</Text>
                <View style={styles.postMeta}>
                  <Text style={styles.timeAgo}>{getTimeAgo(post.created_at)}</Text>
                  {post.mood && (
                    <>
                      <Text style={styles.metaSeparator}>•</Text>
                      <Text style={styles.moodEmoji}>{getMoodEmoji(post.mood)}</Text>
                    </>
                  )}
                  {post.session_minutes && (
                    <>
                      <Text style={styles.metaSeparator}>•</Text>
                      <Text style={styles.sessionTime}>{post.session_minutes}min</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={handleLike}
                activeOpacity={0.7}
              >
                <Text style={[styles.likeIcon, post.user_has_liked && styles.likeIconActive]}>
                  {post.user_has_liked ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.likeCount}>{post.likes_count || 0}</Text>
              </TouchableOpacity>

              <View style={styles.commentButton}>
                <Text style={styles.commentIcon}>💬</Text>
                <Text style={styles.commentCount}>{post.comments_count || 0}</Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              COMMENTS ({post.comments_count || 0})
            </Text>

            {organizedComments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              organizedComments.map(comment => (
                <View key={comment.id}>
                  {renderComment(comment, false)}
                  {comment.replies.map(reply => renderComment(reply, true))}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          {replyTo && (
            <View style={styles.replyingTo}>
              <Text style={styles.replyingToText}>
                Replying to {replyTo.user_name}
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} activeOpacity={0.7}>
                <Text style={styles.cancelReply}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
              placeholderTextColor={theme.colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                style={styles.sendButtonGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.text} />
                ) : (
                  <Text style={styles.sendIcon}>↑</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        userId={selectedUserId}
        userName={selectedUserName}
        onClose={() => setShowProfileModal(false)}
        onRequestCoach={handleRequestCoach}
      />

      {/* Request Coach Modal */}
      <RequestCoachModal
        visible={showRequestModal}
        coachId={selectedUserId}
        coachName={selectedUserName}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          Alert.alert('Success', 'Your coaching request has been sent!');
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
  postCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  metaSeparator: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  moodEmoji: {
    fontSize: theme.fonts.sizes.sm,
  },
  sessionTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  postContent: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.1)',
    gap: theme.spacing.sm,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  likeIcon: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  likeIconActive: {
    transform: [{ scale: 1.1 }],
  },
  likeCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  commentIcon: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  commentCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  commentsSection: {
    marginBottom: theme.spacing.xl,
  },
  commentsTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  emptyComments: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  commentContainer: {
    backgroundColor: 'rgba(26, 20, 72, 0.4)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  replyContainer: {
    marginLeft: theme.spacing.xl,
    backgroundColor: 'rgba(26, 20, 72, 0.3)',
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  commentAvatarText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  commentTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  deleteIcon: {
    fontSize: 16,
  },
  commentContent: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  replyButton: {
    paddingVertical: theme.spacing.xs / 2,
  },
  replyButtonText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'rgba(26, 20, 72, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  replyingToText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  cancelReply: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  sendButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  sendIcon: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

export default PostDetailScreen;
