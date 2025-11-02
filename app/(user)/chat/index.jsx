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
import { useRouter } from "expo-router";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import NotificationBell from "../../../components/notifications/NotificationBell";
import NotificationsModal from "../../../components/notifications/NotificationsModal";
import TutorialOverlay from "../../../components/tutorial/TutorialOverlay";
import { chatTutorialSteps } from "../../../components/tutorial/tutorialSteps";
import ConversationSkeleton from "../../../components/chat/ConversationSkeleton";
import EmptyConversations from "../../../components/chat/EmptyConversations";
import ErrorState from "../../../components/chat/ErrorState";
import { getRelativeTime, formatUnreadCount } from "../../../utils/dateFormat";
import {
  fetchConversationsOptimized,
  fetchVeterinarians,
  deleteConversation,
} from "../../../services/chatService";

const ChatListScreen = () => {
  const { user } = useAuth();
  const { startTutorial, isTutorialCompleted } = useTutorial();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [veterinarians, setVeterinarians] = useState([]);
  const isDark = useColorScheme() === "dark";
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    if (searchQuery.trim() === "") {
      return conversations;
    }
    return conversations.filter(conversation => {
      const vetName = conversation.vetName?.toLowerCase() || "";
      const latestMessage = conversation.latestMessage?.content?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return vetName.includes(query) || latestMessage.includes(query);
    });
  }, [searchQuery, conversations]);

  // Memoized filtered veterinarians
  const filteredVeterinarians = useMemo(() => {
    if (searchQuery.trim() === "") {
      return [];
    }
    return veterinarians.filter(vet => {
      const vetName = vet.display_name?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return vetName.includes(query);
    });
  }, [searchQuery, veterinarians]);

  useEffect(() => {
    loadConversations();
    loadVeterinarians();
    
    if (!isTutorialCompleted('chat')) {
      const timer = setTimeout(() => {
        startTutorial('chat');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadConversations = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await fetchConversationsOptimized(user.id);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setConversations(data || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadVeterinarians = async () => {
    try {
      const { data, error: fetchError } = await fetchVeterinarians();
      
      if (fetchError) {
        console.error("Error loading veterinarians:", fetchError);
        return;
      }
      
      setVeterinarians(data || []);
    } catch (err) {
      console.error("Error loading veterinarians:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const handleDeleteConversation = useCallback(async (conversationId, vetName) => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete your conversation with ${vetName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            
            const { success, error } = await deleteConversation(conversationId);
            
            if (!success) {
              Alert.alert("Error", "Failed to delete conversation");
              await loadConversations();
            }
          },
        },
      ]
    );
  }, []);

  const handleOpenSearch = useCallback(async () => {
    setShowSearch(true);
    setSearchLoading(true);
    if (veterinarians.length === 0) {
      await loadVeterinarians();
    }
    setSearchLoading(false);
  }, [veterinarians.length]);

  const startNewChat = useCallback(async (vetId, vetName) => {
    try {
      const existingConversation = conversations.find(conv => conv.vet_id === vetId);

      if (existingConversation) {
        router.push(`/(user)/chat/${existingConversation.id}`);
        setShowSearch(false);
        setSearchQuery("");
        return;
      }

      setShowSearch(false);
      setSearchQuery("");
      
      router.push(`/(user)/chat/new?vetId=${vetId}&vetName=${encodeURIComponent(vetName)}`);
    } catch (error) {
      console.error("Error starting new chat:", error);
      Alert.alert("Error", "Could not start new chat. Please try again.");
    }
  }, [conversations]);

  const renderConversation = useCallback(({ item }) => {
    const hasUnread = item.unreadCount > 0;
    
    return (
      <TouchableOpacity
        className="flex-row items-center p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700"
        onPress={() => {
          if (hasUnread) {
            setConversations(prev =>
              prev.map(c =>
                c.id === item.id ? { ...c, unreadCount: 0 } : c
              )
            );
          }
          router.push(`/(user)/chat/${item.id}`);
        }}
        onLongPress={() => handleDeleteConversation(item.id, item.vetName)}
        activeOpacity={0.7}
      >
        <View className="relative">
          {item.profile_image_url ? (
            <Image
              source={{ uri: item.profile_image_url }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-neutral-300 dark:bg-neutral-700 items-center justify-center">
              <FontAwesome name="user" size={24} color={isDark ? "#fff" : "#000"} />
            </View>
          )}
          {hasUnread && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-white text-xs font-inter-bold">
                {formatUnreadCount(item.unreadCount)}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-3">
          <Text
            className={`text-base ${
              hasUnread ? "font-inter-bold" : "font-inter-semibold"
            } text-black dark:text-white`}
          >
            {item.vetName}
          </Text>
          {item.latestMessage && (
            <Text
              className={`text-sm ${
                hasUnread
                  ? "text-neutral-700 dark:text-neutral-300 font-inter-medium"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
              numberOfLines={1}
            >
              {item.latestMessage.content}
            </Text>
          )}
        </View>

        <View className="items-end">
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
            {item.latestMessage
              ? getRelativeTime(item.latestMessage.created_at)
              : getRelativeTime(item.updated_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [isDark, handleDeleteConversation]);

  const renderVeterinarian = useCallback(({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700"
      onPress={() => startNewChat(item.id, item.display_name)}
      activeOpacity={0.7}
    >
      {item.profile_image_url ? (
        <Image
          source={{ uri: item.profile_image_url }}
          className="w-14 h-14 rounded-full"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-neutral-300 dark:bg-neutral-700 items-center justify-center">
          <FontAwesome name="user-md" size={24} color={isDark ? "#fff" : "#000"} />
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text className="text-base font-inter-semibold text-black dark:text-white">
          {item.display_name}
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Tap to start chatting
        </Text>
      </View>

      <FontAwesome name="chevron-right" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
    </TouchableOpacity>
  ), [isDark, startNewChat]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <Text className="text-2xl font-inter-bold text-black dark:text-white">
          Messages
        </Text>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity
            onPress={handleOpenSearch}
            className="p-2"
            activeOpacity={0.7}
          >
            <FontAwesome name="search" size={20} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <NotificationBell onPress={() => setNotificationsVisible(true)} />
        </View>
      </View>

      <Modal
        visible={showSearch}
        animationType="slide"
        onRequestClose={() => {
          setShowSearch(false);
          setSearchQuery("");
        }}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
          
          <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="mr-3"
            >
              <MaterialIcons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            
            <View className="flex-1 flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2">
              <FontAwesome name="search" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
              <TextInput
                className="flex-1 ml-2 text-base text-black dark:text-white"
                placeholder="Search conversations or vets..."
                placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
                value={searchQuery}
                onChangeText={setSearchQuery}
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
          </View>
          
          {searchLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
              <Text className="text-base mt-4 text-black dark:text-white">Searching...</Text>
            </View>
          ) : searchQuery.trim() !== "" ? (
            <View className="flex-1">
              {filteredConversations.length > 0 && (
                <View>
                  <Text className="px-4 py-2 text-lg font-inter-bold text-black dark:text-white">
                    Your Chats
                  </Text>
                  <FlatList
                    data={filteredConversations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderConversation}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {filteredVeterinarians.length > 0 && (
                <View>
                  <Text className="px-4 py-2 text-lg font-inter-bold text-black dark:text-white mt-2">
                    Veterinarians
                  </Text>
                  <FlatList
                    data={filteredVeterinarians}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderVeterinarian}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {filteredConversations.length === 0 && filteredVeterinarians.length === 0 && (
                <View className="flex-1 justify-center items-center p-8">
                  <FontAwesome
                    name="search"
                    size={64}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
                    No results found
                  </Text>
                  <Text className="text-base text-center text-neutral-600 dark:text-neutral-300">
                    Try a different search term
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center p-8">
              <FontAwesome
                name="search"
                size={64}
                color={isDark ? "#fff" : "#000"}
              />
              <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
                Search Messages
              </Text>
              <Text className="text-base text-center text-neutral-600 dark:text-neutral-300">
                Find conversations or start chatting with a veterinarian
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
      {loading ? (
        <View className="flex-1 px-4 py-2">
          <ConversationSkeleton />
          <ConversationSkeleton />
          <ConversationSkeleton />
          <ConversationSkeleton />
          <ConversationSkeleton />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={loadConversations} />
      ) : filteredConversations.length === 0 ? (
        <EmptyConversations />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          className="flex-1"
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={isDark ? "#fff" : "#000"} 
            />
          }
        />
      )}
      
      <View className="p-4 bg-white border-t border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
        <TouchableOpacity
          className="flex-row bg-black dark:bg-white rounded-full p-4 items-center justify-center"
          onPress={() => router.push("/(user)/chat/vets")}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={20} color={isDark ? "#000" : "#fff"} />
          <Text className="text-white dark:text-black text-lg font-inter-bold ml-4">
            Start New Chat
          </Text>
        </TouchableOpacity>
      </View>

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
      
      <TutorialOverlay steps={chatTutorialSteps} tutorialId="chat" />
    </SafeAreaView>
  );
};

export default ChatListScreen;
