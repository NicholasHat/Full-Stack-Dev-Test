import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { Bundle } from '../api/client';
import { uiStyles } from '../theme/uiStyles';

type BundlePickerProps = {
  bundles: Bundle[];
  onApplyBundle: (bundle: Bundle) => void;
};

// Component for picking bundles
export function BundlePicker({ bundles, onApplyBundle }: BundlePickerProps) {
  return (
    <View style={uiStyles.section}>
      <Text variant="titleSmall" style={uiStyles.sectionTitle}>Bundles</Text>
      {bundles.length === 0 ? (
        <Text variant="bodySmall" style={uiStyles.mutedText}>No bundles available yet.</Text>
      ) : (
        bundles.map((bundle) => (
          <Button key={bundle.id} mode="outlined" onPress={() => onApplyBundle(bundle)}>
            Add Bundle: {bundle.name}
          </Button>
        ))
      )}
    </View>
  );
}
