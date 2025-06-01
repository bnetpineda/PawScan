// app/(auth)/login.jsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
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
  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
    Alert.alert("Success", "Logged in successfully!");
    router.push("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const isEmailPasswordValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && password.trim().length >= 6;
  };

  const registerButton = async () => {
    router.replace("/(auth)/register");
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#000" : "#fff"}
      />
      <View className="flex-1 w-full max-w-md p-5">
        <TouchableOpacity
          className="absolute left-5 top-5 z-10"
          onPress={() => router.replace("/")}
        >
          <Text className="text-2xl text-gray-400">✕</Text>
        </TouchableOpacity>

        <Text className="mb-8 text-center font-bold text-2xl text-black dark:text-white">
          Enter your details
        </Text>

        <View className="mb-5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900">
          <TextInput
            className="h-14 border-b border-gray-200 dark:border-gray-700 px-4 font-bold text-black dark:text-white bg-transparent"
            placeholder="Username or email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
          />
          <View className="flex-row items-center">
            <TextInput
              className="h-14 flex-1 px-4 font-bold text-black dark:text-white bg-transparent"
              placeholder="Password"
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
                size={24}
                color={passwordVisible ? "#000" : "#888"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`mb-4 items-center rounded-lg py-3 ${
            isEmailPasswordValid() ? "bg-black" : "bg-gray-200"
          }`}
          onPress={handleLogin}
          disabled={!isEmailPasswordValid()}
        >
          <Text
            className={`font-bold text-base ${
              isEmailPasswordValid() ? "text-white" : "text-gray-400"
            }`}
          >
            Sign In
          </Text>
        </TouchableOpacity>

        <View className="flex-1 p-5 justify-end">
          <TouchableOpacity className="mb-4 flex-row items-center justify-center gap-x-2 rounded-lg py-3 bg-gray-900">
            <FontAwesome name="google" size={20} color="#fff" />
            <Text className="font-bold text-sm text-white">GOOGLE</Text>
          </TouchableOpacity>

          <Text className="text-center text-xs text-black dark:text-white">
            By signing in to PawScan, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
