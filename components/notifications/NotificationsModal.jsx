import React, { useState } from 'react';
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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../providers/NotificationProvider';
import NotificationItem from './NotificationItem';

const NotificationsModal = ({ visible, onClose }) => {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
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
          const userRole = notification.user_metadata?.options?.data?.role;
          if (userRole === 'veterinarian') {
            router.push(`/(vet)/chat/${notification.sender_id}`);
          } else {
            router.push(`/(user)/chat/${notification.sender_id}`);
          }
        }
        break;

      case 'comment':
      case 'like':
        // Navigate to home/newsfeed where they can see the post
        onClose();
        // The home screen will show all posts, user can find their post
        break;

      case 'reply':
        // Navigate to post with comments
        onClose();
        break;

      default:
        break;
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAllRead = async () => {
    Alert.alert(
      'Delete All Read',
      'Are you sure you want to delete all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAllRead();
          },
        },
      ]
    );
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? '#FFFFFF' : '#1F2937' },
          ]}
        >
          Notifications
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons
            name="close"
            size={28}
            color={isDark ? '#FFFFFF' : '#1F2937'}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
            {
              backgroundColor:
                filter === 'all'
                  ? '#3B82F6'
                  : isDark
                  ? '#374151'
                  : '#F3F4F6',
            },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  filter === 'all'
                    ? '#FFFFFF'
                    : isDark
                    ? '#D1D5DB'
                    : '#6B7280',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unread' && styles.filterButtonActive,
            {
              backgroundColor:
                filter === 'unread'
                  ? '#3B82F6'
                  : isDark
                  ? '#374151'
                  : '#F3F4F6',
            },
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  filter === 'unread'
                    ? '#FFFFFF'
                    : isDark
                    ? '#D1D5DB'
                    : '#6B7280',
              },
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAllRead}
          >
            <FontAwesome
              name="check-circle"
              size={16}
              color={isDark ? '#60A5FA' : '#3B82F6'}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: isDark ? '#60A5FA' : '#3B82F6' },
              ]}
            >
              Mark all read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteAllRead}
          >
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={isDark ? '#F87171' : '#EF4444'}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: isDark ? '#F87171' : '#EF4444' },
              ]}
            >
              Delete read
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome
        name="bell-slash"
        size={64}
        color={isDark ? '#4B5563' : '#D1D5DB'}
      />
      <Text
        style={[
          styles.emptyTitle,
          { color: isDark ? '#D1D5DB' : '#6B7280' },
        ]}
      >
        No notifications
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: isDark ? '#9CA3AF' : '#9CA3AF' },
        ]}
      >
        {filter === 'unread'
          ? "You're all caught up!"
          : "You'll see notifications here"}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111827' : '#F9FAFB' },
        ]}
        edges={['top']}
      >
        {renderHeader()}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                isDark={isDark}
                onPress={() => handleNotificationPress(item)}
                onDelete={() => handleDeleteNotification(item.id)}
              />
            )}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={
              filteredNotifications.length === 0 && styles.emptyListContainer
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? '#60A5FA' : '#3B82F6'}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    // Active style handled by backgroundColor
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default NotificationsModal;
