import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Modal } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const AnalysisModal = ({ 
  visible, 
  isDark, 
  selectedAnalysis, 
  onClose, 
  onShare, 
  onDelete,
  formatDate,
  getUrgencyColor,
  getUrgencyLevel
}) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-black">
        {/* Modal Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <TouchableOpacity
            onPress={onClose}
            className="p-2"
          >
            <FontAwesome
              name="times"
              size={20}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-lg font-inter-bold text-black dark:text-white">
            Analysis Details
          </Text>
          <View className="w-10 h-10" /> {/* Spacer for alignment */}
        </View>
        
        {selectedAnalysis && (
          <ScrollView className="flex-1">
            <Image
              source={{ uri: selectedAnalysis.image_url }}
              className="w-full h-96"
              resizeMode="cover"
            />
            
            <View className="p-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-inter text-neutral-500 dark:text-neutral-400">
                  {formatDate(selectedAnalysis.created_at)}
                </Text>
                <View
                  className={`self-start px-2 py-1 rounded-full ${getUrgencyColor(
                    selectedAnalysis.analysis_result
                  )}`}
                >
                  <Text className="text-xs font-inter-semibold text-white">
                    {getUrgencyLevel(selectedAnalysis.analysis_result)}
                  </Text>
                </View>
              </View>
              
              <Text className="text-base font-inter text-black dark:text-white mb-6">
                {selectedAnalysis.analysis_result}
              </Text>
              
              <View className="flex-row justify-around border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => {
                    onShare(selectedAnalysis);
                  }}
                >
                  <FontAwesome name="share" size={20} color={isDark ? "#fff" : "#000"} />
                  <Text className="ml-2 text-base font-inter-semibold text-black dark:text-white">
                    Share
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => {
                    onDelete(selectedAnalysis.id);
                  }}
                >
                  <FontAwesome name="trash" size={20} color="#FF3B30" />
                  <Text className="ml-2 text-base font-inter-semibold text-red-600">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

export default AnalysisModal;