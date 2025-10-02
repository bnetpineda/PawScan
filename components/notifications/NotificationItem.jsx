import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

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

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    return notificationTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return { name: 'comment', color: '#3B82F6' };
      case 'comment':
        return { name: 'commenting', color: '#10B981' };
      case 'like':
        return { name: 'heart', color: '#EF4444' };
      case 'reply':
        return { name: 'reply', color: '#8B5CF6' };
      default:
        return { name: 'bell', color: '#6B7280' };
    }
  };

  const icon = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: notification.is_read
            ? (isDark ? '#1F2937' : '#FFFFFF')
            : (isDark ? '#374151' : '#EFF6FF'),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar or Icon */}
        <View style={styles.avatarContainer}>
          {notification.sender_avatar ? (
            <Image
              source={{ uri: notification.sender_avatar }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: icon.color + '20' },
              ]}
            >
              <FontAwesome name={icon.name} size={20} color={icon.color} />
            </View>
          )}
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>

        {/* Notification Content */}
        <View style={styles.textContent}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? '#FFFFFF' : '#1F2937',
                fontWeight: notification.is_read ? '400' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text
            style={[
              styles.message,
              {
                color: isDark ? '#D1D5DB' : '#6B7280',
              },
            ]}
            numberOfLines={2}
          >
            {notification.content}
          </Text>
          <Text
            style={[
              styles.time,
              {
                color: isDark ? '#9CA3AF' : '#9CA3AF',
              },
            ]}
          >
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <MaterialIcons
            name="close"
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
});

export default NotificationItem;
