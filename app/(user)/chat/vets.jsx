import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  RefreshControl, 
  useColorScheme, 
  StatusBar, 
  TextInput,
  Image
} from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "V";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const renderVet = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mx-4 mb-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800"
      onPress={() => router.push(`/(user)/chat/${item.id}?vetName=${encodeURIComponent(item.name)}`)}
      activeOpacity={0.7}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Profile Image */}
      <TouchableOpacity
        className="mr-4"
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/(user)/vet-profile?vetId=${item.id}`);
        }}
      >
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            className="w-14 h-14 rounded-full"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
            <Text className="text-white dark:text-black text-lg font-inter-bold">
              {getInitials(item.name)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Vet Info */}
      <View className="flex-1">
        <Text className="text-lg font-inter-bold text-black dark:text-white mb-1">
          {item.name}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 font-inter-medium">
          Veterinarian • Available for chat
        </Text>
      </View>

      {/* Chat Icon */}
      <View className="w-10 h-10 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center">
        <FontAwesome name="comment" size={16} color={isDark ? "#000" : "#fff"} />
      </View>
    </TouchableOpacity>
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#FAFAFA"}
      />
      
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-black">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 justify-center items-center"
          >
            <FontAwesome name="arrow-left" size={18} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          
          <Text className="text-xl font-inter-bold text-black dark:text-white">
            Choose Veterinarian
          </Text>
          
          <View className="w-10" />
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-900 rounded-full px-4 py-3">
          <FontAwesome name="search" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search veterinarians..."
            placeholderTextColor={isDark ? "#8E8E93" : "#6C757D"}
            className="flex-1 ml-3 text-base font-inter text-black dark:text-white"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="p-1">
              <FontAwesome name="times-circle" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center mb-4">
            <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
          </View>
          <Text className="text-lg font-inter-semibold text-black dark:text-white mb-1">
            Finding veterinarians
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait a moment...
          </Text>
        </View>
      ) : filteredVets.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-6">
            <FontAwesome name="user-md" size={32} color={isDark ? "#8E8E93" : "#6C757D"} />
          </View>
          <Text className="text-xl font-inter-bold text-black dark:text-white mb-2 text-center">
            {searchQuery ? "No results found" : "No veterinarians available"}
          </Text>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center leading-6">
            {searchQuery 
              ? "Try searching with a different term or check the spelling"
              : "We're working to connect more veterinarians to our platform"
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              onPress={clearSearch}
              className="mt-6 bg-neutral-800 dark:bg-neutral-200 px-6 py-3 rounded-full"
            >
              <Text className="text-white dark:text-black font-inter-semibold">Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="flex-1 pt-4">
          <Text className="px-4 pb-2 text-sm font-inter-medium text-neutral-500 dark:text-neutral-400">
            {filteredVets.length} veterinarian{filteredVets.length !== 1 ? 's' : ''} available
          </Text>
          <FlatList
            data={filteredVets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVet}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={isDark ? "#fff" : "#000"}
                colors={["#525252"]}
                progressBackgroundColor={isDark ? "#1F2937" : "#FFFFFF"}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default VetsListScreen;