import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useTutorial } from "../../providers/TutorialProvider";
import SettingsModal from "../../components/profile/SettingsModal";
import BecomeVetModal from "../../components/profile/BecomeVetModal";
import ChangeEmailModal from "../../components/profile/ChangeEmailModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import ImageViewerModal from "../../components/profile/ImageViewerModal";
import EditProfileModal from "../../components/profile/EditProfileModal";
import useProfileData from "../../hooks/useProfileData";

const ProfileScreen = () => {
  const [current, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [becomeVetVisible, setBecomeVetVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
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

  // User profile states
  const [userProfile, setUserProfile] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [petNames, setPetNames] = useState([]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user, logout } = useAuth();
  const { startTutorial } = useTutorial();
  const {
    userPosts,
    petScanCount,
    historyImages,
    postsLoading,
    historyLoading,
    fetchUserPosts,
    fetchPetScanCount,
    fetchHistoryImages,
    refreshAllData,
  } = useProfileData(user);

  useEffect(() => {
    setCurrentUser(user);
    setLoading(false);
    if (user) {
      const displayName =
        user?.user_metadata?.options?.data?.display_name || "";
      setNewEmail(user?.email || "");

      // Fetch user posts, pet scan count, and history images
      fetchUserPosts();
      fetchPetScanCount();
      fetchHistoryImages();

      // Fetch user profile from the user_profiles table
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          // Create a default profile for the user
          await createDefaultUserProfile();
        } else {
          console.error("Error fetching user profile:", error);
        }
        return;
      }

      setUserProfile(data);
      setName(data.name || "");
      setLocation(data.location || "");
      setBio(data.bio || "");
      setPetNames(data.pet_names || []);

      // Set profile image from user_profiles table
      if (data.profile_image_url) {
        setProfileImage(data.profile_image_url);
      } else {
        // Fallback to auth metadata if no avatar in user_profiles
        const avatarUrl =
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.options?.data?.avatar_url;
        if (avatarUrl) {
          setProfileImage(avatarUrl);
        }
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const createDefaultUserProfile = async () => {
    try {
      const { error } = await supabase.from("user_profiles").insert([
        {
          id: user.id,
          name:
            user?.user_metadata?.options?.data?.display_name ||
            user?.email?.split("@")[0] ||
            "Pet Owner",
          created_at: new Date().toISOString(),
          profile_image_url: null // Initialize with null profile_image_url
        },
      ]);

      if (error) throw error;

      // Fetch the newly created profile
      fetchUserProfile();
    } catch (error) {
      console.error("Error creating default user profile:", error);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from("user_profiles")
        .update({
          name: profileData.name,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setName(profileData.name);
      setLocation(profileData.location);
      setBio(profileData.bio);

      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
      fetchUserProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
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
          try {
            await logout();
            // Logout successful, navigation will be handled by AuthProvider
          } catch (error) {
            // Don't show error alert since logout still succeeded locally
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

      // Update the profile_image_url in the user_profiles table instead of auth metadata
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

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

  // Use full name from database consistently
  const displayName = userProfile?.name || "Pet Owner";
  const role = user?.user_metadata?.options?.data?.role || "Pet Owner";
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
          <Text
            className={`mt-4 text-lg font-inter ${
              isDark ? "text-neutral-400" : "text-neutral-500"
            }`}
          >
            No {showingHistory ? "scan history" : "posts"} yet
          </Text>
          <Text
            className={`mt-2 text-base font-inter ${
              isDark ? "text-neutral-500" : "text-neutral-400"
            }`}
          >
            {showingHistory
              ? "Your pet scans will appear here"
              : "Share posts to see them here"}
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <ScrollView
        className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#000"}
          />
        }
      >
        {/* Profile Header - Instagram Style */}
        <View className={`pt-2 pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <View className="flex-row justify-between items-center px-4 mb-8">
            <Image
              source={isDark 
                ? require("../../assets/images/home-logo-darkmode.png") 
                : require("../../assets/images/home-logo-whitemode.png")
              }
              className="w-8 h-9"
              resizeMode="cover"
            />
            <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
              PawScan
            </Text>
            <View className="flex-row">
              <TouchableOpacity 
                className="mr-4"
                onPress={() => setSettingsVisible(true)}
              >
                <FontAwesome
                  name="cog"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditProfileVisible(true)}>
                <FontAwesome
                  name="edit"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              </TouchableOpacity>
            </View>
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

          {/* Bio Section - Enhanced with edit capability */}
          <View className="px-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text
                  className={`font-inter-semibold text-lg ${
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
                  {role === "user" || "pending_veterinarian" ? "Pet Owner" : role} | Pet Health Enthusiast
                </Text>
                <Text
                  className={`mt-1 font-inter ${
                    isDark ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  Member since {formatDate(user?.created_at)}
                </Text>
                
                {/* Location */}
                {location && (
                  <View className="flex-row items-center mt-2">
                    <FontAwesome
                      name="map-marker"
                      size={14}
                      color={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                    <Text
                      className={`ml-2 font-inter ${
                        isDark ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      {location}
                    </Text>
                  </View>
                )}
                
                {/* Bio */}
                {bio && (
                  <Text
                    className={`mt-2 font-inter ${
                      isDark ? "text-neutral-300" : "text-neutral-600"
                    }`}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {bio}
                  </Text>
                )}
                
                {/* Pet Names */}
                {petNames && petNames.length > 0 && (
                  <View className="mt-2">
                    <Text
                      className={`font-inter-semibold text-sm ${
                        isDark ? "text-neutral-300" : "text-neutral-600"
                      }`}
                    >
                      My Pets:
                    </Text>
                    <Text
                      className={`font-inter ${
                        isDark ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      {petNames.join(", ")}
                    </Text>
                  </View>
                )}
              </View>
              

            </View>
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
                color={
                  !showingHistory && isDark
                    ? "#3B82F6"
                    : !showingHistory
                    ? "#3B82F6"
                    : isDark
                    ? "white"
                    : "black"
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center py-3"
              onPress={() => setShowingHistory(true)}
            >
              <FontAwesome
                name="history"
                size={24}
                color={
                  showingHistory && isDark
                    ? "#3B82F6"
                    : showingHistory
                    ? "#3B82F6"
                    : isDark
                    ? "white"
                    : "black"
                }
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        profile={userProfile}
        onSave={updateUserProfile}
        updating={updating}
        isDark={isDark}
      />

      {/* Modals */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onPasswordPress={() => {
          setSettingsVisible(false);
          setChangePasswordVisible(true);
        }}
        onTutorialPress={() => {
          setSettingsVisible(false);
          startTutorial('profile');
        }}
        onSignOut={handleSignOut}
        isDark={isDark}
      />

      <BecomeVetModal
        visible={becomeVetVisible}
        onClose={() => setBecomeVetVisible(false)}
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
    </SafeAreaView>
  );
};

export default ProfileScreen;
