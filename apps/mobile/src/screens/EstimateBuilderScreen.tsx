import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  api,
  Bundle,
  EquipmentCatalogItem,
  Estimate,
  EstimateDraftInput,
  EstimateTotals,
  LaborRate,
  UploadFileInput,
} from '../api/client';
import { EstimateTotalsCard } from '../components/EstimateTotalsCard';
import { EstimateStatusCard } from '../components/EstimateStatusCard';
import { BundlePicker } from '../components/BundlePicker';
import { EquipmentSearch } from '../components/EquipmentSearch';
import { LaborPicker } from '../components/LaborPicker';
import { NotesPhotoCapture } from '../components/NotesPhotoCapture';
import { VoiceCapture } from '../components/VoiceCapture';
import { RootStackParamList } from '../navigation/RootNavigator';
import { estimateDraftSchema } from '../schema/estimateDraft.zod';
import { getDraftById, saveDraft, searchDrafts } from '../storage/drafts.sqlite';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Main screen for building an estimate

export function EstimateBuilderScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EstimateBuilder'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [jobId, setJobId] = useState(route.params?.jobId ?? '');
  const [customerId, setCustomerId] = useState(route.params?.customerId ?? '');
  const [estimateId, setEstimateId] = useState(route.params?.estimateId ?? '');
  const [status, setStatus] = useState<string>('draft');
  const [totals, setTotals] = useState<EstimateTotals | null>(null);
  const [notes, setNotes] = useState('');
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [laborJobType, setLaborJobType] = useState('');
  const [laborLevel, setLaborLevel] = useState('');
  const [laborHoursChosen, setLaborHoursChosen] = useState('');
  const [equipmentLines, setEquipmentLines] = useState<Array<{ equipmentId?: string | null; freeText?: string | null; qty: number }>>([]);
  const [adjustmentsInput, setAdjustmentsInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftSearch, setDraftSearch] = useState('');
  const [autoSaveNote, setAutoSaveNote] = useState('');

  useEffect(() => {
    async function loadCatalogData() {
      try {
        const [rates, equipment, bundleItems] = await Promise.all([
          api.getLaborRates(),
          api.getEquipment(),
          api.getBundles(),
        ]);
        setLaborRates(rates);
        setEquipmentCatalog(equipment);
        setBundles(bundleItems);
      } catch {
        // Keep UI usable even if catalog fetch fails initially.
      }
    }

    loadCatalogData();
  }, []);

  useEffect(() => {
    const routedEstimateId = route.params?.estimateId?.trim();
    const routedDraftId = route.params?.draftId?.trim();
    const copyFromEstimateId = route.params?.copyFromEstimateId?.trim();

    async function hydrateFromRoute() {
      if (routedEstimateId) {
        setBusy(true);
        setError(null);
        try {
          const estimate = await api.getEstimate(routedEstimateId);
          setJobId(estimate.jobId);
          setCustomerId(estimate.customerId);
          syncEstimate(estimate);
          setMessage(`Loaded estimate ${estimate.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load estimate');
        } finally {
          setBusy(false);
        }
        return;
      }

      if (routedDraftId) {
        setError(null);
        try {
          const row = getDraftById(routedDraftId);
          if (!row) {
            setError('Requested local draft was not found.');
            return;
          }
          const parsed = estimateDraftSchema.parse(JSON.parse(row.payload_json));
          setEstimateId(row.id);
          setJobId(row.job_id ?? '');
          setCustomerId(row.customer_id ?? '');
          applyLocalDraftToScreen(parsed);
          setMessage(`Loaded local draft ${row.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load local draft');
        }
        return;
      }

      if (copyFromEstimateId) {
        setBusy(true);
        setError(null);
        try {
          const estimate = await api.getEstimate(copyFromEstimateId);
          setJobId(estimate.jobId);
          setCustomerId(estimate.customerId);
          setStatus('draft');
          setEstimateId('');
          setTotals(null);
          setNotes(estimate.specialNotes ?? '');
          setLaborJobType(estimate.labor?.jobType ?? '');
          setLaborLevel(estimate.labor?.level ?? '');
          setLaborHoursChosen(
            estimate.labor?.hoursChosen === undefined || estimate.labor?.hoursChosen === null
              ? ''
              : String(estimate.labor.hoursChosen)
          );
          setEquipmentLines(
            estimate.equipmentLines.map((line) => ({
              equipmentId: line.equipmentId ?? null,
              freeText: line.freeText ?? null,
              qty: line.qty,
            }))
          );
          setAdjustmentsInput(estimate.adjustments.map((adj) => adj.code).join(', '));
          setMessage(`Duplicated estimate ${estimate.id}. Create to save as new estimate.`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to duplicate estimate');
        } finally {
          setBusy(false);
        }
      }
    }

    hydrateFromRoute();
  }, [route.params?.copyFromEstimateId, route.params?.draftId, route.params?.estimateId]);

  const adjustments = useMemo(
    () =>
      adjustmentsInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((code) => ({ code })),
    [adjustmentsInput]
  );

  const workingDraftId = useMemo(() => {
    const estimate = estimateId.trim();
    if (estimate) {
      return estimate;
    }

    const job = jobId.trim();
    const customer = customerId.trim();
    if (job || customer) {
      return `LOCAL-${job || 'job'}-${customer || 'customer'}`;
    }

    return 'LOCAL-WIP';
  }, [customerId, estimateId, jobId]);

  useEffect(() => {
    const hasAnyData =
      !!jobId.trim() ||
      !!customerId.trim() ||
      !!notes.trim() ||
      !!laborJobType.trim() ||
      !!laborLevel.trim() ||
      !!laborHoursChosen.trim() ||
      equipmentLines.length > 0 ||
      adjustments.length > 0;

    if (!hasAnyData) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const draft = estimateDraftSchema.parse({
          ...buildCurrentDraft(),
          equipmentLines,
          adjustments,
          missingRequiredFields: [],
        });

        saveDraft(workingDraftId, JSON.stringify(draft), jobId || undefined, customerId || undefined);
        setAutoSaveNote(`Auto-saved local draft ${workingDraftId}`);
      } catch {
        // Ignore invalid intermediate input during typing.
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [
    adjustments,
    customerId,
    equipmentLines,
    jobId,
    laborHoursChosen,
    laborJobType,
    laborLevel,
    notes,
    workingDraftId,
  ]);

  function buildCurrentDraft(): EstimateDraftInput {
    return {
      jobId: jobId || null,
      customerId: customerId || null,
      labor:
        laborJobType || laborLevel || laborHoursChosen
          ? {
              jobType: laborJobType || null,
              level: laborLevel || null,
              hoursChosen: laborHoursChosen ? Number(laborHoursChosen) : null,
            }
          : undefined,
      equipmentLines,
      adjustments,
      specialNotes: notes || null,
    };
  }

  function applyLocalDraftToScreen(draft: EstimateDraftInput) {
    if (draft.jobId) {
      setJobId(draft.jobId);
    }
    if (draft.customerId) {
      setCustomerId(draft.customerId);
    }
    if (draft.specialNotes !== undefined && draft.specialNotes !== null) {
      setNotes(draft.specialNotes);
    }
    if (draft.labor) {
      setLaborJobType(draft.labor.jobType ?? '');
      setLaborLevel(draft.labor.level ?? '');
      setLaborHoursChosen(draft.labor.hoursChosen == null ? '' : String(draft.labor.hoursChosen));
    }
    if (draft.equipmentLines) {
      setEquipmentLines(
        draft.equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          freeText: line.freeText ?? null,
          qty: line.qty,
        }))
      );
    }
    if (draft.adjustments) {
      setAdjustmentsInput(draft.adjustments.map((adj) => adj.code).join(', '));
    }
  }

  function syncEstimate(estimate: Estimate) {
    setEstimateId(estimate.id);
    setStatus(estimate.status);
    setTotals(estimate.totals ?? null);
    setNotes(estimate.specialNotes ?? '');
    setLaborJobType(estimate.labor?.jobType ?? '');
    setLaborLevel(estimate.labor?.level ?? '');
    setLaborHoursChosen(
      estimate.labor?.hoursChosen === undefined || estimate.labor?.hoursChosen === null
        ? ''
        : String(estimate.labor.hoursChosen)
    );
    setEquipmentLines(
      estimate.equipmentLines.map((line) => ({
        equipmentId: line.equipmentId ?? null,
        freeText: line.freeText ?? null,
        qty: line.qty,
      }))
    );
    setAdjustmentsInput(estimate.adjustments.map((adj) => adj.code).join(', '));
  }

  async function applyDraft(draft: EstimateDraftInput, successMessage: string) {
    const updatedEstimate = await api.applyEstimateDraft(estimateId, {
      ...draft,
      jobId: draft.jobId ?? (jobId || null),
      customerId: draft.customerId ?? (customerId || null),
    });

    syncEstimate(updatedEstimate);
    setMessage(successMessage);
  }

  async function onCreateEstimate() {
    if (!jobId.trim() || !customerId.trim()) {
      setError('Job ID and Customer ID are required to create an estimate.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const estimate = await api.createEstimate({
        jobId: jobId.trim(),
        customerId: customerId.trim(),
        status: 'draft',
        version: 1,
        labor:
          laborJobType || laborLevel || laborHoursChosen
            ? {
                jobType: laborJobType || null,
                level: laborLevel || null,
                hoursChosen: laborHoursChosen ? Number(laborHoursChosen) : null,
              }
            : null,
        equipmentLines,
        adjustments,
        specialNotes: notes || null,
      });
      syncEstimate(estimate);
      setMessage(`Created estimate ${estimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create estimate');
    } finally {
      setBusy(false);
    }
  }

  async function onApplyAiDraftFromVoice(file: UploadFileInput) {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const aiResult = await api.aiVoiceToDraft(file);
      await applyDraft(aiResult.draft, 'AI voice draft applied to estimate.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply AI voice draft');
    } finally {
      setBusy(false);
    }
  }

  async function onApplyAiDraftFromPhoto(file: UploadFileInput) {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const aiResult = await api.aiNotesImageToDraft(file);
      await applyDraft(aiResult.draft, 'AI notes draft applied to estimate.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply AI notes draft');
    } finally {
      setBusy(false);
    }
  }

  async function onReprice() {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const draft = estimateDraftSchema.parse({
        ...buildCurrentDraft(),
        equipmentLines,
        adjustments,
        missingRequiredFields: [],
      });

      await api.applyEstimateDraft(estimateId, draft);

      const repriced = await api.repriceEstimate(estimateId);
      setTotals(repriced.totals);
      setMessage('Repriced successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprice estimate');
    } finally {
      setBusy(false);
    }
  }

  async function onFinalize() {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const draft = estimateDraftSchema.parse({
        ...buildCurrentDraft(),
        equipmentLines,
        adjustments,
        missingRequiredFields: [],
      });

      await api.applyEstimateDraft(estimateId, draft);
      await api.repriceEstimate(estimateId);
      const finalized = await api.finalizeEstimate(estimateId);
      syncEstimate(finalized);
      setMessage(`Finalized estimate ${finalized.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize estimate');
    } finally {
      setBusy(false);
    }
  }

  function onAddEquipmentLine(line: { equipmentId: string; qty: number }) {
    setEquipmentLines((prev) => [...prev, { equipmentId: line.equipmentId, qty: line.qty }]);
  }

  function onRemoveEquipmentLine(indexToRemove: number) {
    setEquipmentLines((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function onApplyBundle(bundle: Bundle) {
    if (bundle.labor) {
      setLaborJobType(bundle.labor.jobType ?? '');
      setLaborLevel(bundle.labor.level ?? '');
      setLaborHoursChosen(bundle.labor.hoursChosen == null ? '' : String(bundle.labor.hoursChosen));
    }

    if (bundle.equipmentLines.length > 0) {
      setEquipmentLines((prev) => [
        ...prev,
        ...bundle.equipmentLines.map((line) => ({ equipmentId: line.equipmentId ?? null, qty: line.qty })),
      ]);
    }

    if (bundle.adjustments.length > 0) {
      const existing = adjustmentsInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const merged = [...new Set([...existing, ...bundle.adjustments.map((a) => a.code)])];
      setAdjustmentsInput(merged.join(', '));
    }

    if (bundle.notesTemplate) {
      setNotes((prev) => (prev ? `${prev}\n${bundle.notesTemplate}` : bundle.notesTemplate || ''));
    }

    setMessage(`Applied bundle: ${bundle.name}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text variant="titleMedium">Estimate Builder</Text>
        <Text style={styles.mutedText}>Build, draft, reprice, and finalize an estimate.</Text>
        {!!autoSaveNote && <Text style={styles.mutedText}>{autoSaveNote}</Text>}
      </View>

      <View style={styles.card}>
      <Button
        mode="outlined"
        onPress={async () => {
          try {
            const [rates, equipment, bundleItems] = await Promise.all([
              api.getLaborRates(),
              api.getEquipment(),
              api.getBundles(),
            ]);
            setLaborRates(rates);
            setEquipmentCatalog(equipment);
            setBundles(bundleItems);
            setMessage('Catalog data refreshed.');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh catalog data');
          }
        }}
      >
        Refresh Catalogs
      </Button>
      </View>

      <View style={styles.card}>
      <TextInput label="Job ID" value={jobId} onChangeText={setJobId} mode="outlined" />
      <TextInput
        label="Customer ID"
        value={customerId}
        onChangeText={setCustomerId}
        mode="outlined"
      />
      <TextInput
        label="Estimate ID"
        value={estimateId}
        onChangeText={setEstimateId}
        mode="outlined"
        placeholder="Auto-filled after create"
      />
      <TextInput
        label="Special Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
      />
      <TextInput
        label="Find Local Draft"
        value={draftSearch}
        onChangeText={setDraftSearch}
        mode="outlined"
        placeholder="Estimate ID, Job ID, or Customer ID"
      />
      <TextInput
        label="Adjustments (comma-separated codes)"
        value={adjustmentsInput}
        onChangeText={setAdjustmentsInput}
        mode="outlined"
        placeholder="after_hours, permit_fee"
      />
      </View>

      <View style={styles.card}>
      <LaborPicker
        laborRates={laborRates}
        selectedJobType={laborJobType}
        selectedLevel={laborLevel}
        hoursChosen={laborHoursChosen}
        onChange={(next) => {
          if (next.jobType !== undefined) {
            setLaborJobType(next.jobType);
          }
          if (next.level !== undefined) {
            setLaborLevel(next.level);
          }
          if (next.hoursChosen !== undefined) {
            setLaborHoursChosen(next.hoursChosen);
          }
        }}
      />
      </View>

      <View style={styles.card}>
      <EquipmentSearch equipment={equipmentCatalog} onAdd={onAddEquipmentLine} />
      </View>
      <View style={styles.card}>
      <BundlePicker bundles={bundles} onApplyBundle={onApplyBundle} />
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall">Current Equipment Lines</Text>
        {equipmentLines.length === 0 ? (
          <Text variant="bodySmall" style={styles.mutedText}>
            No equipment lines added yet.
          </Text>
        ) : (
          equipmentLines.map((line, index) => (
            <View key={`${line.equipmentId ?? line.freeText ?? 'line'}-${index}`} style={styles.equipmentRow}>
              <Text variant="bodySmall" style={styles.equipmentLabel}>
                {index + 1}. {line.equipmentId ?? line.freeText ?? 'Unknown item'} x {line.qty}
              </Text>
              <Button mode="text" compact onPress={() => onRemoveEquipmentLine(index)}>
                Remove
              </Button>
            </View>
          ))
        )}
        {equipmentLines.length > 0 && (
          <Button mode="outlined" onPress={() => setEquipmentLines([])}>
            Clear Equipment Lines
          </Button>
        )}
      </View>

      <View style={styles.card}>
      <Button mode="contained" onPress={onCreateEstimate} disabled={busy} loading={busy}>
        Create Estimate
      </Button>
      <Button
        mode="outlined"
        onPress={() => {
          setError(null);
          setMessage('');
          try {
            const draft = estimateDraftSchema.parse({
              ...buildCurrentDraft(),
              equipmentLines,
              adjustments,
              missingRequiredFields: [],
            });

            const id = estimateId.trim() || `LOCAL-${Date.now()}`;
            saveDraft(id, JSON.stringify(draft), jobId || undefined, customerId || undefined);
            if (!estimateId.trim()) {
              setEstimateId(id);
            }
            setAutoSaveNote(`Saved local draft ${id}`);
            setMessage(`Saved local draft ${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save local draft');
          }
        }}
      >
        Save Local Draft
      </Button>
      <Button
        mode="outlined"
        onPress={() => {
          setError(null);
          setMessage('');
          try {
            const query = draftSearch.trim() || estimateId.trim() || jobId.trim() || customerId.trim();
            const row =
              estimateId.trim()
                ? getDraftById(estimateId.trim())
                : (searchDrafts(query)[0] ?? null);

            if (!row) {
              setError('No local draft found.');
              return;
            }

            const parsed = estimateDraftSchema.parse(JSON.parse(row.payload_json));
            setEstimateId(row.id);
            applyLocalDraftToScreen(parsed);
            setMessage(`Loaded local draft ${row.id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load local draft');
          }
        }}
      >
        Load Local Draft
      </Button>
      </View>

      <View style={styles.card}>
      <VoiceCapture disabled={busy || !estimateId.trim()} onFileReady={onApplyAiDraftFromVoice} />
      <NotesPhotoCapture disabled={busy || !estimateId.trim()} onFileReady={onApplyAiDraftFromPhoto} />
      <Button mode="outlined" onPress={onReprice} disabled={busy} loading={busy}>
        Run Reprice
      </Button>
      <Button mode="contained-tonal" onPress={onFinalize} disabled={busy} loading={busy}>
        Finalize
      </Button>
      <Button
        mode="text"
        disabled={!estimateId.trim()}
        onPress={() => navigation.navigate('EstimateReview', { estimateId })}
      >
        Review & Share PDF
      </Button>
      </View>

      <EstimateStatusCard status={status} message={message} error={error} />

      <EstimateTotalsCard totals={totals} />
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
  textRow: {
    color: appColors.text,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  equipmentLabel: {
    color: appColors.text,
    flex: 1,
  },
});
