import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, useColorScheme, StatusBar, TextInput } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const VetsListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [vets, setVets] = useState([]);
  const [filteredVets, setFilteredVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    loadVets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVets(vets);
    } else {
      const filtered = vets.filter(vet => {
        const vetName = vet.name?.toLowerCase() || '';
        const vetEmail = vet.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return vetName.includes(query) || vetEmail.includes(query);
      });
      setFilteredVets(filtered);
    }
  }, [searchQuery, vets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVets();
    setRefreshing(false);
  };

  const loadVets = async () => {
    try {
      // Get all veterinarians from the vet_profiles table
      const { data: vetsData, error: vetsError } = await supabase
        .from('vet_profiles')
        .select('id, name, profile_image_url')
        .order('name', { ascending: true });

      if (vetsError) {
        console.error('Error loading vets from vet_profiles:', vetsError);
        // If vet_profiles is not accessible, there are no veterinarians to show
        setVets([]);
        setFilteredVets([]);
        return;
      }

      // Format the data for display
      const formattedVets = vetsData
        .map(vet => ({
          id: vet.id,
          name: vet.name || 'Veterinarian',
          email: '', // Vet profiles may not store email directly
          profile_image_url: vet.profile_image_url
        }))
        .filter(vet => vet.id !== user.id); // Exclude current user if they're also a vet

      setVets(formattedVets);
      setFilteredVets(formattedVets);
    } catch (error) {
      console.error('Error loading vets:', error);
      Alert.alert('Error', 'Could not load veterinarians. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadVetsFromConversations = async () => {
    try {
      // Fallback method: get vets from existing conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('vet_id')
        .eq('user_id', user.id);

      if (conversationsError) throw conversationsError;

      // Get unique vet IDs
      const vetIds = [...new Set(conversationsData.map(conv => conv.vet_id))];

      if (vetIds.length === 0) {
        setVets([]);
        setFilteredVets([]);
        return;
      }

      // Get vet details for each ID
      const vetsWithDetails = [];
      for (const vetId of vetIds) {
        let { data: vetData, error: vetError } = await supabase
          .from('vet_profiles')
          .select('id, name, profile_image_url')
          .eq('id', vetId)
          .single();

        if (vetError) {
          console.error("Error fetching from vet_profiles:", vetError);
          // Skip to the next iteration - no fallback to views
          continue;
        }

        if (!vetError && vetData) {
          vetsWithDetails.push({
            id: vetData.id,
            name: vetData.name || 'Veterinarian',
            email: '', // Vet profiles may not store email directly
            profile_image_url: vetData.profile_image_url
          });
        }
      }

      setVets(vetsWithDetails);
      setFilteredVets(vetsWithDetails);
    } catch (error) {
      console.error('Error loading vets from conversations:', error);
      setVets([]);
      setFilteredVets([]);
    }
  };

  const renderVet = ({ item }) => (
    <TouchableOpacity
      className="flex-row p-4 bg-white border-b border-black dark:bg-neutral-900 dark:border-neutral-700"
      onPress={() => router.push(`/(user)/chat/${item.id}?vetName=${encodeURIComponent(item.name)}`)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        className="mr-4"
        onPress={(e) => {
          e.stopPropagation(); // Prevent the chat navigation
          router.push(`/(user)/vet-profile?vetId=${item.id}`);
        }}
      >
        <View className="w-12 h-12 rounded-full bg-black dark:bg-white justify-center items-center">
          <Text className="text-white dark:text-black text-xl font-inter-bold">{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
      <View className="flex-1 justify-center">
        <TouchableOpacity
          onPress={() => router.push(`/(user)/vet-profile?vetId=${item.id}`)}
        >
          <Text className="text-base font-inter-bold mb-1 text-black dark:text-white">{item.name}</Text>
        </TouchableOpacity>
        <Text className="text-sm text-neutral-600 dark:text-neutral-300">{item.email}</Text>
      </View>
      <View className="ml-2 justify-center">
        <FontAwesome name="chevron-right" size={20} color={isDark ? "#fff" : "#000"} />
      </View>
    </TouchableOpacity>
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <View className="px-5 py-4 border-b border-black dark:border-neutral-700">
        <Text className="text-2xl font-inter-bold text-black dark:text-white mb-3">Select a Veterinarian</Text>
        {/* Search Input */}
        <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-full mt-2 px-6 py-1">
          <FontAwesome name="search" size={20} color={isDark ? "#8E8E93" : "#6C757D"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search veterinarians..."
            placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
            className="flex-1 ml-2 text-base font-inter bg-transparent text-black dark:text-white"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <FontAwesome name="times-circle" size={20} color={isDark ? "#8E8E93" : "#6C757D"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {loading ? (
        <View className="flex-1 justify-center items-center p-8">
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text className="mt-4 text-base text-neutral-600 dark:text-neutral-300">Loading veterinarians...</Text>
        </View>
      ) : filteredVets.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <FontAwesome name="user-md" size={64} color={isDark ? "#fff" : "#000"} />
          <Text className="text-2xl font-inter-bold mt-4 mb-2 text-black dark:text-white">
            {searchQuery ? "No veterinarians found" : "No veterinarians available"}
          </Text>
          <Text className="text-base text-neutral-600 dark:text-neutral-300">
            {searchQuery ? "Try a different search term" : "Please check back later"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVet}
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default VetsListScreen;