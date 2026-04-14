import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Screen edit form for editing customer details

export function CustomerEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CustomerEdit'>>();
  const customerId = route.params?.customerId;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [systemType, setSystemType] = useState('');
  const [systemAge, setSystemAge] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (customerId ? `Edit ${customerId}` : 'New Customer'), [customerId]);

  useEffect(() => {
    if (!customerId) {
      return;
    }

    const id = customerId;

    async function loadCustomer() {
      setLoading(true);
      setError(null);
      try {
        const customer = await api.getCustomer(id);
        setName(customer.name ?? '');
        setAddress(customer.address ?? '');
        setPhone(customer.phone ?? '');
        setPropertyType(customer.propertyType ?? '');
        setSquareFootage(customer.squareFootage?.toString() ?? '');
        setSystemType(customer.systemType ?? '');
        setSystemAge(customer.systemAge?.toString() ?? '');
        setLastServiceDate(customer.lastServiceDate ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [customerId]);

  async function onSave() {
    setSaving(true);
    setError(null);

    const payload = {
      name: name || null,
      address: address || null,
      phone: phone || null,
      propertyType: propertyType || null,
      squareFootage: squareFootage.trim() ? Number(squareFootage) : null,
      systemType: systemType || null,
      systemAge: systemAge.trim() ? Number(systemAge) : null,
      lastServiceDate: lastServiceDate || null,
    };

    try {
      if (customerId) {
        await api.updateCustomer(customerId, payload);
      } else {
        await api.createCustomer(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text variant="titleMedium">{title}</Text>
        <Text style={styles.mutedText}>Customer profile and system details.</Text>
      </View>

      <View style={styles.card}>
        <HelperText type="error" visible={!!error}>
          {error ?? ''}
        </HelperText>
        <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
        <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
        />
        <TextInput
          label="Property Type"
          value={propertyType}
          onChangeText={setPropertyType}
          mode="outlined"
          placeholder="residential or commercial"
        />
        <TextInput
          label="Square Footage"
          value={squareFootage}
          onChangeText={setSquareFootage}
          mode="outlined"
          keyboardType="numeric"
        />
        <TextInput
          label="System Type"
          value={systemType}
          onChangeText={setSystemType}
          mode="outlined"
          placeholder="Central AC + Gas Furnace"
        />
        <TextInput
          label="System Age (years)"
          value={systemAge}
          onChangeText={setSystemAge}
          mode="outlined"
          keyboardType="numeric"
        />
        <TextInput
          label="Last Service Date"
          value={lastServiceDate}
          onChangeText={setLastServiceDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.card}>
        <Button mode="contained" onPress={onSave} loading={saving || loading} disabled={saving || loading}>
          Save Customer
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screenStyles.container,
  },
  content: {
    ...screenStyles.content,
  },
  card: {
    ...screenStyles.card,
  },
  mutedText: {
    color: appColors.muted,
  },
});
