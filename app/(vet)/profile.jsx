import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";


// Modal Components
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
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View className={`pt-16 pb-4 px-6 border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
        <View className="flex-row justify-between items-center">
          <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-gray-900"}`}>
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
              <View className={`w-32 h-32 rounded-full justify-center items-center ${isDark ? "bg-gray-800" : "bg-gray-300"
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
            className={`p-4 rounded-lg border text-base font-inter ${isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-gray-900"
              }`}
            autoCapitalize="words"
            autoFocus
          />
        </View>

        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className={`flex-1 p-4 rounded-lg border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100"
              }`}
            disabled={updating}
          >
            <Text className={`text-center text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"
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

const SettingsModal = ({
  visible,
  onClose,
  onEmailPress,
  onPasswordPress,
  onSignOut,
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
            Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
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

const ChangeEmailModal = ({
  visible,
  onClose,
  newEmail,
  setNewEmail,
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
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View className={`pt-16 pb-4 px-6 border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
        <View className="flex-row justify-between items-center">
          <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Change Email
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        <Text className={`text-base font-inter mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          New Email Address
        </Text>
        <TextInput
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="Enter new email address"
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          className={`p-4 rounded-lg border text-base font-inter ${isDark
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-900"
            }`}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <View className={`mt-4 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-blue-50"}`}>
          <Text className={`text-sm font-inter ${isDark ? "text-gray-400" : "text-blue-700"}`}>
            A verification email will be sent to your new email address. You'll need to verify it before the change takes effect.
          </Text>
        </View>

        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className={`flex-1 p-4 rounded-lg border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100"
              }`}
            disabled={updating}
          >
            <Text className={`text-center text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"
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
              {updating ? "Updating..." : "Update Email"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const ChangePasswordModal = ({
  visible,
  onClose,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  updating,
  isDark,
  userEmail
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View className={`pt-16 pb-4 px-6 border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
        <View className="flex-row justify-between items-center">
          <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Change Password
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="space-y-4">
          <View>
            <Text className={`text-base font-inter mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Current Password
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${isDark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
                }`}
              secureTextEntry
              autoFocus
            />
          </View>

          <View>
            <Text className={`text-base font-inter mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              New Password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${isDark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
                }`}
              secureTextEntry
            />
          </View>

          <View>
            <Text className={`text-base font-inter mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className={`p-4 rounded-lg border text-base font-inter ${isDark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
                }`}
              secureTextEntry
            />
          </View>
        </View>

        <View className={`mt-4 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-yellow-50"}`}>
          <Text className={`text-sm font-inter ${isDark ? "text-gray-400" : "text-yellow-700"}`}>
            Password must be at least 6 characters long.
          </Text>
        </View>

        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className={`flex-1 p-4 rounded-lg border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100"
              }`}
            disabled={updating}
          >
            <Text className={`text-center text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"
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
              {updating ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

const ProfileScreen = () => {
  const [current, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useAuth();

  useEffect(() => {
    setCurrentUser(user);
    setLoading(false);
    if (user) {
      const displayName = user?.user_metadata?.options?.data?.display_name || "";
      setNewName(displayName);
      setNewEmail(user?.email || "");
      // Load profile image if exists
      const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.options?.data?.avatar_url;
      if (avatarUrl) {
        setProfileImage(avatarUrl);
      }
    }
  }, [user]);

  const navigation = useNavigation();

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

  const handleEditProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Please enter a valid name");
      return;
    }

    setUpdating(true);
    try {
      let avatarUrl = profileImage;

      // If there's a new image, upload it
      if (profileImage && profileImage.startsWith('file:')) {
        // Delete existing avatar if it exists
        const { data: existingFiles } = await supabase
          .storage
          .from('avatars')
          .list(`${user.id}/`, {
            limit: 1,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (existingFiles && existingFiles.length > 0) {
          await supabase
            .storage
            .from('avatars')
            .remove([`${user.id}/avatar.jpg`]);
        }

        // Upload new avatar - path must match the policy: user ID as folder name
        const fileName = `${user.id}/avatar.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });

        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, formData, {
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update user metadata with the name and avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          display_name: newName.trim(),
          avatar_url: avatarUrl,
          options: {
            data: {
              display_name: newName.trim(),
              role: user?.user_metadata?.options?.data?.role || "Veterinarian",
              avatar_url: avatarUrl
            }
          }
        }
      });

      if (updateError) throw updateError;

      // Update local state with the new avatar URL
      if (avatarUrl) {
        setProfileImage(avatarUrl);
      }

      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to set a profile picture.');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim()
      });

      if (error) throw error;

      Alert.alert(
        "Verification Required",
        "A verification email has been sent to your new email address. Please check your inbox and click the verification link to complete the change."
      );
      setChangeEmailVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };
  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setUpdating(true);
    try {
      // First verify current password by reauthenticating
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) {
        throw new Error("Current password is incorrect");
      }

      // If authentication succeeds, update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password updated successfully!");
      setChangePasswordVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  const resetForms = useCallback(() => {
    const displayName = user?.user_metadata?.options?.data?.display_name || "";
    setNewName(displayName);
    setNewEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "V"; // Default to 'V' for Veterinarian
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
        className={`flex-1 justify-center items-center ${isDark ? "bg-black" : "bg-white"}`}
      >
        <Text
          className={`text-lg font-inter ${isDark ? "text-white" : "text-black"}`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const displayName = user?.user_metadata?.options?.data?.display_name || "Veterinarian";
  const role = user?.user_metadata?.options?.data?.role || "Veterinarian";
  const email = user?.email || "";

  // Mock data for posts
  const posts = [
    { id: 1, imageUrl: 'https://placehold.co/300', likes: 42 },
    { id: 2, imageUrl: 'https://placehold.co/300', likes: 128 },
    { id: 3, imageUrl: 'https://placehold.co/300', likes: 76 },
    { id: 4, imageUrl: 'https://placehold.co/300', likes: 203 },
    { id: 5, imageUrl: 'https://placehold.co/300', likes: 89 },
    { id: 6, imageUrl: 'https://placehold.co/300', likes: 54 },
  ];

  return (
    <>
      <ScrollView className={`flex-1 pt-12 ${isDark ? "bg-black" : "bg-white"} `}>
        {/* Profile Header */}
        <View className={`pt-12 pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
              {displayName}
            </Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={isDark ? "white" : "black"} 
              />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View className="flex-row px-4 pb-4">
            {/* Profile Image */}
            <View className="mr-6">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <View
                  className={`w-20 h-20 rounded-full justify-center items-center ${
                    isDark ? "bg-gray-800" : "bg-gray-200"
                  }`}
                >
                  <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View className="flex-1 flex-row justify-between">
              <View className="items-center">
                <Text className={`text-lg font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
                  24
                </Text>
                <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Posts
                </Text>
              </View>
              <View className="items-center">
                <Text className={`text-lg font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
                  1.2K
                </Text>
                <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Followers
                </Text>
              </View>
              <View className="items-center">
                <Text className={`text-lg font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
                  356
                </Text>
                <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Following
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View className="px-4">
            <Text className={`font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
              {displayName}
            </Text>
            <Text className={`font-inter ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {role} | Pet Health Expert
            </Text>
            <Text className={`mt-1 font-inter ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Member since {formatDate(user?.created_at)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row px-4 mt-4">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
              onPress={() => setEditProfileVisible(true)}
            >
              <Text
                className={`text-center font-inter-semibold ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Grid */}
        <View className="mt-2">
          <View className="flex-row border-t border-b border-gray-300 dark:border-gray-700">
            <TouchableOpacity className="flex-1 items-center py-3 border-r border-gray-300 dark:border-gray-700">
              <Ionicons 
                name="grid-outline" 
                size={24} 
                color={isDark ? "#3B82F6" : "#3B82F6"} 
              />
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center py-3">
              <Ionicons 
                name="bookmark-outline" 
                size={24} 
                color={isDark ? "white" : "black"} 
              />
            </TouchableOpacity>
          </View>

          {/* Posts Grid */}
          <View className="flex-row flex-wrap">
            {posts.map((post) => (
              <View key={post.id} className="w-1/3 aspect-square p-1">
                <Image
                  source={{ uri: post.imageUrl }}
                  className="w-full h-full rounded"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => {
          setEditProfileVisible(false);
          resetForms();
        }}
        newName={newName}
        setNewName={setNewName}
        profileImage={profileImage}
        onProfileImageChange={pickImage}
        onSubmit={handleEditProfile}
        updating={updating}
        isDark={isDark}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onEmailPress={() => {
          setSettingsVisible(false);
          setChangeEmailVisible(true);
        }}
        onPasswordPress={() => {
          setSettingsVisible(false);
          setChangePasswordVisible(true);
        }}
        onSignOut={handleSignOut}
        isDark={isDark}
      />

      <ChangeEmailModal
        visible={changeEmailVisible}
        onClose={() => {
          setChangeEmailVisible(false);
          resetForms();
        }}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        onSubmit={handleChangeEmail}
        updating={updating}
        isDark={isDark}
      />

      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => {
          setChangePasswordVisible(false);
          resetForms();
        }}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleChangePassword}
        updating={updating}
        isDark={isDark}
      />
    </>
  );
};

export default ProfileScreen;