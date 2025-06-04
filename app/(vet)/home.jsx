import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";

const home = () => {
  const { logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold mb-4">Vet Home</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("camera")}>
        <Text>camera</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => logout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/history")}>
        <Text>History</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default home;
