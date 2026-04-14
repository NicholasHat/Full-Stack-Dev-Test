import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api, Job } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Screen for listing jobs. This is the main screen that users will see when they open the app. 
// It shows a list of jobs with their status and address.

export function JobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Job[]>([]);

  async function load() {
    setItems(await api.listJobs());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Button mode="contained" onPress={load}>
        Refresh Jobs
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('JobEdit')}>
        New Job
      </Button>
      {items.map((j) => (
        <Card key={j.id} onPress={() => navigation.navigate('JobEdit', { jobId: j.id })}>
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
