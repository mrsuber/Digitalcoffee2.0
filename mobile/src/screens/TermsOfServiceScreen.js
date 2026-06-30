import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

export const TermsOfServiceScreen = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Last Updated */}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>Last Updated: June 10, 2024</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            Welcome to Digital Coffee. By accessing or using our mobile application, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our app.
          </Text>
          <Text style={styles.paragraph}>
            These Terms constitute a legally binding agreement between you and Digital Coffee. Please read them carefully.
          </Text>
        </View>

        {/* Service Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Description</Text>
          <Text style={styles.paragraph}>
            Digital Coffee is a mental wellness platform that provides:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Guided meditation and audio content</Text>
            <Text style={styles.bullet}>• Mood tracking and analytics</Text>
            <Text style={styles.bullet}>• Focus sessions with binaural beats</Text>
            <Text style={styles.bullet}>• Personal journaling features</Text>
            <Text style={styles.bullet}>• Wellness courses and programs</Text>
            <Text style={styles.bullet}>• Community support features</Text>
            <Text style={styles.bullet}>• Professional coaching services (Premium)</Text>
          </View>
          <Text style={styles.paragraph}>
            We reserve the right to modify, suspend, or discontinue any part of our services at any time.
          </Text>
        </View>

        {/* User Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Accounts</Text>

          <Text style={styles.subsectionTitle}>Account Creation</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• You must be at least 13 years old to use Digital Coffee</Text>
            <Text style={styles.bullet}>• You must provide accurate and complete information</Text>
            <Text style={styles.bullet}>• You are responsible for maintaining account security</Text>
            <Text style={styles.bullet}>• One person may not maintain multiple accounts</Text>
          </View>

          <Text style={styles.subsectionTitle}>Account Security</Text>
          <Text style={styles.paragraph}>
            You are responsible for all activities that occur under your account. You must:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Keep your password confidential</Text>
            <Text style={styles.bullet}>• Notify us immediately of any unauthorized access</Text>
            <Text style={styles.bullet}>• Not share your account with others</Text>
          </View>
        </View>

        {/* Subscription and Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription and Payments</Text>

          <Text style={styles.subsectionTitle}>Free Tier</Text>
          <Text style={styles.paragraph}>
            Our free tier provides access to basic features including limited audio content, mood tracking, and community features.
          </Text>

          <Text style={styles.subsectionTitle}>Premium Subscription</Text>
          <Text style={styles.paragraph}>
            Premium subscriptions are offered on a monthly or yearly basis:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Monthly: $9.99/month</Text>
            <Text style={styles.bullet}>• Yearly: $99.99/year (2 months free)</Text>
          </View>

          <Text style={styles.subsectionTitle}>Payment Terms</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Subscriptions automatically renew unless cancelled</Text>
            <Text style={styles.bullet}>• You will be charged at the beginning of each billing period</Text>
            <Text style={styles.bullet}>• All payments are processed securely through Stripe</Text>
            <Text style={styles.bullet}>• Prices are subject to change with 30 days notice</Text>
            <Text style={styles.bullet}>• No refunds for partial subscription periods</Text>
          </View>

          <Text style={styles.subsectionTitle}>Cancellation</Text>
          <Text style={styles.paragraph}>
            You may cancel your subscription at any time through the Account Details screen. Cancellation takes effect at the end of the current billing period. You will retain Premium access until then.
          </Text>
        </View>

        {/* User Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Use the app for any illegal purpose</Text>
            <Text style={styles.bullet}>• Harass, abuse, or harm other users</Text>
            <Text style={styles.bullet}>• Post offensive, threatening, or inappropriate content</Text>
            <Text style={styles.bullet}>• Spam or send unsolicited messages</Text>
            <Text style={styles.bullet}>• Attempt to gain unauthorized access to our systems</Text>
            <Text style={styles.bullet}>• Reverse engineer or copy our app</Text>
            <Text style={styles.bullet}>• Use automated systems to access our services</Text>
            <Text style={styles.bullet}>• Impersonate others or misrepresent your affiliation</Text>
          </View>
          <Text style={styles.paragraph}>
            Violation of these terms may result in account suspension or termination.
          </Text>
        </View>

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content and Intellectual Property</Text>

          <Text style={styles.subsectionTitle}>Our Content</Text>
          <Text style={styles.paragraph}>
            All content provided by Digital Coffee (audio, text, graphics, logos) is owned by us or our licensors and protected by copyright and trademark laws. You may not:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Download or distribute our content without permission</Text>
            <Text style={styles.bullet}>• Use our content for commercial purposes</Text>
            <Text style={styles.bullet}>• Remove copyright or trademark notices</Text>
          </View>

          <Text style={styles.subsectionTitle}>Your Content</Text>
          <Text style={styles.paragraph}>
            When you create content (journal entries, community posts, feedback):
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• You retain ownership of your content</Text>
            <Text style={styles.bullet}>• You grant us a license to use, store, and display it</Text>
            <Text style={styles.bullet}>• You confirm you have the right to share this content</Text>
            <Text style={styles.bullet}>• We may remove content that violates these Terms</Text>
          </View>
        </View>

        {/* Professional Coaching */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Coaching Services</Text>
          <Text style={styles.paragraph}>
            Premium members have access to professional coaches. Important disclaimers:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Coaches provide guidance and support, not medical treatment</Text>
            <Text style={styles.bullet}>• Coaching is not a substitute for professional mental health care</Text>
            <Text style={styles.bullet}>• We do not guarantee specific results from coaching</Text>
            <Text style={styles.bullet}>• Coach-client communications are confidential but not privileged</Text>
            <Text style={styles.bullet}>• You may discontinue coaching at any time</Text>
          </View>
          <Text style={styles.importantNote}>
            ⚠️ If you are experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.
          </Text>
        </View>

        {/* Disclaimers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimers and Limitations</Text>

          <Text style={styles.subsectionTitle}>Medical Disclaimer</Text>
          <Text style={styles.paragraph}>
            Digital Coffee is a wellness tool, not a medical device or treatment. Our app:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Does not diagnose, treat, or cure any medical condition</Text>
            <Text style={styles.bullet}>• Should not replace professional medical advice</Text>
            <Text style={styles.bullet}>• Is intended for general wellness purposes only</Text>
          </View>

          <Text style={styles.subsectionTitle}>Service Availability</Text>
          <Text style={styles.paragraph}>
            We provide our services "as is" without warranties of any kind. We do not guarantee:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Uninterrupted or error-free service</Text>
            <Text style={styles.bullet}>• Specific results or outcomes</Text>
            <Text style={styles.bullet}>• Compatibility with all devices</Text>
            <Text style={styles.bullet}>• Availability of specific features</Text>
          </View>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, Digital Coffee shall not be liable for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Indirect, incidental, or consequential damages</Text>
            <Text style={styles.bullet}>• Loss of profits, data, or business opportunities</Text>
            <Text style={styles.bullet}>• Damages exceeding the amount paid for Premium subscription</Text>
            <Text style={styles.bullet}>• Issues arising from third-party services or content</Text>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.paragraph}>
            Your use of Digital Coffee is also governed by our Privacy Policy. By using our app, you consent to our data practices as described in the Privacy Policy.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Violation of these Terms</Text>
            <Text style={styles.bullet}>• Fraudulent or illegal activity</Text>
            <Text style={styles.bullet}>• Non-payment of subscription fees</Text>
            <Text style={styles.bullet}>• Prolonged inactivity</Text>
          </View>
          <Text style={styles.paragraph}>
            You may delete your account at any time through the app settings. Upon termination, your access to Premium features will cease immediately, but you will retain access to free features during any remaining subscription period.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms at any time. When we make changes:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• We will update the "Last Updated" date</Text>
            <Text style={styles.bullet}>• We will notify you via email or in-app notification</Text>
            <Text style={styles.bullet}>• Continued use constitutes acceptance of new Terms</Text>
            <Text style={styles.bullet}>• Material changes will be communicated 30 days in advance</Text>
          </View>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law and Disputes</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by the laws of the jurisdiction where Digital Coffee operates. Any disputes will be resolved through:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Good faith negotiations first</Text>
            <Text style={styles.bullet}>• Binding arbitration if negotiations fail</Text>
            <Text style={styles.bullet}>• Small claims court for qualifying claims</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>📧 Email: legal@digitalcoffee.cafe</Text>
            <Text style={styles.contactText}>🌐 Website: digitalcoffee.cafe</Text>
            <Text style={styles.contactText}>📱 In-App: Help & Support section</Text>
          </View>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceText}>
            By using Digital Coffee, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Digital Coffee. All rights reserved.</Text>
        </View>
      </ScrollView>
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
    marginBottom: theme.spacing.lg,
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
  updateInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  updateText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subsectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  bulletList: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  bullet: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: 4,
  },
  importantNote: {
    fontSize: theme.fonts.sizes.sm,
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    lineHeight: 20,
  },
  contactInfo: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  contactText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  acceptanceBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  acceptanceText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});

export default TermsOfServiceScreen;
