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

const UsersListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(petOwner => {
        const userName = petOwner.name?.toLowerCase() || '';
        const userEmail = petOwner.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return userName.includes(query) || userEmail.includes(query);
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const loadUsers = async () => {
    try {
      console.log('Loading pet owners...');
      console.log('Current vet user ID:', user.id);
      
      // Query user_profiles - pet owners should be visible to vets
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, name, profile_image_url, created_at');

      console.log('Query response:', { 
        data: usersData, 
        error: usersError,
        dataLength: usersData?.length 
      });

      if (usersError) {
        console.error('Error loading user_profiles:', usersError);
        console.error('Error code:', usersError.code);
        console.error('Error message:', usersError.message);
        console.error('Error hint:', usersError.hint);
        console.error('Error details:', usersError.details);
        
        // Show specific error to help debug RLS issues
        Alert.alert(
          'Database Error', 
          `Could not load pet owners. This might be due to Row Level Security policies.\n\nError: ${usersError.message}`
        );
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      if (!usersData || usersData.length === 0) {
        console.log('No user profiles found in database');
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      console.log(`Found ${usersData.length} total user profiles`);
      console.log('Sample user:', usersData[0]);

      // Format the data for display
      const formattedUsers = usersData
        .map(petOwner => ({
          id: petOwner.id,
          name: petOwner.name || 'Pet Owner',
          email: '',
          profile_image_url: petOwner.profile_image_url
        }))
        .filter(petOwner => petOwner.id !== user.id)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      console.log(`After filtering out current user: ${formattedUsers.length} pet owners available`);
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Unexpected error loading users:', error);
      Alert.alert('Error', 'Could not load pet owners. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (selectedUser) => {
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', selectedUser.id)
        .eq('vet_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingConversation) {
        // Navigate to existing conversation
        router.push(`/(vet)/chat/${selectedUser.id}?userName=${encodeURIComponent(selectedUser.name)}`);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: selectedUser.id,
            vet_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Navigate to new conversation
        router.push(`/(vet)/chat/${selectedUser.id}?userName=${encodeURIComponent(selectedUser.name)}`);
      }
    } catch (error) {
      console.error('Error selecting user:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PO';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectUser(item)}
      className="flex-row items-center px-4 py-4 bg-white dark:bg-neutral-900 mb-2 mx-4 rounded-2xl active:opacity-80"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Avatar */}
      {item.profile_image_url ? (
        <Image
          source={{ uri: item.profile_image_url }}
          className="w-14 h-14 rounded-full mr-3"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-neutral-800 dark:bg-neutral-200 justify-center items-center mr-3">
          <Text className="text-white dark:text-black font-inter-bold text-base">
            {getInitials(item.name)}
          </Text>
        </View>
      )}

      {/* User Info */}
      <View className="flex-1">
        <Text className="text-lg font-inter-bold text-black dark:text-white mb-1">
          {item.name}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 font-inter-medium">
          Pet Owner • Available for chat
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
            Choose Pet Owner
          </Text>
          
          <View className="w-10" />
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-900 rounded-full px-4 py-3">
          <FontAwesome name="search" size={16} color={isDark ? "#8E8E93" : "#6C757D"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search pet owners..."
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
            Finding pet owners
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait a moment...
          </Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 justify-center items-center mb-6">
            <FontAwesome name="users" size={32} color={isDark ? "#8E8E93" : "#6C757D"} />
          </View>
          <Text className="text-xl font-inter-bold text-black dark:text-white mb-2 text-center">
            {searchQuery ? "No results found" : "No pet owners available"}
          </Text>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center leading-6">
            {searchQuery 
              ? "Try searching with a different term or check the spelling"
              : "We're working to connect more pet owners to our platform"
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
            {filteredUsers.length} pet owner{filteredUsers.length !== 1 ? 's' : ''} available
          </Text>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUser}
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

export default UsersListScreen;
