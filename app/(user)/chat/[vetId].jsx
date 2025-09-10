import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform, useColorScheme, StatusBar, Image, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import notificationService from '../../../services/notificationService';

const ChatScreen = () => {
  const { vetId, vetName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({}); // Track message status
  const [networkError, setNetworkError] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);
  const messagesChannelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    createOrGetConversation();
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe();
        messagesChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      // Clear typing status when leaving chat
      if (conversationId && user) {
        clearTypingStatus();
      }
    };
  }, [vetId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
      subscribeToTyping();
    }
    
    // Cleanup subscription when conversationId changes or component unmounts
    return () => {
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe();
        messagesChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
    };
  }, [conversationId]);

  const createOrGetConversation = async () => {
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user_id.eq.${user.id},vet_id.eq.${vetId}),and(user_id.eq.${vetId},vet_id.eq.${user.id})`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingConversation) {
        setConversationId(existingConversation.id);
        return;
      }

      // Create new conversation
      const { data: newConversation, error: insertError } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: user.id,
            vet_id: vetId,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setConversationId(newConversation.id);
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      setNetworkError('Failed to start conversation. Please check your connection and try again.');
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  const loadMessages = async () => {
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
          delivered: true,
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
  };

  const subscribeToMessages = () => {
    // Unsubscribe from any existing subscription
    if (messagesChannelRef.current) {
      messagesChannelRef.current.unsubscribe();
      messagesChannelRef.current = null;
    }

    // Create new subscription
    messagesChannelRef.current = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // If this is a message from the other user, mark it as delivered
          if (newMessage.sender_id !== user.id) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            
            // Mark message as read if chat is open
            markMessageAsRead(newMessage.id);
            
            // Send push notification
            const senderName = vetName || 'Veterinarian';
            await notificationService.sendPushNotificationToUser(
              vetId, // Send to vet, not user
              `New message from ${senderName}`,
              newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
              {
                conversationId: conversationId,
                senderId: newMessage.sender_id,
                type: 'new_message'
              }
            );
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
            
            // Update message status
            setMessageStatus(prev => ({
              ...prev,
              [newMessage.id]: {
                sent: true,
                delivered: true,
                read: newMessage.read || false
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
          
          // Update message status
          setMessageStatus(prev => ({
            ...prev,
            [updatedMessage.id]: {
              sent: true,
              delivered: true,
              read: updatedMessage.read || false
            }
          }));
        }
      )
      .subscribe();

    console.log('Subscribed to messages channel');
  };

  const subscribeToTyping = () => {
    // Unsubscribe from any existing subscription
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe();
      typingChannelRef.current = null;
    }

    // Create new subscription for typing status
    typingChannelRef.current = supabase
      .channel('typing')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
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
          const typingData = payload.new;
          if (typingData.user_id !== user.id) {
            setIsOtherUserTyping(typingData.is_typing);
          }
        }
      )
      .subscribe();

    console.log('Subscribed to typing channel');
  };

  const updateTypingStatus = async (isTyping) => {
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
  };

  const clearTypingStatus = async () => {
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
  };

  const handleInputChange = (text) => {
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
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't show alert for read status errors as they're not critical
    }
  };

  const retrySendMessage = async (tempMessageId, content, imageUrl = null, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      // Upload image if provided
      let uploadedImageUrl = null;
      if (imageUrl) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: imageUrl,
          type: 'image/jpeg',
          name: fileName,
        });

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, formData);

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
      
      // Update message status
      setMessageStatus(prev => ({
        ...prev,
        [tempMessageId]: {
          sent: true,
          delivered: true,
          read: data.read || false
        }
      }));

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
        // Max retries reached
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
  };

  const sendMessage = async (imageUrl = null) => {
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
      await retrySendMessage(tempMessageId, content, imageUrl);
      setNewMessage('');
      setSelectedImage(null);
      
      // Clear typing status after sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      updateTypingStatus(false);
    } catch (error) {
      // Error already handled in retrySendMessage
      console.error('Error sending message:', error);
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to send images.');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageModalVisible(true);
    }
  };

  const takePhoto = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your camera to take photos.');
      return;
    }

    // Launch camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageModalVisible(true);
    }
  };

  const sendImage = async () => {
    if (!selectedImage) return;
    
    setImageModalVisible(false);
    setIsSending(true);
    
    try {
      await sendMessage(selectedImage);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsSending(false);
      setSelectedImage(null);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatusIcon = (messageId) => {
    const status = messageStatus[messageId];
    if (!status) return null;
    
    if (status.read) {
      return <FontAwesome name="check-circle" size={12} color="#007AFF" />;
    } else if (status.delivered) {
      return <FontAwesome name="check-circle" size={12} color="#8E8E93" />;
    } else if (status.sent) {
      return <FontAwesome name="check" size={12} color="#8E8E93" />;
    }
    return null;
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender_id === user.id;
    const messageTime = formatTime(item.created_at);
    const isTempMessage = item.id.toString().startsWith('temp_');
    
    return (
      <View className={`mb-3 flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <View className={`max-w-[80%] ${isCurrentUser ? 'bg-black dark:bg-white rounded-2xl rounded-br-none' : 'bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 rounded-2xl rounded-bl-none'}`}>
          {item.image_url && (
            <Image 
              source={{ uri: item.image_url }} 
              className="w-full h-48 rounded-t-2xl" 
              resizeMode="cover" 
            />
          )}
          {item.content ? (
            <View className="p-3">
              <Text className={`text-base font-inter ${isCurrentUser ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>{item.content}</Text>
              <View className={`flex-row items-center justify-end mt-1 ${isCurrentUser ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                <Text className={`text-xs ${isCurrentUser ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {messageTime}
                </Text>
                {isCurrentUser && !isTempMessage && (
                  <View className="ml-1">
                    {getMessageStatusIcon(item.id)}
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View className="p-3">
              <View className={`flex-row items-center justify-end mt-1 ${isCurrentUser ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                <Text className={`text-xs ${isCurrentUser ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {messageTime}
                </Text>
                {isCurrentUser && !isTempMessage && (
                  <View className="ml-1">
                    {getMessageStatusIcon(item.id)}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <SafeAreaView className="flex-1 pt-12">
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#000" : "#fff"}
        />
        <View className="flex-row items-center px-5 py-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-6" activeOpacity={0.7}>
            <FontAwesome name="arrow-left" size={20} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <View className="mr-3">
            <View className="w-10 h-10 rounded-full bg-black dark:bg-white justify-center items-center">
              <Text className="text-white dark:text-black text-base font-inter-bold">{vetName?.charAt(0)?.toUpperCase() || 'V'}</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-inter-bold text-black dark:text-white">{vetName || 'Veterinarian'}</Text>
            {isOtherUserTyping && (
              <Text className="text-xs text-gray-500 dark:text-gray-400">typing...</Text>
            )}
          </View>
        </View>
        
        {networkError && (
          <View className="bg-red-100 border-l-4 border-red-500 p-4 mx-4 my-2 rounded">
            <View className="flex-row items-center">
              <FontAwesome name="exclamation-triangle" size={16} color="#EF4444" />
              <Text className="text-red-700 font-inter-semibold ml-2">Connection Issue</Text>
            </View>
            <Text className="text-red-600 text-sm mt-1">{networkError}</Text>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
        
        {/* Attachment Options Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAttachmentOptions}
          onRequestClose={() => setShowAttachmentOptions(false)}
        >
          <TouchableOpacity 
            className="flex-1 bg-black bg-opacity-50 justify-end"
            activeOpacity={1}
            onPress={() => setShowAttachmentOptions(false)}
          >
            <View className="bg-white dark:bg-neutral-800 rounded-t-2xl p-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-inter-bold text-black dark:text-white">Attach Media</Text>
                <TouchableOpacity onPress={() => setShowAttachmentOptions(false)}>
                  <FontAwesome name="times" size={20} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-around py-4">
                <TouchableOpacity 
                  className="items-center"
                  onPress={() => {
                    setShowAttachmentOptions(false);
                    pickImage();
                  }}
                >
                  <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mb-2">
                    <FontAwesome name="image" size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-black dark:text-white font-inter">Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="items-center"
                  onPress={() => {
                    setShowAttachmentOptions(false);
                    takePhoto();
                  }}
                >
                  <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mb-2">
                    <FontAwesome name="camera" size={24} color="#10B981" />
                  </View>
                  <Text className="text-black dark:text-white font-inter">Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Image Preview Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={() => {
            setImageModalVisible(false);
            setSelectedImage(null);
          }}
        >
          <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
            <View className="w-4/5 h-2/3 bg-black rounded-2xl overflow-hidden">
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  className="w-full h-full" 
                  resizeMode="contain" 
                />
              )}
            </View>
            <View className="flex-row mt-6">
              <TouchableOpacity 
                className="bg-red-500 rounded-full px-6 py-3 mx-2"
                onPress={() => {
                  setImageModalVisible(false);
                  setSelectedImage(null);
                }}
              >
                <Text className="text-white font-inter-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-blue-500 rounded-full px-6 py-3 mx-2 flex-row items-center"
                onPress={sendImage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="send" size={16} color="white" />
                    <Text className="text-white font-inter-bold ml-2">Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <View className="flex-row p-4 bg-white border-t border-black dark:bg-neutral-900 dark:border-neutral-700">
          <TouchableOpacity 
            className="justify-center mr-2"
            onPress={() => setShowAttachmentOptions(true)}
          >
            <FontAwesome name="plus-circle" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TextInput
            value={newMessage}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
            className="flex-1 border border-black dark:border-neutral-700 rounded-full py-2 px-4 max-h-[100px] text-base font-inter bg-white dark:bg-neutral-800 text-black dark:text-white"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            onPress={() => sendMessage()}
            className={`rounded-full w-10 h-10 justify-center items-center ml-2 ${!newMessage.trim() && !selectedImage ? 'bg-gray-400' : 'bg-black dark:bg-white'}`}
            disabled={!newMessage.trim() && !selectedImage}
            activeOpacity={0.8}
          >
            <FontAwesome name="send" size={16} color={isDark ? "#000" : "#fff"} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;