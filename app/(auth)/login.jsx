import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { useColorScheme } from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { signInWithEmail, resetPassword } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error, data } = await signInWithEmail(email, password);
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
      
      // Check if the user is a veterinarian and if they're verified
      if (data.user?.user_metadata?.role === "Veterinarian") {
        // Check if the user exists in the auth.users table (meaning they're verified)
        const { data: userData, error: userError } = await supabase
          .from('veterinarians')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (userError || !userData) {
          // User is a veterinarian but not found in the verified veterinarians view
          // This means they're not yet verified by an admin
          await supabase.auth.signOut(); // Log them out
          Alert.alert(
            "Account Not Verified", 
            "Your veterinarian account is pending verification by an administrator. You will receive an email once verified."
          );
          return;
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = resetEmail.trim();
    
    if (!trimmedEmail) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsResetLoading(true);
    try {
      const result = await resetPassword(trimmedEmail);
      
      if (result.error) {
        Alert.alert("Error", result.error.message);
        return;
      }
      
      Alert.alert(
        "Password Reset Email Sent",
        "Check your email for instructions to reset your password"
      );
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsResetLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.replace("/(auth)/register");
  };

  const isEmailPasswordValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && password.trim().length >= 6;
  };

  const isResetEmailValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return resetEmail && emailRegex.test(resetEmail.trim());
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="flex-1 w-full max-w-md ">
        <TouchableOpacity
          className="absolute left-0 top-3 z-10"
          onPress={() => router.replace("/")}
        >
          <Text className="text-2xl text-neutral-400">✕</Text>
        </TouchableOpacity>

        <View className="mt-16 mb-8">
          <Text className="text-center font-inter-bold text-3xl text-black dark:text-white">
            Welcome Back
          </Text>
          <Text className="text-center text-neutral-500 dark:text-neutral-400 mt-2">
            Sign in to your PawScan account
          </Text>
        </View>

        <View className="mb-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <TextInput
            className="h-14 border-b border-neutral-200 dark:border-neutral-700 px-4 font-inter-bold text-black dark:text-white bg-transparent"
            placeholder="Email"
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
          onPress={() => setShowForgotPassword(true)}
        >
          <Text className="text-black dark:text-white font-inter-bold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`mb-4 items-center rounded-lg py-3.5
    ${
      isEmailPasswordValid()
        ? "bg-black dark:bg-white"
        : "bg-neutral-300 dark:bg-neutral-700"
    }`}
          onPress={handleLogin}
          disabled={!isEmailPasswordValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-inter-bold text-base ${
                isEmailPasswordValid()
                  ? "text-white dark:text-black"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-0.5 bg-neutral-900 dark:bg-neutral-500" />
          <Text className="mx-4 text-neutral-700 dark:text-neutral-600">or</Text>
          <View className="flex-1 h-0.5 bg-neutral-900 dark:bg-neutral-500" />
        </View>

        <View className="mt-6">
          <View className="flex-row justify-center">
            <Text className="text-neutral-500 dark:text-neutral-400 font-inter">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text className="font-inter-bold text-black dark:text-white">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-6 font font-inter">
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

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showForgotPassword}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-11/12 max-w-md bg-white dark:bg-black rounded-2xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-inter-bold text-black dark:text-white">
                Reset Password
              </Text>
              <TouchableOpacity
                onPress={() => setShowForgotPassword(false)}
                className="p-2"
              >
                <Text className="text-2xl text-neutral-400">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-600 dark:text-neutral-400 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View className="mb-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <TextInput
                className="h-14 px-4 font-inter-bold text-black dark:text-white bg-transparent"
                placeholder="Email"
                placeholderTextColor="#888"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              className={`items-center rounded-lg py-3.5 mb-3
        ${
          isResetEmailValid()
            ? "bg-black dark:bg-white"
            : "bg-neutral-300 dark:bg-neutral-700"
        }`}
              onPress={handlePasswordReset}
              disabled={!isResetEmailValid() || isResetLoading}
            >
              {isResetLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  className={`font-inter-bold text-base ${
                    isResetEmailValid()
                      ? "text-white dark:text-black"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center py-3"
              onPress={() => setShowForgotPassword(false)}
            >
              <Text className="text-black dark:text-white font-inter-bold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
