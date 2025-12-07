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
  filterAvailableVeterinarians,
  formatConversationData,
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
  const [veterinarians, setVeterinarians] = useState([]);
  const [filteredVeterinarians, setFilteredVeterinarians] = useState([]);
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
        setFilteredVeterinarians([]);
      } else {
        // Filter existing conversations
        const filteredConversationsList = filterConversations(conversations, query, 'user');
        setFilteredConversations(filteredConversationsList);
        
        // Filter veterinarians for new chats
        const conversationVetIds = conversations.map(c => c.vet_id);
        const filteredVetsList = filterAvailableVeterinarians(veterinarians, conversationVetIds, query);
        setFilteredVeterinarians(filteredVetsList);
      }
    }, 300),
    [conversations, veterinarians]
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
      // Get conversations for the current user
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select(
            `
          id,
          vet_id,
          updated_at
        `
          )
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the latest message for each conversation and vet details
      const conversationsWithLatestMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          // Get vet details from the vet_profiles table
          let { data: vetData, error: vetError } = await supabase
            .from("vet_profiles")
            .select("id, name, profile_image_url")
            .eq("id", conversation.vet_id)
            .single();

          if (vetError) {
            console.error("Error fetching vet data:", vetError);
            // Fallback to a default vet name
            return {
              ...conversation,
              latestMessage: null,
              vetName: "Veterinarian",
              profile_image_url: null,
            };
          }

          const vetName = vetData?.name || "Veterinarian";
          const profileImageUrl = vetData?.profile_image_url || null;

          // Get the latest message for this conversation
          const { data: latestMessageData, error: messageError } =
            await supabase
              .from("messages")
              .select("content, created_at")
              .eq("conversation_id", conversation.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

          if (messageError && messageError.code !== "PGRST116") {
            console.error("Error fetching message:", messageError);
          }

          return {
            ...conversation,
            latestMessage: latestMessageData || null,
            vetName: vetName,
            profile_image_url: profileImageUrl,
          };
        })
      );

      setConversations(conversationsWithLatestMessage);
      setFilteredConversations(conversationsWithLatestMessage);
      
      // Load all veterinarians for search
      loadVeterinarians();
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Could not load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadVeterinarians = async () => {
    try {
      // Get all veterinarians from vet_profiles table
      const { data: vetsData, error: vetsError } = await supabase
        .from("vet_profiles")
        .select("id, name, profile_image_url")
        .order("name", { ascending: true });

      if (vetsError) {
        console.error("Error fetching veterinarians from vet_profiles:", vetsError);
        setVeterinarians([]);
        return;
      }

      // Format data to match expected vet object structure
      const formattedVets = vetsData.map(vet => ({
        id: vet.id,
        display_name: vet.name,
        email: "",
        profile_image_url: vet.profile_image_url
      }));

      setVeterinarians(formattedVets);
    } catch (error) {
      console.error("Error loading veterinarians:", error);
    }
  };

  // Memoized conversation count for performance
  const conversationCount = useMemo(() => filteredConversations.length, [filteredConversations]);

  // Render Start New Chat Button based on context
  const renderStartNewChatButton = () => {
    if (showSearch) return null; // Hide during search

    if (conversationCount === 0) {
      // Header button for empty state
      return (
        <TouchableOpacity
          onPress={() => router.push("/(user)/chat/vets")}
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

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mx-4 mb-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800"
      onPress={() =>
        router.push(
          `/(user)/chat/${item.vet_id}?vetName=${encodeURIComponent(
            item.vetName
          )}`
        )
      }
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        className="mr-4"
        onPress={() => router.push(`/(user)/vet-profile?vetId=${item.vet_id}`)}
        activeOpacity={0.7}
      >
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            className="w-14 h-14 rounded-full"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
            <Text className="text-white dark:text-black text-lg font-inter-bold">
              {getInitials(item.vetName)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <TouchableOpacity 
            onPress={() => router.push(`/(user)/vet-profile?vetId=${item.vet_id}`)}
            activeOpacity={0.7}
          >
            <Text
              className="text-lg font-inter-bold text-black dark:text-white"
              numberOfLines={1}
            >
              {item.vetName}
            </Text>
          </TouchableOpacity>
          {item.latestMessage && item.latestMessage.created_at && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
              {formatChatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text
            className="text-sm text-neutral-600 dark:text-neutral-400"
            numberOfLines={1}
          >
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

  const renderVeterinarian = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mx-4 mb-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800"
      onPress={() => {
        router.push(
          `/(user)/chat/${item.id}?vetName=${encodeURIComponent(
            item.display_name
          )}`
        );
        setShowSearch(false);
        setSearchQuery("");
      }}
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
              {getInitials(item.display_name)}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-lg font-inter-bold text-black dark:text-white mb-1"
          numberOfLines={1}
        >
          {item.display_name}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          Veterinarian • Available for chat
        </Text>
      </View>
      <View className="w-10 h-10 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
        <FontAwesome name="comment" size={16} color={isDark ? "#000" : "#fff"} />
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
            {renderStartNewChatButton()}
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
                placeholder="Search chats or veterinarians..."
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
              {/* Existing Conversations */}
              {filteredConversations.length > 0 && (
                <View>
                  <Text className="px-4 pb-2 text-sm font-inter-medium text-neutral-500 dark:text-neutral-400">
                    Your Chats
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
              
              {/* Veterinarians for New Chats */}
              {filteredVeterinarians.length > 0 && (
                <View>
                  <Text className="px-4 pb-2 text-sm font-inter-medium text-neutral-500 dark:text-neutral-400">
                    Veterinarians
                  </Text>
                  <FlatList
                    data={filteredVeterinarians}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderVeterinarian}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}
              
              {/* No Results */}
              {filteredConversations.length === 0 && filteredVeterinarians.length === 0 && (
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
            Start a chat with a veterinarian to begin your conversation
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
              contentContainerStyle={{ paddingBottom: 100 }}
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
            onPress={() => router.push("/(user)/chat/vets")}
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
