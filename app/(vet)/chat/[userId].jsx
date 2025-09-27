import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform, useColorScheme, StatusBar, Modal, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import useVetChat from '../../../hooks/useVetChat';
import MessageList from '../../../components/chat/MessageList';
import MessageInput from '../../../components/chat/MessageInput';

const ChatScreen = () => {
  const { userId, userName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const isDark = useColorScheme() === 'dark';

  // Use the custom hook to handle all chat logic
  const {
    messages,
    newMessage,
    setNewMessage,
    isOtherUserTyping,
    messageStatus,
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
    clearTypingStatus,
  } = useVetChat(conversationId, user, userName, userId);

  // Function to format time
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Function to get message status icon
  const getMessageStatusIcon = useCallback((messageId) => {
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
  }, [messageStatus]);

  // Function to create or get conversation
  const createOrGetConversation = async () => {
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user_id.eq.${userId},vet_id.eq.${user.id}),and(user_id.eq.${user.id},vet_id.eq.${userId})`)
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
            user_id: userId,
            vet_id: user.id,
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

  // Effect to load conversation
  useEffect(() => {
    createOrGetConversation();
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('Component unmounting, cleaning up...');
      cleanupSubscriptions();
      
      // Clear typing status when leaving chat
      if (conversationId && user) {
        clearTypingStatus();
      }
    };
  }, [userId, conversationId, cleanupSubscriptions, clearTypingStatus]);

  // Effect to handle subscription when conversation is established
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
      subscribeToTyping();
    }
    
    // Cleanup subscription when conversationId changes
    return () => {
      console.log('Conversation ID changed, cleaning up...');
      cleanupSubscriptions();
    };
  }, [conversationId, loadMessages, subscribeToMessages, subscribeToTyping, cleanupSubscriptions]);

  // Effect to mark messages as read
  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages.length, markMessagesAsRead]);

  // Pick image function
  const pickImage = useCallback(async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to send images.');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageModalVisible(true);
    }
  }, []);

  // Take photo function
  const takePhoto = useCallback(async () => {
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
  }, []);

  // Send image function
  const sendImage = useCallback(async () => {
    if (!selectedImage) return;
    
    setImageModalVisible(false);
    
    try {
      await sendMessage(selectedImage);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setSelectedImage(null);
    }
  }, [selectedImage, sendMessage]);

  // Handler for sending a message
  const onSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  // Handler for attachment button
  const onAttachment = useCallback(() => {
    setShowAttachmentOptions(true);
  }, []);

  // Handler for back button
  const handleBack = useCallback(async () => {
    // Clean up subscriptions before navigating away
    cleanupSubscriptions();
    
    // Clear typing status
    if (conversationId && user) {
      clearTypingStatus();
    }
    
    // Navigate back
    router.push('/(vet)/chat');
  }, [cleanupSubscriptions, conversationId, user, clearTypingStatus, router]);

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <SafeAreaView className="flex-1">
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#000" : "#fff"}
        />
        <View className="flex-row items-center px-5 py-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700">
          <TouchableOpacity onPress={handleBack} className="mr-6" activeOpacity={0.7}>
            <FontAwesome name="arrow-left" size={20} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <View className="mr-3">
            <View className="w-10 h-10 rounded-full bg-black dark:bg-white justify-center items-center">
              <Text className="text-white dark:text-black text-base font-inter-bold">{userName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-inter-bold text-black dark:text-white">{userName || 'Pet Owner'}</Text>
            {isOtherUserTyping && (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">typing...</Text>
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
        
        <MessageList
          messages={messages}
          user={user}
          formatTime={formatTime}
          getMessageStatusIcon={getMessageStatusIcon}
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
        
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={onSend}
          onAttachment={onAttachment}
          isSending={isSending}
          handleInputChange={handleInputChange}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;