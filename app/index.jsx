import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

const GetStartedScreen = () => {
  const handleGetStarted = () => {
    console.log("Get Started button pressed!");
  };

  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background p-6 dark">
      <View className="w-full max-w-md bg-card dark:bg-card rounded-lg p-8 items-center">
        <Image
          source={{
            uri: "https://placehold.co/150x150/000000/FFFFFF?text=PawScan",
          }}
          className="w-32 h-32 rounded-full mb-6 border border-border dark:border-border"
          accessibilityLabel="PawScan App Logo"
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />

        <Text className="text-4xl font-inter-semibold text-foreground dark:text-foreground mb-3 text-center">
          Welcome to PawScan
        </Text>

        <Text className="text-lg font-inter text-muted-foreground dark:text-muted-foreground mb-8 text-center leading-relaxed">
          Your ultimate companion for pet care and management. Let's begin!
        </Text>

        <TouchableOpacity
          onPress={handleGetStarted}
          className="w-full bg-primary dark:bg-primary py-4 px-6 rounded-md shadow-sm"
        >
          <Text className="text-primary-foreground dark:text-primary-foreground text-xl font-inter-semibold text-center">
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => console.log("Learn More pressed!")}
          className="mt-4"
        >
          <Text className="text-muted-foreground dark:text-muted-foreground text-base font-inter">
            Learn More
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GetStartedScreen;
