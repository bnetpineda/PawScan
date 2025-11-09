import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const AnalysisCard = ({ analysis, isDark, onOpenModal, onShare, onDelete, formatDate }) => {
  // Internal urgency logic
  const text = String(analysis.analysis_result ?? "");
  const lowerText = text.toLowerCase();

  const urgencyColor =
    lowerText.includes("emergency") || lowerText.includes("urgent")
      ? "bg-red-500"
      : lowerText.includes("medium") || lowerText.includes("moderate")
      ? "bg-yellow-500"
      : "bg-green-500";

  const urgencyLevel =
    lowerText.includes("emergency") || lowerText.includes("urgent")
      ? "High Priority"
      : lowerText.includes("medium") || lowerText.includes("moderate")
      ? "Medium Priority"
      : "Low Priority";

  return (
    <TouchableOpacity
      className="mb-4 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800"
      onPress={() => onOpenModal(analysis)}
      activeOpacity={0.7}
    >
      {analysis.image_url ? (
        <Image
          source={{ uri: analysis.image_url }}
          className="w-full h-64"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-64 bg-neutral-200 dark:bg-neutral-800 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">No image</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-inter text-neutral-500 dark:text-neutral-400">
            {String(formatDate(analysis.created_at))}
          </Text>
          <View className={`self-start px-2 py-1 rounded-full ${urgencyColor}`}>
            <Text className="text-xs font-inter-semibold text-white">
              {urgencyLevel}
            </Text>
          </View>
        </View>

        <Text
          className="text-base font-inter text-black dark:text-white mb-4"
          numberOfLines={3}
        >
          {text}
        </Text>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => onShare(analysis)}
            className="flex-row items-center"
          >
            <FontAwesome
              name="share"
              size={16}
              color={isDark ? "#fff" : "#000"}
            />
            <Text className="ml-2 text-sm font-inter-semibold text-black dark:text-white">
              Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(analysis.id)}
            className="flex-row items-center"
          >
            <FontAwesome name="trash" size={16} color="#FF3B30" />
            <Text className="ml-2 text-sm font-inter-semibold text-red-600">
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AnalysisCard;
