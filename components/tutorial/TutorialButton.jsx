import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTutorial } from '../../providers/TutorialProvider';

const TutorialButton = ({ tutorialType, style, iconOnly = false }) => {
  const { startTutorial, isTutorialCompleted } = useTutorial();
  const isDark = useColorScheme() === 'dark';

  const handlePress = () => {
    startTutorial(tutorialType);
  };

  if (iconOnly) {
    return (
      <TouchableOpacity
        style={[styles.iconButton, isDark && styles.iconButtonDark, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="help-outline" size={20} color={isDark ? '#d4d4d4' : '#525252'} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, isDark && styles.buttonDark, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialIcons name="help-outline" size={18} color={isDark ? '#d4d4d4' : '#525252'} />
      <Text style={[styles.buttonText, isDark && styles.buttonTextDark]}>
        {isTutorialCompleted(tutorialType) ? 'Restart Tutorial' : 'Start Tutorial'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  buttonDark: {
    backgroundColor: '#404040',
    borderColor: '#525252',
  },
  buttonText: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#fafafa',
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  iconButtonDark: {
    backgroundColor: '#404040',
    borderColor: '#525252',
  },
});

export default TutorialButton;
