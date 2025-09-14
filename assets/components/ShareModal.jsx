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
        <View
          className={`bg-neutral-100 dark:bg-neutral-700 rounded-2xl p-6 mx-6 w-11/12 ${
            isDark ? "" : "border border-neutral-300"
          }`}
        >
          <Text className="text-xl font-inter-bold text-center mb-4 text-black dark:text-white">
            Share to Newsfeed
          </Text>

          <Text className="text-neutral-600 font-inter dark:text-neutral-300 mb-2">
            Pet Name (Optional)
          </Text>
          <TextInput
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg pl-2 p-4 mb-4 font-inter text-black dark:text-white"
            placeholder="Enter your pet's name"
            placeholderTextColor={isDark ? "#6C757D" : "#6C757D"}
            value={petName}
            onChangeText={setPetName}
            maxLength={50}
          />

          <TouchableOpacity
            className="flex-row items-center p-3 rounded-lg mb-6"
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <FontAwesome
              name={isAnonymous ? "check-square" : "square-o"}
              size={20}
              color={
                isAnonymous ? "#000000" : isDark ? "#fff" : COLORS.textSecondary
              }
            />
            <Text className="font-inter ml-2 text-black dark:text-white">
              Share anonymously
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-white dark:bg-black py-3 rounded-lg"
              onPress={onClose}
              disabled={isSharing}
            >
              <Text className="text-center text-black dark:text-white font-inter-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-black dark:bg-white py-3 rounded-lg"
              onPress={onShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center  text-white dark:text-black font-inter-semibold">
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
