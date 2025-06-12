import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  TextInput,
  Modal,
  useColorScheme, // Import useColorScheme
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import { FontAwesome } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { analyzePetImage, shareToNewsfeed } from "../../utils/analyzePetImage";
import { supabase } from "../../lib/supabase";
import ShareModal from "../../assets/components/ShareModal";

const COLORS = {
  primary: "#007AFF",
  primaryLight: "#E0F0FF",
  background: "#F8F9FA", // This will be overridden by dark mode styles for the main background
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#6C757D",
  error: "#DC3545",
  white: "#FFFFFF",
  black: "#000000",
  lightGray: "#E9ECEF",
  success: "#28A745",
};

export default function CameraScreen() {
  const [facing, setFacing] = useState("back");
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const colorScheme = useColorScheme(); // Get the current color scheme
  const isDark = colorScheme === "dark"; // Check if dark mode is active

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [petName, setPetName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const cameraRef = useRef(null);

  if (!cameraPermission || !mediaLibraryPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator
          size="large"
          color={isDark ? COLORS.white : COLORS.primary}
        />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black px-8">
        <FontAwesome
          name="camera"
          size={48}
          color={isDark ? COLORS.lightGray : COLORS.textSecondary}
          style={{ marginBottom: 20 }}
        />
        <Text className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6 leading-6">
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          className="bg-[#007AFF] py-3 px-8 rounded-full" // Primary blue button, often looks good in both modes
          onPress={requestCameraPermission}
        >
          <Text className="text-white text-base font-inter-bold">
            Grant Camera Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    if (cameraRef.current) {
      setIsLoading(true);
      setImageUri(null);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        // Save to media library and use the asset URI
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        await handleImageSelected(asset.uri);
      } catch (error) {
        console.error("Failed to take picture:", error);
        Alert.alert("Error", "Could not take picture.");
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function pickImage() {
    if (!mediaLibraryPermission.granted) {
      const { status } = await requestMediaLibraryPermission();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera roll permission is needed to select images."
        );
        return;
      }
    }

    setIsLoading(true);
    setImageUri(null);

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("Error", "Could not pick image.");
    } finally {
      setIsLoading(false);
    }
  }

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
      console.log(currentAnalysisId, petName, isAnonymous);
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

  const renderPreview = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center bg-white dark:bg-black">
          <ActivityIndicator
            size="large"
            color={isDark ? COLORS.white : COLORS.primary}
          />
          <Text className="text-center text-base text-gray-700 dark:text-gray-300 mt-2">
            Processing...
          </Text>
        </View>
      );
    }

    if (imageUri) {
      return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black items-center mt-4">
          <Image
            source={{ uri: imageUri }}
            className="w-10/12 aspect-square rounded-2xl mb-8 bg-black dark:bg-white"
            resizeMode="contain"
          />
          <View className="flex-row justify-center w-full px-6 gap-4 mb-4">
            <TouchableOpacity
              onPress={handleRetake}
              className="flex-row items-center bg-black dark:bg-white rounded-full py-3 px-6"
              activeOpacity={0.8}
            >
              <FontAwesome
                name="camera"
                size={18}
                color={isDark ? "#000" : "#fff"}
              />
              <Text className="font-inter-bold text-white dark:text-black text-base ml-3">
                Retake
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              className="flex-row items-center bg-black dark:bg-white rounded-full py-3 px-6"
              activeOpacity={0.8}
            >
              <FontAwesome
                name="image"
                size={18}
                color={isDark ? "#000" : "#fff"}
              />
              <Text className="font-inter-bold text-white dark:text-black text-base ml-3">
                Choose New
              </Text>
            </TouchableOpacity>
          </View>

          {/* Share Button - Only show if analysis is complete and has ID */}
          {analysisResult && currentAnalysisId && (
            <View className="flex-row justify-center w-full px-6 mb-4">
              <TouchableOpacity
                onPress={handleSharePress}
                className="flex-row items-center bg-black dark:bg-white rounded-full py-3 px-6"
                activeOpacity={0.8}
              >
                <FontAwesome
                  name="share"
                  size={18}
                  color={isDark ? "#000" : "#fff"}
                />
                <Text className="font-inter-bold text-white dark:text-black text-base ml-3">
                  Share to Newsfeed
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {analysisResult ? (
            <View
              className="w-11/12 p-4 bg-white dark:bg-gray-800 rounded-xl shadow"
              style={{ maxHeight: 600 }}
            >
              <ScrollView
                className="max-h-80"
                showsVerticalScrollIndicator={true}
              >
                <Text className="text-black dark:text-white font-inter-semibold text-base mb-2">
                  {analysisResult}
                </Text>
              </ScrollView>
            </View>
          ) : null}
        </SafeAreaView>
      );
    }

    return null;
  };

  async function handleImageSelected(uri) {
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
  }

  // After the image is captured or selected, the camera view is hidden and the preview is shown.
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? COLORS.black : COLORS.background}
      />
      <View style={{ flex: 1 }}>
        {!imageUri && (
          <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} />
        )}
        {/* Controls overlay */}
        {!imageUri && (
          <View className="absolute left-0 right-0 bottom-0 flex-row justify-around items-center px-6 py-12">
            <TouchableOpacity onPress={pickImage}>
              <FontAwesome name="image" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              className="justify-center items-center bg-white rounded-full w-20 h-20"
              onPress={takePicture}
            />
            <TouchableOpacity onPress={toggleCameraFacing}>
              <FontAwesome name="refresh" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {imageUri && renderPreview()}
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
    </View>
  );
}
