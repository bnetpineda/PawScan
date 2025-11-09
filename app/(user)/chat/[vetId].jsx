import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, useColorScheme, StatusBar, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import useChat from '../../../hooks/useChat';
import MessageList from '../../../components/chat/MessageList';
import MessageInput from '../../../components/chat/MessageInput';

const ChatScreen = () => {
  const { vetId, originalVetName } = useLocalSearchParams();
  const [resolvedVetName, setResolvedVetName] = useState(originalVetName || 'Veterinarian');
  const router = useRouter();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [vetProfileImage, setVetProfileImage] = useState(null);
  const isDark = useColorScheme() === 'dark';

  // Use the custom hook to handle all chat logic
  const {
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
  } = useChat(conversationId, user, resolvedVetName, vetId);

  const handleLongPressMessage = useCallback((msg) => {
    if (msg.sender_id !== user.id) return;
    Alert.alert('Delete message', 'Do you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(msg.id) }
    ]);
  }, [user?.id, deleteMessage]);

  const fetchVetProfileInfo = async () => {
    try {
      // 1. Try to get name from vet_profiles
      const { data: vetProfile, error: vetProfileError } = await supabase
        .from('vet_profiles')
        .select('profile_image_url, name')
        .eq('id', vetId)
        .single();

      if (!vetProfileError && vetProfile) {
        if (vetProfile.profile_image_url) {
          setVetProfileImage(vetProfile.profile_image_url);
        }
        setResolvedVetName(vetProfile.name);
        return; // Exit if name found
      }

      // 2. If not found in vet_profiles, try to get from newsfeed_posts
      const { data: postData, error: postError } = await supabase
        .from('newsfeed_posts')
        .select('display_name')
        .eq('user_id', vetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
          
      if (!postError && postData && postData.display_name) {
        setResolvedVetName(postData.display_name);
        return; // Exit if name found
      }

      // 3. Fallback if name not found anywhere
      setResolvedVetName(originalVetName || 'Veterinarian');

    } catch (error) {
      console.error('Error fetching vet profile info:', error);
      // Fallback in case of any error during fetching
      setResolvedVetName(originalVetName || 'Veterinarian');
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "V";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to format time
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Function to get message status icon
  const getMessageStatusIcon = useCallback((messageId) => {
    const status = messageStatus[messageId];
    if (!status) return null;
    
    if (status.read) {
      return <FontAwesome name="check-circle" size={12} color="#525252" />;
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

  // Effect to load conversation
  useEffect(() => {
    createOrGetConversation();
    
    // Fetch vet profile info and update the vet name
    fetchVetProfileInfo();
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('Component unmounting, cleaning up...');
      cleanupSubscriptions();
      
      // Clear typing status when leaving chat
      if (conversationId && user) {
        clearTypingStatus();
      }
    };
  }, [vetId, conversationId, cleanupSubscriptions, clearTypingStatus, originalVetName]);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    router.push('/(user)/chat');
  }, [cleanupSubscriptions, conversationId, user, clearTypingStatus, router]);

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#000" : "#fff"}
        />
        <View className="flex-row items-center px-5 py-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700">
          <TouchableOpacity onPress={handleBack} className="mr-6" activeOpacity={0.7}>
            <FontAwesome name="arrow-left" size={20} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="mr-3"
            onPress={() => router.push(`/(user)/vet-profile?vetId=${vetId}`)}
          >
            {vetProfileImage ? (
              <Image
                source={{ uri: vetProfileImage }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
                <Text className="text-white dark:text-black text-sm font-inter-bold">
                  {getInitials(resolvedVetName)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push(`/(user)/vet-profile?vetId=${vetId}`)}>
              <Text className="text-lg font-inter-bold text-black dark:text-white">{resolvedVetName}</Text>
            </TouchableOpacity>
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
          onLongPressMessage={handleLongPressMessage}
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
                  <View className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center mb-2">
                    <FontAwesome name="image" size={24} color={isDark ? "#8E8E93" : "#6C757D"} />
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
                  <View className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center mb-2">
                    <FontAwesome name="camera" size={24} color={isDark ? "#8E8E93" : "#6C757D"} />
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
                className="bg-neutral-600 dark:bg-neutral-400 rounded-full px-6 py-3 mx-2"
                onPress={() => {
                  setImageModalVisible(false);
                  setSelectedImage(null);
                }}
              >
                <Text className="text-white dark:text-black font-inter-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-neutral-800 dark:bg-neutral-200 rounded-full px-6 py-3 mx-2 flex-row items-center"
                onPress={sendImage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="send" size={16} color={isDark ? "#000" : "#fff"} />
                    <Text className="text-white dark:text-black font-inter-bold ml-2">Send</Text>
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