import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function ShareModal({
  visible,
  onClose,
  petName,
  setPetName,
  isAnonymous,
  setIsAnonymous,
  isSharing,
  onShare,
  isDark,
  COLORS,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 w-11/12">
          <Text className="text-xl font-inter-bold text-center mb-4 text-black dark:text-white">
            Share to Newsfeed
          </Text>

          <Text className="text-gray-600 dark:text-gray-300 mb-2">
            Pet Name (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 text-black dark:text-white"
            placeholder="Enter your pet's name"
            placeholderTextColor={isDark ? "#6C757D" : "#6C757D"}
            value={petName}
            onChangeText={setPetName}
            maxLength={50}
          />

          <TouchableOpacity
            className={`flex-row items-center p-3 rounded-lg mb-6 ${
              isAnonymous
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <FontAwesome
              name={isAnonymous ? "check-square" : "square-o"}
              size={20}
              color={
                isAnonymous
                  ? COLORS.primary
                  : isDark
                  ? COLORS.white
                  : COLORS.textSecondary
              }
            />
            <Text className="ml-3 text-gray-700 dark:text-gray-300">
              Share anonymously
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg"
              onPress={onClose}
              disabled={isSharing}
            >
              <Text className="text-center text-gray-700 dark:text-white font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg"
              onPress={onShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center text-white font-semibold">
                  Share
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
