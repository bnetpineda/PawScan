import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

const VetChatListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Get conversations for the current vet
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id
        `)
        .eq('vet_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the latest message for each conversation and user details
      const conversationsWithLatestMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          // Get user details
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('id, raw_user_meta_data')
            .eq('id', conversation.user_id)
            .single();

          if (userError) throw userError;

          const { data: latestMessageData, error: messageError } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== 'PGRST116') {
            throw messageError;
          }

          return {
            ...conversation,
            latestMessage: latestMessageData,
            userName: userData?.raw_user_meta_data?.options?.data?.display_name || 'Pet Owner'
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
      onPress={() => router.push(`/(vet)/chat/${item.user_id}?userName=${encodeURIComponent(item.userName)}`)}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.userName}>{item.userName}</Text>
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
        <Text style={styles.infoText}>Users will start chats with you. Check back later!</Text>
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
  userName: {
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
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});

export default VetChatListScreen;