import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase"; // Adjust path if needed

const home = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView>
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/(tabs)/camera")}>
        <Text>camera</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/history")}>
        <Text>History</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default home;
