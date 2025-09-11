import { View, Text } from "react-native";

const SeverityIndicator = ({ severity, isDarkMode }) => {
  const severityConfig = {
    Low: {
      color: isDarkMode ? "bg-green-700" : "bg-green-200",
      textColor: isDarkMode ? "text-green-300" : "text-green-800",
      label: "Low",
    },
    Medium: {
      color: isDarkMode ? "bg-yellow-700" : "bg-yellow-200",
      textColor: isDarkMode ? "text-yellow-300" : "text-yellow-800",
      label: "Medium",
    },
    High: {
      color: isDarkMode ? "bg-orange-700" : "bg-orange-200",
      textColor: isDarkMode ? "text-orange-300" : "text-orange-800",
      label: "High",
    },
    Emergency: {
      color: isDarkMode ? "bg-red-700" : "bg-red-200",
      textColor: isDarkMode ? "text-red-300" : "text-red-800",
      label: "Emergency",
    },
  };

  const config = severityConfig[severity] || severityConfig.Low;

  return (
    <View className={`px-2 py-1 rounded-full ${config.color}`}>
      <Text className={`text-xs font-inter-semibold ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
};

export default SeverityIndicator;