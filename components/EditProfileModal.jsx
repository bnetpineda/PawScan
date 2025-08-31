import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import React from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EditProfileModal = ({ 
  visible, 
  onClose, 
  newName, 
  setNewName, 
  profileImage, 
  onProfileImageChange,
  onSubmit, 
  updating, 
  isDark 
}) => (
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
            Edit Profile
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}
          >
            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="items-center mb-6">
          <TouchableOpacity onPress={onProfileImageChange}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-32 h-32 rounded-full"
              />
            ) : (
              <View className={`w-32 h-32 rounded-full justify-center items-center ${
                isDark ? "bg-gray-700" : "bg-gray-300"
              }`}>
                <Ionicons 
                  name="camera-outline" 
                  size={32} 
                  color={isDark ? "white" : "black"} 
                />
              </View>
            )}
          </TouchableOpacity>
          <Text className={`mt-2 text-sm font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Tap to change photo
          </Text>
        </View>

        <View className="mb-4">
          <Text className={`text-base font-inter mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Display Name
          </Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={`p-4 rounded-lg border text-base font-inter ${
              isDark 
                ? "bg-gray-900 border-gray-700 text-white" 
                : "bg-white border-gray-300 text-black"
            }`}
            autoCapitalize="words"
            autoFocus
          />
        </View>

        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className={`flex-1 p-4 rounded-lg border ${
              isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100"
            }`}
            disabled={updating}
          >
            <Text className={`text-center text-base font-inter-semibold ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSubmit}
            className="flex-1 p-4 rounded-lg bg-blue-600"
            disabled={updating}
          >
            <Text className="text-center text-base font-inter-bold text-white">
              {updating ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

export default EditProfileModal;