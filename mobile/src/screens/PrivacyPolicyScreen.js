import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { theme } from '../utils/theme';
import { legalAPI } from '../services/api';

export const PrivacyPolicyScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, []);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await legalAPI.getPrivacyPolicy();

      if (response.success) {
        setDocument(response.data);
      } else {
        setError('Failed to load Privacy Policy');
      }
    } catch (err) {
      console.error('Error loading Privacy Policy:', err);
      setError('Failed to load Privacy Policy');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientMid, theme.colors.gradientEnd]}
      style={styles.container}
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading Privacy Policy...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadDocument}
            style={styles.retryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Last Updated */}
          {document?.last_updated && (
            <View style={styles.updateInfo}>
              <Text style={styles.updateText}>
                Last Updated: {formatDate(document.last_updated)}
              </Text>
              {document?.version && (
                <Text style={styles.versionText}>Version {document.version}</Text>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>
              {document?.content || ''}
            </Markdown>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Digital Coffee. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
    paddingBottom: theme.spacing.md,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fonts.sizes.md,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.alpha,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  updateInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
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
  versionText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  markdownContainer: {
    marginBottom: theme.spacing.xl,
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

// Markdown styles
const markdownStyles = {
  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  heading1: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  heading2: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  heading3: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  paragraph: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  strong: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  ordered_list: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  list_item: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 24,
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: theme.colors.alpha,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  blockquote: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.alpha,
    paddingLeft: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
};

export default PrivacyPolicyScreen;
