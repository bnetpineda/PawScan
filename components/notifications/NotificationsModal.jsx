import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../providers/NotificationProvider';
import { useAuth } from '../../providers/AuthProvider';
import NotificationItem from './NotificationItem';

const NotificationsModal = ({ visible, onClose }) => {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(async (notification) => {
    try {
      // Mark as read if not already
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'message':
          // Navigate to chat
          if (notification.related_id) {
            onClose();
            // Determine if user is vet or regular user based on their role
            const userData = user?.user_metadata?.options?.data || {};
            const userRole = userData.role;
            // Extract sender name from notification data
            const senderName = notification.sender_name || notification.title || '';
            if (userRole === 'veterinarian') {
              router.push(`/(vet)/chat/${notification.sender_id}?userName=${encodeURIComponent(senderName)}`);
            } else {
              router.push(`/(user)/chat/${notification.sender_id}?originalVetName=${encodeURIComponent(senderName)}`);
            }
          }
          break;

        case 'comment':
          // Navigate to home and open comments modal for the post
          if (notification.related_id) {
            onClose();
            const userData = user?.user_metadata?.options?.data || {};
            const userRole = userData.role;
            if (userRole === 'veterinarian') {
              router.push(`/(vet)/home?openComments=${notification.related_id}`);
            } else {
              router.push(`/(user)/home?openComments=${notification.related_id}`);
            }
          }
          break;

        case 'like':
          // Navigate to home/newsfeed where they can see the post
          onClose();
          const userData2 = user?.user_metadata?.options?.data || {};
          const userRole2 = userData2.role;
          if (userRole2 === 'veterinarian') {
            router.push('/(vet)/home');
          } else {
            router.push('/(user)/home');
          }
          break;

        case 'reply':
          // Navigate to post with comments
          onClose();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }, [markAsRead, onClose, router, user]);

  const handleDeleteNotification = useCallback((notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notificationId);
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  }, [deleteNotification]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [markAllAsRead]);

  const handleDeleteAllRead = useCallback(() => {
    Alert.alert(
      'Delete All Read',
      'Are you sure you want to delete all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllRead();
            } catch (error) {
              console.error('Error deleting all read:', error);
            }
          },
        },
      ]
    );
  }, [deleteAllRead]);

  const filteredNotifications = useMemo(() => 
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications,
    [notifications, filter]
  );

  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const renderHeader = useCallback(() => (
    <View className={`border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
      {/* Header Top */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          onPress={onClose}
          className="p-2 -ml-2"
          activeOpacity={0.6}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#fafafa' : '#0a0a0a'}
          />
        </TouchableOpacity>
        
        <Text className={`text-base font-inter-semibold ${isDark ? 'text-neutral-50' : 'text-neutral-950'}`}>
          Notifications
        </Text>

        <View className="w-8" />
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4">
        <TouchableOpacity
          className={`flex-1 pb-3 border-b-2 ${
            filter === 'all'
              ? isDark ? 'border-neutral-50' : 'border-neutral-950'
              : 'border-transparent'
          }`}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center text-sm font-inter-semibold ${
              filter === 'all'
                ? isDark ? 'text-neutral-50' : 'text-neutral-950'
                : isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 pb-3 border-b-2 ${
            filter === 'unread'
              ? isDark ? 'border-neutral-50' : 'border-neutral-950'
              : 'border-transparent'
          }`}
          onPress={() => setFilter('unread')}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-center gap-1">
            <Text
              className={`text-center text-sm font-inter-semibold ${
                filter === 'unread'
                  ? isDark ? 'text-neutral-50' : 'text-neutral-950'
                  : isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View className={`rounded-full px-1.5 py-0.5 min-w-[20px] items-center ${
                isDark ? 'bg-neutral-700' : 'bg-neutral-200'
              }`}>
                <Text className={`text-xs font-inter-semibold ${
                  isDark ? 'text-neutral-50' : 'text-neutral-950'
                }`}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View className={`flex-row items-center justify-end gap-4 px-4 py-2 ${
          isDark ? 'bg-neutral-900' : 'bg-neutral-50'
        }`}>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 py-1"
            onPress={handleMarkAllRead}
            activeOpacity={0.6}
          >
            <MaterialIcons
              name="done-all"
              size={16}
              color={isDark ? '#a3a3a3' : '#737373'}
            />
            <Text className={`text-xs font-inter-medium ${
              isDark ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Mark all read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-1.5 py-1"
            onPress={handleDeleteAllRead}
            activeOpacity={0.6}
          >
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={isDark ? '#a3a3a3' : '#737373'}
            />
            <Text className={`text-xs font-inter-medium ${
              isDark ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Clear read
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [isDark, filter, unreadCount, notifications.length, handleMarkAllRead, handleDeleteAllRead]);

  const renderEmptyState = useCallback(() => (
    <View className="flex-1 items-center justify-center px-8">
      <View className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${
        isDark ? 'bg-neutral-800' : 'bg-neutral-100'
      }`}>
        <MaterialIcons
          name="notifications-none"
          size={48}
          color={isDark ? '#525252' : '#a3a3a3'}
        />
      </View>
      <Text className={`text-xl font-inter-semibold mb-2 ${
        isDark ? 'text-neutral-200' : 'text-neutral-800'
      }`}>
        No notifications
      </Text>
      <Text className={`text-sm text-center ${
        isDark ? 'text-neutral-400' : 'text-neutral-500'
      }`}>
        {filter === 'unread'
          ? "You're all caught up!"
          : "You'll see notifications here"}
      </Text>
    </View>
  ), [isDark, filter]);

  const renderItem = useCallback(({ item }) => (
    <NotificationItem
      notification={item}
      isDark={isDark}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item.id)}
    />
  ), [isDark, handleNotificationPress, handleDeleteNotification]);

  const ItemSeparator = useCallback(() => (
    <View className={`h-px mx-4 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`} />
  ), [isDark]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}
        edges={['top']}
      >
        {renderHeader()}

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator 
              size="large" 
              color={isDark ? '#737373' : '#525252'} 
            />
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={
              filteredNotifications.length === 0 ? { flex: 1 } : { paddingBottom: 16 }
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? '#737373' : '#525252'}
              />
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={ItemSeparator}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default NotificationsModal;
