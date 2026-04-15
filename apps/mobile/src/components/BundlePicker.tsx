import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Searchbar, Text } from 'react-native-paper';

import { Bundle } from '../api/client';
import { uiStyles } from '../theme/uiStyles';

type BundlePickerProps = {
  bundles: Bundle[];
  onApplyBundle: (bundle: Bundle) => void;
};

// Component for picking bundles
export function BundlePicker({ bundles, onApplyBundle }: BundlePickerProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filteredBundles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return bundles;
    }

    return bundles.filter(
      (bundle) =>
        bundle.name.toLowerCase().includes(q) ||
        (bundle.description ?? '').toLowerCase().includes(q)
    );
  }, [bundles, query]);

  const isCompact = !focused && !query.trim();
  const visibleBundles = isCompact ? filteredBundles.slice(0, 3) : filteredBundles;

  return (
    <View style={uiStyles.section}>
      <Text variant="titleSmall" style={uiStyles.sectionTitle}>Bundles</Text>
      <Searchbar
        placeholder="Search bundles"
        value={query}
        onChangeText={setQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {isCompact && <Text variant="bodySmall" style={uiStyles.mutedText}>Tap search to expand bundle results.</Text>}
      {visibleBundles.length === 0 ? (
        <Text variant="bodySmall" style={uiStyles.mutedText}>No bundles available yet.</Text>
      ) : (
        visibleBundles.map((bundle) => (
          <Button key={bundle.id} mode="outlined" onPress={() => onApplyBundle(bundle)}>
            Add Bundle: {bundle.name}
          </Button>
        ))
      )}
    </View>
  );
}
