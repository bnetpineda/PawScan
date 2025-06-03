import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useColorScheme,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import { Redirect } from "expo-router";

const GetStartedScreen = () => {
  const colorScheme = useColorScheme();
  const tintColor = colorScheme === "dark" ? "#fff" : "#000";
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  if (loading) return null; // Show nothing while loading

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-6 ">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#000" : "#fff"}
      />
      <View className="w-full max-w-md rounded-lg p-8 items-center">
        <Image
          source={require("../assets/images/logo.png")}
          className="w-64 h-64 rounded-full mb-6 mt-24"
          style={{ tintColor }}
          accessibilityLabel="PawScan App Logo"
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />
        <Text className="text-lg font-inter-italic text-black dark:text-white mb-8 text-center leading-relaxed">
          Your ultimate companion for pet care and management. Let's begin!
        </Text>
      </View>
      <View className="flex-1 justify-end w-full max-w-md p-6 mb-10">
        <TouchableOpacity
          onPress={handleGetStarted}
          className="w-full bg-primary dark:bg-white py-4 px-6 rounded-2xl shadow-sm"
        >
          <Text className="text-white dark:text-black text-xl font-inter-semibold text-center">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GetStartedScreen;
