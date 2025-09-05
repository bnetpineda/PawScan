import { FontAwesome } from "@expo/vector-icons";
import { View, Text } from "react-native";

const DetailSection = ({ title, content, icon, color = "green", isDarkMode }) => {
  if (!content) return null;

  const colorMap = {
    blue: isDarkMode ? "#60A5FA" : "#2563EB",
    green: isDarkMode ? "#34D399" : "#059669",
    orange: isDarkMode ? "#FBBF24" : "#EA580C",
    purple: isDarkMode ? "#A78BFA" : "#7C3AED",
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <FontAwesome name={icon} size={20} color={colorMap[color]} />
        <Text
          className="ml-2 text-lg font-inter-semibold dark:text-white text-black"
        >
          {title}
        </Text>
      </View>
      <Text
        className="text-base font-inter leading-6 dark:text-gray-300 text-gray-700"
      >
        {content}
      </Text>
    </View>
  );
};

export default DetailSection;