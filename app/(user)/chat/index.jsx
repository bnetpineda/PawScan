import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useColorScheme,
  StatusBar,
  TextInput,
  Modal,
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
          // Get vet details from the secure veterinarians view
          const { data: vetData, error: vetError } = await supabase
            .from("veterinarians")
            .select("id, display_name, email")
            .eq("id", conversation.vet_id)
            .single();

          // If we get a permission error, try to get the user's display name from the user_display_names view
          if (vetError && vetError.code === "42501") {
            console.warn("Permission denied for veterinarians view, falling back to user_display_names view");
            const { data: userData, error: userError } = await supabase
              .from("user_display_names")
              .select("id, display_name, email")
              .eq("id", conversation.vet_id)
              .single();
            
            if (!userError && userData) {
              vetData = userData;
              vetError = null;
            }
          }

          if (vetError) {
            console.error("Error fetching vet data:", vetError);
            // Fallback to a default vet name
            return {
              ...conversation,
              latestMessage: null,
              vetName: "Veterinarian",
            };
          }

          const vetName = vetData?.display_name || "Veterinarian";

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
    }
  };

  const loadVeterinarians = async () => {
    try {
      // Get all veterinarians
      const { data: vetsData, error: vetsError } = await supabase
        .from("veterinarians")
        .select("id, display_name, email")
        .order("display_name", { ascending: true });

      if (vetsError) {
        console.error("Error fetching veterinarians:", vetsError);
        return;
      }

      setVeterinarians(vetsData);
    } catch (error) {
      console.error("Error loading veterinarians:", error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      className="flex-row p-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700"
      onPress={() =>
        router.push(
          `/(user)/chat/${item.vet_id}?vetName=${encodeURIComponent(
            item.vetName
          )}`
        )
      }
    >
      <View className="mr-3">
        <View className="w-12 h-12 rounded-full bg-black dark:bg-white justify-center items-center">
          <Text className="text-white dark:text-black text-xl font-inter-bold">
            {item.vetName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between mb-1">
          <Text
            className="text-base font-inter-bold flex-1 text-black dark:text-white"
            numberOfLines={1}
          >
            {item.vetName}
          </Text>
          {item.latestMessage && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
              {formatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text
            className="text-sm text-neutral-600 dark:text-neutral-300"
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
      className="flex-row p-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700"
      onPress={() => {
        router.push(
          `/(user)/chat/${item.id}?vetName=${encodeURIComponent(
            item.display_name
          )}`
        );
        setShowSearch(false);
        setSearchQuery("");
      }}
    >
      <View className="mr-3">
        <View className="w-12 h-12 rounded-full bg-black dark:bg-white justify-center items-center">
          <Text className="text-white dark:text-black text-xl font-inter-bold">
            {item.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="flex-1 justify-center">
        <Text
          className="text-base font-inter-bold text-black dark:text-white"
          numberOfLines={1}
        >
          {item.display_name}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-300">
          Veterinarian
        </Text>
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
        <Text className="text-2xl font-inter-bold text-black dark:text-white">
          Your Chats
        </Text>
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
      
      {filteredConversations.length === 0 && !showSearch ? (
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