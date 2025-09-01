import { Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

const EmptyState = ({ isDark, isEmpty }) => {
  if (isEmpty) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <FontAwesome
          name="heart-o"
          size={48}
          color={isDark ? "#8E8E93" : "#6C757D"}
        />
        <Text className="text-xl font-inter-semibold text-black dark:text-white mt-4">
          No posts yet
        </Text>
        <Text className="text-base font-inter text-gray-500 dark:text-gray-400 text-center px-8">
          Share your pet's health analysis to be the first!
        </Text>
      </View>
    );
  }

  return null;
};

export default EmptyState;