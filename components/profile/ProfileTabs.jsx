import React from "react";
import { View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getBorderColor } from "../../utils/themeColors";

const ProfileTabs = ({ showingHistory, onTabChange, isDark }) => {
  const borderColor = getBorderColor(isDark);
  const activeColor = "#3B82F6";
  const inactiveColor = isDark ? "white" : "black";

  return (
    <View className={`flex-row border-t border-b ${borderColor}`}>
      <TouchableOpacity
        className={`flex-1 items-center py-3 border-r ${borderColor}`}
        onPress={() => onTabChange(false)}
        accessibilityLabel="Posts"
        accessibilityRole="tab"
        accessibilityState={{ selected: !showingHistory }}
      >
        <FontAwesome
          name="table"
          size={24}
          color={!showingHistory ? activeColor : inactiveColor}
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        className="flex-1 items-center py-3"
        onPress={() => onTabChange(true)}
        accessibilityLabel="History"
        accessibilityRole="tab"
        accessibilityState={{ selected: showingHistory }}
      >
        <FontAwesome
          name="history"
          size={24}
          color={showingHistory ? activeColor : inactiveColor}
        />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(ProfileTabs);
