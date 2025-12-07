import { useState, useEffect, useCallback, useMemo } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";
import { useTutorial } from "../../../providers/TutorialProvider";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import NotificationBell from "../../../components/notifications/NotificationBell";
import NotificationsModal from "../../../components/notifications/NotificationsModal";
import TutorialOverlay from "../../../components/tutorial/TutorialOverlay";
import { chatTutorialSteps } from "../../../components/tutorial/tutorialSteps";
import { 
  formatChatTime, 
  getInitials, 
  debounce, 
  filterConversations,
  truncateText
} from "../../../utils/chatUtils";

const ChatListScreen = () => {
  const { user } = useAuth();
  const { startTutorial, isTutorialCompleted } = useTutorial();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const isDark = useColorScheme() === "dark";
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  useEffect(() => {
    loadConversations();
    // Show tutorial on first visit
    if (!isTutorialCompleted('chat')) {
      const timer = setTimeout(() => {
        startTutorial('chat');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Optimized search with debouncing
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      if (query.trim() === "") {
        setFilteredConversations(conversations);
      } else {
        const filteredConversationsList = filterConversations(conversations, query, 'vet');
        setFilteredConversations(filteredConversationsList);
      }
    }, 300),
    [conversations]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

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

  // Memoized conversation count for performance
  const conversationCount = useMemo(() => filteredConversations.length, [filteredConversations]);

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
      activeOpacity={0.7}
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
              {formatChatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
            {truncateText(item.latestMessage.content, 60)}
          </Text>
        ) : (
          <Text className="text-sm italic text-neutral-500 dark:text-neutral-400">
            No messages yet
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStartNewChatButton = () => {
    if (showSearch) return null; // Hide during search

    if (conversationCount === 0) {
      // Header button for empty state
      return (
        <TouchableOpacity
          onPress={() => router.push("/(vet)/chat/users")}
          className="bg-black dark:bg-white rounded-full px-4 py-2 flex-row items-center"
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={16} color={isDark ? "#000" : "#fff"} />
          <Text className="text-white dark:text-black text-sm font-inter-bold ml-2">
            New Chat
          </Text>
        </TouchableOpacity>
      );
    }

    return null; // Will show floating button instead
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black" edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#FAFAFA"}
      />
      
      {/* Header */}
      <View className="px-5 py-4 bg-white dark:bg-black">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-inter-bold text-black dark:text-white">
              Messages
            </Text>
            {conversationCount > 0 && !showSearch && (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {conversationCount} conversation{conversationCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            {renderStartNewChatButton()}
            <TouchableOpacity 
              onPress={() => startTutorial('chat')}
              className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 justify-center items-center"
            >
              <MaterialIcons 
                name="help-outline" 
                size={20} 
                color={isDark ? "#d4d4d4" : "#525252"} 
              />
            </TouchableOpacity>
            <View className="mx-2">
              <NotificationBell 
                onPress={() => setNotificationsVisible(true)} 
                isDark={isDark} 
              />
            </View>
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
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
          <View className="px-4 py-4 bg-white dark:bg-black">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity 
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
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
          {searchQuery.trim() !== "" && (
            <View className="flex-1 pt-4">
              {filteredConversations.length > 0 ? (
                <View>
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
              ) : (
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
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-4">
            <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          </View>
          <Text className="text-lg font-inter-semibold text-black dark:text-white mb-1">
            Loading conversations
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait a moment...
          </Text>
        </View>
      ) : filteredConversations.length === 0 && !showSearch ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-6">
            <FontAwesome name="commenting-o" size={32} color={isDark ? "#8E8E93" : "#6C757D"} />
          </View>
          <Text className="text-xl font-inter-bold text-black dark:text-white mb-2 text-center">
            No conversations yet
          </Text>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center leading-6">
            Users will start chats with you. Check back later!
          </Text>
        </View>
      ) : (
        !showSearch && (
          <View className="flex-1 pt-4">
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
        )
      )}

      {/* Floating Action Button for existing conversations */}
      {conversationCount > 0 && !showSearch && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={() => router.push("/(vet)/chat/users")}
            className="w-14 h-14 rounded-full bg-black dark:bg-white justify-center items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 8,
            }}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={24} color={isDark ? "#000" : "#fff"} />
          </TouchableOpacity>
        </View>
      )}

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
      
      <TutorialOverlay steps={chatTutorialSteps} tutorialId="chat" />
    </SafeAreaView>
  );
};

export default ChatListScreen;
