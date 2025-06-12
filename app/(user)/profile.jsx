import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from "react-native";
import { supabase } from "../../lib/supabase"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider"; // Adjust path as needed

const ProfileScreen = () => {
  const [current, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useAuth();
  useEffect(() => {
    setCurrentUser(user);
    setLoading(false);
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDark ? "bg-black" : "bg-white"
        }`}
      >
        <Text
          className={`text-lg font-inter ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const displayName =
    user?.user_metadata?.options?.data?.display_name || "Pet Owner";
  const role = user?.user_metadata?.options?.data?.role || "Pet Owner";
  const email = user?.email || "";

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      {/* Header */}
      <View
        className={`pt-16 pb-8 px-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text
            className={`text-2xl font-inter-bold ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Profile
          </Text>
          <TouchableOpacity
            onPress={handleSignOut}
            className={`p-2 rounded-full ${
              isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Picture and Basic Info */}
        <View className="items-center">
          <View
            className={`w-32 h-32 rounded-full justify-center items-center mb-4 ${
              isDark ? "bg-gray-700" : "bg-gray-300"
            }`}
          >
            <Text
              className={`text-4xl font-inter-bold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {getInitials(displayName)}
            </Text>
          </View>

          <Text
            className={`text-2xl font-inter-bold mb-2 ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            {displayName}
          </Text>

          <Text
            className={`text-lg font-inter capitalize mb-1 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {role}
          </Text>

          <Text
            className={`text-base font-inter ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {email}
          </Text>
        </View>
      </View>

      {/* Profile Details */}
      <View className="px-6 py-4">
        <Text
          className={`text-xl font-inter-bold mb-4 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Account Information
        </Text>

        {/* Info Cards */}
        <View className="space-y-3">
          <View
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`ml-3 text-base font-inter-semibold ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email
              </Text>
            </View>
            <Text
              className={`text-base font-inter ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {email}
            </Text>
          </View>

          <View
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`ml-3 text-base font-inter-semibold ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Role
              </Text>
            </View>
            <Text
              className={`text-base font-inter capitalize ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {role}
            </Text>
          </View>

          <View
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`ml-3 text-base font-inter-semibold ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Member Since
              </Text>
            </View>
            <Text
              className={`text-base font-inter ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {formatDate(user?.created_at)}
            </Text>
          </View>

          <View
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="time-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`ml-3 text-base font-inter-semibold ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Last Sign In
              </Text>
            </View>
            <Text
              className={`text-base font-inter ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {formatDate(user?.last_sign_in_at)}
            </Text>
          </View>

          <View
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={isDark ? "#10B981" : "#059669"}
              />
              <Text
                className={`ml-3 text-base font-inter-semibold ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email Status
              </Text>
            </View>
            <Text
              className={`text-base font-inter ${
                isDark ? "text-green-400" : "text-green-600"
              }`}
            >
              {user?.role === "authenticated" ? "Verified" : "Not Verified"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-6 py-4 space-y-3">
        <TouchableOpacity
          className={`p-4 rounded-lg border ${
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
          onPress={() => {
            // Add edit profile functionality
            Alert.alert(
              "Edit Profile",
              "Edit profile functionality would go here"
            );
          }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="create-outline"
              size={20}
              color={isDark ? "white" : "black"}
            />
            <Text
              className={`ml-2 text-base font-inter-semibold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Edit Profile
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`p-4 rounded-lg border ${
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
          onPress={() => {
            // Add settings functionality
            Alert.alert("Settings", "Settings functionality would go here");
          }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="settings-outline"
              size={20}
              color={isDark ? "white" : "black"}
            />
            <Text
              className={`ml-2 text-base font-inter-semibold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Settings
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-4 rounded-lg bg-red-600 border border-red-600"
          onPress={handleSignOut}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="ml-2 text-base font-inter-bold text-white">
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};

export default ProfileScreen;
