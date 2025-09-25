import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import VetProfileViewer from '../../components/VetProfileViewer';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function VetProfileScreen() {
  const { vetId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [vetProfile, setVetProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vetId) {
      fetchVetProfile();
    }
  }, [vetId]);

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

      // Fetch user metadata
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('display_name, avatar_url, created_at')
        .eq('id', vetId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        Alert.alert('Error', 'Could not load user information.');
        return;
      }

      // Combine the data
      const combinedData = {
        ...vetProfileData,
        ...userData,
        id: vetId
      };
      
      setVetProfile(combinedData);
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

  const handleSendMessage = () => {
    // Navigate to a chat screen with this veterinarian
    router.push(`/(user)/chat/${vetId}`);
  };

  if (loading) {
    return (
      <VetProfileViewer
        vetProfileData={null}
        isDark={isDark}
        onGoBack={handleGoBack}
        onSendMessage={handleSendMessage}
      />
    );
  }

  return (
    <VetProfileViewer
      vetProfileData={vetProfile}
      isDark={isDark}
      onGoBack={handleGoBack}
      onSendMessage={handleSendMessage}
    />
  );
}