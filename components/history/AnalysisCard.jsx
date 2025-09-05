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
  const urgencyColor = getUrgencyColor(analysis.analysis_result);
  const urgencyLevel = getUrgencyLevel(analysis.analysis_result);

  return (
    <TouchableOpacity
      key={analysis.id}
      className="mb-4 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
      onPress={() => onOpenModal(analysis)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <Image
        source={{ uri: analysis.image_url }}
        className="w-full h-64"
        resizeMode="cover"
      />
      
      {/* Content */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-inter text-gray-500 dark:text-gray-400">
            {formatDate(analysis.created_at)}
          </Text>
          <View
            className={`self-start px-2 py-1 rounded-full ${urgencyColor}`}
          >
            <Text className="text-xs font-inter-semibold text-white">
              {urgencyLevel}
            </Text>
          </View>
        </View>
        
        <Text
          className="text-base font-inter text-black dark:text-white mb-4"
          numberOfLines={3}
        >
          {analysis.analysis_result}
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