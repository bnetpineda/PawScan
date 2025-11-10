import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
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
import ChangeEmailModal from "../../components/profile/ChangeEmailModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import ImageViewerModal from "../../components/profile/ImageViewerModal";
import VetProfileEditModal from "../../components/profile/VetProfileEditModal";
import useProfileData from "../../hooks/useProfileData";
import TutorialOverlay from "../../components/tutorial/TutorialOverlay";
import { profileTutorialSteps } from "../../components/tutorial/tutorialSteps";

const ProfileScreen = () => {
  const [current, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [showingHistory, setShowingHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // Vet profile states
  const [vetProfile, setVetProfile] = useState(null);
  const [name, setName] = useState("");
  const [medicalSpecialty, setMedicalSpecialty] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [availableSchedule, setAvailableSchedule] = useState([]);
  const [vetProfileEditable, setVetProfileEditable] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  // FIXED: Separate updating states for each modal
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useAuth();
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
    refreshAllData
  } = useProfileData(user);

  useEffect(() => {
    setCurrentUser(user);
    setLoading(false);
    if (user) {
      const displayName =
        user?.user_metadata?.options?.data?.display_name || "";
      setNewEmail(user?.email || "");

      // Fetch user posts, pet scan count, and history images
      console.log('Fetching user data...');
      fetchUserPosts();
      fetchPetScanCount();
      fetchHistoryImages();
      
      // Fetch veterinarian profile
      fetchVetProfile();
    }

    // FIXED: Cleanup function to prevent memory leaks
    return () => {
      setUpdatingEmail(false);
      setUpdatingPassword(false);
    };
  }, [user]);

  const fetchVetProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Create a default profile for the veterinarian
          await createDefaultVetProfile();
        } else {
          console.error('Error fetching vet profile:', error);
        }
        return;
      }
      
      setVetProfile(data);
      setName(data.name || '');
      setMedicalSpecialty(data.medical_specialty || '');
      setClinicLocation(data.clinic_location || '');
      setContactInfo(data.contact_info || '');
      setAvailableSchedule(data.available_schedule || []);
      
      // Set profile image from vet_profiles table
      if (data.profile_image_url) {
        setProfileImage(data.profile_image_url);
      } else {
        // Fallback to auth metadata if no avatar in vet_profiles
        const avatarUrl =
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.options?.data?.avatar_url;
        if (avatarUrl) {
          setProfileImage(avatarUrl);
        }
      }
    } catch (error) {
      console.error('Error in fetchVetProfile:', error);
    }
  };

  const createDefaultVetProfile = async () => {
    try {
      const { error } = await supabase
        .from('vet_profiles')
        .insert([{ 
          id: user.id,
          name: user?.user_metadata?.options?.data?.display_name || '',
          created_at: new Date().toISOString(),
          profile_image_url: null // Initialize with null profile_image_url
        }]);

      if (error) throw error;
      
      // Fetch the newly created profile
      fetchVetProfile();
    } catch (error) {
      console.error('Error creating default vet profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    await fetchVetProfile();
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
      
      // Determine content type with safe default
      const imageExt = imageUri.split(".").pop()?.toLowerCase();
      const contentType = imageExt ? `image/${imageExt === "jpg" ? "jpeg" : imageExt}` : "image/jpeg";

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL and add cache-busting param
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Update the profile_image_url in the vet_profiles table instead of auth metadata
      const { error: updateError } = await supabase
        .from('vet_profiles')
        .update({ profile_image_url: cacheBustedUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state with the new avatar URL
      setProfileImage(cacheBustedUrl);

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

  // FIXED: Use separate updatingEmail state
  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      }, {
        emailRedirectTo: 'https://pawscan-dashboard.vercel.app/confirm-email',
      });

      if (error) throw error;

      Alert.alert(
        "Verification Required",
        "A verification email has been sent to your new email address. Please check your inbox and click the verification link to complete the change."
      );
      setEmailSent(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setChangeEmailVisible(false);
        resetForms();
      }, 2000);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  // FIXED: Use separate updatingPassword state
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

    setUpdatingPassword(true);
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
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setChangePasswordVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const resetForms = useCallback(() => {
    setNewEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEmailSent(false);
  }, [user]);

  const updateVetProfile = async () => {
    try {
      setUpdatingEmail(true); // Reuse for vet profile updating indicator if needed
      // Or create a separate state: const [updatingProfile, setUpdatingProfile] = useState(false);
      
      const { error } = await supabase
        .from('vet_profiles')
        .update({
          name,
          medical_specialty: medicalSpecialty,
          clinic_location: clinicLocation,
          contact_info: contactInfo,
          available_schedule: availableSchedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      Alert.alert("Success", "Profile updated successfully!");
      setVetProfileEditable(false);
      fetchVetProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating vet profile:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const editSchedule = (scheduleData) => {
    const newEntry = {
      day: scheduleData.day,
      time: scheduleData.time,
      id: Date.now().toString() // Simple unique ID
    };
    
    setAvailableSchedule([...availableSchedule, newEntry]);
  };

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

  const displayName = vetProfile?.name || user?.user_metadata?.options?.data?.display_name || "Veterinarian";
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
        <View className={`pt-4 pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
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
              <TouchableOpacity onPress={() => setVetProfileEditable(true)}>
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
          
          {/* Vet Profile Details */}
          {vetProfile && (
            <View className="mt-4 px-4">
              <View className="space-y-4">
                {/* Specialty and Location - Side by side */}
                <View className="flex-row justify-between">
                  <View className="w-[48%]">
                    <View className="flex-row items-start">
                      <View className="pt-1">
                        <FontAwesome
                          name="stethoscope"
                          size={16}
                          color={isDark ? "white" : "black"}
                        />
                      </View>
                      <View className="ml-3 flex-1 mb-4">
                        <Text
                          className={`font-inter-semibold text-sm ${
                            isDark ? "text-neutral-300" : "text-neutral-600"
                          }`}
                        >
                          Specialty
                        </Text>
                        <Text
                          className={`font-inter ${
                            isDark ? "text-white" : "text-black"
                          }`}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {medicalSpecialty || "Not specified"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-[48%]">
                    <View className="flex-row items-start">
                      <View className="pt-1">
                        <FontAwesome
                          name="map-marker"
                          size={16}
                          color={isDark ? "white" : "black"}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text
                          className={`font-inter-semibold text-sm ${
                            isDark ? "text-neutral-300" : "text-neutral-600"
                          }`}
                        >
                          Location
                        </Text>
                        <Text
                          className={`font-inter ${
                            isDark ? "text-white" : "text-black"
                          }`}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {clinicLocation || "Not specified"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Contact and Available Hours - Side by side */}
                <View className="flex-row justify-between">
                  <View className="w-[48%]">
                    <View className="flex-row items-start">
                      <View className="pt-1">
                        <FontAwesome
                          name="phone"
                          size={16}
                          color={isDark ? "white" : "black"}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text
                          className={`font-inter-semibold text-sm ${
                            isDark ? "text-neutral-300" : "text-neutral-600"
                          }`}
                        >
                          Contact
                        </Text>
                        <Text
                          className={`font-inter ${
                            isDark ? "text-white" : "text-black"
                          }`}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {contactInfo || "Not specified"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-[48%]">
                    {availableSchedule && availableSchedule.length > 0 && (
                      <View>
                        <View className="flex-row items-center mb-1">
                          <FontAwesome
                            name="calendar"
                            size={16}
                            color={isDark ? "white" : "black"}
                          />
                          <Text
                            className={`font-inter-semibold ml-2 text-sm ${
                              isDark ? "text-neutral-300" : "text-neutral-600"
                            }`}
                          >
                            Available Hours
                          </Text>
                        </View>
                        <View className="space-y-1">
                          {(showFullSchedule ? availableSchedule : availableSchedule.slice(0, 2)).map((schedule, index) => (
                            <View key={schedule.id || index} className="flex-row">
                              <Text
                                className={`font-inter text-xs ${
                                  isDark ? "text-white" : "text-black"
                                }`}
                                numberOfLines={1}
                              >
                                {schedule.day}: {schedule.time}
                              </Text>
                            </View>
                          ))}
                          {availableSchedule.length > 2 && (
                            <TouchableOpacity 
                              onPress={() => setShowFullSchedule(!showFullSchedule)}
                            >
                              <Text
                                className={`font-inter text-xs ${
                                  isDark ? "text-blue-400" : "text-blue-600"
                                }`}
                              >
                                {showFullSchedule ? 'Show less' : `+${availableSchedule.length - 2} more`}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
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
        onTutorialPress={() => {
          setSettingsVisible(false);
          startTutorial('profile');
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
        updating={updatingEmail} // FIXED: Pass specific state
        isDark={isDark}
        emailSent={emailSent}
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
        updating={updatingPassword} // FIXED: Pass specific state
        isDark={isDark}
      />

      {/* Vet Profile Edit Modal Component */}
      <VetProfileEditModal
        visible={vetProfileEditable}
        onClose={() => setVetProfileEditable(false)}
        name={name}
        setName={setName}
        medicalSpecialty={medicalSpecialty}
        setMedicalSpecialty={setMedicalSpecialty}
        clinicLocation={clinicLocation}
        setClinicLocation={setClinicLocation}
        contactInfo={contactInfo}
        setContactInfo={setContactInfo}
        availableSchedule={availableSchedule}
        setAvailableSchedule={setAvailableSchedule}
        editSchedule={editSchedule}
        updateVetProfile={updateVetProfile}
        updating={updatingEmail} // Consider creating separate updatingProfile state
        isDark={isDark}
      />
      <TutorialOverlay steps={profileTutorialSteps} tutorialId="profile" />
    </SafeAreaView>
  );
};

export default ProfileScreen;