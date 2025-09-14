import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/AuthProvider";
import { useColorScheme } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // Get the access token from the URL hash
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get("access_token");

      if (!accessToken) {
        Alert.alert("Error", "Invalid reset link. Please request a new password reset.");
        router.replace("/(auth)/login");
        return;
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Password Updated",
        "Your password has been successfully updated. You can now log in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = () => {
    return password.length >= 6 && password === confirmPassword;
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="flex-1 w-full max-w-md justify-center">
        <View className="mb-8">
          <Text className="text-center font-inter-bold text-3xl text-black dark:text-white">
            Reset Password
          </Text>
          <Text className="text-center text-neutral-500 dark:text-neutral-400 mt-2">
            Enter your new password below
          </Text>
        </View>

        <View className="mb-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <View className="flex-row items-center">
            <TextInput
              className="h-14 flex-1 px-4 font-inter-bold text-black dark:text-white bg-transparent"
              placeholder="New Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              className="ml-2 p-2 px-4"
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Text className="text-black dark:text-white font-inter-bold">
                {passwordVisible ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <View className="flex-row items-center">
            <TextInput
              className="h-14 flex-1 px-4 font-inter-bold text-black dark:text-white bg-transparent"
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              className="ml-2 p-2 px-4"
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              <Text className="text-black dark:text-white font-inter-bold">
                {confirmPasswordVisible ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`mb-4 items-center rounded-lg py-3.5
    ${
      isPasswordValid()
        ? "bg-black dark:bg-white"
        : "bg-neutral-300 dark:bg-neutral-700"
    }`}
          onPress={handleResetPassword}
          disabled={!isPasswordValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-inter-bold text-base ${
                isPasswordValid()
                  ? "text-white dark:text-black"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Update Password
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-black dark:text-white font-inter-bold">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}