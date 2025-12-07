import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Modal,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [idImageUri, setIdImageUri] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [idImageError, setIdImageError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [uploadingId, setUploadingId] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const cameraRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Real-time validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
      } else {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
          setPasswordError(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          );
        } else {
          setPasswordError("");
        }
      }
    } else {
      setPasswordError("");
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match.");
    } else {
      setConfirmPasswordError("");
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    if (fullName && fullName.trim().length < 2) {
      setFullNameError("Full name must be at least 2 characters.");
    } else {
      setFullNameError("");
    }
  }, [fullName]);

  useEffect(() => {
    if (userRole === "veterinarian" && !idImageUri) {
      setIdImageError("");
    } else {
      setIdImageError("");
    }
  }, [idImageUri, userRole]);

  const showIdUploadAlert = (onConfirm) => {
    Alert.alert(
      "License ID Required",
      "Your license ID is required to confirm your professional credentials before your account can be approved.\n\nBy uploading your ID, you agree to our Privacy Policy. Your information will be stored securely and used only for verification purposes.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "I Agree", onPress: onConfirm }
      ]
    );
  };

  const handleTakePhoto = async () => {
    showIdUploadAlert(async () => {
      if (!cameraPermission?.granted) {
        const { granted } = await requestCameraPermission();
        if (!granted) {
          Alert.alert("Permission Required", "Camera permission is required to take a photo.");
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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Gallery permission is required to select a photo.");
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

  const uploadIdImage = async (userId) => {
    if (!idImageUri) return null;

    try {
      setUploadingId(true);
      const base64 = await FileSystem.readAsStringAsync(idImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(base64, "base64");
      const extension = idImageUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}_${Date.now()}.${extension}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vet-ids")
        .upload(filePath, buffer, {
          contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vet-ids")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading ID:", error);
      throw error;
    } finally {
      setUploadingId(false);
    }
  };

  const handleRegister = async () => {
    const validation = isFormValid();
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    setLoading(true);
    try {
      // For veterinarians, upload ID image FIRST before registration
      let idUrl = null;
      if (userRole === "veterinarian" && idImageUri) {
        try {
          // Generate a temporary ID for the upload (will be linked to user after registration)
          const tempId = `pending_${Date.now()}`;
          idUrl = await uploadIdImage(tempId);
        } catch (uploadError) {
          console.error("Failed to upload ID image:", uploadError);
          Alert.alert(
            "Registration Failed",
            "Failed to upload your ID image. Please try again."
          );
          setLoading(false);
          return;
        }
      }

      // For veterinarians, we register them with a "pending_veterinarian" role
      // For regular users, we register them with a "user" role
      const role =
        userRole === "veterinarian" ? "pending_veterinarian" : userRole;

      // Register user with role and profile details in metadata
      const { error: authError } = await signUpWithEmail(email, password, {
        options: {
          data: {
            role: role,
            full_name: fullName,
            license_id_url: idUrl,
          },
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes("email")) {
          Alert.alert(
            "Registration Failed",
            "This email is already registered. Please use a different email or sign in instead."
          );
        } else {
          Alert.alert("Registration Failed", authError.message);
        }
        return;
      }

      const successMessage =
        userRole === "veterinarian"
          ? "Your application has been submitted for review. You will receive an email once verified by an administrator."
          : "Please check your email for verification instructions.";

      Alert.alert("Registration Successful", successMessage, [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace("/(auth)/login");
  };

  const handleGoogleSignUp = async () => {
    // For veterinarians, require ID image first
    if (userRole === "veterinarian" && !idImageUri) {
      Alert.alert(
        "License ID Required",
        "Please upload your veterinary license ID before signing up with Google."
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      // For veterinarians, upload ID image first
      let idUrl = null;
      if (userRole === "veterinarian" && idImageUri) {
        try {
          const tempId = `pending_google_${Date.now()}`;
          idUrl = await uploadIdImage(tempId);
        } catch (uploadError) {
          console.error("Failed to upload ID image:", uploadError);
          Alert.alert(
            "Sign-Up Failed",
            "Failed to upload your ID image. Please try again."
          );
          setIsGoogleLoading(false);
          return;
        }
      }

      // Proceed with Google sign-in
      const { data } = await signInWithGoogle();
      
      // For veterinarians, update their profile with vet data
      if (userRole === "veterinarian" && data?.user) {
        const userId = data.user.id;
        
        // Update user metadata with vet role
        await supabase.auth.updateUser({
          data: {
            options: {
              data: {
                role: "pending_veterinarian",
                license_id_url: idUrl,
              }
            }
          }
        });

        // Create vet profile
        const { error: vetProfileError } = await supabase
          .from("vet_profiles")
          .upsert({
            id: userId,
            name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Veterinarian",
            license_id_url: idUrl,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });

        if (vetProfileError) {
          console.error("Error creating vet profile:", vetProfileError);
        }

        // Sign out the user since they need admin verification
        await supabase.auth.signOut();
        
        Alert.alert(
          "Application Submitted",
          "Your veterinarian application has been submitted for review. You will receive an email once verified by an administrator.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
        return;
      }
      
      // For regular users, navigation is handled by AuthProvider
    } catch (error) {
      if (error.message !== "Google Sign-In was cancelled.") {
        Alert.alert("Google Sign-Up Failed", error.message || "An unexpected error occurred");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isFormValid = () => {
    // Check for any existing errors
    if (
      emailError ||
      passwordError ||
      confirmPasswordError ||
      fullNameError ||
      idImageError
    ) {
      return { valid: false, message: "Please fix the errors in the form." };
    }

    // Check required fields
    if (!fullName.trim()) {
      return { valid: false, message: "Please enter your full name." };
    }

    if (!email.trim()) {
      return { valid: false, message: "Please enter your email address." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: "Please enter a valid email address." };
    }

    if (!password.trim()) {
      return { valid: false, message: "Please enter a password." };
    }

    // Password strength validation
    if (password.trim().length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters.",
      };
    }

    // Check for password strength (at least one uppercase, one lowercase, one number)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return {
        valid: false,
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      };
    }

    if (!confirmPassword.trim()) {
      return { valid: false, message: "Please confirm your password." };
    }

    if (password !== confirmPassword) {
      return { valid: false, message: "Passwords don't match." };
    }

    // For veterinarians, we require an ID image upload
    if (userRole === "veterinarian") {
      if (!idImageUri) {
        return { valid: false, message: "Please upload your veterinary license ID." };
      }
    }
    return { valid: true };
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          <View className="flex-1 p-6">
            <TouchableOpacity
              className="absolute left-5 top-3 z-10"
              onPress={() => router.replace("/")}
            >
              <Text className="text-2xl text-neutral-400">✕</Text>
            </TouchableOpacity>

            <View className="mt-12 mb-8">
              <Text className="text-3xl font-inter-bold text-black dark:text-white mb-2">
                Create Account
              </Text>
              <Text className="font-inter text-neutral-500 dark:text-neutral-400">
                Sign up to get started with PawScan
              </Text>
            </View>

            <View className="mb-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <TextInput
                className="h-14 border-b border-neutral-200 dark:border-neutral-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="none"
              />
              {fullNameError ? (
                <Text className="text-red-500 text-xs px-4 py-1">
                  {fullNameError}
                </Text>
              ) : null}
              <TextInput
                className="h-14 border-b border-neutral-200 dark:border-neutral-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                placeholder="Email address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text className="text-red-500 text-xs px-4 py-1">
                  {emailError}
                </Text>
              ) : null}
              <View className="flex-row items-center border-b border-neutral-200 dark:border-neutral-700">
                <TextInput
                  className="h-14 flex-1 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                  className="ml-2 p-2 px-4"
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <FontAwesome
                    name={passwordVisible ? "eye" : "eye-slash"}
                    size={20}
                    color={
                      isDark
                        ? passwordVisible
                          ? "#fff"
                          : "#888"
                        : passwordVisible
                        ? "#000"
                        : "#888"
                    }
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text className="text-red-500 text-xs px-4 py-1">
                  {passwordError}
                </Text>
              ) : null}
              {password && !passwordError && (
                <View className="px-4 py-2">
                  <View className="flex-row">
                    <View
                      className={`h-1 flex-1 rounded-full mr-1 ${
                        /.*[A-Z].*/.test(password)
                          ? "bg-green-500"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                    <View
                      className={`h-1 flex-1 rounded-full mr-1 ${
                        /.*[a-z].*/.test(password)
                          ? "bg-green-500"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                    <View
                      className={`h-1 flex-1 rounded-full ${
                        /.*\d.*/.test(password)
                          ? "bg-green-500"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                  </View>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Password must be alphanumeric (uppercase, lowercase, number) and include a special character
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <TextInput
                  className="h-14 flex-1 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                  placeholder="Confirm password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                />
                <TouchableOpacity
                  className="ml-2 p-2 px-4"
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                >
                  <FontAwesome
                    name={confirmPasswordVisible ? "eye" : "eye-slash"}
                    size={20}
                    color={
                      isDark
                        ? confirmPasswordVisible
                          ? "#fff"
                          : "#888"
                        : confirmPasswordVisible
                        ? "#000"
                        : "#888"
                    }
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text className="text-red-500 text-xs px-4 py-1">
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Modern Segmented Role Selection */}
            <View className="mb-6 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1 flex-row">
              <TouchableOpacity
                style={[
                  styles.buttonBase,
                  userRole === "user"
                    ? styles.buttonActive
                    : styles.buttonInactive,
                  userRole === "user" && isDark ? styles.buttonActiveDark : {}, // Apply dark mode active background
                  userRole === "user" ? styles.buttonShadow : {}, // Apply shadow only when active
                ]}
                onPress={() => setUserRole("user")}
              >
                <Text
                  style={[
                    styles.buttonTextBase,
                    userRole === "user"
                      ? styles.buttonTextActive
                      : styles.buttonTextInactive,
                    userRole === "user" && isDark
                      ? styles.buttonTextActiveDark
                      : {}, // Apply dark mode active text color
                    !userRole === "user" && isDark
                      ? styles.buttonTextInactiveDark
                      : {}, // Apply dark mode inactive text color
                  ]}
                >
                  User
                </Text>
              </TouchableOpacity>

              {/* Veterinarian Button */}
              <TouchableOpacity
                style={[
                  styles.buttonBase,
                  userRole === "veterinarian"
                    ? [
                        styles.buttonActive,
                        isDark && styles.buttonActiveDark,
                        styles.buttonShadow,
                      ]
                    : styles.buttonInactive,
                ]}
                onPress={() => setUserRole("veterinarian")}
              >
                <Text
                  style={[
                    styles.buttonTextBase,
                    userRole === "veterinarian"
                      ? [
                          styles.buttonTextActive,
                          isDark && styles.buttonTextActiveDark,
                        ]
                      : [
                          styles.buttonTextInactive,
                          isDark && styles.buttonTextInactiveDark,
                        ],
                  ]}
                >
                  Veterinarian
                </Text>
              </TouchableOpacity>
            </View>

            {/* ID Upload Section for Veterinarians */}
            {userRole === "veterinarian" && (
              <View className="mb-6">
                <Text className="text-sm font-inter-bold text-black dark:text-white mb-3">
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
                      <Text className="text-white font-inter-bold text-sm">Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 items-center justify-center py-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600"
                      onPress={handleTakePhoto}
                    >
                      <FontAwesome name="camera" size={24} color={isDark ? "#888" : "#666"} />
                      <Text className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm font-inter">
                        Take Photo
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="flex-1 items-center justify-center py-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600"
                      onPress={handlePickFromGallery}
                    >
                      <FontAwesome name="image" size={24} color={isDark ? "#888" : "#666"} />
                      <Text className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm font-inter">
                        From Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {idImageError ? (
                  <Text className="text-red-500 text-xs mt-2">{idImageError}</Text>
                ) : null}
                
                {uploadingId && (
                  <View className="flex-row items-center mt-2">
                    <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
                    <Text className="text-neutral-500 dark:text-neutral-400 ml-2 text-sm">
                      Uploading ID...
                    </Text>
                  </View>
                )}

                <Text className="text-neutral-500 dark:text-neutral-400 text-xs mt-3 text-center">
                  By uploading your ID, you agree to our Privacy Policy. Your information will be stored securely and used only for verification purposes.
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`mb-4 items-center justify-center rounded-2xl py-4 ${
                isFormValid().valid && !loading
                  ? "bg-black dark:bg-white"
                  : "bg-neutral-300 dark:bg-neutral-700"
              }`}
              onPress={handleRegister}
              disabled={!isFormValid().valid || loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? "#fff" : "#000"} />
              ) : (
                <Text
                  className={`font-inter-bold text-base ${
                    isFormValid().valid
                      ? "text-white dark:text-black"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-0.5 bg-neutral-900 dark:bg-neutral-500" />
              <Text className="mx-4 text-neutral-700 dark:text-neutral-600">
                or
              </Text>
              <View className="flex-1 h-0.5 bg-neutral-900 dark:bg-neutral-500" />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-lg py-3.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              onPress={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={isDark ? "#fff" : "#000"} size="small" />
              ) : (
                <>
                  <FontAwesome name="google" size={20} color={isDark ? "#fff" : "#000"} style={{ marginRight: 12 }} />
                  <Text className="font-inter-bold text-base text-black dark:text-white">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4 mb-6">
              <Text className="text-neutral-600 dark:text-neutral-400">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text className="font-inter-bold text-black dark:text-white">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

          
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <SafeAreaView className="flex-1 bg-black">
          <View style={{ flex: 1 }}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
            />
            <View className="flex-1 justify-end pb-10" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  buttonBase: {
    flex: 1, // flex-1
    alignItems: "center", // items-center
    justifyContent: "center", // justify-center
    paddingVertical: 10, // py-2.5 (2.5 * 4 = 10)
    borderRadius: 999, // rounded-full
  },
  buttonActive: {
    backgroundColor: "#000", // bg-black
  },
  buttonActiveDark: {
    backgroundColor: "#fff", // dark:bg-white
  },
  buttonInactive: {
    backgroundColor: "transparent", // When not active, no background
  },
  buttonShadow: {
    shadowColor: "#000", // shadow-sm (default shadow color)
    shadowOffset: { width: 0, height: 1 }, // shadow-sm default offset
    shadowOpacity: 0.1, // shadow-sm default opacity
    shadowRadius: 1, // shadow-sm default radius
    elevation: 2, // For Android shadow
  },
  buttonTextBase: {
    fontFamily: "Inter_700Bold", // Matches your "inter-bold" entry in tailwind.config.js
    fontSize: 14, // text-base
  },
  buttonTextActive: {
    color: "#fff", // text-white
  },
  buttonTextActiveDark: {
    color: "#000", // dark:text-black
  },
  buttonTextInactive: {
    color: "#4B5563", // text-neutral-600
  },
  buttonTextInactiveDark: {
    color: "#9CA3AF", // dark:text-neutral-400
  },
});
