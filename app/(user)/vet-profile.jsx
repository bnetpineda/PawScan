import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import useProfileData from '../../hooks/useProfileData';
import ImageViewerModal from "../../components/profile/ImageViewerModal";

export default function VetProfileScreen() {
  const { vetId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [vetProfile, setVetProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vetUser, setVetUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [name, setName] = useState("");
  const [medicalSpecialty, setMedicalSpecialty] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [availableSchedule, setAvailableSchedule] = useState([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const {
    userPosts,
    petScanCount,
    postsLoading,
    fetchUserPosts,
    fetchPetScanCount,
    refreshAllData
  } = useProfileData(vetUser);

  useEffect(() => {
    if (vetId) {
      fetchVetProfile();
    }
  }, [vetId]);

  useEffect(() => {
    if (vetUser) {
      fetchUserPosts();
      fetchPetScanCount();
    }
  }, [vetUser]);

  const fetchVetProfile = async () => {
    try {
      setLoading(true);
      
      const { data: vetProfileData, error: profileError } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('id', vetId)
        .single();

      if (profileError) {
        console.error('Error fetching vet profile:', profileError);
        Alert.alert('Error', 'Could not load veterinarian profile.');
        return;
      }

      let displayName = vetProfileData.name;
      
      try {
        const { data: postData, error: postError } = await supabase
          .from('newsfeed_posts')
          .select('display_name')
          .eq('user_id', vetId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!postError && postData && postData.display_name) {
          displayName = postData.display_name;
        }
      } catch (error) {
        console.log('Could not get display name from posts, using vet profile name');
      }

      const combinedData = {
        ...vetProfileData,
        display_name: displayName,
        created_at: vetProfileData.created_at,
        id: vetId
      };
      
      setVetProfile(combinedData);
      setName(vetProfileData.name || '');
      setMedicalSpecialty(vetProfileData.medical_specialty || '');
      setClinicLocation(vetProfileData.clinic_location || '');
      setContactInfo(vetProfileData.contact_info || '');
      setAvailableSchedule(vetProfileData.available_schedule || []);
      setProfileImage(vetProfileData.profile_image_url);
      
      setVetUser({ 
        id: vetId, 
        display_name: displayName,
      });
      
    } catch (error) {
      console.error('Error in fetchVetProfile:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVetProfile();
    if (vetUser) {
      await refreshAllData();
    }
    setRefreshing(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleMessagePress = () => {
    router.push(`/chat/${vetId}?vetName=${encodeURIComponent(vetProfile?.display_name || vetProfile?.name || 'Veterinarian')}`);
  };

  const getInitials = (name) => {
    if (!name) return "V";
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

  const renderGridContent = () => {
    if (postsLoading) {
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

    if (userPosts.length > 0) {
      return userPosts.map((item) => (
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
            Share posts to see them here
          </Text>
        </View>
      );
    }
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

  const displayName = vetProfile?.name || "Veterinarian";
  const role = "Veterinarian";

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
            <TouchableOpacity onPress={handleGoBack}>
              <FontAwesome name="arrow-left" size={24} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
            <Text className="text-2xl font-inter-bold text-black dark:text-white ml-2">
              {name || 'Veterinarian'}
            </Text>
            <View style={{ width: 24 }} />
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
                    {getInitials(displayName)}
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
              Member since {formatDate(vetProfile?.created_at)}
            </Text>
          </View>

          {/* Message Button */}
          <View className="px-4 mt-4">
            <TouchableOpacity
              className="w-full bg-blue-500 py-2 rounded-lg items-center"
              onPress={handleMessagePress}
            >
              <Text className="text-white font-inter-semibold">Message</Text>
            </TouchableOpacity>
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
            <View className="flex-1 items-center py-3">
              <FontAwesome
                name="table"
                size={24}
                color="#3B82F6"
              />
            </View>
          </View>

          {/* Posts Grid */}
          <View className="flex-row flex-wrap w-full">
            {renderGridContent()}
          </View>
        </View>
      </ScrollView>

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={selectedImage}
        onClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
}