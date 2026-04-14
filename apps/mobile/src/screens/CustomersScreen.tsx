import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Searchbar, Text } from 'react-native-paper';

import { api } from '../api/client';

// Screen for searching and updating customers.

export function CustomersScreen() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const data = (await api.listCustomers(query)) as any[];
    setItems(data);
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
      {items.map((c) => (
        <Card key={c.id}>
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
