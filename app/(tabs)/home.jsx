import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";

const home = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView>
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/(tabs)/camera")}>
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
