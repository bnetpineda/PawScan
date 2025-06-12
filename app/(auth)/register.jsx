import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { useColorScheme } from "react-native";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    const validation = isFormValid();
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUpWithEmail(email, password, {
        options: {
          data: {
            display_name: fullName,
            role: userRole,
          },
        },
      });

      if (error) {
        Alert.alert("Registration Failed", error.message);
      } else {
        Alert.alert(
          "Registration Successful",
          "Please check your email for verification instructions.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace("/(auth)/login");
  };

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: "Please enter a valid email address." };
    }
    if (password.trim().length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters.",
      };
    }
    if (password !== confirmPassword) {
      return { valid: false, message: "Passwords don't match." };
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
              <Text className="text-2xl text-gray-400">✕</Text>
            </TouchableOpacity>

            <View className="mt-12 mb-8">
              <Text className="text-3xl font-inter-bold text-black dark:text-white mb-2">
                Create Account
              </Text>
              <Text className="font-inter text-gray-500 dark:text-gray-400">
                Sign up to get started with PawScan
              </Text>
            </View>

            <View className="mb-5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900">
              <TextInput
                className="h-14 border-b border-gray-200 dark:border-gray-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="none"
              />
              <TextInput
                className="h-14 border-b border-gray-200 dark:border-gray-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                placeholder="Email address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View className="flex-row items-center border-b border-gray-200 dark:border-gray-700">
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
            </View>

            {/* Modern Segmented Role Selection */}
            <View className="mb-6 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-neutral-800 p-1 flex-row">
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
                  userRole === "Veterinarian"
                    ? [styles.buttonActive, isDark && styles.buttonActiveDark, styles.buttonShadow]
                    : styles.buttonInactive,
                ]}
                onPress={() => setUserRole("Veterinarian")}
              >
                <Text
                  style={[
                    styles.buttonTextBase,
                    userRole === "Veterinarian"
                      ? [styles.buttonTextActive, isDark && styles.buttonTextActiveDark]
                      : [styles.buttonTextInactive, isDark && styles.buttonTextInactiveDark],
                  ]}
                >
                  Veterinarian
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`mb-4 items-center justify-center rounded-2xl py-4 ${
                isFormValid().valid && !loading
                  ? "bg-black dark:bg-white"
                  : "bg-gray-300 dark:bg-gray-700"
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
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-0.5 bg-gray-900 dark:bg-gray-500" />
              <Text className="mx-4 text-gray-700 dark:text-gray-600">or</Text>
              <View className="flex-1 h-0.5 bg-gray-900 dark:bg-gray-500" />
            </View>

            <View className="flex-row justify-center mt-4 mb-6">
              <Text className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text className="font-inter-bold text-black dark:text-white">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
              By creating an account, you agree to our{" "}
              <Text className="font-inter-bold text-black dark:text-white">
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text className="font-inter-bold text-black dark:text-white">
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    color: "#4B5563", // text-gray-600
  },
  buttonTextInactiveDark: {
    color: "#9CA3AF", // dark:text-gray-400
  },
});
