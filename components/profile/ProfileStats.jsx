import React from "react";
import { View, Text } from "react-native";
import { getThemeColors } from "../../utils/themeColors";

const ProfileStats = ({ postsCount, petScanCount, isDark }) => {
  const colors = getThemeColors(isDark);

  return (
    <View className="flex-row justify-around px-4 py-4">
      <View className="items-center">
        <Text className={`text-2xl font-inter-bold ${colors.text}`}>
          {postsCount}
        </Text>
        <Text className={`font-inter ${colors.textSecondary}`}>Posts</Text>
      </View>
      
      <View className="items-center">
        <Text className={`text-2xl font-inter-bold ${colors.text}`}>
          {petScanCount}
        </Text>
        <Text className={`font-inter ${colors.textSecondary}`}>Pet Scanned</Text>
      </View>
    </View>
  );
};

export default React.memo(ProfileStats);
