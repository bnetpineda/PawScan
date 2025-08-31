import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

const ChatListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Get conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          vet_id,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the latest message for each conversation and vet details
      const conversationsWithLatestMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          // Get vet details using a different approach since we can't directly access auth.users
          // We'll get vet information from the veterinarians view instead
          const { data: vetData, error: vetError } = await supabase
            .from('veterinarians')
            .select('id, raw_user_meta_data, email')
            .eq('id', conversation.vet_id)
            .single();

          if (vetError) {
            console.error('Error fetching vet data:', vetError);
            // Fallback to a default vet name
            return {
              ...conversation,
              latestMessage: null,
              vetName: 'Veterinarian'
            };
          }

          const vetName = vetData?.raw_user_meta_data?.options?.data?.display_name || 'Veterinarian';

          // Get the latest message for this conversation
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
            vetName: vetName
          };
        })
      );

      setConversations(conversationsWithLatestMessage);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Could not load conversations');
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/(user)/chat/${item.vet_id}?vetName=${encodeURIComponent(item.vetName)}`)}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.vetName}>{item.vetName}</Text>
        {item.latestMessage && (
          <Text style={styles.timestamp}>
            {new Date(item.latestMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
      {item.latestMessage && (
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.latestMessage.content}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Chats</Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't started any chats yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          style={styles.conversationsList}
        />
      )}
      <View style={styles.startChatContainer}>
        <TouchableOpacity
          style={styles.startChatButton}
          onPress={() => router.push('/(user)/chat/vets')}
        >
          <Text style={styles.startChatButtonText}>Start New Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  startChatContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatListScreen;