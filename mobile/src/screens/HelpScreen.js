import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import FeedbackModal from '../components/FeedbackModal';

const FAQ_DATA = [
  {
    id: 1,
    question: 'What is Digital Coffee?',
    answer: 'Digital Coffee is a mental wellness app designed to help you manage stress, improve focus, and enhance your overall mental well-being through guided meditations, mood tracking, focus exercises, and professional coaching.',
  },
  {
    id: 2,
    question: 'How do I upgrade to Premium?',
    answer: 'Go to your Profile screen and tap on "Upgrade to Premium". You can choose between monthly ($9.99) or yearly ($99.99) subscription plans. Premium members get access to all audio content, professional coaches, and advanced features.',
  },
  {
    id: 3,
    question: 'What features are included in Premium?',
    answer: 'Premium members get: unlimited access to all audio content (meditations, binaural beats, affirmations), professional coaching services, advanced progress analytics, priority support, and new features as they\'re released.',
  },
  {
    id: 4,
    question: 'How do I track my mood?',
    answer: 'You can log your mood on the Home screen by selecting one of the mood options (Clear, Tired, or Anxious). You can also view your mood history and trends in the Progress section.',
  },
  {
    id: 5,
    question: 'How do focus sessions work?',
    answer: 'Focus sessions help you concentrate through various techniques: audio sessions with binaural beats, guided meditations, timed focus periods, and breathing exercises. You can access them from the Focus tab.',
  },
  {
    id: 6,
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your Premium subscription at any time from your Account Details screen. You\'ll continue to have access until the end of your billing period.',
  },
  {
    id: 7,
    question: 'What are binaural beats?',
    answer: 'Binaural beats are audio frequencies that can help induce different mental states. Alpha waves promote relaxation, Beta waves enhance focus, Theta waves aid meditation, and Delta waves support deep sleep.',
  },
  {
    id: 8,
    question: 'How do I contact a professional coach?',
    answer: 'Premium members can browse professional coaches in the Coaching Hub. Select a coach, view their profile, and send a coaching request. Once accepted, you can message them directly.',
  },
];

const CONTACT_OPTIONS = [
  {
    id: 1,
    icon: '📧',
    title: 'Email Support',
    subtitle: 'info@digitalcoffee.cafe',
    action: () => Linking.openURL('mailto:info@digitalcoffee.cafe?subject=Digital Coffee Support Request'),
  },
  {
    id: 2,
    icon: '🌐',
    title: 'Visit Website',
    subtitle: 'digitalcoffee.cafe',
    action: () => Linking.openURL('https://digitalcoffee.cafe'),
  },
  {
    id: 3,
    icon: '📱',
    title: 'Report a Bug',
    subtitle: 'Help us improve',
    type: 'feedback',
    feedbackType: 'bug',
  },
  {
    id: 4,
    icon: '💡',
    title: 'Feature Request',
    subtitle: 'Share your ideas',
    type: 'feedback',
    feedbackType: 'feature_request',
  },
];

const QUICK_LINKS = [
  {
    id: 1,
    icon: '📜',
    title: 'Privacy Policy',
    type: 'navigate',
    screen: 'PrivacyPolicy',
  },
  {
    id: 2,
    icon: '📋',
    title: 'Terms of Service',
    type: 'navigate',
    screen: 'TermsOfService',
  },
  {
    id: 3,
    icon: '🔒',
    title: 'Data Security',
    type: 'alert',
    action: () => Alert.alert(
      'Data Security',
      'Your data is encrypted and stored securely. We never share your personal information with third parties without your consent. All payment information is processed through Stripe, a PCI-compliant payment processor.',
      [{ text: 'OK' }]
    ),
  },
];

export const HelpScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactOption = async (option) => {
    try {
      if (option.type === 'feedback') {
        setFeedbackType(option.feedbackType);
        setShowFeedbackModal(true);
      } else if (option.action) {
        await option.action();
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open link. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientMid, theme.colors.gradientEnd]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeEmoji}>🤝</Text>
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeSubtitle}>
            Find answers to common questions or get in touch with our support team
          </Text>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GET IN TOUCH</Text>
          <View style={styles.contactGrid}>
            {CONTACT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.contactCard}
                onPress={() => handleContactOption(option)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(26, 20, 72, 0.6)', 'rgba(15, 10, 50, 0.6)']}
                  style={styles.contactCardInner}
                >
                  <Text style={styles.contactIcon}>{option.icon}</Text>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.8}
              >
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Text style={styles.faqToggle}>
                    {expandedFAQ === faq.id ? '−' : '+'}
                  </Text>
                </View>
                {expandedFAQ === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK LINKS</Text>
          <View style={styles.quickLinksContainer}>
            {QUICK_LINKS.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={styles.quickLinkItem}
                onPress={() => {
                  if (link.type === 'navigate') {
                    navigation.navigate(link.screen);
                  } else if (link.type === 'alert' && link.action) {
                    link.action();
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.quickLinkContent}>
                  <Text style={styles.quickLinkIcon}>{link.icon}</Text>
                  <Text style={styles.quickLinkTitle}>{link.title}</Text>
                </View>
                <Text style={styles.quickLinkArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Digital Coffee v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Digital Coffee. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        type={feedbackType}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 60,
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  contactCardInner: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: theme.borderRadius.lg,
    minHeight: 140,
    justifyContent: 'center',
  },
  contactIcon: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  contactTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  faqContainer: {
    gap: theme.spacing.sm,
  },
  faqItem: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    paddingRight: theme.spacing.md,
  },
  faqToggle: {
    fontSize: 24,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  faqAnswer: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  quickLinksContainer: {
    gap: theme.spacing.sm,
  },
  quickLinkItem: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  quickLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  quickLinkIcon: {
    fontSize: 24,
  },
  quickLinkTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickLinkArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  copyrightText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
});

export default HelpScreen;
