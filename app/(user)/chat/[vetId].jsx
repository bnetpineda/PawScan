import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform, useColorScheme, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

const ChatScreen = () => {
  const { vetId, vetName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);
  const messagesChannelRef = useRef(null);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    createOrGetConversation();
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe();
        messagesChannelRef.current = null;
      }
    };
  }, [vetId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
    
    // Cleanup subscription when conversationId changes or component unmounts
    return () => {
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe();
        messagesChannelRef.current = null;
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

      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
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
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    console.log('Subscribed to messages channel');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    // Create a temporary message object for immediate display
    const tempMessage = {
      id: Date.now(), // temporary ID
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // Immediately add to local state for instant feedback
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: newMessage.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace the temporary message with the real one from the database
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === tempMessage.id);
        if (tempMessageIndex !== -1) {
          updatedMessages[tempMessageIndex] = data;
        }
        return updatedMessages;
      });

      setNewMessage('');
    } catch (error) {
      // Remove the temporary message if there was an error
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempMessage.id));
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender_id === user.id;
    const messageTime = formatTime(item.created_at);
    
    return (
      <View className={`mb-3 flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <View className={`max-w-[80%] p-3 rounded-2xl ${isCurrentUser ? 'bg-blue-500 rounded-br-none' : 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-bl-none'}`}>
          <Text className={`text-base font-inter ${isCurrentUser ? 'text-white' : 'text-black dark:text-white'}`}>{item.content}</Text>
          <Text className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {messageTime}
          </Text>
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
        <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-200 dark:bg-neutral-900 dark:border-neutral-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-2" activeOpacity={0.7}>
            <FontAwesome name="arrow-left" size={20} color={isDark ? "#60a5fa" : "#007AFF"} />
          </TouchableOpacity>
          <View className="mr-3">
            <View className="w-10 h-10 rounded-full bg-blue-500 justify-center items-center">
              <Text className="text-white text-base font-inter-bold">{vetName?.charAt(0)?.toUpperCase() || 'V'}</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-inter-bold text-black dark:text-white">{vetName || 'Veterinarian'}</Text>
            <Text className="text-sm text-blue-500">Online</Text>
          </View>
        </View>
        
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
        
        <View className="flex-row p-4 bg-white border-t border-gray-200 dark:bg-neutral-900 dark:border-neutral-800">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
            className="flex-1 border border-gray-300 dark:border-neutral-700 rounded-full py-2 px-4 max-h-[100px] text-base font-inter bg-white dark:bg-neutral-800 text-black dark:text-white"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            className={`rounded-full w-10 h-10 justify-center items-center ml-2 ${!newMessage.trim() ? 'bg-gray-400' : 'bg-blue-500'}`}
            disabled={!newMessage.trim()}
            activeOpacity={0.8}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;