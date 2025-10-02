import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl, 
  useColorScheme, 
  StatusBar, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import NotificationBell from '../../../components/notifications/NotificationBell';
import NotificationsModal from '../../../components/notifications/NotificationsModal';

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
  const [notificationsVisible, setNotificationsVisible] = useState(false);

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
          let userName = 'Pet Owner';
          let profileImageUrl = null;
          
          try {
            // Get user details from the user_profiles table
            const { data: userData, error: userError } = await supabase
              .from('user_profiles')
              .select('id, name, profile_image_url')
              .eq('id', conversation.user_id)
              .single();

            if (userError) {
              // Check if error is due to no rows found (PGRST116) or RLS violation
              if (userError.code === 'PGRST116') {
                // No user profile found - user might not have created a profile yet
                console.log(`User profile not found for user ID: ${conversation.user_id}`);
                userName = 'Pet Owner';
                profileImageUrl = null;
              } else if (userError.code === '42501') { // Permission denied
                console.warn(`Permission denied accessing profile for user ID: ${conversation.user_id}. This might be due to RLS policies.`);
                // For now, use a default name, but we might want to implement a function in the future
                // that allows limited access to user information necessary for chat functionality
                userName = 'Pet Owner';
                profileImageUrl = null;
              } else {
                // Log other errors
                console.error('Error fetching user data from user_profiles:', userError);
                userName = 'Pet Owner';
                profileImageUrl = null;
              }
            } else {
              // Use the name and profile image from user_profiles if available
              userName = userData?.name || 'Pet Owner';
              profileImageUrl = userData?.profile_image_url || null;
            }
          } catch (exception) {
            // Handle any unexpected exceptions during the fetch
            console.error('Exception fetching user data:', exception);
            userName = 'Pet Owner';
            profileImageUrl = null;
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
            userName: userName,
            profile_image_url: profileImageUrl,
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

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mx-4 mb-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800"
      onPress={() => router.push(`/(vet)/chat/${item.user_id}?userName=${encodeURIComponent(item.userName)}`)}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="mr-4">
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            className="w-14 h-14 rounded-full"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
            <Text className="text-white dark:text-black text-lg font-inter-bold">
              {getInitials(item.userName)}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-inter-bold text-black dark:text-white" numberOfLines={1}>
            {item.userName}
          </Text>
          {item.latestMessage && item.latestMessage.created_at && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
              {formatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
            {item.latestMessage.content}
          </Text>
        ) : (
          <Text className="text-sm italic text-neutral-500 dark:text-neutral-400">
            No messages yet
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black" edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#FAFAFA"}
      />
      
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-black">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-inter-bold text-black dark:text-white">
            Your Chats
          </Text>
          <View className="flex-row items-center gap-2">
            <NotificationBell 
              onPress={() => setNotificationsVisible(true)} 
              isDark={isDark} 
            />
            <TouchableOpacity 
              onPress={() => setShowSearch(true)}
              className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 justify-center items-center"
            >
              <FontAwesome 
                name="search" 
                size={18} 
                color={isDark ? "#fff" : "#000"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Search Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showSearch}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
          <View className="px-4 py-4 bg-white dark:bg-black">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity 
                onPress={() => setShowSearch(false)}
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 justify-center items-center mr-3"
              >
                <FontAwesome 
                  name="arrow-left" 
                  size={18} 
                  color={isDark ? "#fff" : "#000"} 
                />
              </TouchableOpacity>
              <Text className="text-xl font-inter-bold text-black dark:text-white">
                Search
              </Text>
            </View>
            
            <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-900 rounded-full px-4 py-3">
              <FontAwesome name="search" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search chats..."
                placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
                className="flex-1 ml-3 text-base font-inter text-black dark:text-white"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery("")}
                  className="p-1"
                >
                  <FontAwesome 
                    name="times-circle" 
                    size={16} 
                    color={isDark ? "#8E8E93" : "#6C757D"} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Search Results */}
          {searchQuery.trim() !== "" && filteredConversations.length > 0 && (
            <View className="flex-1 pt-4">
              <Text className="px-4 pb-2 text-sm font-inter-medium text-neutral-500 dark:text-neutral-400">
                Search Results
              </Text>
              <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderConversation}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
          
          {searchQuery.trim() !== "" && filteredConversations.length === 0 && (
            <View className="flex-1 justify-center items-center px-8">
              <View className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-6">
                <FontAwesome
                  name="search"
                  size={32}
                  color={isDark ? "#8E8E93" : "#6C757D"}
                />
              </View>
              <Text className="text-xl font-inter-bold text-black dark:text-white mb-2 text-center">
                No results found
              </Text>
              <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center leading-6">
                Try searching with a different term
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center mb-4">
            <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
          </View>
          <Text className="text-lg font-inter-semibold text-black dark:text-white mb-1">
            Loading conversations
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait a moment...
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-6">
            <FontAwesome name="commenting-o" size={32} color={isDark ? "#8E8E93" : "#6C757D"} />
          </View>
          <Text className="text-xl font-inter-bold text-black dark:text-white mb-2 text-center">
            {searchQuery ? "No chats found" : "No conversations yet"}
          </Text>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center leading-6">
            {searchQuery 
              ? "Try searching with a different term" 
              : "Users will start chats with you. Check back later!"}
          </Text>
        </View>
      ) : (
        <View className="flex-1 pt-4">
          {filteredConversations.length > 0 && (
            <Text className="px-4 pb-2 text-sm font-inter-medium text-neutral-500 dark:text-neutral-400">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            </Text>
          )}
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderConversation}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={isDark ? "#fff" : "#000"}
                colors={["#525252"]}
                progressBackgroundColor={isDark ? "#1F2937" : "#FFFFFF"}
              />
            }
          />
        </View>
      )}

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ChatListScreen;