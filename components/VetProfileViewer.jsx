import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const VetProfileViewer = ({ 
  vetProfileData,
  isDark,
  onGoBack,
  onSendMessage,
  userPosts = [],
  userHistory = [],
  petScanCount = 0
}) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showingHistory, setShowingHistory] = useState(false);

  const {
    name,
    medical_specialty,
    clinic_location,
    contact_info,
    available_schedule,
    avatar_url,
    display_name,
    created_at
  } = vetProfileData || {};

  // Get initials for default avatar
  const getInitials = (name) => {
    if (!name) return "V"; // Default to 'V' for Veterinarian
    return name
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

  // Simplified grid rendering function
  const renderGridContent = () => {
    const items = showingHistory ? userHistory : userPosts;
    
    // Show actual items
    if (items.length > 0) {
      return items.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          className="w-1/3 aspect-square p-1"
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
              ? "This veterinarian has no scan history" 
              : "This veterinarian has no posts"}
          </Text>
        </View>
      );
    }
  };

  return (
    <>
      <ScrollView 
        className={`flex-1 ${isDark ? "bg-black" : "bg-white"} pt-4`}
      >
        {/* Profile Header - Instagram Style */}
        <View className={`pt-12 pb-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <View className="flex-row justify-between items-center px-4 mb-8">
            <Image
              source={require("../assets/images/home-logo.png")}
              className="w-8 h-9"
              resizeMode="cover"
            />
            <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
              PawScan
            </Text>
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
              {onSendMessage && (
                <TouchableOpacity onPress={onSendMessage}>
                  <FontAwesome
                    name="comment"
                    size={24}
                    color={isDark ? "white" : "black"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Profile Info - Instagram Style */}
          <View className="flex-row px-4 pb-4 items-center">
            {/* Profile Image */}
            <View className="mr-6">
              {avatar_url ? (
                <Image
                  source={{ uri: avatar_url }}
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
                    {getInitials(display_name)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats - Updated for Pet Owners */}
            <View className="flex-row flex-1 justify-around">
              <View className="items-center">
                <Text
                  className={`text-lg font-inter-bold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  {vetProfileData?.post_count || userPosts?.length || 0}
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

      {/* Message Button */}
      {onSendMessage && (
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={onSendMessage}
            className={`py-4 rounded-xl justify-center items-center ${
              isDark ? "bg-blue-600" : "bg-blue-500"
            }`}
          >
            <Text className="text-white text-center font-inter-semibold text-lg">
              Message Veterinarian
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default VetProfileViewer;