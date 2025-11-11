import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Image,
  useColorScheme,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef, useEffect } from "react";
import { FontAwesome } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { analyzePetImage } from "../../utils/analyzePetImage";
import { supabase } from "../../lib/supabase";

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

export default function CameraViewComponent({ 
  onImageSelected, 
  isLoading, 
  setIsLoading,
  isCameraActive,
  onPermissionGranted
}) {
  const [facing, setFacing] = useState("back");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const cameraRef = useRef(null);

  // Trigger tutorial when camera permission is granted
  useEffect(() => {
    if (cameraPermission?.granted && onPermissionGranted) {
      onPermissionGranted();
    }
  }, [cameraPermission, onPermissionGranted]);

  const handlePermissionDenied = () => {
    return (
      <View className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-900 items-center justify-center mb-8">
            <FontAwesome
              name="camera"
              size={48}
              color={isDark ? COLORS.lightneutral : COLORS.textSecondary}
            />
          </View>
          <Text className="text-center text-2xl font-inter-bold text-black dark:text-white mb-4">
            Camera Access Needed
          </Text>
          <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 mb-8 leading-6">
            To capture pet photos for health analysis, we need access to your camera.
          </Text>
          <TouchableOpacity
            className="bg-black dark:bg-white py-4 px-8 rounded-full w-full max-w-xs items-center"
            onPress={requestCameraPermission}
          >
            <Text className="text-white dark:text-black text-base font-inter-bold">
              Allow Camera Access
            </Text>
          </TouchableOpacity>
          <Text className="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-6">
            You can change this anytime in Settings
          </Text>
        </View>
      </View>
    );
  };

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
    return handlePermissionDenied();
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        // Save to media library and use the asset URI
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        await onImageSelected(asset.uri);
      } catch (error) {
        console.error("Failed to take picture:", error);
        Alert.alert("Error", "Could not take picture.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
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
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("Error", "Could not pick image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {cameraPermission.granted && isCameraActive && (
        <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} />
      )}
      
      {/* Camera Controls Overlay */}
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
    </View>
  );
}
