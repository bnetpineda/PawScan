import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTutorial } from '../../providers/TutorialProvider';

const WelcomeTutorialPrompt = ({ tutorialType, onDismiss }) => {
  const { startTutorial, isTutorialCompleted } = useTutorial();
  const isDark = useColorScheme() === 'dark';

  // Don't show if already completed
  if (isTutorialCompleted(tutorialType)) {
    return null;
  }

  const handleStart = () => {
    startTutorial(tutorialType);
    onDismiss && onDismiss();
  };

  const handleDismiss = () => {
    onDismiss && onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="explore" size={32} color={isDark ? '#d4d4d4' : '#525252'} />
        </View>
        
        <Text style={[styles.title, isDark && styles.titleDark]}>New to PawScan?</Text>
        <Text style={[styles.description, isDark && styles.descriptionDark]}>
          Take a quick tour to learn how to use all the features
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton, isDark && styles.dismissButtonDark]}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.dismissButtonText, isDark && styles.dismissButtonTextDark]}>Maybe Later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.startButton, isDark && styles.startButtonDark]}
            onPress={handleStart}
            activeOpacity={0.7}
          >
            <Text style={[styles.startButtonText, isDark && styles.startButtonTextDark]}>Start Tour</Text>
            <MaterialIcons name="arrow-forward" size={16} color={isDark ? '#171717' : '#fafafa'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardDark: {
    backgroundColor: '#262626',
    borderColor: '#404040',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 6,
  },
  titleDark: {
    color: '#fafafa',
  },
  description: {
    fontSize: 13,
    color: '#525252',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  descriptionDark: {
    color: '#d4d4d4',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#171717',
  },
  startButtonDark: {
    backgroundColor: '#fafafa',
  },
  startButtonText: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  startButtonTextDark: {
    color: '#171717',
  },
  dismissButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  dismissButtonDark: {
    backgroundColor: '#404040',
    borderColor: '#525252',
  },
  dismissButtonText: {
    color: '#525252',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButtonTextDark: {
    color: '#d4d4d4',
  },
});

export default WelcomeTutorialPrompt;
