import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { createLoadingManager } from '../utils/performance';

const useChat = (conversationId, user, vetName, vetId) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({}); // Track message status
  const messageStatusRef = useRef(messageStatus);
  const [networkError, setNetworkError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesChannelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Create loading manager for better loading state handling
  const sendingLoadingManager = useMemo(() => createLoadingManager(setIsSending), []);
  
  // Track subscription states to prevent duplicates
  const isSubscribedRef = useRef({
    messages: false,
    typing: false
  });
  
  // Update ref when messageStatus changes
  useEffect(() => {
    messageStatusRef.current = messageStatus;
  }, [messageStatus]);

  // Cleanup function for all subscriptions
  const cleanupSubscriptions = useCallback(() => {
    console.log('Cleaning up subscriptions...');
    
    // Unsubscribe from messages channel
    if (messagesChannelRef.current) {
      try {
        const channel = messagesChannelRef.current;
        messagesChannelRef.current = null;
        isSubscribedRef.current.messages = false;
        channel.unsubscribe();
        console.log('Unsubscribed from messages channel');
      } catch (error) {
        console.error('Error unsubscribing from messages channel:', error);
      }
    }
    
    // Unsubscribe from typing channel
    if (typingChannelRef.current) {
      try {
        const channel = typingChannelRef.current;
        typingChannelRef.current = null;
        isSubscribedRef.current.typing = false;
        channel.unsubscribe();
        console.log('Unsubscribed from typing channel');
      } catch (error) {
        console.error('Error unsubscribing from typing channel:', error);
      }
    }
  }, []);

  // Update typing status
  const updateTypingStatus = useCallback(async (isTyping) => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('typing_status')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: isTyping,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'conversation_id,user_id',
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating typing status:', error);
      // Don't show alert for typing status errors as they're not critical
    }
  }, [conversationId, user]);

  // Clear typing status
  const clearTypingStatus = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from('typing_status')
        .update({ is_typing: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error clearing typing status:', error);
      // Don't show alert for typing status errors as they're not critical
    }
  }, [conversationId, user]);

  // Function to mark a message as read
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't show alert for read status errors as they're not critical
    }
  }, []);

  // Function to mark messages as read when they are displayed
  const markMessagesAsRead = useCallback(async () => {
    // Find all messages from the other user that haven't been read yet
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== user.id && !msg.read
    );
    
    // Mark each unread message as read
    for (const message of unreadMessages) {
      await markMessageAsRead(message.id);
    }
  }, [messages, user, markMessageAsRead]);

  // Retry send message function
  const retrySendMessage = useCallback(async (tempMessageId, content, imageUrl = null, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      // Upload image if provided
      let uploadedImageUrl = null;
      if (imageUrl) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        // Read the image as base64 like in analyzePetImage.js
        const fileData = await FileSystem.readAsStringAsync(imageUrl, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(fileData, "base64");
        
        // Determine content type
        const imageExt = imageUrl.split(".").pop()?.toLowerCase();
        const contentType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, fileBuffer, {
            contentType: contentType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        uploadedImageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: content,
            image_url: uploadedImageUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace the temporary message with the real one from the database
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === tempMessageId);
        if (tempMessageIndex !== -1) {
          updatedMessages[tempMessageIndex] = data;
        }
        return updatedMessages;
      });
      
      // Update message status - remove the temporary ID and add the real ID
      setMessageStatus(prev => {
        const newStatus = { ...prev };
        // Remove the temporary message status
        delete newStatus[tempMessageId];
        // Add the real message status
        newStatus[data.id] = {
          sent: true,
          delivered: false, // Not delivered yet, will be updated when recipient receives it
          read: false // Not read yet, will be updated when recipient reads it
        };
        return newStatus;
      });

      setNetworkError(null);
      return data;
    } catch (error) {
      console.error(`Error sending message (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry
        return retrySendMessage(tempMessageId, content, imageUrl, retryCount + 1);
      } else {
        // Max retries reached - remove the temporary message
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempMessageId));
        setMessageStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[tempMessageId];
          return newStatus;
        });
        
        setNetworkError('Failed to send message after multiple attempts. Please check your connection.');
        Alert.alert(
          'Message Failed', 
          'Could not send your message. Please check your connection and try again.',
          [
            { text: 'Retry', onPress: () => retrySendMessage(tempMessageId, content, imageUrl, 0) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        throw error;
      }
    }
  }, [conversationId, user]);

  // Send message function
  const sendMessage = useCallback(async (imageUrl = null) => {
    const content = newMessage.trim();
    if (!content && !imageUrl || !conversationId) return;

    // Create a temporary message object for immediate display
    const tempMessageId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      read: false,
    };

    // Immediately add to local state for instant feedback
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    
    // Set initial message status
    setMessageStatus(prev => ({
      ...prev,
      [tempMessageId]: {
        sent: false,
        delivered: false,
        read: false
      }
    }));

    try {
      // Use loading manager instead of direct setIsSending
      sendingLoadingManager.start(100);
      
      await retrySendMessage(tempMessageId, content, imageUrl);
      setNewMessage('');
      
      // Clear typing status after sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      updateTypingStatus(false);
    } catch (error) {
      // Error already handled in retrySendMessage
      console.error('Error sending message:', error);
    } finally {
      sendingLoadingManager.stop();
    }
  }, [newMessage, conversationId, user, retrySendMessage, sendingLoadingManager, updateTypingStatus]);

  // Handle input change function
  const handleInputChange = useCallback((text) => {
    setNewMessage(text);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing status to true
    updateTypingStatus(true);
    
    // Set timeout to clear typing status after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 1000);
  }, [updateTypingStatus]);

  // Subscribe to messages
  const subscribeToMessages = useCallback(() => {
    // Prevent duplicate subscriptions
    if (isSubscribedRef.current.messages || !conversationId || !user) {
      console.log('Skipping messages subscription - already subscribed or missing dependencies');
      return;
    }

    // Create new subscription
    console.log('Creating new messages subscription');
    isSubscribedRef.current.messages = true;
    
    const channelName = `messages-${conversationId}`;
    messagesChannelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Additional check to ensure we're still subscribed
          if (!isSubscribedRef.current.messages) return;
          
          const newMessage = payload.new;
          
          // If this is a message from the other user, mark it as delivered
          if (newMessage.sender_id !== user.id) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            
            // Mark message as delivered (not read yet)
            // Read status will be updated when user actually views the message
            setMessageStatus(prev => ({
              ...prev,
              [newMessage.id]: {
                sent: true,
                delivered: true,
                read: false
              }
            }));
            
            // Send push notification - notification service removed
          } else {
            // This is our own message, update its status
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const index = updatedMessages.findIndex(msg => msg.id === newMessage.id);
              if (index !== -1) {
                updatedMessages[index] = newMessage;
              }
              return updatedMessages;
            });
            
            // Update message status - only mark as sent, not delivered or read
            // Delivered status should be updated when the recipient actually receives it
            // Read status should be updated when the recipient actually reads it
            setMessageStatus(prev => ({
              ...prev,
              [newMessage.id]: {
                sent: true,
                delivered: false, // Will be updated when recipient receives it
                read: false // Will be updated when recipient reads it
              }
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Additional check to ensure we're still subscribed
          if (!isSubscribedRef.current.messages) return;
          
          const updatedMessage = payload.new;
          
          // Update message in list
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const index = updatedMessages.findIndex(msg => msg.id === updatedMessage.id);
            if (index !== -1) {
              updatedMessages[index] = updatedMessage;
            }
            return updatedMessages;
          });
          
          // Update message status only if it exists in our status tracking
          // This handles cases where the message status is updated (e.g., read status)
          if (messageStatusRef.current[updatedMessage.id]) {
            setMessageStatus(prev => ({
              ...prev,
              [updatedMessage.id]: {
                ...prev[updatedMessage.id],
                read: updatedMessage.read || false
              }
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages channel');
        } else if (status === 'CLOSED') {
          console.log('Messages subscription closed');
          isSubscribedRef.current.messages = false;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Messages subscription error');
          isSubscribedRef.current.messages = false;
        }
      });

    console.log('Subscribed to messages channel');
  }, [conversationId, user, vetName, vetId]);

  // Subscribe to typing
  const subscribeToTyping = useCallback(() => {
    // Prevent duplicate subscriptions
    if (isSubscribedRef.current.typing || !conversationId || !user) {
      console.log('Skipping typing subscription - already subscribed or missing dependencies');
      return;
    }

    // Create new subscription for typing status
    console.log('Creating new typing subscription');
    isSubscribedRef.current.typing = true;
    
    const channelName = `typing-${conversationId}`;
    typingChannelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Additional check to ensure we're still subscribed
          if (!isSubscribedRef.current.typing) return;
          
          const typingData = payload.new;
          if (typingData.user_id !== user.id) {
            setIsOtherUserTyping(typingData.is_typing);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Additional check to ensure we're still subscribed
          if (!isSubscribedRef.current.typing) return;
          
          const typingData = payload.new;
          if (typingData.user_id !== user.id) {
            setIsOtherUserTyping(typingData.is_typing);
          }
        }
      )
      .subscribe((status) => {
        console.log('Typing subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to typing channel');
        } else if (status === 'CLOSED') {
          console.log('Typing subscription closed');
          isSubscribedRef.current.typing = false;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Typing subscription error');
          isSubscribedRef.current.typing = false;
        }
      });

    console.log('Subscribed to typing channel');
  }, [conversationId, user]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Initialize message status for existing messages
      const initialStatus = {};
      data.forEach(msg => {
        initialStatus[msg.id] = {
          sent: true,
          delivered: msg.sender_id !== user.id, // Delivered if sent by other user
          read: msg.read || false
        };
      });

      setMessages(data);
      setMessageStatus(initialStatus);
      setNetworkError(null);
    } catch (error) {
      console.error('Error loading messages:', error);
      setNetworkError('Failed to load messages. Please check your connection and try again.');
      Alert.alert('Error', 'Could not load messages');
    }
  }, [conversationId, user]);

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isOtherUserTyping,
    setIsOtherUserTyping,
    messageStatus,
    setMessageStatus,
    networkError,
    setNetworkError,
    isSending,
    sendMessage,
    handleInputChange,
    subscribeToMessages,                                          
    subscribeToTyping,
    cleanupSubscriptions,
    markMessagesAsRead,
    loadMessages,
    updateTypingStatus,
    clearTypingStatus,
    sendingLoadingManager,
    deleteMessage
  };
};

export default useChat;