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
  const { user, loading, logout } = useAuth();

  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  const handleSignOut = async () => {
    await logout();
  };

  if (loading) return null; // Show nothing while loading

  if (user && !loading) {
    const role = user.user_metadata?.options?.data?.role;
    console.log("User role:", role);
    
    // Block pending veterinarians
    if (role === "pending_veterinarian") {
      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
          <Text className="text-xl font-inter-semibold text-black dark:text-white text-center mb-4">
            Account Pending Verification
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 text-center mb-6">
            Your veterinarian account is pending verification by an administrator. 
            You will receive an email once verified.
          </Text>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-primary dark:bg-white py-3 px-6 rounded-lg"
          >
            <Text className="text-white dark:text-black font-inter-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (role === "veterinarian") {
      return <Redirect href="/(vet)/home" />;
    } else {
      return <Redirect href="/(user)/home" />;
    }
  }

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
