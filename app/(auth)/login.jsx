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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; // Adjust the import path as necessary
import { useColorScheme } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
      router.push("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) {
        Alert.alert("Google Sign-In Failed", error.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.replace("/(auth)/register");
  };

  const isEmailPasswordValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && password.trim().length >= 6;
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="flex-1 w-full max-w-md ">
        <TouchableOpacity
          className="absolute left-0 top-3 z-10"
          onPress={() => router.replace("/")}
        >
          <Text className="text-2xl text-gray-400">✕</Text>
        </TouchableOpacity>

        <View className="mt-16 mb-8">
          <Text className="text-center font-inter-bold text-3xl text-black dark:text-white">
            Welcome Back
          </Text>
          <Text className="text-center text-gray-500 dark:text-gray-400 mt-2">
            Sign in to your PawScan account
          </Text>
        </View>

        <View className="mb-5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900">
          <TextInput
            className="h-14 border-b border-gray-200 dark:border-gray-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
            placeholder="Username or email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View className="flex-row items-center">
            <TextInput
              className="h-14 flex-1 px-4 font-inter-bold text-black dark:text-white bg-transparent"
              placeholder="Password"
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
              <FontAwesome
                name={passwordVisible ? "eye" : "eye-slash"}
                size={24}
                color={passwordVisible ? (isDark ? "#fff" : "#000") : "#888"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className="self-end mb-4"
          onPress={() => Alert.alert("Reset Password", "Feature coming soon!")}
        >
          <Text className="text-black dark:text-white font-inter-bold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`mb-4 items-center rounded-lg py-3.5 ${
            isEmailPasswordValid()
              ? "bg-black dark:bg-white"
              : "bg-gray-200 dark:bg-black"
          }`}
          onPress={handleLogin}
          disabled={!isEmailPasswordValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-inter-bold text-base ${
                isEmailPasswordValid() ? "text-white" : "text-gray-400"
              }`}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-0.5 bg-gray-400 dark:bg-gray-900" />
          <Text className="mx-4 text-gray-700 dark:text-gray-600">or</Text>
          <View className="flex-1 h-0.5 bg-gray-400 dark:bg-gray-900" />
        </View>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-center gap-x-2 rounded-lg py-3.5 bg-transparent border border-gray-300 dark:border-gray-700"
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <FontAwesome
            name="google"
            size={20}
            color={isDark ? "#fff" : "#000"}
          />
          <Text className="font-inter-bold text-sm text-black dark:text-white">
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View className="mt-6">
          <View className="flex-row justify-center">
            <Text className="text-gray-500 dark:text-gray-400 font-inter">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text className="font-inter-bold text-black dark:text-white">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 font font-inter">
            By signing in to PawScan, you agree to our{" "}
            <Text className="text-black dark:text-white font-inter-bold">
              Terms
            </Text>{" "}
            and{" "}
            <Text className="text-black dark:text-white font-inter-bold">
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
