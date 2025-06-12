import { Text, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { supabase } from "../lib/supabase";

const ViewProfile = (userId) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
      <Text className="font-inter-bold text-xs ">View Profile</Text>
    </SafeAreaView>
  );
};

export default ViewProfile;
