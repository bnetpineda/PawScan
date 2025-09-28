import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import VetProfileViewer from '../../components/VetProfileViewer';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useProfileData from '../../hooks/useProfileData';

export default function VetProfileScreen() {
  const { vetId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [vetProfile, setVetProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vetUser, setVetUser] = useState(null);

  // Create a mock user object for the vet to use with useProfileData
  const {
    userPosts,
    petScanCount,
    postsLoading,
    fetchUserPosts,
    fetchPetScanCount,
  } = useProfileData(vetUser);

  useEffect(() => {
    if (vetId) {
      fetchVetProfile();
    }
  }, [vetId]);

  // Fetch vet posts when vetUser is set
  useEffect(() => {
    if (vetUser) {
      fetchUserPosts();
      fetchPetScanCount();
    }
  }, [vetUser]);

  const fetchVetProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch veterinarian profile
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

      // Try to get display name from a recent newsfeed post
      let displayName = vetProfileData.name; // fallback to vet profile name
      
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

      // Combine the data
      const combinedData = {
        ...vetProfileData,
        display_name: displayName,
        created_at: vetProfileData.created_at,
        id: vetId
      };
      
      setVetProfile(combinedData);
      
      // Set the vet user object for useProfileData hook
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

  const handleGoBack = () => {
    router.back();
  };

  if (loading || postsLoading) {
    return (
      <VetProfileViewer
        vetProfileData={null}
        userPosts={[]}
        petScanCount={0}
        postsLoading={true}
        isDark={isDark}
        onGoBack={handleGoBack}
        isViewingAsUser={true}
      />
    );
  }

  // Handler for sending a message to the vet
  const handleMessagePress = () => {
    router.push(`/chat/${vetId}?vetName=${encodeURIComponent(vetProfile?.display_name || vetProfile?.name || 'Veterinarian')}`);
  };

  return (
    <VetProfileViewer
      vetProfileData={vetProfile}
      userPosts={userPosts}
      petScanCount={petScanCount}
      postsLoading={postsLoading}
      isDark={isDark}
      onGoBack={handleGoBack}
      onSendMessage={handleMessagePress}
      isViewingAsUser={true}
    />
  );
}