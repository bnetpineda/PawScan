// app/(auth)/login.jsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    try {
      Alert.alert("Success", "Logged in successfully!");
      router.push("/(tabs)/home"); // Redirect to home screen after successful login}');
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const isEmailPasswordValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validationa
    return emailRegex.test(email.trim()) && password.trim().length >= 6;
  };
  const registerButton = async () => {
    router.replace("/(auth)/register");
  };
  1;

  return (
    <SafeAreaView className="flex-1 bg-[#132026]">
      <StatusBar backgroundColor="#132026" barStyle="light-content" />

      <View className="flex-1 p-5">
        <TouchableOpacity
          className="absolute left-5 top-5 z-10"
          onPress={() => router.replace("/")}
        >
          <Text className="text-2xl text-[#5a696e]">✕</Text>
        </TouchableOpacity>

        <Text className="mb-8 text-center font-chakrapetch-bold text-2xl text-[#5a696e]">
          Enter your details
        </Text>

        <View className="mb-5 rounded-2xl border border-gray-700 bg-[#212f36]">
          <TextInput
            className="h-14 border-b border-gray-700 px-4 font-chakrapetch-bold text-white"
            placeholder="Username or email"
            placeholderTextColor="#5a696e"
            value={email}
            onChangeText={setEmail}
          />
          <View className="flex-row items-center">
            <TextInput
              className="h-14 flex-1 px-4 font-chakrapetch-bold text-white"
              placeholder="Password"
              placeholderTextColor="#5a696e"
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
                color="#A0AEC0"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`mb-4 items-center rounded-lg py-3 ${
            isEmailPasswordValid() ? "bg-[#1db1f7]" : "bg-gray-700"
          }`}
          onPress={handleLogin}
          disabled={!isEmailPasswordValid()} // Button remains disabled if input is invalid
        >
          <Text className="font-chakrapetch-bold text-base text-white">
            SIGN IN
          </Text>
        </TouchableOpacity>

        <View className="flex-1 p-5">
          {/* Other UI Elements (Inputs, Sign-in Button, etc.) */}

          <View className="flex-1 justify-end">
            <TouchableOpacity className="mb-4 flex-row items-center justify-center gap-x-2 rounded-lg bg-gray-700 py-3">
              <FontAwesome name="google" size={20} color="white" />
              <Text className="font-chakrapetch-bold text-sm text-white">
                GOOGLE
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-xs text-gray-400">
              By signing in to Pawdex, you agree to our Terms and Privacy
              Policy.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
