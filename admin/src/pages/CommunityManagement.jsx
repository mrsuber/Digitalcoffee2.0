import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Trash2, Eye, AlertCircle, Filter, X } from 'lucide-react';
import { adminCommunityAPI } from '../services/api';

export default function CommunityManagement() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedPostReports, setSelectedPostReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [postsRes, commentsRes] = await Promise.all([
        adminCommunityAPI.getPosts(),
        adminCommunityAPI.getComments()
      ]);

      setPosts(postsRes.data || []);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error('Error loading community data:', error);
      alert('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await adminCommunityAPI.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await adminCommunityAPI.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      alert('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleViewReports = async (postId) => {
    try {
      setLoadingReports(true);
      setShowReportsModal(true);
      const response = await adminCommunityAPI.getPostReports(postId);
      setSelectedPostReports(response.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredPosts = filterStatus === 'all'
    ? posts
    : filterStatus === 'reported'
    ? posts.filter(p => p.is_reported)
    : posts;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Loading community data...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Community Management</h1>
        <p style={{ color: '#6b7280' }}>Moderate posts and comments from the community</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Posts</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{posts.length}</p>
            </div>
            <MessageSquare size={32} style={{ color: '#3b82f6' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Comments</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{comments.length}</p>
            </div>
            <MessageSquare size={32} style={{ color: '#10b981' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Reported Posts</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {posts.filter(p => p.is_reported).length}
              </p>
            </div>
            <AlertCircle size={32} style={{ color: '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              padding: '1rem 0',
              borderBottom: activeTab === 'posts' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'posts' ? '#3b82f6' : '#6b7280',
              background: 'none',
              border: 'none',
              fontWeight: activeTab === 'posts' ? '600' : 'normal',
              cursor: 'pointer'
            }}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            style={{
              padding: '1rem 0',
              borderBottom: activeTab === 'comments' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'comments' ? '#3b82f6' : '#6b7280',
              background: 'none',
              border: 'none',
              fontWeight: activeTab === 'comments' ? '600' : 'normal',
              cursor: 'pointer'
            }}
          >
            Comments
          </button>
        </div>
      </div>

      {/* Filter */}
      {activeTab === 'posts' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Filter size={20} style={{ color: '#6b7280' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Posts</option>
            <option value="reported">Reported Only</option>
          </select>
        </div>
      )}

      {/* Content */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280' }}>No posts found</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="card">
                {post.is_reported && (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        Reported Content ({post.report_count || 0} {post.report_count === 1 ? 'report' : 'reports'})
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewReports(post.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #dc2626',
                        background: 'white',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: '600' }}>{post.user_name}</p>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>•</span>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{formatDate(post.created_at)}</p>
                    </div>

                    <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>{post.content}</p>

                    <div style={{ display: 'flex', gap: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Heart size={16} />
                        {post.likes_count}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MessageSquare size={16} />
                        {post.comments_count}
                      </span>
                      {post.report_count > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626' }}>
                          <AlertCircle size={16} />
                          {post.report_count}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: '#fee2e2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    title="Delete post"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280' }}>No comments found</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: '600' }}>{comment.user_name}</p>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>•</span>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{formatDate(comment.created_at)}</p>
                    </div>

                    <p style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>{comment.content}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>On post #{comment.post_id}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: '#fee2e2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    title="Delete comment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Report Details</h2>
              <button
                onClick={() => setShowReportsModal(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: '#f3f4f6',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingReports ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Loading reports...</p>
            ) : selectedPostReports.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No reports found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedPostReports.map((report) => (
                  <div key={report.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{report.reporter_name}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{report.reporter_email}</p>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(report.created_at)}</p>
                    </div>
                    {report.reason && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#f9fafb',
                        borderRadius: '0.25rem'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          <strong>Reason:</strong> {report.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
