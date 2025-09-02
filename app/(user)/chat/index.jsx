import { useState, useEffect } from "react";
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
  const isDark = useColorScheme() === "dark";

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
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Could not load conversations");
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
            <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatTime(item.latestMessage.created_at)}
            </Text>
          )}
        </View>
        {item.latestMessage ? (
          <Text
            className="text-sm text-gray-600 dark:text-gray-300"
            numberOfLines={1}
          >
            {item.latestMessage.content}
          </Text>
        ) : (
          <Text className="text-sm italic text-gray-500 dark:text-gray-400">
            No messages yet
          </Text>
        )}
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
      </View>
      {conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesome
            name="commenting-o"
            size={64}
            color={isDark ? "#fff" : "#000"}
          />
          <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
            No conversations yet
          </Text>
          <Text className="text-base text-center text-gray-600 dark:text-gray-300">
            Start a chat with a veterinarian to begin
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
          }
        />
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
