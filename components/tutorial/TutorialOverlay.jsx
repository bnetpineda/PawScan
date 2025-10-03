import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  useColorScheme,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTutorial } from '../../providers/TutorialProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TutorialOverlay = ({ steps, tutorialId, onComplete }) => {
  const { currentStep, isActive, tutorialType, nextStep, previousStep, skipTutorial, completeTutorial } = useTutorial();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    if (isActive && tutorialType === tutorialId) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [isActive, currentStep, tutorialType, tutorialId]);

  // Only show if this is the active tutorial
  if (!isActive || !steps || steps.length === 0 || tutorialType !== tutorialId) {
    return null;
  }

  // Ensure currentStep is within bounds
  if (currentStep >= steps.length || currentStep < 0) {
    return null;
  }

  const step = steps[currentStep];
  
  // Additional safety check
  if (!step) {
    return null;
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
      onComplete && onComplete();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    skipTutorial();
    onComplete && onComplete();
  };

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Semi-transparent backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.85],
              }),
            },
          ]}
        />

        {/* Highlight area */}
        {step.highlightArea && (
          <View
            style={[
              styles.highlightBox,
              isDark && styles.highlightBoxDark,
              {
                top: step.highlightArea.top || 0,
                left: step.highlightArea.left || 0,
                width: step.highlightArea.width || 100,
                height: step.highlightArea.height || 100,
                borderRadius: step.highlightArea.borderRadius || 8,
              },
            ]}
          />
        )}

        {/* Tutorial card */}
        <Animated.View
          style={[
            styles.tutorialCard,
            isDark && styles.tutorialCardDark,
            {
              top: step.position?.top || SCREEN_HEIGHT / 2 - 150,
              left: step.position?.left || 20,
              right: step.position?.right || 20,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          {step.icon && (
            <View style={styles.iconContainer}>
              {step.icon.type === 'FontAwesome' ? (
                <FontAwesome name={step.icon.name} size={32} color={isDark ? '#d4d4d4' : '#525252'} />
              ) : (
                <MaterialIcons name={step.icon.name} size={32} color={isDark ? '#d4d4d4' : '#525252'} />
              )}
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, isDark && styles.titleDark]}>{step.title}</Text>

          {/* Description */}
          <Text style={[styles.description, isDark && styles.descriptionDark]}>{step.description}</Text>

          {/* Additional tip */}
          {step.tip && (
            <View style={[styles.tipContainer, isDark && styles.tipContainerDark]}>
              <MaterialIcons name="lightbulb-outline" size={16} color={isDark ? '#a3a3a3' : '#737373'} />
              <Text style={[styles.tipText, isDark && styles.tipTextDark]}>{step.tip}</Text>
            </View>
          )}

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  isDark && styles.progressDotDark,
                  index === currentStep && (isDark ? styles.progressDotActiveDark : styles.progressDotActive),
                ]}
              />
            ))}
          </View>

          {/* Step counter */}
          <Text style={[styles.stepCounter, isDark && styles.stepCounterDark]}>
            {currentStep + 1} of {steps.length}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!isFirstStep && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, isDark && styles.secondaryButtonDark]}
                onPress={previousStep}
              >
                <FontAwesome name="chevron-left" size={12} color={isDark ? '#d4d4d4' : '#525252'} />
                <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, isDark && styles.skipButtonTextDark]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isDark && styles.primaryButtonDark]}
              onPress={handleNext}
            >
              <Text style={[styles.primaryButtonText, isDark && styles.primaryButtonTextDark]}>
                {isLastStep ? 'Done' : 'Next'}
              </Text>
              {!isLastStep && (
                <FontAwesome name="chevron-right" size={12} color={isDark ? '#171717' : '#fafafa'} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Arrow pointer */}
        {step.arrowPosition && (
          <View
            style={[
              styles.arrow,
              {
                top: step.arrowPosition.top,
                left: step.arrowPosition.left,
                transform: [{ rotate: step.arrowPosition.rotation || '0deg' }],
              },
            ]}
          >
            <FontAwesome name="long-arrow-up" size={32} color={isDark ? '#a3a3a3' : '#737373'} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  highlightBox: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#737373',
    shadowColor: '#525252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  highlightBoxDark: {
    borderColor: '#a3a3a3',
    shadowColor: '#d4d4d4',
  },
  tutorialCard: {
    position: 'absolute',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  tutorialCardDark: {
    backgroundColor: '#262626',
    borderColor: '#404040',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleDark: {
    color: '#fafafa',
  },
  description: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionDark: {
    color: '#d4d4d4',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#737373',
  },
  tipContainerDark: {
    backgroundColor: '#404040',
    borderLeftColor: '#a3a3a3',
  },
  tipText: {
    fontSize: 13,
    color: '#525252',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  tipTextDark: {
    color: '#d4d4d4',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4d4d4',
    marginHorizontal: 3,
  },
  progressDotDark: {
    backgroundColor: '#525252',
  },
  progressDotActive: {
    backgroundColor: '#525252',
    width: 20,
  },
  progressDotActiveDark: {
    backgroundColor: '#d4d4d4',
    width: 20,
  },
  stepCounter: {
    fontSize: 11,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  stepCounterDark: {
    color: '#737373',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#171717',
    flex: 1,
  },
  primaryButtonDark: {
    backgroundColor: '#fafafa',
  },
  primaryButtonText: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonTextDark: {
    color: '#171717',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  secondaryButtonDark: {
    backgroundColor: '#404040',
    borderColor: '#525252',
  },
  secondaryButtonText: {
    color: '#525252',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonTextDark: {
    color: '#d4d4d4',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: '#a3a3a3',
    fontSize: 13,
    fontWeight: '500',
  },
  skipButtonTextDark: {
    color: '#737373',
  },
  arrow: {
    position: 'absolute',
  },
});

export default TutorialOverlay;
