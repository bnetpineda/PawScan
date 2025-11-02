import React from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getThemeColors } from "../../utils/themeColors";

const ProfileHeader = ({
  profileImage,
  onImagePress,
  onEditPress,
  onSettingsPress,
  uploading,
  uploadProgress,
  isDark,
}) => {
  const colors = getThemeColors(isDark);

  return (
    <View className="flex-row justify-between items-center px-4 py-4">
      <TouchableOpacity
        onPress={onImagePress}
        accessibilityLabel="Profile picture"
        accessibilityHint="Double tap to view full size or change picture"
        accessibilityRole="imagebutton"
      >
        <View className="relative">
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className="w-24 h-24 rounded-full"
              accessibilityLabel="User profile picture"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-neutral-300 dark:bg-neutral-700 items-center justify-center">
              <FontAwesome name="user" size={40} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </View>
          )}
          
          {uploading && (
            <View className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 items-center justify-center">
              <ActivityIndicator size="small" color="#fff" />
              {uploadProgress > 0 && (
                <Text className="text-white text-xs mt-1">{uploadProgress}%</Text>
              )}
            </View>
          )}
          
          <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
            <FontAwesome name="camera" size={12} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onEditPress}
          className={`px-4 py-2 rounded-lg ${colors.cardBg} ${colors.border} border`}
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
        >
          <Text className={`font-inter-semibold ${colors.text}`}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSettingsPress}
          className={`px-4 py-2 rounded-lg ${colors.cardBg} ${colors.border} border`}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <FontAwesome name="cog" size={20} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(ProfileHeader);
