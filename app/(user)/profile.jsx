import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ScrollView, useColorScheme, View, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useTutorial } from "../../providers/TutorialProvider";
import SettingsModal from "../../components/profile/SettingsModal";
import ChangeEmailModal from "../../components/profile/ChangeEmailModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import ImageViewerModal from "../../components/profile/ImageViewerModal";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileStats from "../../components/profile/ProfileStats";
import ProfileBio from "../../components/profile/ProfileBio";
import ProfileTabs from "../../components/profile/ProfileTabs";
import ProfileGrid from "../../components/profile/ProfileGrid";
import ErrorBoundary from "../../components/ErrorBoundary";
import useProfileData from "../../hooks/useProfileData";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useProfileUpdate } from "../../hooks/useProfileUpdate";
import { getThemeColors } from "../../utils/themeColors";
import { toast } from "../../utils/toast";
import TutorialOverlay from "../../components/tutorial/TutorialOverlay";
import { profileTutorialSteps } from "../../components/tutorial/tutorialSteps";

const ProfileScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  const { user } = useAuth();
  const { startTutorial } = useTutorial();
  
  // Custom hooks
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile(user?.id);
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
  const { pickImage, uploadImage, uploading, progress } = useImageUpload();
  const {
    updateProfile,
    updateEmail,
    updatePassword,
    updateProfileImage,
    updating,
  } = useProfileUpdate(user?.id);

  // Modal states
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  
  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [showingHistory, setShowingHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Computed values
  const profileImage = useMemo(() => {
    return profile?.profile_image_url || 
           user?.user_metadata?.avatar_url || 
           user?.user_metadata?.options?.data?.avatar_url || 
           null;
  }, [profile?.profile_image_url, user]);

  const displayName = useMemo(() => {
    return profile?.name || 
           user?.user_metadata?.options?.data?.display_name || 
           user?.email?.split("@")[0] || 
           "Pet Owner";
  }, [profile?.name, user]);

  const role = useMemo(() => {
    return user?.user_metadata?.role || "Pet Owner";
  }, [user]);

  // Initialize data
  useEffect(() => {
    if (user) {
      setNewEmail(user.email || "");
      fetchUserPosts();
      fetchPetScanCount();
      fetchHistoryImages();
    }
  }, [user?.id]);

  // Image handling
  const handlePickProfileImage = useCallback(async () => {
    try {
      const uri = await pickImage();
      if (!uri || !user?.id) return;

      const publicUrl = await uploadImage(uri, user.id, "profile-images");
      await updateProfileImage(publicUrl);
      await refreshProfile();
      
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast.error(error.message || "Failed to update profile picture");
    }
  }, [user?.id, pickImage, uploadImage, updateProfileImage, refreshProfile]);

  const handleImagePress = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  }, []);

  // Profile update handlers
  const handleUpdateProfile = useCallback(async (updates) => {
    try {
      await updateProfile(updates);
      await refreshProfile();
      setEditProfileVisible(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    }
  }, [updateProfile, refreshProfile]);

  const handleChangeEmail = useCallback(async () => {
    try {
      if (!newEmail || newEmail === user?.email) {
        toast.warning("Please enter a new email address");
        return;
      }

      await updateEmail(newEmail);
      setEmailSent(true);
      toast.success("Confirmation email sent! Please check your inbox and click the confirmation link.");
      
      // Close modal after 2 seconds to let user see the success message
      setTimeout(() => {
        setChangeEmailVisible(false);
        resetForms();
      }, 2000);
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error(error.message || "Failed to change email");
    }
  }, [newEmail, user?.email, updateEmail, resetForms]);

  const handleChangePassword = useCallback(async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.warning("Please fill in all fields");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      await updatePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      
      // Close modal after 2 seconds to let user see the success message
      setTimeout(() => {
        setChangePasswordVisible(false);
        resetForms();
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    }
  }, [currentPassword, newPassword, confirmPassword, updatePassword, resetForms]);

  const handleSignOut = useCallback(async () => {
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
            toast.error(error.message);
          }
        },
      },
    ]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshAllData(), refreshProfile()]);
    setRefreshing(false);
  }, [refreshAllData, refreshProfile]);

  const resetForms = useCallback(() => {
    setNewEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEmailSent(false);
  }, [user]);

  const renderGridContent = useMemo(() => {
    const items = showingHistory ? historyImages : userPosts;
    const isLoading = showingHistory ? historyLoading : postsLoading;
    const emptyMessage = showingHistory 
      ? "No scan history yet" 
      : "No posts yet";

    return (
      <ProfileGrid
        items={items}
        loading={isLoading}
        onImagePress={handleImagePress}
        emptyMessage={emptyMessage}
        isDark={isDark}
      />
    );
  }, [showingHistory, historyImages, userPosts, historyLoading, postsLoading, isDark, handleImagePress]);

  if (profileLoading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${colors.background}`}>
        <View />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary onReset={() => refreshProfile()}>
      <SafeAreaView className={`flex-1 ${colors.background}`} edges={['top']}>
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#fff" : "#000"}
            />
          }
        >
          {/* Profile Header */}
          <ProfileHeader
            profileImage={profileImage}
            onImagePress={handlePickProfileImage}
            onEditPress={() => setEditProfileVisible(true)}
            onSettingsPress={() => setSettingsVisible(true)}
            uploading={uploading}
            uploadProgress={progress}
            isDark={isDark}
          />

          {/* Stats */}
          <ProfileStats
            postsCount={userPosts?.length || 0}
            petScanCount={petScanCount || 0}
            isDark={isDark}
          />

          {/* Bio */}
          <ProfileBio
            displayName={displayName}
            role={role}
            createdAt={user?.created_at}
            bio={profile?.bio}
            location={profile?.location}
            isDark={isDark}
          />

          {/* Tabs */}
          <View className="mt-2">
            <ProfileTabs
              showingHistory={showingHistory}
              onTabChange={setShowingHistory}
              isDark={isDark}
            />

            {/* Grid */}
            {renderGridContent}
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
          profile={profile}
          onSave={handleUpdateProfile}
          updating={updating}
          isDark={isDark}
        />

        {/* Settings Modal */}
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

        {/* Change Email Modal */}
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
          emailSent={emailSent}
        />

        {/* Change Password Modal */}
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
      <TutorialOverlay steps={profileTutorialSteps} tutorialId="profile" />
    </ErrorBoundary>
  );
};

export default ProfileScreen;
