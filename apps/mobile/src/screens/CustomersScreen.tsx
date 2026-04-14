import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Searchbar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api, Customer } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Screen for searching and updating customers.

export function CustomersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Customer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setItems(await api.listCustomers(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text variant="titleMedium">Customers</Text>
        <Text style={styles.mutedText}>Search or create customer records.</Text>
      </View>

      <View style={styles.card}>
        <Searchbar value={query} onChangeText={setQuery} placeholder="Search customers" />
        <Button mode="contained" onPress={load} loading={busy} disabled={busy}>
          Search
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('CustomerEdit')} disabled={busy}>
          New Customer
        </Button>
        <HelperText type="error" visible={!!error}>
          {error ?? ''}
        </HelperText>
      </View>

      {items.map((c) => (
        <Card key={c.id} onPress={() => navigation.navigate('CustomerEdit', { customerId: c.id })} style={styles.listCard}>
          <Card.Title title={c.name || c.id} subtitle={c.address || 'No address'} />
        </Card>
      ))}

      {items.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>No customers yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    padding: 12,
    gap: 10,
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
  },
  mutedText: {
    color: '#8B949E',
  },
});
