import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';

const VetChatScreen = () => {
  const { userId, userName } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    createOrGetConversation();
  }, [userId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

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
    const messagesChannel = supabase
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

    return () => {
      messagesChannel.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: newMessage.trim(),
          },
        ]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message');
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender_id === user.id;
    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat with {userName}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  currentUserMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VetChatScreen;