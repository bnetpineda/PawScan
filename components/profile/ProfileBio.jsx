import React from "react";
import { View, Text } from "react-native";
import { getThemeColors } from "../../utils/themeColors";
import { formatDate } from "../../utils/dateFormat";

const ProfileBio = ({ displayName, role, createdAt, bio, location, isDark }) => {
  const colors = getThemeColors(isDark);

  return (
    <View className="px-4">
      <Text className={`font-inter-semibold ${colors.text}`}>
        {displayName}
      </Text>
      <Text className={`font-inter ${colors.textSecondary}`}>
        {role} | Pet Health Enthusiast
      </Text>
      {location && (
        <Text className={`font-inter ${colors.textSecondary}`}>
          📍 {location}
        </Text>
      )}
      <Text className={`mt-1 font-inter ${colors.textTertiary}`}>
        Member since {formatDate(createdAt)}
      </Text>
      {bio && (
        <Text className={`mt-2 font-inter ${colors.text}`}>
          {bio}
        </Text>
      )}
    </View>
  );
};

export default React.memo(ProfileBio);
