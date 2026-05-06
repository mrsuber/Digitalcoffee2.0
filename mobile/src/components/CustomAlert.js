import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

export const CustomAlert = ({ visible, type = 'info', title, message, onClose, buttons }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: '#14b8a6', gradient: ['#14b8a6', '#0d9488'] };
      case 'error':
        return { icon: '✕', color: '#ef4444', gradient: ['#ef4444', '#dc2626'] };
      case 'warning':
        return { icon: '⚠', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] };
      default:
        return { icon: 'ℹ', color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] };
    }
  };

  const { icon, color, gradient } = getIconAndColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.98)', 'rgba(26, 20, 72, 0.98)']}
            style={styles.alertContent}
          >
            {/* Icon */}
            <LinearGradient
              colors={gradient}
              style={styles.iconContainer}
            >
              <Text style={styles.icon}>{icon}</Text>
            </LinearGradient>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons ? (
                buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'cancel' && styles.cancelButton,
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => {
                      if (button.onPress) button.onPress();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    {button.style === 'cancel' ? (
                      <View style={styles.cancelButtonInner}>
                        <Text style={styles.cancelButtonText}>{button.text}</Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={gradient}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>{button.text}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.singleButton]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradient}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>OK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Decorative border */}
            <View style={[styles.borderTop, { backgroundColor: color }]} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook for easier usage
export const useAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: null,
  });

  const showAlert = (config) => {
    setAlertConfig({
      visible: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      buttons: config.buttons || null,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onClose={hideAlert}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: width - 60,
    maxWidth: 340,
  },
  alertContent: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
  singleButton: {
    flex: 1,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: theme.fonts.sizes.md,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    flex: 1,
  },
  cancelButtonInner: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default CustomAlert;
