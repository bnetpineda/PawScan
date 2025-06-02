import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }
      // Fetch history for this user
      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setHistory([]);
      } else {
        setHistory(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!history.length) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-gray-500 dark:text-gray-400">
          No history found.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black p-4">
      <FlatList
        data={history}
        keyExtractor={(item) => item.id || item.created_at}
        renderItem={({ item }) => (
          <View className="mb-6 p-4 rounded-xl bg-gray-100 dark:bg-neutral-800 shadow">
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                className="w-full h-48 rounded-lg mb-2 bg-gray-300"
                resizeMode="cover"
              />
            ) : null}
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {new Date(item.created_at).toLocaleString()}
            </Text>
            <Text className="text-base text-black dark:text-white font-inter-semibold mb-1">
              Analysis Result:
            </Text>
            <Text className="text-sm text-gray-700 dark:text-gray-200">
              {item.analysis_result}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
