import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

const VetProfileViewer = ({ 
  vetProfileData,
  userPosts = [],
  petScanCount = 0,
  postsLoading = false,
  isDark,
  onGoBack,
  onSendMessage,
  isViewingAsUser = false
}) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!vetProfileData && !postsLoading) {
    return (
      <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"} items-center justify-center`}>
        <Text className={`text-lg font-inter ${isDark ? "text-white" : "text-black"}`}>
          Profile not found
        </Text>
      </View>
    );
  }

  const {
    name,
    medical_specialty,
    clinic_location,
    contact_info,
    available_schedule,
    profile_image_url,
    display_name,
    created_at,
    email
  } = vetProfileData || {};

  // Determine profile image
  const profileImage = profile_image_url;

  // Get initials for default avatar
  const getInitials = (name) => {
    const displayNameToUse = display_name || name;
    if (!displayNameToUse) return "V";
    return displayNameToUse
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Grid rendering function for posts
  const renderGridContent = () => {
    if (postsLoading) {
      // Show loading placeholders
      return Array(6).fill(0).map((_, index) => (
        <View 
          key={index} 
          className={`w-1/3 aspect-square p-1`}
        >
          <View className={`w-full h-full rounded ${isDark ? "bg-neutral-800" : "bg-neutral-200"}`} />
        </View>
      ));
    }

    if (userPosts.length > 0) {
      return userPosts.map((post, index) => (
        <TouchableOpacity 
          key={post.id || index} 
          className="w-1/3 aspect-square p-1"
          onPress={() => setSelectedImage(post.url)}
        >
          <Image
            source={{ uri: post.url }}
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
            name="table" 
            size={48} 
            color={isDark ? "#6B7280" : "#9CA3AF"} 
          />
          <Text className={`mt-4 text-lg font-inter ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
            No posts yet
          </Text>
          <Text className={`mt-2 text-base font-inter ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
            This veterinarian hasn't shared any posts
          </Text>
        </View>
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // You could add refresh logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <>
      <ScrollView 
        className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header - Instagram Style */}
        <View className={`pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <View className="flex-row justify-between items-center px-4 mb-8 pt-4">
            <Image
              source={isDark 
                ? require("../assets/images/home-logo-darkmode.png") 
                : require("../assets/images/home-logo-whitemode.png")
              }
              className="w-8 h-9"
              resizeMode="cover"
            />
            <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
              PawScan
            </Text>
            <View className="flex-row">
              <View className="flex-row">
              {onGoBack && (
                <TouchableOpacity 
                  className="mr-4"
                  onPress={onGoBack}
                >
                  <FontAwesome
                    name="arrow-left"
                    size={24}
                    color={isDark ? "white" : "black"}
                  />
                </TouchableOpacity>
              )}
              {isViewingAsUser && onSendMessage && (
                <TouchableOpacity 
                  className="mr-4"
                  onPress={onSendMessage}
                >
                  <FontAwesome
                    name="comment"
                    size={24}
                    color={isDark ? "white" : "black"}
                  />
                </TouchableOpacity>
              )}
              </View>
            </View>
          </View>

          {/* Profile Info - Instagram Style */}
          <View className="flex-row px-4 pb-4 items-center">
            {/* Profile Image */}
            <View className="mr-6">
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
                    {getInitials(display_name || name)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View className="flex-row flex-1 justify-around">
              <View className="items-center">
                <Text
                  className={`text-lg font-inter-bold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  {userPosts?.length || 0}
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
              {display_name || name}
            </Text>
            <Text
              className={`font-inter ${
                isDark ? "text-neutral-300" : "text-neutral-600"
              }`}
            >
              {medical_specialty ? `${medical_specialty} | Pet Health Expert` : "Pet Health Expert"}
            </Text>
            <Text
              className={`mt-1 font-inter ${
                isDark ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Member since {formatDate(created_at)}
            </Text>
          </View>
          
          {/* Vet Profile Details */}
          {vetProfileData && (
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
                          {medical_specialty || "Not specified"}
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
                          {clinic_location || "Not specified"}
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
                          {contact_info || "Not specified"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-[48%]">
                    {available_schedule && available_schedule.length > 0 && (
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
                          {(showFullSchedule ? available_schedule : available_schedule.slice(0, 2)).map((schedule, index) => (
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
                          {available_schedule.length > 2 && (
                            <TouchableOpacity 
                              onPress={() => setShowFullSchedule(!showFullSchedule)}
                            >
                              <Text
                                className={`font-inter text-xs ${
                                  isDark ? "text-blue-400" : "text-blue-600"
                                }`}
                              >
                                {showFullSchedule ? 'Show less' : `+${available_schedule.length - 2} more`}
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

        {/* Posts Grid - Instagram Style (No History Tab for Users) */}
        <View className="mt-2">
          <View className="flex-row border-t border-b border-neutral-300 dark:border-neutral-700">
            <View className="flex-1 items-center py-3">
              <FontAwesome
                name="table"
                size={24}
                color={isDark ? "#3B82F6" : "#3B82F6"}
              />
            </View>
          </View>

          {/* Posts Grid */}
          <View className="flex-row flex-wrap w-full">
            {renderGridContent()}
          </View>
        </View>
      </ScrollView>

      {/* Simple Image Viewer Modal (inline) */}
      {selectedImage && (
        <View className="absolute inset-0 bg-black bg-opacity-90 items-center justify-center z-50">
          <TouchableOpacity 
            className="absolute top-12 right-4 z-10"
            onPress={() => setSelectedImage(null)}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
      )}
    </>
  );
};

export default VetProfileViewer;