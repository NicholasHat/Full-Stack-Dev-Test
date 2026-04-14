import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

// Screen edit form for editing customer details

export function CustomerEditScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [systemType, setSystemType] = useState('');
  const [systemAge, setSystemAge] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Customer Details</Text>
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
      <Button mode="contained">Save Customer</Button>
    </ScrollView>
  );
}
