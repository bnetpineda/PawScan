import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const SettingsModal = ({ visible, onClose, onEmailPress, onPasswordPress, isDark, onSignOut }) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <View className={`pt-16 pb-4 px-6 border-b ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
        <View className="flex-row justify-between items-center">
          <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
            Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}
          >
            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <View className="space-y-3">
          <TouchableOpacity
            className={`p-4 rounded-lg border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            onPress={onEmailPress}
          >
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={24} color={isDark ? "white" : "black"} />
              <View className="ml-3 flex-1">
                <Text className={`text-base font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
                  Change Email
                </Text>
                <Text className={`text-sm font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Update your email address
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            onPress={onPasswordPress}
          >
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={24} color={isDark ? "white" : "black"} />
              <View className="ml-3 flex-1">
                <Text className={`text-base font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
                  Change Password
                </Text>
                <Text className={`text-sm font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Update your account password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            onPress={onSignOut}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color={isDark ? "white" : "black"} />
              <View className="ml-3 flex-1">
                <Text className={`text-base font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
                  Sign Out
                </Text>
                <Text className={`text-sm font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Log out of your account
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

export default SettingsModal;