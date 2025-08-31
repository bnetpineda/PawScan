import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import ChangeEmailModal from "../../components/ChangeEmailModal";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import EditProfileModal from "../../components/EditProfileModal";
import SettingsModal from "../../components/SettingsModal";
import * as ImagePicker from 'expo-image-picker'; // Added missing import

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
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
    if (user) {
      const displayName = user?.user_metadata?.options?.data?.display_name || "";
      setNewName(displayName);
      setNewEmail(user?.email || "");
      // Load profile image if exists
      if (user?.user_metadata?.avatar_url) {
        setProfileImage(user.user_metadata.avatar_url);
      }
    }
    setLoading(false);
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
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
      // First update the name
      const { error: nameError } = await supabase.auth.updateUser({
        data: { 
          display_name: newName.trim(),
          options: {
            data: {
              display_name: newName.trim(),
              role: user?.user_metadata?.options?.data?.role || "Pet Owner",
              ...(profileImage && { avatar_url: profileImage })
            }
          }
        }
      });

      if (nameError) throw nameError;

      // If there's a new image, upload it
      if (profileImage && profileImage.startsWith('file:')) {
        const formData = new FormData();
        formData.append('file', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });

        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(`user_${user.id}/avatar.jpg`, formData);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(`user_${user.id}/avatar.jpg`);

        // Update user metadata with the new avatar URL
        const { error: avatarError } = await supabase.auth.updateUser({
          data: { 
            avatar_url: publicUrl,
            ...user.user_metadata
          }
        });

        if (avatarError) throw avatarError;
        setProfileImage(publicUrl);
      }

      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
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
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-black" : "bg-white"}`}>
        <Text className={`text-lg font-inter ${isDark ? "text-white" : "text-black"}`}>
          Loading...
        </Text>
      </View>
    );
  }

  const displayName = user?.user_metadata?.options?.data?.display_name || "Pet Owner";
  const role = user?.user_metadata?.options?.data?.role || "Pet Owner";
  const email = user?.email || "";

  return (
    <>
      <ScrollView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
        {/* Header */}
        <View className={`pt-16 pb-8 px-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className="flex-row items-center mb-6">
            <Text className={`text-2xl font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
              Profile
            </Text>
          </View>

          {/* Profile Picture and Basic Info */}
          <View className="items-center">
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-32 h-32 rounded-full mb-4"
              />
            ) : (
              <View
                className={`w-32 h-32 rounded-full justify-center items-center mb-4 ${
                  isDark ? "bg-gray-700" : "bg-gray-300"
                }`}
              >
                <Text className={`text-4xl font-inter-bold ${isDark ? "text-white" : "text-black"}`}>
                  {getInitials(displayName)}
                </Text>
              </View>
            )}

            <Text className={`text-2xl font-inter-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
              {displayName}
            </Text>

            <Text className={`text-lg font-inter capitalize mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {role}
            </Text>

            <Text className={`text-base font-inter ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {email}
            </Text>
          </View>
        </View>

        {/* Profile Details */}
        <View className="px-6 py-4">
          <Text className={`text-xl font-inter-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>
            Account Information
          </Text>

          {/* Info Cards */}
          <View className="space-y-3">
            <View className={`p-4 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text className={`ml-3 text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Email
                </Text>
              </View>
              <Text className={`text-base font-inter ${isDark ? "text-white" : "text-black"}`}>
                {email}
              </Text>
            </View>

            <View className={`p-4 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text className={`ml-3 text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Role
                </Text>
              </View>
              <Text className={`text-base font-inter capitalize ${isDark ? "text-white" : "text-black"}`}>
                {role}
              </Text>
            </View>

            <View className={`p-4 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text className={`ml-3 text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Member Since
                </Text>
              </View>
              <Text className={`text-base font-inter ${isDark ? "text-white" : "text-black"}`}>
                {formatDate(user?.created_at)}
              </Text>
            </View>

            <View className={`p-4 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text className={`ml-3 text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Last Sign In
                </Text>
              </View>
              <Text className={`text-base font-inter ${isDark ? "text-white" : "text-black"}`}>
                {formatDate(user?.last_sign_in_at)}
              </Text>
            </View>

            <View className={`p-4 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={isDark ? "#10B981" : "#059669"}
                />
                <Text className={`ml-3 text-base font-inter-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Email Status
                </Text>
              </View>
              <Text className={`text-base font-inter ${isDark ? "text-green-400" : "text-green-600"}`}>
                {user?.role === "authenticated" ? "Verified" : "Not Verified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 py-4 space-y-3">
          <TouchableOpacity
            className={`p-4 rounded-lg border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            onPress={() => setEditProfileVisible(true)}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="create-outline"
                size={20}
                color={isDark ? "white" : "black"}
              />
              <Text className={`ml-2 text-base font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
                Edit Profile
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            onPress={() => setSettingsVisible(true)}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="settings-outline"
                size={20}
                color={isDark ? "white" : "black"}
              />
              <Text className={`ml-2 text-base font-inter-semibold ${isDark ? "text-white" : "text-black"}`}>
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

      {/* Modals */}
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
        isDark={isDark}
      />

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