import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { api } from '../api/client';

// Screen for listing jobs. This is the main screen that users will see when they open the app. 
// It shows a list of jobs with their status and address.

export function JobsScreen() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const data = (await api.listJobs()) as any[];
    setItems(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Button mode="contained" onPress={load}>
        Refresh Jobs
      </Button>
      {items.map((j) => (
        <Card key={j.id}>
          <Card.Title title={j.id} subtitle={j.status} />
          <Card.Content>
            <Text>{j.address || 'No address'}</Text>
          </Card.Content>
        </Card>
      ))}
      {items.length === 0 && (
        <View>
          <Text>No jobs yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}
