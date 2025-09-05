import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

const LoadingState = ({ isDark }) => {
  const colors = {
    background: isDark ? "bg-black" : "bg-white",
    text: isDark ? "text-gray-400" : "text-gray-500",
  };

  return (
    <View
      className={`flex-1 justify-center items-center ${colors.background}`}
    >
      <ActivityIndicator size="large" color="#007AFF" />
      <Text className={`mt-4 text-base font-inter ${colors.text}`}>
        Loading your analyses...
      </Text>
    </View>
  );
};

export default LoadingState;