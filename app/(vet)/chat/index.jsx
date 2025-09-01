import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert, RefreshControl, useColorScheme, StatusBar } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const VetChatListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
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
          // Get user details from the secure veterinarians view (reusing for users too)
          const { data: userData, error: userError } = await supabase
            .from('veterinarians')
            .select('id, raw_user_meta_data, email')
            .eq('id', conversation.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
            // Fallback to a default user name
            return {
              ...conversation,
              latestMessage: null,
              userName: 'Pet Owner'
            };
          }

          const userName = userData?.raw_user_meta_data?.options?.data?.display_name || 'Pet Owner';

          const { data: latestMessageData, error: messageError } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== 'PGRST116') {
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
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Could not load conversations');
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
      className="flex-row p-4 bg-white border-b border-gray-200 dark:bg-neutral-900 dark:border-neutral-800"
      onPress={() => router.push(`/(vet)/chat/${item.user_id}?userName=${encodeURIComponent(item.userName)}`)}
    >
      <View className="mr-3">
        <View className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center">
          <Text className="text-white text-xl font-inter-bold">{item.userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between mb-1">
          <Text className="text-base font-inter-bold flex-1 text-black dark:text-white" numberOfLines={1}>{item.userName}</Text>
          {item.latestMessage && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">{formatTime(item.latestMessage.created_at)}</Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text className="text-sm text-gray-600 dark:text-gray-300" numberOfLines={1}>
            {item.latestMessage.content}
          </Text>
        ) : (
          <Text className="text-sm italic text-gray-500 dark:text-gray-400">No messages yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
        <Text className="text-2xl font-inter-bold text-black dark:text-white">Your Chats</Text>
      </View>
      {conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesome name="commenting-o" size={64} color={isDark ? "#60a5fa" : "#007AFF"} />
          <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">No conversations yet</Text>
          <Text className="text-base text-center text-gray-600 dark:text-gray-300">Users will start chats with you. Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#60a5fa" : "#007AFF"} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 15,
    color: '#666',
  },
  noMessage: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default VetChatListScreen;