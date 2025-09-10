import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.lastToken = null;
    this.initialized = false;
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permission is not granted, return null
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem('pushToken', token);
      
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Save push token to user profile only if it has changed
  async savePushTokenToProfile(token) {
    try {
      if (!token) return;
      
      // Check if token has actually changed to avoid unnecessary updates
      const storedToken = await AsyncStorage.getItem('lastSavedPushToken');
      if (storedToken === token) {
        console.log('Push token unchanged, skipping update');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user metadata with push token
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          push_token: token
        }
      });

      if (error) throw error;
      
      // Save the token as last saved to prevent repeated updates
      await AsyncStorage.setItem('lastSavedPushToken', token);
      console.log('Push token saved to profile');
    } catch (error) {
      console.error('Error saving push token to profile:', error);
    }
  }

  // Send push notification to a user
  async sendPushNotificationToUser(userId, title, body, data = {}) {
    try {
      // First, let's get the user's push token from their metadata
      const { data: userData, error: userError } = await supabase
        .from('user_display_names') // Using the view you have
        .select('id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Get the user's push token from auth metadata
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error('Error fetching user auth data:', authError);
        return;
      }

      const pushToken = user?.user_metadata?.push_token;
      if (!pushToken) {
        console.log('User does not have a push token');
        return;
      }

      // In a real implementation, you would send this to your backend
      // which would then use Expo's push notification service
      console.log('Would send push notification to:', pushToken, {
        title,
        body,
        data
      });
      
      // For production, you'd make an API call to your backend service
      // that uses Expo's push notification service to avoid rate limits
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Listen for notifications
  addNotificationListeners() {
    // Handle incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification:', notification);
    });

    // Handle notification responses (taps)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - you might want to navigate to the chat
      const data = response.notification.request.content.data;
      if (data && data.conversationId) {
        // Navigate to chat screen
        // This would require integration with your navigation system
        console.log('Navigate to conversation:', data.conversationId);
      }
    });
  }

  // Remove notification listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  // Initialize notifications only once
  async initialize() {
    // Prevent multiple initializations
    if (this.initialized) {
      console.log('Notification service already initialized');
      return;
    }
    
    try {
      this.initialized = true;
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        await this.savePushTokenToProfile(token);
      }
      this.addNotificationListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.initialized = false; // Reset if initialization failed
    }
  }
  
  // Reset initialization flag (useful for testing or logout)
  reset() {
    this.initialized = false;
    this.lastToken = null;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;