import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
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
      position: { top: "40%" },
      highlight: null,
    },
    {
      id: 2,
      title: "Navigation Bar",
      description:
        "Use these buttons to search posts, view app info, and check your analysis history.",
      icon: "search",
      position: { top: "20%" },
      highlight: { top: 62, width: screenWidth, height: 60 },
    },
    {
      id: 3,
      title: "Pet Health Posts",
      description:
        "Each post shows a pet's photo and AI-generated health analysis from our community.",
      icon: "image",
      position: { top: "35%" },
      highlight: { top: 120, left: 16, width: screenWidth - 25, height: 500 },
    },
    {
      id: 4,
      title: "Interact with Posts",
      description:
        "Like posts with the heart button, view comments, and share interesting analyses with others.",
      icon: "thumbs-up",
      position: { top: "50%" },
      highlight: { top: 440, left: 16, width: 160, height: 45 },
    },
    {
      id: 5,
      title: "View Full Images",
      description:
        "Tap any pet photo to view it in full screen for a closer look at the analysis subject.",
      icon: "expand",
      position: { top: "30%" },
      highlight: { top: 185, left: 16, width: screenWidth - 32, height: 260 },
    },
    {
      id: 6,
      title: "Read Analysis Details",
      description:
        "Each post includes detailed AI analysis. Tap 'Read More' to see the complete health assessment.",
      icon: "file-text",
      position: { top: "55%" },
      highlight: { top: 480, left: 16, width: screenWidth - 32, height: 140 },
    },
    {
      id: 7,
      title: "Join the Conversation",
      description:
        "Tap the comment button to share your thoughts, ask questions, or provide advice to fellow pet owners.",
      icon: "comment",
      position: { top: "15%" },
      highlight: { top: 440, left: 75, width: 55, height: 40 },
    },
    {
      id: 8,
      title: "Pull to Refresh",
      description:
        "Swipe down on the feed to refresh and see the latest posts from the community.",
      icon: "refresh",
      position: { top: "25%" },
      highlight: { top: 100, left: 0, width: screenWidth, height: 100 },
    },
    {
      id: 9,
      title: "You're All Set! 🎉",
      description:
        "Start exploring pet health analyses and sharing your own. Happy scanning!",
      icon: "check-circle",
      position: { top: "40%" },
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

  // Define colors based on the theme
  const colors = {
    background: isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.7)",
    cardBg: isDark ? "#1F2937" : "#FFFFFF",
    titleText: isDark ? "#F3F4F6" : "#111827",
    descriptionText: isDark ? "#D1D5DB" : "#374151",
    stepText: isDark ? "#60A5FA" : "#3B82F6",
    iconColor: "#FFFFFF",
    iconBg: "#3B82F6",
    closeIcon: isDark ? "#9CA3AF" : "#6B757D",
    progressBg: isDark ? "#374151" : "#E5E7EB",
    progressBar: isDark ? "#60A5FA" : "#3B82F6",
    prevButtonBg: isDark ? "#374151" : "#F3F4F6",
    prevButtonText: isDark ? "#F3F4F6" : "#111827",
    prevButtonDisabledBg: isDark ? "#4B5563" : "#F9FAFB",
    prevButtonDisabledText: isDark ? "#9CA3AF" : "#D1D5DB",
    nextButtonBg: "#3B82F6",
    nextButtonText: "#FFFFFF",
    dotColor: isDark ? "#60A5FA" : "#3B82F6",
    dotInactiveColor: isDark ? "#4B5563" : "#D1D5DB",
    skipLink: isDark ? "#93C5FD" : "#3B82F6",
    highlightBorder: "#3B82F6",
    highlightBg: "rgba(59, 130, 246, 0.15)",
    hintBg: isDark ? "rgba(40, 58, 83, 0.9)" : "rgba(0, 0, 0, 0.6)",
    hintText: isDark ? "#E5E7EB" : "#FFFFFF",
  };

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
          backgroundColor: colors.background,
          opacity: fadeAnim,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Highlight Area */}
        {currentStepData.highlight && (
          <View
            style={{
              position: "absolute",
              ...currentStepData.highlight,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: colors.highlightBorder,
              backgroundColor: colors.highlightBg,
            }}
          />
        )}

        {/* Tutorial Card */}
        <Animated.View
          style={{
            position: "absolute",
            top: currentStepData.position.top,
            width: "90%",
            alignSelf: "center",
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 10,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? "#374151" : "transparent",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.iconBg,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <FontAwesome
                    name={currentStepData.icon}
                    size={20}
                    color={colors.iconColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.titleText,
                    }}
                  >
                    {currentStepData.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.stepText,
                      marginTop: 2,
                    }}
                  >
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={skipTutorial} style={{ padding: 8 }}>
                <FontAwesome name="times" size={18} color={colors.closeIcon} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: colors.descriptionText,
                marginBottom: 24,
              }}
            >
              {currentStepData.description}
            </Text>

            {/* Progress Bar */}
            <View
              style={{
                height: 6,
                backgroundColor: colors.progressBg,
                borderRadius: 3,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.progressBar,
                  width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
                }}
              />
            </View>

            {/* Navigation Buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={prevStep}
                disabled={currentStep === 0}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor:
                    currentStep === 0
                      ? colors.prevButtonDisabledBg
                      : colors.prevButtonBg,
                  opacity: currentStep === 0 ? 0.6 : 1,
                }}
              >
                <FontAwesome
                  name="chevron-left"
                  size={14}
                  color={
                    currentStep === 0
                      ? colors.prevButtonDisabledText
                      : colors.prevButtonText
                  }
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: "600",
                    color:
                      currentStep === 0
                        ? colors.prevButtonDisabledText
                        : colors.prevButtonText,
                  }}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {tutorialSteps.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                      backgroundColor:
                        index === currentStep
                          ? colors.dotColor
                          : colors.dotInactiveColor,
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={nextStep}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: colors.nextButtonBg,
                }}
              >
                <Text
                  style={{
                    marginRight: 8,
                    fontWeight: "600",
                    color: colors.nextButtonText,
                  }}
                >
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                </Text>
                <FontAwesome
                  name={
                    currentStep === tutorialSteps.length - 1
                      ? "check"
                      : "chevron-right"
                  }
                  size={14}
                  color={colors.nextButtonText}
                />
              </TouchableOpacity>
            </View>

            {/* Skip Tutorial Link */}
            {currentStep < tutorialSteps.length - 1 && (
              <TouchableOpacity
                onPress={skipTutorial}
                style={{ marginTop: 16, alignSelf: "center" }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.skipLink,
                    textDecorationLine: "underline",
                  }}
                >
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: colors.hintBg,
              }}
            >
              <FontAwesome
                name="hand-pointer-o"
                size={16}
                color={colors.hintText}
              />
              <Text
                style={{ marginLeft: 8, fontSize: 14, color: colors.hintText }}
              >
                Tap anywhere to continue
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
};

// Hook to manage tutorial state (no changes needed here)
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
