import {
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Modal,
  Alert,
  useColorScheme,
} from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { analyzePetImage, shareToNewsfeed } from "../../utils/analyzePetImage";
import { supabase } from "../../lib/supabase";
import { useTutorial } from "../../providers/TutorialProvider";
import TutorialOverlay from "../tutorial/TutorialOverlay";
import { cameraTutorialSteps } from "../tutorial/tutorialSteps";
import ShareModal from "../../assets/components/ShareModal";
import CameraViewComponent from "./CameraView";
import Preview from "./Preview";

const COLORS = {
  primary: "#007AFF",
  primaryLight: "#E0F0FF",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#6C757D",
  error: "#DC3545",
  white: "#FFFFFF",
  black: "#000000",
  lightneutral: "#E9ECEF",
  success: "#28A745",
};

export default function CameraScreen({ userType = "user" }) {
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { startTutorial, isTutorialCompleted } = useTutorial();

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [petName, setPetName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      return () => {
        setIsCameraActive(false);
      };
    }, [])
  );

  const cameraRef = useRef(null);

  const handleRetake = () => {
    setImageUri(null);
    setAnalysisResult("");
    setCurrentAnalysisId(null);
  };

  const handleSharePress = () => {
    if (!currentAnalysisId) {
      Alert.alert("Error", "No analysis available to share.");
      return;
    }
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!currentAnalysisId) {
      Alert.alert("Error", "No analysis available to share.");
      return;
    }

    setIsSharing(true);
    try {
      await shareToNewsfeed(
        currentAnalysisId,
        petName.trim() || null,
        isAnonymous
      );
      setShowShareModal(false);
      setPetName("");
      setIsAnonymous(false);
      Alert.alert(
        "Success!",
        "Your pet analysis has been shared to the newsfeed!",
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Failed to share:", error);
      Alert.alert("Error", "Failed to share to newsfeed. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleImageSelected = async (uri) => {
    setImageUri(uri);
    setIsLoading(true);

    // Get the current user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const result = await analyzePetImage(uri, userId);
    setIsLoading(false);

    // Handle the new return format
    if (typeof result === "object" && result.analysis) {
      setAnalysisResult(result.analysis);
      setCurrentAnalysisId(result.analysisId);
    } else {
      // Backward compatibility for string return
      setAnalysisResult(result);
      setCurrentAnalysisId(null);
    }
  };

  // Auto-trigger tutorial on first visit (called by CameraView on permission grant)
  const handleAutoTutorialTrigger = () => {
    if (!isTutorialCompleted('camera')) {
      startTutorial('camera');
    }
  };

  // Manual trigger from help button (always works)
  const handleTutorialTrigger = () => {
    startTutorial('camera');
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? COLORS.black : COLORS.background}
      />
      
      {/* Help Button */}
      <View className="absolute top-12 right-4 z-10">
        <TouchableOpacity
          onPress={handleTutorialTrigger}
          className="bg-neutral-100 dark:bg-neutral-800 rounded-full p-2"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}
        >
          <MaterialIcons 
            name="help-outline" 
            size={24} 
            color={isDark ? "#d4d4d4" : "#525252"} 
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {!imageUri && (
          <CameraViewComponent
            onImageSelected={handleImageSelected}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isCameraActive={isCameraActive}
            onPermissionGranted={handleAutoTutorialTrigger}
          />
        )}
        {imageUri && (
          <Preview
            imageUri={imageUri}
            isLoading={isLoading}
            analysisResult={analysisResult}
            currentAnalysisId={currentAnalysisId}
            onRetake={handleRetake}
            onChooseNew={() => {
              setImageUri(null);
              setAnalysisResult("");
              setCurrentAnalysisId(null);
            }}
            onSharePress={handleSharePress}
          />
        )}
      </View>
      
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        petName={petName}
        setPetName={setPetName}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
        isSharing={isSharing}
        onShare={handleShareSubmit}
        isDark={isDark}
        COLORS={COLORS}
      />
      <TutorialOverlay steps={cameraTutorialSteps} tutorialId="camera" />
    </View>
  );
}
