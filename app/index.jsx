import React, { use } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
const GetStartedScreen = () => {
  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background p-6 dark">
      <View className="w-full max-w-md bg-card dark:bg-card rounded-lg p-8 items-center">
        <Image
          source={require("../assets/images/logo.png")}
          className="w-64 h-64 rounded-full mb-6 mt-24"
          accessibilityLabel="PawScan App Logo"
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />

        <Text className="text-lg font-inter text-muted-foreground dark:text-muted-foreground mb-8 text-center leading-relaxed">
          Your ultimate companion for pet care and management. Let's begin!
        </Text>
      </View>
      <View className="flex-1 justify-end w-full max-w-md p-6 mb-10">
        <TouchableOpacity
          onPress={handleGetStarted}
          className="w-full bg-primary dark:bg-primary py-4 px-6 rounded-md shadow-sm"
        >
          <Text className="text-primary-foreground dark:text-primary-foreground text-xl font-inter-semibold text-center">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GetStartedScreen;
