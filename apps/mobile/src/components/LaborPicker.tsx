import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { LaborRate } from '../api/client';
import { uiStyles } from '../theme/uiStyles';

type LaborPickerProps = {
  laborRates: LaborRate[];
  selectedJobType: string;
  selectedLevel: string;
  hoursChosen: string;
  onChange: (next: { jobType?: string; level?: string; hoursChosen?: string }) => void;
};

// Component for picking labor details
export function LaborPicker({
  laborRates,
  selectedJobType,
  selectedLevel,
  hoursChosen,
  onChange,
}: LaborPickerProps) {
  const jobTypes = [...new Set(laborRates.map((rate) => rate.jobType))];
  const levels = laborRates
    .filter((rate) => rate.jobType === selectedJobType)
    .map((rate) => rate.level);

  const selectedRate = laborRates.find(
    (rate) => rate.jobType === selectedJobType && rate.level === selectedLevel
  );

  return (
    <View style={uiStyles.section}>
      <Text variant="titleSmall" style={uiStyles.sectionTitle}>Labor</Text>
      <TextInput
        label="Job Type"
        value={selectedJobType}
        onChangeText={(value) => onChange({ jobType: value, level: '' })}
        mode="outlined"
      />
      <View style={uiStyles.chipRow}>
        {jobTypes.map((type) => (
          <Button key={type} mode={selectedJobType === type ? 'contained' : 'outlined'} onPress={() => onChange({ jobType: type, level: '' })}>
            {type}
          </Button>
        ))}
      </View>

      <TextInput
        label="Level"
        value={selectedLevel}
        onChangeText={(value) => onChange({ level: value })}
        mode="outlined"
      />
      <View style={uiStyles.chipRow}>
        {levels.map((level) => (
          <Button key={level} mode={selectedLevel === level ? 'contained' : 'outlined'} onPress={() => onChange({ level })}>
            {level}
          </Button>
        ))}
      </View>

      <TextInput
        label="Hours"
        value={hoursChosen}
        onChangeText={(value) => onChange({ hoursChosen: value })}
        mode="outlined"
        keyboardType="decimal-pad"
      />
      {selectedRate && (
        <Text variant="bodySmall" style={uiStyles.mutedText}>
          Suggested range: {selectedRate.estimatedHours.min} - {selectedRate.estimatedHours.max} hours @ ${selectedRate.hourlyRate}/hr
        </Text>
      )}
    </View>
  );
}
