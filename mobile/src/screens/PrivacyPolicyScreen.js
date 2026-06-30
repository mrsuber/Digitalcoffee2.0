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

export const PrivacyPolicyScreen = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Last Updated */}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>Last Updated: June 10, 2024</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Digital Coffee ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </Text>
          <Text style={styles.paragraph}>
            By using Digital Coffee, you agree to the collection and use of information in accordance with this policy.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>

          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you create an account, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Full name</Text>
            <Text style={styles.bullet}>• Email address</Text>
            <Text style={styles.bullet}>• Password (encrypted)</Text>
            <Text style={styles.bullet}>• Subscription status and payment information</Text>
          </View>

          <Text style={styles.subsectionTitle}>Usage Information</Text>
          <Text style={styles.paragraph}>
            We automatically collect certain information when you use our app:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Mood check-in data and history</Text>
            <Text style={styles.bullet}>• Audio listening sessions and duration</Text>
            <Text style={styles.bullet}>• Course progress and completion</Text>
            <Text style={styles.bullet}>• Journal entries (stored securely)</Text>
            <Text style={styles.bullet}>• Focus session statistics</Text>
            <Text style={styles.bullet}>• Community posts and interactions</Text>
            <Text style={styles.bullet}>• Device information and app usage patterns</Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the collected information for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Providing and maintaining our services</Text>
            <Text style={styles.bullet}>• Personalizing your experience and content recommendations</Text>
            <Text style={styles.bullet}>• Processing payments and managing subscriptions</Text>
            <Text style={styles.bullet}>• Analyzing usage patterns to improve our app</Text>
            <Text style={styles.bullet}>• Sending important updates and notifications</Text>
            <Text style={styles.bullet}>• Connecting you with professional coaches (Premium members)</Text>
            <Text style={styles.bullet}>• Responding to support requests and feedback</Text>
            <Text style={styles.bullet}>• Ensuring app security and preventing fraud</Text>
          </View>
        </View>

        {/* Data Storage and Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your personal information:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• All data is encrypted in transit using SSL/TLS</Text>
            <Text style={styles.bullet}>• Passwords are hashed using bcrypt encryption</Text>
            <Text style={styles.bullet}>• Data is stored on secure servers with restricted access</Text>
            <Text style={styles.bullet}>• Regular security audits and updates</Text>
            <Text style={styles.bullet}>• Payment information is processed through Stripe (PCI-compliant)</Text>
          </View>
          <Text style={styles.paragraph}>
            While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing and Disclosure</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• With professional coaches when you initiate coaching sessions (Premium feature)</Text>
            <Text style={styles.bullet}>• With service providers who assist in operating our app (hosting, analytics, payment processing)</Text>
            <Text style={styles.bullet}>• When required by law or to protect our rights</Text>
            <Text style={styles.bullet}>• In connection with a business transfer or acquisition</Text>
          </View>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Access your personal data</Text>
            <Text style={styles.bullet}>• Update or correct your information</Text>
            <Text style={styles.bullet}>• Delete your account and associated data</Text>
            <Text style={styles.bullet}>• Export your data</Text>
            <Text style={styles.bullet}>• Opt-out of marketing communications</Text>
            <Text style={styles.bullet}>• Withdraw consent for data processing</Text>
          </View>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact us at privacy@digitalcoffee.cafe or use the Account Deletion feature in the app settings.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal information for as long as your account is active or as needed to provide services. When you delete your account:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Your account is marked as deleted immediately</Text>
            <Text style={styles.bullet}>• Personal data is anonymized for analytics purposes</Text>
            <Text style={styles.bullet}>• Complete deletion occurs within 30 days</Text>
            <Text style={styles.bullet}>• Some data may be retained for legal compliance (e.g., payment records)</Text>
          </View>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Digital Coffee is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will promptly delete it.
          </Text>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
          </Text>
          <Text style={styles.paragraph}>
            We use the following third-party services:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Stripe for payment processing</Text>
            <Text style={styles.bullet}>• Analytics providers for app improvement</Text>
            <Text style={styles.bullet}>• Cloud hosting services for data storage</Text>
          </View>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Posting the new Privacy Policy on this page</Text>
            <Text style={styles.bullet}>• Updating the "Last Updated" date</Text>
            <Text style={styles.bullet}>• Sending you an email notification for significant changes</Text>
          </View>
          <Text style={styles.paragraph}>
            Your continued use of the app after changes indicates acceptance of the updated policy.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>📧 Email: privacy@digitalcoffee.cafe</Text>
            <Text style={styles.contactText}>🌐 Website: digitalcoffee.cafe</Text>
            <Text style={styles.contactText}>📱 In-App: Help & Support section</Text>
          </View>
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
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});

export default PrivacyPolicyScreen;
