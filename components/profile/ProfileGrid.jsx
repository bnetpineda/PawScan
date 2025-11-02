import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getThemeColors } from "../../utils/themeColors";

const { width } = Dimensions.get("window");
const imageSize = width / 3;

const ProfileGrid = ({
  items,
  loading,
  onImagePress,
  emptyMessage,
  isDark,
}) => {
  const colors = getThemeColors(isDark);

  if (loading) {
    return (
      <View className="flex-row flex-wrap w-full">
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={{ width: imageSize, height: imageSize }}
            className="bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
          />
        ))}
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View className="w-full py-20 items-center justify-center">
        <FontAwesome
          name="image"
          size={48}
          color={isDark ? "#6B7280" : "#9CA3AF"}
        />
        <Text className={`mt-4 font-inter ${colors.textSecondary}`}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap w-full">
      {items.map((item, index) => {
        // Handle both posts (url property) and history (image_url property)
        const imageUrl = item.url || item.image_url;
        return (
          <TouchableOpacity
            key={item.id || index}
            style={{ width: imageSize, height: imageSize }}
            onPress={() => onImagePress(imageUrl)}
            accessibilityLabel={`Image ${index + 1}`}
            accessibilityRole="imagebutton"
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: imageSize, height: imageSize }}
              className="border border-neutral-300 dark:border-neutral-700"
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(ProfileGrid);
