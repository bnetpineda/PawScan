import React from "react";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const EmptyState = ({ isDark }) => {
  return (
    <View className="flex-1 justify-center items-center py-24">
      <FontAwesome
        name="history"
        size={48}
        color={isDark ? "#fff" : "#000"}
      />
      <Text className="mt-4 text-xl font-inter-bold text-black dark:text-white">
        No analyses yet
      </Text>
      <Text className="mt-2 text-base font-inter text-neutral-500 dark:text-neutral-400 text-center px-8">
        Start by taking a photo of your pet to create your first health
        analysis!
      </Text>
    </View>
  );
};

export default EmptyState;