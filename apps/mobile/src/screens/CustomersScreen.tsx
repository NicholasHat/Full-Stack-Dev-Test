import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Searchbar value={query} onChangeText={setQuery} placeholder="Search customers" />
      <Button mode="contained" onPress={load}>
        Search
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('CustomerEdit')}>
        New Customer
      </Button>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
      {items.map((c) => (
        <Card key={c.id} onPress={() => navigation.navigate('CustomerEdit', { customerId: c.id })}>
          <Card.Title title={c.name || c.id} subtitle={c.address} />
        </Card>
      ))}
      {items.length === 0 && (
        <View>
          <Text>No customers yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}
