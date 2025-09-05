import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const AnalysisCard = ({ 
  analysis, 
  isDark, 
  onOpenModal, 
  onShare, 
  onDelete,
  formatDate,
  getUrgencyColor,
  getUrgencyLevel
}) => {
  const colors = {
    card: isDark ? "bg-gray-800" : "bg-white",
    border: isDark ? "border-gray-700" : "border-gray-200",
    text: isDark ? "text-white" : "text-black",
    textSecondary: isDark ? "text-gray-400" : "text-gray-500",
  };

  const urgencyColor = getUrgencyColor(analysis.analysis_result);
  const urgencyLevel = getUrgencyLevel(analysis.analysis_result);

  return (
    <TouchableOpacity
      key={analysis.id}
      className={`rounded-2xl border mb-4 overflow-hidden shadow-md ${colors.card} ${colors.border}`}
      onPress={() => onOpenModal(analysis)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-4 pb-3">
        <View className="flex-row items-center">
          <FontAwesome
            name="calendar"
            size={14}
            color={isDark ? "#8E8E93" : "#6C757D"}
          />
          <Text className={`ml-2 text-xs font-inter ${colors.textSecondary}`}>
            {formatDate(analysis.created_at)}
          </Text>
        </View>
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => onShare(analysis)}
            className="p-2"
          >
            <FontAwesome
              name="share"
              size={16}
              color={isDark ? "#8E8E93" : "#6C757D"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(analysis.id)}
            className="p-2"
          >
            <FontAwesome name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image and Content */}
      <View className="flex-row px-4 pb-4">
        <Image
          source={{ uri: analysis.image_url }}
          className="w-20 h-20 rounded-xl mr-4"
          resizeMode="cover"
        />
        <View className="flex-1">
          <View
            className={`self-start px-2 py-1 rounded-xl mb-2 ${urgencyColor}`}
          >
            <Text className="text-xs font-inter-semibold text-white">
              {urgencyLevel}
            </Text>
          </View>
          <Text
            className={`text-sm font-inter ${colors.text}`}
            numberOfLines={3}
          >
            {analysis.analysis_result}
          </Text>
          <TouchableOpacity>
            <Text className="text-sm font-inter-semibold text-blue-600 dark:text-blue-400">
              View Full Analysis →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AnalysisCard;