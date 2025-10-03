import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const NotificationItem = ({
  notification,
  isDark,
  onPress,
  onDelete,
}) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const secondsAgo = Math.floor((now - notificationTime) / 1000);

    if (secondsAgo < 60) return 'now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d`;
    return `${Math.floor(secondsAgo / 604800)}w`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return 'chat-bubble-outline';
      case 'comment':
        return 'comment';
      case 'like':
        return 'favorite-border';
      case 'reply':
        return 'reply';
      default:
        return 'notifications-none';
    }
  };

  const icon = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity
      className={`flex-row items-start px-4 py-3 ${
        !notification.is_read ? (isDark ? 'bg-neutral-900' : 'bg-neutral-50') : ''
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar or Icon */}
      <View className="mr-3 relative">
        {notification.sender_avatar ? (
          <Image
            source={{ uri: notification.sender_avatar }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className={`w-12 h-12 rounded-full items-center justify-center ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}>
            <MaterialIcons
              name={icon}
              size={24}
              color={isDark ? '#a3a3a3' : '#737373'}
            />
          </View>
        )}
        {!notification.is_read && (
          <View className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
            isDark ? 'bg-neutral-50 border-black' : 'bg-neutral-950 border-white'
          }`} />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row items-start justify-between mb-1">
          <Text
            className={`flex-1 text-sm leading-5 ${
              !notification.is_read
                ? `font-inter-semibold ${isDark ? 'text-neutral-50' : 'text-neutral-950'}`
                : `font-inter ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`
            }`}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
        </View>
        
        <Text
          className={`text-sm mb-1 ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}
          numberOfLines={2}
        >
          {notification.content}
        </Text>
        
        <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {formatTimeAgo(notification.created_at)}
        </Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        className="p-2 -mr-2"
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        activeOpacity={0.6}
      >
        <MaterialIcons
          name="close"
          size={18}
          color={isDark ? '#737373' : '#a3a3a3'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default NotificationItem;
