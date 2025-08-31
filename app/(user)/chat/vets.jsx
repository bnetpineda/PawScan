import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VetsListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVets();
    setRefreshing(false);
  };

  const loadVets = async () => {
    try {
      // Get all veterinarians from the secure view
      const { data: vetsData, error: vetsError } = await supabase
        .from('veterinarians')
        .select('id, raw_user_meta_data, email')
        .order('raw_user_meta_data->options->data->display_name', { ascending: true });

      if (vetsError) {
        console.error('Error loading vets:', vetsError);
        // Fallback: try to get from conversations
        await loadVetsFromConversations();
        return;
      }

      // Format the data for display
      const formattedVets = vetsData
        .map(vet => ({
          id: vet.id,
          name: vet.raw_user_meta_data?.options?.data?.display_name || 'Veterinarian',
          email: vet.email || 'No email provided'
        }))
        .filter(vet => vet.id !== user.id); // Exclude current user if they're also a vet

      setVets(formattedVets);
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
        return;
      }

      // Get vet details for each ID
      const vetsWithDetails = [];
      for (const vetId of vetIds) {
        const { data: vetData, error: vetError } = await supabase
          .from('veterinarians')
          .select('id, raw_user_meta_data, email')
          .eq('id', vetId)
          .single();

        if (!vetError && vetData) {
          vetsWithDetails.push({
            id: vetData.id,
            name: vetData.raw_user_meta_data?.options?.data?.display_name || 'Veterinarian',
            email: vetData.email || 'No email provided'
          });
        }
      }

      setVets(vetsWithDetails);
    } catch (error) {
      console.error('Error loading vets from conversations:', error);
      setVets([]);
    }
  };

  const renderVet = ({ item }) => (
    <TouchableOpacity
      style={styles.vetItem}
      onPress={() => router.push(`/(user)/chat/${item.id}?vetName=${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.vetInfo}>
        <Text style={styles.vetName}>{item.name}</Text>
        <Text style={styles.vetEmail}>{item.email}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select a Veterinarian</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading veterinarians...</Text>
        </View>
      ) : vets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#007AFF" />
          <Text style={styles.emptyTitle}>No veterinarians available</Text>
          <Text style={styles.emptyText}>Please check back later</Text>
        </View>
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVet}
          style={styles.vetsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  vetsList: {
    flex: 1,
  },
  vetItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vetEmail: {
    fontSize: 15,
    color: '#666',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default VetsListScreen;