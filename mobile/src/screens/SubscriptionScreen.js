import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SubscriptionScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [publishableKey, setPublishableKey] = useState('pk_test_51JLaHtBBZYlnWgxJEWpAoMZwh0wQPlafhJabaSASYYqiajF40exKqHTKmErb2ButSJRwgHdfxOuqfjNzy8yVTPvz00SF3r6UZj');

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      if (response.success) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error('Load subscription status error:', error);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited access to all courses',
        'Access to all premium audio content',
        'Advanced mood tracking',
        'Priority support',
        'Ad-free experience',
      ],
      badge: null,
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$99.99',
      period: 'per year',
      savings: 'Save $19.89/year',
      features: [
        'Unlimited access to all courses',
        'Access to all premium audio content',
        'Advanced mood tracking',
        'Priority support',
        'Ad-free experience',
        'Best value - 2 months free!',
      ],
      badge: 'BEST VALUE',
    },
  ];

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Step 1: Create payment intent
      console.log('Creating payment intent for plan:', selectedPlan);
      const response = await subscriptionAPI.createPaymentIntent(selectedPlan);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment intent');
      }

      const { client_secret, publishable_key, amount } = response.data;
      console.log('Payment intent created:', { client_secret: client_secret?.substring(0, 20) + '...', amount });

      // Store publishable key if returned
      if (publishable_key) {
        setPublishableKey(publishable_key);
      }

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Digital Coffee',
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          email: user?.email,
          name: user?.name,
        },
        appearance: {
          colors: {
            primary: '#D4AF37',
            background: '#1A1A1A',
            componentBackground: '#2A2A2A',
            componentBorder: '#3A3A3A',
            componentDivider: '#3A3A3A',
            primaryText: '#FFFFFF',
            secondaryText: '#CCCCCC',
            componentText: '#FFFFFF',
            placeholderText: '#999999',
          },
        },
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        throw new Error(initError.message || 'Failed to initialize payment');
      }

      // Step 3: Present payment sheet
      const { error: presentError, paymentOption } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment cancelled by user');
          return;
        }
        console.error('Payment sheet present error:', presentError);
        throw new Error(presentError.message || 'Payment failed');
      }

      // Step 4: Confirm payment on backend
      console.log('Confirming payment...');
      const confirmResponse = await subscriptionAPI.confirmPayment(
        client_secret.split('_secret_')[0], // Extract payment intent ID
        selectedPlan
      );

      if (confirmResponse.success) {
        // Update user object in AsyncStorage with new subscription status
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const updatedUser = {
            ...JSON.parse(userData),
            subscription_status: 'premium',
            subscription_expires_at: confirmResponse.data.expires_at
          };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Refresh user data from AsyncStorage
        await refreshUser();

        // Reload subscription status
        await loadSubscriptionStatus();

        Alert.alert(
          'Success!',
          'Your subscription has been activated. Welcome to Premium!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(confirmResponse.message || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You will still have access until the end of your billing period.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await subscriptionAPI.cancel();

              if (response.success) {
                // Update user object in AsyncStorage
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                  const updatedUser = {
                    ...JSON.parse(userData),
                    subscription_status: 'free',
                  };
                  await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }

                // Refresh user data
                await refreshUser();

                // Reload subscription status
                await loadSubscriptionStatus();

                Alert.alert(
                  'Subscription Cancelled',
                  response.message || 'Your subscription has been cancelled successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                throw new Error(response.message || 'Failed to cancel subscription');
              }
            } catch (error) {
              console.error('Cancel subscription error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to cancel subscription. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderPlanCard = (plan) => {
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        activeOpacity={0.8}
        onPress={() => setSelectedPlan(plan.id)}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
        ]}
      >
        {plan.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={styles.planNameContainer}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.savings && (
              <Text style={styles.planSavings}>{plan.savings}</Text>
            )}
          </View>
          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // Check if user already has premium
  const isPremium = user?.subscription_status === 'premium';
  const isActive = subscriptionStatus?.is_active;

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1A1A1A', '#2D1810']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upgrade to Premium</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Premium Status */}
            {isPremium && isActive ? (
              <View style={styles.statusCard}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                <Text style={styles.statusTitle}>You're Premium!</Text>
                <Text style={styles.statusText}>
                  {subscriptionStatus?.expires_at &&
                    `Your subscription expires on ${new Date(subscriptionStatus.expires_at).toLocaleDateString()}`}
                </Text>

                {/* Cancel Subscription Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>
                    {loading ? 'Processing...' : 'Cancel Subscription'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Hero Section */}
                <View style={styles.hero}>
                  <Ionicons name="diamond" size={60} color="#D4AF37" />
                  <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
                  <Text style={styles.heroSubtitle}>
                    Get unlimited access to all premium features and transform your mindfulness journey
                  </Text>
                </View>

                {/* Plans */}
                <View style={styles.plansContainer}>
                  <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                  {plans.map(plan => renderPlanCard(plan))}
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                  style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
                  onPress={handleSubscribe}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#C19A2E']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1A1A1A" />
                    ) : (
                      <Text style={styles.subscribeButtonText}>
                        Subscribe Now
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    • Secure payment powered by Stripe
                  </Text>
                  <Text style={styles.infoText}>
                    • Cancel anytime, no questions asked
                  </Text>
                  <Text style={styles.infoText}>
                    • 7-day money-back guarantee
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#2A2A2A',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#2D2410',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planNameContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  planSavings: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
  radioContainer: {
    padding: 4,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#D4AF37',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
  },
  planPeriod: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#CCC',
    flex: 1,
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  infoContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default SubscriptionScreen;
