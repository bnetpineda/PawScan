import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthProvider';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  /**
   * Fetch all notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await notificationService.fetchNotifications({ limit: 100 });
      setNotifications(data);
      
      // Update unread count
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch unread count only
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if it was unread
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  /**
   * Delete all read notifications
   */
  const deleteAllRead = useCallback(async () => {
    try {
      await notificationService.deleteAllRead();
      
      // Update local state - keep only unread
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  }, []);

  /**
   * Handle incoming real-time notification
   */
  const handleRealtimeNotification = useCallback((notification, eventType = 'insert') => {
    if (eventType === 'delete') {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return;
    }

    if (eventType === 'update') {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? notification : n))
      );
      return;
    }

    // Insert new notification
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show local notification if app is in foreground
    showLocalNotification(notification);
  }, []);

  /**
   * Show local notification
   */
  const showLocalNotification = async (notification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.content,
          data: { 
            notificationId: notification.id,
            relatedId: notification.related_id,
            relatedType: notification.related_type,
            type: notification.type,
          },
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  };

  /**
   * Subscribe to real-time notifications
   */
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Subscribe to real-time updates
    const sub = notificationService.subscribeToNotifications(
      user.id,
      handleRealtimeNotification
    );
    setSubscription(sub);

    // Request notification permissions
    requestNotificationPermissions();

    return () => {
      if (sub) {
        notificationService.unsubscribe(sub);
      }
    };
  }, [user, fetchNotifications, handleRealtimeNotification]);

  /**
   * Request notification permissions
   */
  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      // For Android, set up notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
