import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

const BecomeVetModal = ({ visible, onClose, isDark }) => {
  const [idImageUri, setIdImageUri] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);
  const isMountedRef = useRef(true);
  const { user, refreshUser } = useAuth();

  // Track mounted state to prevent state updates after unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const showIdUploadAlert = (onConfirm) => {
    Alert.alert(
      "License ID Required",
      "Your license ID is required to confirm your professional credentials before your account can be approved.\n\nBy uploading your ID, you agree to our Privacy Policy. Your information will be stored securely and used only for verification purposes.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "I Agree", onPress: onConfirm },
      ]
    );
  };

  const handleTakePhoto = async () => {
    showIdUploadAlert(async () => {
      if (!cameraPermission?.granted) {
        const { granted } = await requestCameraPermission();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Camera permission is required to take a photo."
          );
          return;
        }
      }
      setShowCamera(true);
    });
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setIdImageUri(photo.uri);
        setShowCamera(false);
      } catch (_error) {
        Alert.alert("Error", "Failed to capture photo.");
      }
    }
  };

  const handlePickFromGallery = async () => {
    showIdUploadAlert(async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Gallery permission is required to select a photo."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
          setIdImageUri(result.assets[0].uri);
        }
      } catch (_error) {
        Alert.alert("Error", "Failed to pick image from gallery.");
      }
    });
  };

  const uploadIdImage = async () => {
    if (!idImageUri) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(idImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(base64, "base64");
      const extension = idImageUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}_${Date.now()}.${extension}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vet-ids")
        .upload(filePath, buffer, {
          contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("vet-ids").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading ID:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!idImageUri) {
      Alert.alert("Error", "Please upload your veterinary license ID.");
      return;
    }

    setUploading(true);
    try {
      // Upload the ID image
      const idUrl = await uploadIdImage();

      if (!idUrl) {
        throw new Error("Failed to upload ID image");
      }

      // Create or update vet profile FIRST (before auth update triggers re-renders)
      const { error: vetProfileError } = await supabase
        .from("vet_profiles")
        .upsert(
          {
            id: user.id,
            name:
              user.user_metadata?.options?.data?.full_name ||
              user.email?.split("@")[0] ||
              "Veterinarian",
            license_id_url: idUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (vetProfileError) {
        console.error("Error creating vet profile:", vetProfileError);
      }

      // Reset state BEFORE updating auth (which triggers re-renders via onAuthStateChange)
      if (isMountedRef.current) {
        setUploading(false);
        setIdImageUri(null);
      }

      // Show success alert before auth update (which may cause re-renders)
      Alert.alert(
        "Application Submitted! 🎉",
        "Your veterinarian application has been submitted successfully!\n\nOur team will review your credentials and you'll receive an email notification once your account has been verified.",
        [{ text: "OK", onPress: onClose }]
      );

      // Update user metadata to pending_veterinarian
      // This will trigger onAuthStateChange and cause parent re-renders
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          options: {
            data: {
              ...user.user_metadata?.options?.data,
              role: "pending_veterinarian",
              license_id_url: idUrl,
            },
          },
        },
      });

      if (updateError) {
        console.error("Error updating user role:", updateError);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      if (isMountedRef.current) {
        setUploading(false);
      }
      Alert.alert(
        "Error",
        error.message || "Failed to submit application. Please try again."
      );
    }
  };

  const handleClose = () => {
    setIdImageUri(null);
    setShowCamera(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
        {/* Header */}
        <View
          className={`pt-8 pb-4 px-6 border-b ${
            isDark
              ? "border-neutral-600 bg-neutral"
              : "border-neutral-400 bg-neutral-50"
          }`}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-2xl font-inter-bold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Become a Veterinarian
            </Text>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <FontAwesome
                name="close"
                size={20}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 py-6">
          <Text
            className={`text-base font-inter mb-6 ${
              isDark ? "text-neutral-300" : "text-neutral-600"
            }`}
          >
            Upload your veterinary license ID to apply for veterinarian status.
            Your application will be reviewed by an administrator.
          </Text>

          {/* ID Upload Section */}
          <Text
            className={`text-sm font-inter-bold mb-3 ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Upload Veterinary License ID
          </Text>

          {idImageUri ? (
            <View className="items-center">
              <Image
                source={{ uri: idImageUri }}
                className="w-full h-48 rounded-xl mb-3"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-full"
                onPress={() => setIdImageUri(null)}
              >
                <Text className="text-white font-inter-bold text-sm">
                  Remove Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 items-center justify-center py-6 rounded-xl border-2 border-dashed ${
                  isDark ? "border-neutral-600" : "border-neutral-300"
                }`}
                onPress={handleTakePhoto}
              >
                <FontAwesome
                  name="camera"
                  size={24}
                  color={isDark ? "#888" : "#666"}
                />
                <Text
                  className={`mt-2 text-sm font-inter ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 items-center justify-center py-6 rounded-xl border-2 border-dashed ${
                  isDark ? "border-neutral-600" : "border-neutral-300"
                }`}
                onPress={handlePickFromGallery}
              >
                <FontAwesome
                  name="image"
                  size={24}
                  color={isDark ? "#888" : "#666"}
                />
                <Text
                  className={`mt-2 text-sm font-inter ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  From Gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text
            className={`text-xs mt-4 text-center ${
              isDark ? "text-neutral-500" : "text-neutral-400"
            }`}
          >
            By uploading your ID, you agree to our Privacy Policy. Your
            information will be stored securely and used only for verification
            purposes.
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            className={`mt-6 items-center justify-center rounded-xl py-4 ${
              idImageUri && !uploading
                ? "bg-black dark:bg-white"
                : "bg-neutral-300 dark:bg-neutral-700"
            }`}
            onPress={handleSubmit}
            disabled={!idImageUri || uploading}
          >
            {uploading ? (
              <ActivityIndicator color={isDark ? "#000" : "#fff"} />
            ) : (
              <Text
                className={`font-inter-bold text-base ${
                  idImageUri
                    ? "text-white dark:text-black"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Submit Application
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <SafeAreaView className="flex-1 bg-black">
          <View style={{ flex: 1 }}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
            />
            <View
              className="flex-1 justify-end pb-10"
              style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            >
              <View className="flex-row justify-center items-center gap-8">
                <TouchableOpacity
                  className="bg-white/20 p-4 rounded-full"
                  onPress={() => setShowCamera(false)}
                >
                  <FontAwesome name="times" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white p-5 rounded-full"
                  onPress={handleCapturePhoto}
                >
                  <FontAwesome name="camera" size={32} color="#000" />
                </TouchableOpacity>

                <View className="w-14" />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
};

export default BecomeVetModal;
