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
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useColorScheme } from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleRegister = async () => {
    if (!isFormValid().valid) {
      Alert.alert("Validation Error", isFormValid().message);
      return;
    }

    setLoading(true);
    try {
      // Register the user with Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
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

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        Alert.alert("Error", error.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: "Please enter a valid email address." };
    }

    // Username validation
    if (username.trim().length < 3) {
      return {
        valid: false,
        message: "Username must be at least 3 characters.",
      };
    }

    // Password validation
    if (password.trim().length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters.",
      };
    }

    // Password match validation
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
                placeholder="Username"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
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

            <TouchableOpacity
              className={`mb-4 items-center justify-center rounded-lg py-4 ${
                isFormValid().valid && !loading
                  ? "bg-black dark:bg-white"
                  : "bg-gray-200 dark:bg-gray-800"
              }`}
              onPress={handleRegister}
              disabled={!isFormValid().valid || loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? "#fff" : "#000"} />
              ) : (
                <Text
                  className={`${
                    isFormValid().valid
                      ? "text-white dark:text-black font-inter-bold"
                      : "text-gray-400 dark:text-gray-500 font-inter"
                  }`}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
              <Text className="mx-4 text-gray-500 dark:text-gray-400 font-medium">
                or
              </Text>
              <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
            </View>

            <TouchableOpacity
              className="mb-6 flex-row items-center justify-center py-3.5 rounded-lg border border-gray-300 dark:border-gray-700"
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <FontAwesome
                name="google"
                size={18}
                color={isDark ? "#fff" : "#000"}
              />
              <Text className="ml-2 font-inter-bold text-black dark:text-white">
                Continue with Google
              </Text>
            </TouchableOpacity>

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
