import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  RefreshControl,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import SettingsModal from "../../components/profile/SettingsModal";
import ChangeEmailModal from "../../components/profile/ChangeEmailModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import ImageViewerModal from "../../components/profile/ImageViewerModal";
import useProfileData from "../../hooks/useProfileData";

const ProfileScreen = () => {
  const [current, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showingHistory, setShowingHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useAuth();
  const {
    userPosts,
    petScanCount,
    historyImages,
    postsLoading,
    historyLoading,
    fetchUserPosts,
    fetchPetScanCount,
    fetchHistoryImages,
    refreshAllData
  } = useProfileData(user);

  useEffect(() => {
    setCurrentUser(user);
    setLoading(false);
    if (user) {
      const displayName =
        user?.user_metadata?.options?.data?.display_name || "";
      setNewEmail(user?.email || "");
      // Load profile image if exists
      const avatarUrl =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.options?.data?.avatar_url;
      if (avatarUrl) {
        setProfileImage(avatarUrl);
      }

      // Fetch user posts, pet scan count, and history images
      console.log('Fetching user data...');
      fetchUserPosts();
      fetchPetScanCount();
      fetchHistoryImages();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
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
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(`${user.id}/`, {
          limit: 1,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove([`${user.id}/avatar.jpg`]);
      }

      // Upload new avatar using base64 approach like in analyzePetImage.js
      const fileName = `${user.id}/avatar.jpg`;
      
      // Read the image as base64
      const fileData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileData, "base64");
      
      // Determine content type
      const imageExt = imageUri.split(".").pop()?.toLowerCase();
      const contentType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update user metadata with the avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
          options: {
            data: {
              avatar_url: publicUrl,
            },
          },
        },
      });

      if (updateError) throw updateError;

      // Update local state with the new avatar URL
      setProfileImage(publicUrl);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile picture. Please try again."
      );
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to set a profile picture."
      );
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
        email: newEmail.trim(),
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
    user?.user_metadata?.options?.data?.display_name || "Veterinarian";
  const role = user?.user_metadata?.options?.data?.role || "Veterinarian";
  const email = user?.email || "";

  // Simplified grid rendering function
  const renderGridContent = () => {
    const items = showingHistory ? historyImages : userPosts;
    const isLoading = showingHistory ? historyLoading : postsLoading;
    
    // If loading, show placeholders
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <View key={index} className="w-1/3 aspect-square p-1">
          <View
            className={`w-full h-full rounded ${
              isDark ? "bg-neutral-800" : "bg-neutral-200"
            }`}
          />
        </View>
      ));
    }
    
    // Loaded - show actual items or empty state
    if (items.length > 0) {
      return items.map((item) => (
        <TouchableOpacity 
          key={item.id} 
          className="w-1/3 aspect-square p-1"
          onPress={() => {
            setSelectedImage(item.url);
            setImageViewerVisible(true);
          }}
        >
          <Image
            source={{ uri: item.url }}
            className="w-full h-full rounded"
            resizeMode="cover"
          />
        </TouchableOpacity>
      ));
    } else {
      // Show empty state message
      return (
        <View className="w-full py-10 items-center justify-center">
          <FontAwesome 
            name={showingHistory ? "history" : "table"} 
            size={48} 
            color={isDark ? "#6B7280" : "#9CA3AF"} 
          />
          <Text className={`mt-4 text-lg font-inter ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
            No {showingHistory ? "scan history" : "posts"} yet
          </Text>
          <Text className={`mt-2 text-base font-inter ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
            {showingHistory 
              ? "Your pet scans will appear here" 
              : "Share posts to see them here"}
          </Text>
        </View>
      );
    }
  };

  return (
    <>
      <ScrollView 
        className={`flex-1 ${isDark ? "bg-black" : "bg-white"} pt-4`}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? "#fff" : "#000"} 
          />
        }
      >
        {/* Profile Header - Instagram Style */
        }
        <View className={`pt-12 pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <View className="flex-row justify-between items-center px-4 mb-8">
            <Image
              source={require("../../assets/images/home-logo.png")}
              className="w-8 h-9"
              resizeMode="cover"
            />
            <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
              PawScan
            </Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <FontAwesome
                name="cog"
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
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View
                  className={`w-24 h-24 rounded-full justify-center items-center ${
                    isDark ? "bg-neutral-800" : "bg-neutral-200"
                  }`}
                >
                  <Text
                    className={`text-2xl font-inter-bold ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
              <View
                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center ${
                  isDark ? "bg-neutral-700" : "bg-neutral-300"
                }`}
              >
                <FontAwesome
                  name="camera"
                  size={16}
                  color={isDark ? "white" : "black"}
                />
              </View>
            </TouchableOpacity>

            {/* Stats - Updated for Pet Owners */}
            <View className="flex-row flex-1 justify-around">
              <View className="items-center">
                <Text
                  className={`text-lg font-inter-bold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  {userPosts.length}
                </Text>
                <Text
                  className={`text-sm ${
                    isDark ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  Posts
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-inter-bold text-black dark:text-white">
                  {petScanCount}
                </Text>
                <Text
                  className={`text-sm ${
                    isDark ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  Pet Scanned
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
                isDark ? "text-neutral-300" : "text-neutral-600"
              }`}
            >
              {role} | Pet Health Expert
            </Text>
            <Text
              className={`mt-1 font-inter ${
                isDark ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Member since {formatDate(user?.created_at)}
            </Text>
          </View>
        </View>

        {/* Posts Grid - Instagram Style */}
        <View className="mt-2">
          <View className="flex-row border-t border-b border-neutral-300 dark:border-neutral-700">
            <TouchableOpacity 
              className="flex-1 items-center py-3 border-r border-neutral-300 dark:border-neutral-700"
              onPress={() => setShowingHistory(false)}
            >
              <FontAwesome
                name="table"
                size={24}
                color={!showingHistory && isDark ? "#3B82F6" : !showingHistory ? "#3B82F6" : isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 items-center py-3"
              onPress={() => setShowingHistory(true)}
            >
              <FontAwesome
                name="history"
                size={24}
                color={showingHistory && isDark ? "#3B82F6" : showingHistory ? "#3B82F6" : isDark ? "white" : "black"}
              />
            </TouchableOpacity>
          </View>

          {/* Posts/History Grid */}
          <View className="flex-row flex-wrap w-full">
            {renderGridContent()}
          </View>
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={selectedImage}
        onClose={() => setImageViewerVisible(false)}
      />

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