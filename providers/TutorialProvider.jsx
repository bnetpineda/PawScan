import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthProvider';

const TutorialContext = createContext({});

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [tutorialType, setTutorialType] = useState(null); // 'user' or 'vet'
  const [completedTutorials, setCompletedTutorials] = useState([]);

  // Load completed tutorials from storage
  useEffect(() => {
    loadCompletedTutorials();
  }, []);

  const loadCompletedTutorials = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedTutorials');
      if (completed) {
        setCompletedTutorials(JSON.parse(completed));
      }
    } catch (error) {
      console.error('Error loading completed tutorials:', error);
    }
  };

  const saveCompletedTutorial = async (tutorialId) => {
    try {
      const updated = [...completedTutorials, tutorialId];
      await AsyncStorage.setItem('completedTutorials', JSON.stringify(updated));
      setCompletedTutorials(updated);
    } catch (error) {
      console.error('Error saving completed tutorial:', error);
    }
  };

  const startTutorial = (type) => {
    setTutorialType(type);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const skipTutorial = async () => {
    if (tutorialType) {
      await saveCompletedTutorial(tutorialType);
    }
    setIsActive(false);
    setCurrentStep(0);
    setTutorialType(null);
  };

  const completeTutorial = async () => {
    if (tutorialType) {
      await saveCompletedTutorial(tutorialType);
    }
    setIsActive(false);
    setCurrentStep(0);
    setTutorialType(null);
  };

  const resetTutorials = async () => {
    try {
      await AsyncStorage.removeItem('completedTutorials');
      setCompletedTutorials([]);
    } catch (error) {
      console.error('Error resetting tutorials:', error);
    }
  };

  const isTutorialCompleted = (tutorialId) => {
    return completedTutorials.includes(tutorialId);
  };

  const value = {
    currentStep,
    isActive,
    tutorialType,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    resetTutorials,
    isTutorialCompleted,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
