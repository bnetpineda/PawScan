import { supabase } from '../lib/supabase';

/**
 * Notification Service
 * Handles all notification-related operations
 */

export const notificationService = {
  /**
   * Fetch notifications for the current user
   * @param {object} options - Query options
   * @returns {Promise<Array>}
   */
  async fetchNotifications({ limit = 50, unreadOnly = false } = {}) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich notifications with sender details
      const enrichedNotifications = await Promise.all(
        (data || []).map(async (notification) => {
          if (!notification.sender_id) return notification;

          try {
            // Try to get sender details from vet_profiles first
            const { data: vetProfile } = await supabase
              .from('vet_profiles')
              .select('name, profile_image_url')
              .eq('id', notification.sender_id)
              .single();

            if (vetProfile) {
              return {
                ...notification,
                sender_name: vetProfile.name,
                sender_avatar: vetProfile.profile_image_url,
              };
            }

            // If not a vet, get from user_profiles
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('name, profile_image_url')
              .eq('id', notification.sender_id)
              .single();

            if (userProfile) {
              return {
                ...notification,
                sender_name: userProfile.name,
                sender_avatar: userProfile.profile_image_url,
              };
            }
          } catch (err) {
            console.error('Error fetching sender details:', err);
          }

          return notification;
        })
      );

      return enrichedNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      
      return data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  async markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete all read notifications
   * @returns {Promise<void>}
   */
  async deleteAllRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time notifications
   * @param {string} userId
   * @param {function} callback
   * @returns {object} Subscription object
   */
  subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Enrich the notification with sender details
          const notification = payload.new;
          
          if (notification.sender_id) {
            try {
              // Try vet_profiles first
              const { data: vetProfile } = await supabase
                .from('vet_profiles')
                .select('name, profile_image_url')
                .eq('id', notification.sender_id)
                .single();

              if (vetProfile) {
                notification.sender_name = vetProfile.name;
                notification.sender_avatar = vetProfile.profile_image_url;
              } else {
                // Try user_profiles
                const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('name, profile_image_url')
                  .eq('id', notification.sender_id)
                  .single();

                if (userProfile) {
                  notification.sender_name = userProfile.name;
                  notification.sender_avatar = userProfile.profile_image_url;
                }
              }
            } catch (err) {
              console.error('Error enriching notification:', err);
            }
          }

          callback(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new, 'update');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.old, 'delete');
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Unsubscribe from notifications
   * @param {object} subscription
   */
  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  /**
   * Create a manual notification (for testing or custom scenarios)
   * @param {object} notification
   * @returns {Promise<object>}
   */
  async createNotification({ userId, senderId, type, title, content, relatedId, relatedType }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            sender_id: senderId,
            type,
            title,
            content,
            related_id: relatedId,
            related_type: relatedType,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
};
