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

  // Calculate responsive dimensions
  const cardWidth = screenWidth * 0.9;
  const cardHorizontalPadding = screenWidth * 0.03;
  const defaultCardTop = screenHeight * 0.4;
  const navBarHeight = screenHeight * 0.05;
  const postHeight = screenHeight * 0.5;
  const imageHeight = screenHeight * 0.26;
  const actionBarHeight = screenHeight * 0.04;

  const tutorialSteps = [
    {
      id: 1,
      title: "Welcome to PawScan NewsFeed! 🐾",
      description:
        "Discover and share pet health analyses with the community. Let's take a quick tour!",
      icon: "heart",
      position: { top: defaultCardTop },
      highlight: null,
    },
    {
      id: 2,
      title: "Navigation Bar",
      description:
        "Use these buttons to search posts, view app info, and check your analysis history.",
      icon: "search",
      position: { top: screenHeight * 0.15 },
      highlight: { 
        top: screenHeight * 0.065, 
        left: 0, 
        width: screenWidth, 
        height: navBarHeight
      },
    },
    {
      id: 3,
      title: "Pet Health Posts",
      description:
        "Each post shows a pet's photo and AI-generated health analysis from our community.",
      icon: "image",
      position: { top: screenHeight * 0.6 },
      highlight: { 
        top: screenHeight * 0.12, 
        left: cardHorizontalPadding, 
        width: cardWidth + cardHorizontalPadding, 
        height: postHeight
      },
    },
    {
      id: 4,
      title: "Interact with Posts",
      description:
        "Like posts with the heart button, view comments, and share interesting analyses with others.",
      icon: "thumbs-up",
      position: { top: screenHeight * 0.15 },
      highlight: { 
        top: screenHeight * 0.46, 
        left: cardHorizontalPadding, 
        width: cardWidth * 0.4, 
        height: actionBarHeight
      },
    },
    {
      id: 5,
      title: "View Full Images",
      description:
        "Tap any pet photo to view it in full screen for a closer look at the analysis subject.",
      icon: "expand",
      position: { top: screenHeight * 0.50 },
      highlight: { 
        top: screenHeight * 0.2, 
        left: cardHorizontalPadding, 
        width: cardWidth + cardHorizontalPadding, 
        height: imageHeight
      },
    },
    {
      id: 6,
      title: "Read Analysis Details",
      description:
        "Each post includes detailed AI analysis. Tap 'Read More' to see the complete health assessment.",
      icon: "file-text",
      position: { top: screenHeight * 0.2 },
      highlight: { 
        top: screenHeight * 0.5, 
        left: cardHorizontalPadding, 
        width: cardWidth + cardHorizontalPadding, 
        height: screenHeight * 0.13
      },
    },
    {
      id: 7,
      title: "Join the Conversation",
      description:
        "Tap the comment button to share your thoughts, ask questions, or provide advice to fellow pet owners.",
      icon: "comment",
      position: { top: screenHeight * 0.15 },
      highlight: { 
        top: screenHeight * 0.46, 
        left: cardWidth * 0.18, 
        width: cardWidth * 0.14, 
        height: actionBarHeight
      },
    },
    {
      id: 8,
      title: "Pull to Refresh",
      description:
        "Swipe down on the feed to refresh and see the latest posts from the community.",
      icon: "refresh",
      position: { top: screenHeight * 0.2 },
      highlight: { 
        top: screenHeight * 0.12, 
        left: 0, 
        width: screenWidth, 
        height: screenHeight * 0.08
      },
    },
    {
      id: 9,
      title: "You're All Set! 🎉",
      description:
        "Start exploring pet health analyses and sharing your own. Happy scanning!",
      icon: "check-circle",
      position: { top: defaultCardTop },
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
              borderColor: isDark ? "#fff" : "#000",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          />
        )}

        {/* Tutorial Card */}
        <Animated.View
          style={{
            position: "absolute",
            top: currentStepData.position.top,
            width: cardWidth,
            alignSelf: "center",
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#000" : "#fff",
              borderRadius: 16,
              padding: Math.min(20, screenWidth * 0.05),
              borderWidth: 1,
              borderColor: isDark ? "#fff" : "#000",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Math.min(16, screenHeight * 0.03),
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <View
                  style={{
                    width: Math.min(40, screenWidth * 0.1),
                    height: Math.min(40, screenWidth * 0.1),
                    borderRadius: Math.min(20, screenWidth * 0.05),
                    backgroundColor: isDark ? "#fff" : "#000",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Math.min(12, screenWidth * 0.03),
                  }}
                >
                  <FontAwesome
                    name={currentStepData.icon}
                    size={Math.min(18, screenWidth * 0.05)}
                    color={isDark ? "#000" : "#fff"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                  style={{
                    fontSize: Math.min(18, screenWidth * 0.05),
                    fontWeight: "700",
                    color: isDark ? "#f9fafb" : "#111827",
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {currentStepData.title}
                </Text>
                </View>
              </View>
              <TouchableOpacity onPress={skipTutorial} style={{ padding: 8 }}>
                <FontAwesome name="times" size={Math.min(18, screenWidth * 0.05)} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            
            {/* Step Counter */}
            <Text
              style={{
                fontSize: Math.min(12, screenWidth * 0.03),
                color: isDark ? "#fff" : "#000",
                marginTop: 2,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Step {currentStep + 1} of {tutorialSteps.length}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: Math.min(16, screenWidth * 0.04),
                lineHeight: Math.min(22, screenWidth * 0.06),
                color: isDark ? "#fff" : "#000",
                marginBottom: Math.min(20, screenHeight * 0.03),
                fontFamily: "Inter_400Regular",
              }}
            >
              {currentStepData.description}
            </Text>

            {/* Progress Bar */}
            <View
              style={{
                height: 4,
                backgroundColor: isDark ? "#333" : "#ccc",
                borderRadius: 2,
                marginBottom: Math.min(20, screenHeight * 0.03),
              }}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isDark ? "#fff" : "#000",
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
                  paddingHorizontal: Math.min(16, screenWidth * 0.04),
                  paddingVertical: Math.min(8, screenHeight * 0.015),
                  borderRadius: 20,
                  backgroundColor: isDark ? "#333" : "#eee",
                  opacity: currentStep === 0 ? 0.5 : 1,
                }}
              >
                <FontAwesome
                  name="chevron-left"
                  size={Math.min(14, screenWidth * 0.035)}
                  color={isDark ? "#f9fafb" : "#111827"}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                    fontSize: Math.min(14, screenWidth * 0.035),
                    fontFamily: "Inter_600SemiBold",
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
                          ? isDark ? "#fff" : "#000"
                          : isDark ? "#444" : "#bbb",
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={nextStep}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: Math.min(16, screenWidth * 0.04),
                  paddingVertical: Math.min(8, screenHeight * 0.015),
                  borderRadius: 20,
                  backgroundColor: isDark ? "#fff" : "#000",
                }}
              >
                <Text
                  style={{
                    marginRight: 8,
                    fontWeight: "600",
                    color: isDark ? "#000" : "#fff",
                    fontSize: Math.min(14, screenWidth * 0.035),
                    fontFamily: "Inter_600SemiBold",
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
                  size={Math.min(14, screenWidth * 0.035)}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* Skip Tutorial Link */}
            {currentStep < tutorialSteps.length - 1 && (
              <TouchableOpacity
                onPress={skipTutorial}
                style={{ marginTop: Math.min(16, screenHeight * 0.03), alignSelf: "center" }}
              >
                <Text
                  style={{
                    fontSize: Math.min(14, screenWidth * 0.035),
                    color: isDark ? "#fff" : "#000",
                    textDecorationLine: "underline",
                    fontFamily: "Inter_400Regular",
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
              bottom: screenHeight * 0.1,
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
                paddingHorizontal: Math.min(16, screenWidth * 0.04),
                paddingVertical: Math.min(10, screenHeight * 0.02),
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(51, 51, 51, 0.8)" : "rgba(0, 0, 0, 0.6)",
              }}
            >
              <FontAwesome
                name="hand-pointer-o"
                size={Math.min(16, screenWidth * 0.04)}
                color="#fff"
              />
              <Text
                style={{ 
                  marginLeft: 8, 
                  fontSize: Math.min(14, screenWidth * 0.035), 
                  color: isDark ? "#fff" : "#000",
                  fontFamily: "Inter_400Regular",
                }}
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
