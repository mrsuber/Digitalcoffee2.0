import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';
import RequestCoachModal from '../components/RequestCoachModal';

const CommunityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (offset = 0, isRefresh = false) => {
    try {
      if (offset === 0 && !isRefresh) {
        setLoading(true);
      }

      const response = await communityAPI.getPosts(20, offset);
      console.log('CommunityScreen - Posts API response:', JSON.stringify(response).substring(0, 500));

      if (response.success) {
        const newPosts = response.data || [];
        console.log('CommunityScreen - First post:', newPosts[0]);
        console.log('CommunityScreen - First post user_id:', newPosts[0]?.user_id);

        if (offset === 0) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasMore(newPosts.length === 20);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts(0, true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadPosts(posts.length);
    }
  };

  const handleLike = async (postId, currentlyLiked) => {
    try {
      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                user_has_liked: !currentlyLiked,
                likes_count: currentlyLiked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );

      const response = await communityAPI.likePost(postId);

      if (!response.success) {
        // Revert on failure
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  user_has_liked: currentlyLiked,
                  likes_count: currentlyLiked
                    ? post.likes_count + 1
                    : post.likes_count - 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                user_has_liked: currentlyLiked,
                likes_count: currentlyLiked
                  ? post.likes_count + 1
                  : post.likes_count - 1,
              }
            : post
        )
      );
    }
  };

  const handleReport = (postId) => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post? Our team will review it.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await communityAPI.reportPost(postId);
              if (response.success) {
                Alert.alert('Success', response.message || 'Post reported successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to report post');
              }
            } catch (error) {
              console.error('Error reporting post:', error);
              Alert.alert('Error', 'Failed to report post');
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
    if (userId === user?.id) {
      // Navigate to own profile screen instead
      navigation.navigate('Profile');
      return;
    }
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowProfileModal(true);
  };

  const handleRequestCoach = () => {
    setShowProfileModal(false);
    setTimeout(() => {
      setShowRequestModal(true);
    }, 300);
  };

  const handleRequestSubmitted = () => {
    setShowRequestModal(false);
    loadPosts(0, true);
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id, post: item })}
      activeOpacity={0.95}
    >
      <TouchableOpacity
        style={styles.postHeader}
        onPress={(e) => {
          e.stopPropagation();
          handleViewProfile(item.user_id, item.user_name);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.4)', 'rgba(147, 51, 234, 0.4)']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user_name || 'Anonymous'}</Text>
          <View style={styles.postMeta}>
            <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
            {item.mood && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
              </>
            )}
            {item.session_minutes && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.sessionTime}>{item.session_minutes}min</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postActions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLike(item.id, item.user_has_liked);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.likeIcon, item.user_has_liked && styles.likeIconActive]}>
              {item.user_has_liked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.likeCount}>{item.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commentButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('PostDetail', { postId: item.id, post: item });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.commentIcon}>💬</Text>
            <Text style={styles.commentCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
        </View>

        {item.user_id !== user?.id && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={(e) => {
              e.stopPropagation();
              handleReport(item.id);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.reportIcon}>⚠️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌟</Text>
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to share your meditation journey with the community!
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={theme.colors.alpha} />
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Always navigate to Courses screen (Library default)
            navigation.navigate('Courses');
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>COMMUNITY</Text>
          <Text style={styles.headerSubtitle}>Share your meditation journey</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreatePost')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.alpha, theme.colors.theta]}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonText}>+ Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.alpha}
            colors={[theme.colors.alpha]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
        userName={selectedUserName}
        onRequestCoach={handleRequestCoach}
      />

      <RequestCoachModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        coachId={selectedUserId}
        coachName={selectedUserName}
        onSuccess={handleRequestSubmitted}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text,
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  createButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  postCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
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
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.1)',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  reportButton: {
    padding: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  reportIcon: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
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
    lineHeight: 22,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingMore: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
});

export default CommunityScreen;
