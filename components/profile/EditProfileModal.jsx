import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getThemeColors } from "../../utils/themeColors";

const EditProfileModal = ({
  visible,
  onClose,
  profile,
  onSave,
  updating,
  isDark,
}) => {
  const colors = getThemeColors(isDark);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
    }
  }, [profile]);

  const handleSave = () => {
    onSave({ name, bio, location });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className={`${colors.background} rounded-t-3xl`}
          style={{ maxHeight: "90%" }}
        >
          {/* Header */}
          <View className={`flex-row items-center justify-between p-4 border-b ${colors.border}`}>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <FontAwesome name="times" size={24} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
            <Text className={`text-lg font-inter-bold ${colors.text}`}>
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={updating}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
            >
              {updating ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text className="text-blue-500 font-inter-semibold text-base">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Name */}
            <View className="mb-4">
              <Text className={`mb-2 font-inter-medium ${colors.text}`}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                className={`p-3 rounded-lg ${colors.inputBg} ${colors.text} font-inter`}
                accessibilityLabel="Name input"
              />
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className={`mb-2 font-inter-medium ${colors.text}`}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Your location"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                className={`p-3 rounded-lg ${colors.inputBg} ${colors.text} font-inter`}
                accessibilityLabel="Location input"
              />
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className={`mb-2 font-inter-medium ${colors.text}`}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`p-3 rounded-lg ${colors.inputBg} ${colors.text} font-inter`}
                maxLength={200}
                accessibilityLabel="Bio input"
              />
              <Text className={`mt-1 text-right ${colors.textTertiary} text-xs`}>
                {bio.length}/200
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(EditProfileModal);
