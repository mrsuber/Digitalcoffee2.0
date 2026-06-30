import React, { useState, useEffect } from 'react';
import { coachAPI } from '../services/api';
import { Star, Award } from 'lucide-react';

export default function CoachReviews() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsRes = await coachAPI.getReviews();

      // Handle the response - backend returns { success, reviews }
      const reviewsList = reviewsRes.reviews || [];
      setReviews(reviewsList);

      // Calculate average rating from reviews
      const avgRating = reviewsList.length > 0
        ? reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length
        : 0;

      setAnalytics({
        avg_rating: avgRating,
        total_reviews: reviewsList.length
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      alert('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading reviews...</div>
      </div>
    );
  }

  const avgRating = analytics?.avg_rating ? parseFloat(analytics.avg_rating) : 0;
  const ratingDistribution = calculateRatingDistribution(reviews);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          My Reviews
        </h1>
        <p style={{ color: '#666' }}>
          {reviews.length} total review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Rating Overview */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Rating Overview
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '2rem',
          alignItems: 'center'
        }}>
          {/* Average Rating */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '1rem'
            }}>
              <Award size={32} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {avgRating.toFixed(1)}
              </p>
            </div>
            <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>Average Rating</p>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Based on {reviews.length} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div
                  key={rating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    minWidth: '80px'
                  }}>
                    <span style={{ fontWeight: '500' }}>{rating}</span>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  </div>

                  <div style={{
                    flex: 1,
                    height: '24px',
                    background: '#e5e7eb',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(to right, #f59e0b, #d97706)',
                      transition: 'width 0.3s'
                    }} />
                  </div>

                  <span style={{
                    minWidth: '60px',
                    textAlign: 'right',
                    color: '#666',
                    fontSize: '0.875rem'
                  }}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          All Reviews
        </h2>

        {reviews.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
            No reviews yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function calculateRatingDistribution(reviews) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating]++;
    }
  });
  return distribution;
}

function ReviewCard({ review }) {
  const studentName = review.user_name || 'Anonymous';
  const feedbackText = review.review;

  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: review.avatar_url ? `url(${review.avatar_url})` : '#3b82f6',
            backgroundSize: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '1.125rem'
          }}>
            {!review.avatar_url && studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
              {studentName}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={20}
              fill={i < review.rating ? '#f59e0b' : 'none'}
              color={i < review.rating ? '#f59e0b' : '#d1d5db'}
            />
          ))}
        </div>
      </div>

      {feedbackText && (
        <p style={{
          fontSize: '0.9375rem',
          color: '#374151',
          lineHeight: '1.6',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          borderLeft: '3px solid #f59e0b'
        }}>
          "{feedbackText}"
        </p>
      )}

      {review.is_verified && (
        <div style={{ marginTop: '1rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.375rem 0.75rem',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            ✓ Verified Review
          </span>
        </div>
      )}
    </div>
  );
}
