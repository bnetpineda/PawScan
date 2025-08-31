import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

const VetsListScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVets();
  }, []);

  const loadVets = async () => {
    try {
      // Get all users with the role of "Veterinarian" from the user metadata
      // We'll use a different approach that doesn't require direct access to auth.users
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, role')
        .eq('role', 'Veterinarian')
        .order('display_name');

      if (error) {
        // Fallback: try to get from a different source
        console.warn('Error loading vets from user_profiles:', error);
        throw error;
      }

      // Format the data for display
      const formattedVets = users.map(vet => ({
        id: vet.id,
        name: vet.display_name || 'Veterinarian',
        email: vet.email || 'No email provided'
      }));

      setVets(formattedVets);
    } catch (error) {
      console.error('Error loading vets:', error);
      // Show a friendly message to the user
      Alert.alert(
        'Information', 
        'Unable to load veterinarians at the moment. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderVet = ({ item }) => (
    <TouchableOpacity
      style={styles.vetItem}
      onPress={() => router.push(`/(user)/chat/${item.id}?vetName=${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.vetHeader}>
        <Text style={styles.vetName}>{item.name}</Text>
      </View>
      <Text style={styles.vetEmail}>{item.email}</Text>
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
          <Text style={styles.emptyText}>No veterinarians available at the moment</Text>
        </View>
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVet}
          style={styles.vetsList}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  vetsList: {
    flex: 1,
  },
  vetItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  vetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vetEmail: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default VetsListScreen;