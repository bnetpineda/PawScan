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
  const colors = {
    card: isDark ? "bg-gray-800" : "bg-white",
    modalBg: isDark ? "bg-black/80" : "bg-black/50",
    text: isDark ? "text-white" : "text-black",
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 justify-center items-center px-4 ${colors.modalBg}`}
      >
        <View
          className={`w-full max-h-[90%] rounded-2xl overflow-hidden ${colors.card}`}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-lg font-inter-bold text-black dark:text-white">
              Analysis Details
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2"
            >
              <FontAwesome
                name="times"
                size={20}
                color={isDark ? "#8E8E93" : "#6C757D"}
              />
            </TouchableOpacity>
          </View>
          {selectedAnalysis && (
            <ScrollView>
              <Image
                source={{ uri: selectedAnalysis.image_url }}
                className="w-full h-64"
                resizeMode="cover"
              />
              <View className="flex-row justify-between items-center px-5 py-4">
                <Text className="text-xs font-inter text-gray-500 dark:text-gray-400">
                  {formatDate(selectedAnalysis.created_at)}
                </Text>
                <View
                  className={`self-start px-2 py-1 rounded-xl ${getUrgencyColor(
                    selectedAnalysis.analysis_result
                  )}`}
                >
                  <Text className="text-xs font-inter-semibold text-white">
                    {getUrgencyLevel(selectedAnalysis.analysis_result)}
                  </Text>
                </View>
              </View>
              <View className="px-5 pb-4">
                <Text className="text-base font-inter text-black dark:text-white mb-4">
                  {selectedAnalysis.analysis_result}
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-lg bg-blue-600"
                    onPress={() => {
                      onShare(selectedAnalysis);
                      onClose();
                    }}
                  >
                    <FontAwesome name="share" size={16} color="#fff" />
                    <Text className="ml-2 text-white font-inter-semibold">
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-lg bg-red-600"
                    onPress={() => {
                      onClose();
                      onDelete(selectedAnalysis.id);
                    }}
                  >
                    <FontAwesome name="trash" size={16} color="#fff" />
                    <Text className="ml-2 text-white font-inter-semibold">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AnalysisModal;