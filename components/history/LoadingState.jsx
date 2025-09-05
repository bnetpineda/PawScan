import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

const LoadingState = ({ isDark }) => {
  return (
    <View
      className="flex-1 justify-center items-center bg-white dark:bg-black"
    >
      <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
      <Text className="mt-4 text-base font-inter text-gray-500 dark:text-gray-400">
        Loading your analyses...
      </Text>
    </View>
  );
};

export default LoadingState;