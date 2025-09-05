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
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)",
          opacity: fadeAnim,
        }}
      >
        {/* Highlight Area */}
        {currentStepData.highlight && (
          <View
            style={{
              position: "absolute",
              ...currentStepData.highlight,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: isDark ? "#3B82F6" : "#3B82F6",
              backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.1)",
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
              backgroundColor: isDark ? "#000" : "#fff",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#e5e7eb",
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
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#3B82F6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <FontAwesome
                    name={currentStepData.icon}
                    size={18}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                  >
                    {currentStepData.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#3B82F6",
                      marginTop: 2,
                    }}
                  >
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={skipTutorial} style={{ padding: 8 }}>
                <FontAwesome name="times" size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                lineHeight: 22,
                color: isDark ? "#d1d5db" : "#374151",
                marginBottom: 20,
              }}
            >
              {currentStepData.description}
            </Text>

            {/* Progress Bar */}
            <View
              style={{
                height: 4,
                backgroundColor: isDark ? "#374151" : "#e5e7eb",
                borderRadius: 2,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#3B82F6",
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
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                  opacity: currentStep === 0 ? 0.5 : 1,
                }}
              >
                <FontAwesome
                  name="chevron-left"
                  size={14}
                  color={isDark ? "#f9fafb" : "#111827"}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: "600",
                    color: isDark ? "#f9fafb" : "#111827",
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
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginHorizontal: 3,
                      backgroundColor:
                        index === currentStep
                          ? "#3B82F6"
                          : isDark ? "#4b5563" : "#d1d5db",
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
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: "#3B82F6",
                }}
              >
                <Text
                  style={{
                    marginRight: 8,
                    fontWeight: "600",
                    color: "#fff",
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
                  color="#fff"
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
                    color: "#3B82F6",
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
                backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(0, 0, 0, 0.6)",
              }}
            >
              <FontAwesome
                name="hand-pointer-o"
                size={16}
                color="#fff"
              />
              <Text
                style={{ marginLeft: 8, fontSize: 14, color: "#fff" }}
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
