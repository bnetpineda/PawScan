import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
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
import { useAuth } from "../../../providers/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

const ChatListScreen = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
      setFilteredVeterinarians([]);
    } else {
      // Filter existing conversations
      const filtered = conversations.filter(conversation => {
        const vetName = conversation.vetName?.toLowerCase() || "";
        const latestMessage = conversation.latestMessage?.content?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return vetName.includes(query) || latestMessage.includes(query);
      });
      setFilteredConversations(filtered);
      
      // Filter veterinarians for new chats
      const filteredVets = veterinarians.filter(vet => {
        const vetName = vet.display_name?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return vetName.includes(query);
      });
      setFilteredVeterinarians(filteredVets);
    }
  }, [searchQuery, conversations, veterinarians]);

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

          // Debug log to check the message data structure
          console.log("Latest message for conversation", conversation.id, ":", latestMessageData);

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
        // No fallback - if vet_profiles is not accessible, there are no veterinarians to show
        setVeterinarians([]);
        return;
      }

      // Format data to match expected vet object structure
      const formattedVets = vetsData.map(vet => ({
        id: vet.id,
        display_name: vet.name,
        email: "", // Vet profiles don't necessarily store email directly
        profile_image_url: vet.profile_image_url
      }));

      setVeterinarians(formattedVets);
    } catch (error) {
      console.error("Error loading veterinarians:", error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "";
      
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return date.toLocaleDateString([], { weekday: "long" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "V";
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
    >
      <TouchableOpacity 
        className="mr-4"
        onPress={() => router.push(`/(user)/vet-profile?vetId=${item.vet_id}`)}
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
              {formatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text
            className="text-sm text-neutral-600 dark:text-neutral-400"
            numberOfLines={1}
          >
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
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#FAFAFA"}
      />
      
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-black">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-inter-bold text-black dark:text-white">
            Messages
          </Text>
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
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
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
              placeholder="Search chats or veterinarians..."
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
          
          {/* Search Results */}
          {searchQuery.trim() !== "" && (
            <View className="flex-1">
              {/* Existing Conversations */}
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
              
              {/* Veterinarians for New Chats */}
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
              
              {/* No Results */}
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
          )}
        </SafeAreaView>
      </Modal>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className="text-lg mt-4 text-black dark:text-white">Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 && !showSearch ? (
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesome
            name="commenting-o"
            size={64}
            color={isDark ? "#fff" : "#000"}
          />
          <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
            No conversations yet
          </Text>
          <Text className="text-base text-center text-neutral-600 dark:text-neutral-300">
            Start a chat with a veterinarian to begin
          </Text>
        </View>
      ) : (
        !showSearch && (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderConversation}
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
            }
          />
        )
      )}
      <View className="p-4 bg-white border-t border-black dark:bg-neutral-900 dark:border-neutral-700">
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
    </SafeAreaView>
  );
};

export default ChatListScreen;