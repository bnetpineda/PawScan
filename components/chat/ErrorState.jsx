import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const ErrorState = ({ message, onRetry }) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="flex-1 justify-center items-center p-8">
      <FontAwesome
        name="exclamation-triangle"
        size={64}
        color={isDark ? "#ef4444" : "#dc2626"}
      />
      <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
        Something went wrong
      </Text>
      <Text className="text-base text-center text-neutral-600 dark:text-neutral-300 mb-6">
        {message || "Unable to load conversations. Please try again."}
      </Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-black dark:bg-white rounded-full px-6 py-3"
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text className="text-white dark:text-black text-base font-inter-semibold">
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState;
