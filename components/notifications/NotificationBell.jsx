import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNotifications } from '../../providers/NotificationProvider';

const NotificationBell = ({ onPress, isDark = false }) => {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="relative">
        <FontAwesome
          name="bell"
          size={20}
          color={isDark ? "#fff" : "#0A0A0A"}
        />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 justify-center items-center px-1">
            <Text className="text-white text-[10px] font-inter-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NotificationBell;
