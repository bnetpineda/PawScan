import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, RefreshControl, useColorScheme, StatusBar, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const ChatListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const userName = conversation.userName?.toLowerCase() || "";
        const latestMessage = conversation.latestMessage?.content?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return userName.includes(query) || latestMessage.includes(query);
      });
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await loadConversations();
    setRefreshing(false);
  };

  const loadConversations = async () => {
    try {
      // Get conversations for the current vet
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          updated_at
        `)
        .eq('vet_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the latest message for each conversation and user details
      const conversationsWithLatestMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          // Get user details from the user_profiles table
          let { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('id, name')
            .eq('id', conversation.user_id)
            .single();

          let userName = 'Pet Owner';

          if (userError) {
            console.error('Error fetching user data from user_profiles:', userError);
            
            // Handle case where user doesn't exist (might have been deleted)
            if (userError.code === 'PGRST116') {
              console.warn('User not found for conversation:', conversation.user_id);
              userName = 'Deleted User';
            } else {
              userName = 'Pet Owner';
            }
          } else {
            // Use the name from user_profiles
            userName = userData?.name || 'Pet Owner';
          }

          const { data: latestMessageData, error: messageError } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Handle case where no messages exist yet
          if (messageError && messageError.code === 'PGRST116') {
            // This is expected when there are no messages yet
            console.debug('No messages found for conversation:', conversation.id);
          } else if (messageError) {
            console.error('Error fetching message:', messageError);
          }

          return {
            ...conversation,
            latestMessage: latestMessageData || null,
            userName: userName
          };
        })
      );

      setConversations(conversationsWithLatestMessage);
      setFilteredConversations(conversationsWithLatestMessage);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Could not load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      className="flex-row p-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700"
      onPress={() => router.push(`/(vet)/chat/${item.user_id}?userName=${encodeURIComponent(item.userName)}`)}
    >
      <View className="mr-3">
        <View className="w-12 h-12 rounded-full bg-black dark:bg-white justify-center items-center">
          <Text className="text-white dark:text-black text-xl font-inter-bold">{item.userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between mb-1">
          <Text className="text-base font-inter-bold flex-1 text-black dark:text-white" numberOfLines={1}>{item.userName}</Text>
          {item.latestMessage && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">{formatTime(item.latestMessage.created_at)}</Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text className="text-sm text-neutral-600 dark:text-neutral-300" numberOfLines={1}>
            {item.latestMessage.content}
          </Text>
        ) : (
          <Text className="text-sm italic text-neutral-500 dark:text-neutral-400">No messages yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black pt-12">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-black dark:border-neutral-700 mt-2">
        <Text className="text-2xl font-inter-bold text-black dark:text-white">Your Chats</Text>
        <TouchableOpacity 
          onPress={() => setShowSearch(true)}
          className="p-2"
        >
          <FontAwesome 
            name="search" 
            size={20} 
            color={isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Search Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showSearch}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
          <View className="flex-row items-center px-4 py-3 border-b border-neutral-300 dark:border-neutral-700">
            <TouchableOpacity 
              onPress={() => setShowSearch(false)}
              className="p-2 mr-2"
            >
              <FontAwesome 
                name="arrow-left" 
                size={20} 
                color={isDark ? "#fff" : "#000"} 
              />
            </TouchableOpacity>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search chats..."
              placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
              className="flex-1 border border-neutral-300 dark:border-neutral-700 rounded-full px-4 py-2 text-base font-inter bg-white dark:bg-neutral-800 text-black dark:text-white"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery("")}
                className="p-2 ml-2"
              >
                <FontAwesome 
                  name="times-circle" 
                  size={20} 
                  color={isDark ? "#8E8E93" : "#6C757D"} 
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className="text-lg mt-4 text-black dark:text-white">Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesome name="commenting-o" size={64} color={isDark ? "#fff" : "#000"} />
          <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
            {searchQuery ? "No chats found" : "No conversations yet"}
          </Text>
          <Text className="text-base text-center text-neutral-600 dark:text-neutral-300">
            {searchQuery 
              ? "Try a different search term" 
              : "Users will start chats with you. Check back later!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ChatListScreen;