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
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [userPosts, setUserPosts] = useState([]);

  // Form states
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
      setNewEmail(user?.email || "");
      // Load profile image if exists
      const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.options?.data?.avatar_url;
      if (avatarUrl) {
        setProfileImage(avatarUrl);
      }
      
      // Fetch user posts
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    
    try {
      // List all files in the user's folder
      const { data: files, error } = await supabase
        .storage
        .from('avatars') // Assuming posts are stored in the avatars bucket
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching user posts:', error);
        return;
      }

      // Get public URLs for each file (excluding avatar.jpg if it exists)
      const postFiles = files.filter(file => file.name !== 'avatar.jpg');
      const postsWithUrls = postFiles.map(file => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${file.name}`);
        
        return {
          id: file.id,
          url: publicUrl,
          name: file.name
        };
      });

      setUserPosts(postsWithUrls);
    } catch (error) {
      console.error('Error processing user posts:', error);
    }
  };

  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

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

  const updateProfileImage = async (imageUri) => {
    try {
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
        uri: imageUri,
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

      // Update user metadata with the avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          avatar_url: publicUrl,
          options: {
            data: {
              avatar_url: publicUrl
            }
          }
        }
      });

      if (updateError) throw updateError;

      // Update local state with the new avatar URL
      setProfileImage(publicUrl);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", error.message || "Failed to update profile picture. Please try again.");
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
      await updateProfileImage(result.assets[0].uri);
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
    setNewEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "U"; // Default to 'U' for User
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

  const displayName = user?.user_metadata?.options?.data?.display_name || "Pet Owner";
  const role = user?.user_metadata?.options?.data?.role || "Pet Owner";
  const email = user?.email || "";

  return (
    <>
      <ScrollView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
        {/* Profile Header - Instagram Style */}
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

          {/* Profile Info - Instagram Style */}
          <View className="flex-row px-4 pb-4 items-center">
            {/* Profile Image - Click to change */}
            <TouchableOpacity onPress={pickImage} className="mr-6">
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
              <View className={`absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
                <Ionicons 
                  name="camera-outline" 
                  size={16} 
                  color={isDark ? "white" : "black"} 
                />
              </View>
            </TouchableOpacity>

            {/* Stats - Instagram Style */}
            <View className="flex-row flex-1 justify-around">
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
            <Text
              className={`font-inter-semibold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {displayName}
            </Text>
            <Text
              className={`font-inter ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {role} | Pet Health Enthusiast
            </Text>
            <Text
              className={`mt-1 font-inter ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Member since {formatDate(user?.created_at)}
            </Text>
          </View>
        </View>

        {/* Posts Grid - Instagram Style */}
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
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <View key={post.id} className="w-1/3 aspect-square p-1">
                  <Image
                    source={{ uri: post.url }}
                    className="w-full h-full rounded"
                    resizeMode="cover"
                  />
                </View>
              ))
            ) : (
              // Placeholder grid when no posts
              Array.from({ length: 6 }).map((_, index) => (
                <View key={index} className="w-1/3 aspect-square p-1">
                  <View className={`w-full h-full rounded ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
                </View>
              ))
            )}
          </View>
        </View>
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