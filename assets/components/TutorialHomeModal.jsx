import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const TutorialModal = ({ visible, onClose, isDark }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  const tutorialSteps = [
    {
      id: 1,
      title: "Welcome to PawScan NewsFeed! 🐾",
      description:
        "Discover and share pet health analyses with the community. Let's take a quick tour!",
      icon: "heart",
      position: { top: "40%", left: "10%" },
      highlight: null,
    },
    {
      id: 2,
      title: "Navigation Bar",
      description:
        "Use these buttons to search posts, view app info, and check your analysis history.",
      icon: "search",
      position: { top: "20%", left: "10%" },
      highlight: { top: 62, width: screenWidth , height: 60 },
    },
    {
      id: 3,
      title: "Pet Health Posts",
      description:
        "Each post shows a pet's photo and AI-generated health analysis from our community.",
      icon: "image",
      position: { top: "35%", left: "10%" },
      highlight: { top: 150, left: 16, width: screenWidth - 25, height: 400 },
    },
    {
      id: 4,
      title: "Interact with Posts",
      description:
        "Like posts with the heart button, view comments, and share interesting analyses with others.",
      icon: "thumbs-up",
      position: { top: "50%", left: "10%" },
      highlight: { top: 440, left: 16, width: 200, height: 50 },
    },
    {
      id: 5,
      title: "View Full Images",
      description:
        "Tap any pet photo to view it in full screen for a closer look at the analysis subject.",
      icon: "expand",
      position: { top: "30%", left: "10%" },
      highlight: { top: 280, left: 16, width: screenWidth - 32, height: 150 },
    },
    {
      id: 6,
      title: "Read Analysis Details",
      description:
        "Each post includes detailed AI analysis. Tap 'Read More' to see the complete health assessment.",
      icon: "file-text",
      position: { top: "55%", left: "10%" },
      highlight: { top: 500, left: 16, width: screenWidth - 32, height: 100 },
    },
    {
      id: 7,
      title: "Join the Conversation",
      description:
        "Tap the comment button to share your thoughts, ask questions, or provide advice to fellow pet owners.",
      icon: "comment",
      position: { top: "45%", left: "10%" },
      highlight: { top: 440, left: 80, width: 60, height: 50 },
    },
    {
      id: 8,
      title: "Pull to Refresh",
      description:
        "Swipe down on the feed to refresh and see the latest posts from the community.",
      icon: "refresh",
      position: { top: "25%", left: "10%" },
      highlight: { top: 100, left: 0, width: screenWidth, height: 100 },
    },
    {
      id: 9,
      title: "You're All Set! 🎉",
      description:
        "Start exploring pet health analyses and sharing your own. Happy scanning!",
      icon: "check-circle",
      position: { top: "40%", left: "10%" },
      highlight: null,
    },
  ];

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    closeTutorial();
  };

  const closeTutorial = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const currentStepData = tutorialSteps[currentStep];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeTutorial}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          opacity: fadeAnim,
        }}
      >
        {/* Highlight Area */}
        {currentStepData.highlight && (
          <View
            style={{
              position: "absolute",
              top: currentStepData.highlight.top,
              left: currentStepData.highlight.left,
              width: currentStepData.highlight.width,
              height: currentStepData.highlight.height,
              borderRadius: 12,
              borderWidth: 3,
              borderColor: "#007AFF",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
            }}
          />
        )}

        {/* Tutorial Card */}
        <Animated.View
          style={{
            position: "absolute",
            top: currentStepData.position.top,
            left: currentStepData.position.left,
            right: "10%",
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            className={`rounded-2xl p-6 mx-4 shadow-lg ${
              isDark ? "bg-neutral-900 border border-neutral-700" : "bg-white"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center mr-3">
                  <FontAwesome
                    name={currentStepData.icon}
                    size={20}
                    color="white"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-lg font-inter-bold ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {currentStepData.title}
                  </Text>
                  <Text className="text-xs font-inter text-blue-500">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={skipTutorial} className="p-2">
                <FontAwesome
                  name="times"
                  size={16}
                  color={isDark ? "#8E8E93" : "#6C757D"}
                />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text
              className={`text-base font-inter leading-6 mb-6 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {currentStepData.description}
            </Text>

            {/* Progress Bar */}
            <View
              className={`h-2 rounded-full mb-6 ${
                isDark ? "bg-neutral-700" : "bg-gray-200"
              }`}
            >
              <View
                className="h-2 rounded-full bg-blue-500"
                style={{
                  width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
                }}
              />
            </View>

            {/* Navigation Buttons */}
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={prevStep}
                disabled={currentStep === 0}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  currentStep === 0
                    ? isDark
                      ? "bg-neutral-800"
                      : "bg-gray-100"
                    : isDark
                    ? "bg-neutral-700"
                    : "bg-gray-200"
                }`}
              >
                <FontAwesome
                  name="chevron-left"
                  size={14}
                  color={
                    currentStep === 0
                      ? isDark
                        ? "#4A4A4A"
                        : "#C4C4C4"
                      : isDark
                      ? "#E5E5E7"
                      : "#333333"
                  }
                />
                <Text
                  className={`ml-2 font-inter-semibold ${
                    currentStep === 0
                      ? isDark
                        ? "text-neutral-500"
                        : "text-gray-400"
                      : isDark
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <View className="flex-row space-x-2">
                {tutorialSteps.map((_, index) => (
                  <View
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep
                        ? "bg-blue-500"
                        : isDark
                        ? "bg-neutral-600"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={nextStep}
                className="flex-row items-center px-4 py-2 rounded-full bg-blue-500"
              >
                <Text className="text-white font-inter-semibold mr-2">
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                </Text>
                <FontAwesome
                  name={
                    currentStep === tutorialSteps.length - 1
                      ? "check"
                      : "chevron-right"
                  }
                  size={14}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Skip Tutorial Link */}
            {currentStep < tutorialSteps.length - 1 && (
              <TouchableOpacity
                onPress={skipTutorial}
                className="mt-4 self-center"
              >
                <Text className="text-sm font-inter text-blue-500 underline">
                  Skip Tutorial
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Tap anywhere to continue hint */}
        {currentStep < tutorialSteps.length - 1 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 50,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
            onPress={nextStep}
          >
            <View className="flex-row items-center px-4 py-2 rounded-full bg-black bg-opacity-50">
              <FontAwesome name="hand-pointer-o" size={14} color="white" />
              <Text className="text-white text-sm font-inter ml-2">
                Tap anywhere to continue
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
};

// Hook to manage tutorial state
export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  // Check if user has seen tutorial before (you can implement with AsyncStorage)
  const checkFirstTime = async () => {
    // Implement AsyncStorage logic here if needed
    // For now, always show tutorial
    return true;
  };

  return {
    showTutorial,
    startTutorial,
    closeTutorial,
    checkFirstTime,
  };
};

export default TutorialModal;
