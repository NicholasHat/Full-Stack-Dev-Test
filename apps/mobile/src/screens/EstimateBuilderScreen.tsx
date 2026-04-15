import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Button, FAB, Searchbar, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  api,
  Bundle,
  Customer,
  EquipmentCatalogItem,
  Estimate,
  EstimateDraftInput,
  EstimateTotals,
  Job,
  LaborRate,
  UploadFileInput,
} from '../api/client';
import { EstimateTotalsCard } from '../components/EstimateTotalsCard';
import { EstimateStatusCard } from '../components/EstimateStatusCard';
import { BundlePicker } from '../components/BundlePicker';
import { EquipmentSearch } from '../components/EquipmentSearch';
import { LaborPicker } from '../components/LaborPicker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { estimateDraftSchema } from '../schema/estimateDraft.zod';
import { getDraftById, saveDraft, searchDrafts } from '../storage/drafts.sqlite';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Main screen for building an estimate

export function EstimateBuilderScreen() {
  type EquipmentLineDraft = {
    equipmentId?: string | null;
    freeText?: string | null;
    qty: number;
    unitPrice?: number | null;
  };

  const route = useRoute<RouteProp<RootStackParamList, 'EstimateBuilder'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [jobId, setJobId] = useState(route.params?.jobId ?? '');
  const [customerId, setCustomerId] = useState(route.params?.customerId ?? '');
  const [estimateName, setEstimateName] = useState('');
  const [estimateId, setEstimateId] = useState(route.params?.estimateId ?? '');
  const [status, setStatus] = useState<string>('draft');
  const [totals, setTotals] = useState<EstimateTotals | null>(null);
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [laborJobType, setLaborJobType] = useState('');
  const [laborLevel, setLaborLevel] = useState('');
  const [laborHoursChosen, setLaborHoursChosen] = useState('');
  const [equipmentLines, setEquipmentLines] = useState<EquipmentLineDraft[]>([]);
  const [adjustmentsInput, setAdjustmentsInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mediaFabOpen, setMediaFabOpen] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [draftSearch, setDraftSearch] = useState('');
  const [autoSaveNote, setAutoSaveNote] = useState('');

  useEffect(() => {
    async function loadCatalogData() {
      try {
        const [rates, equipment, bundleItems, customerItems, jobItems] = await Promise.all([
          api.getLaborRates(),
          api.getEquipment(),
          api.getBundles(),
          api.listCustomers(),
          api.listJobs(),
        ]);
        setLaborRates(rates);
        setEquipmentCatalog(equipment);
        setBundles(bundleItems);
        setCustomers(customerItems);
        setJobs(jobItems);
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
          const parsedNotes = parseEstimateNameAndNotes(estimate.specialNotes ?? '');
          setEstimateName(parsedNotes.name);
          setNotes(parsedNotes.notes);
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

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) {
      return customers.slice(0, 5);
    }

    return customers
      .filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          (item.name ?? '').toLowerCase().includes(q) ||
          (item.address ?? '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [customerSearch, customers]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) {
      return jobs.slice(0, 5);
    }

    return jobs
      .filter(
        (job) =>
          job.id.toLowerCase().includes(q) ||
          (job.address ?? '').toLowerCase().includes(q) ||
          (job.status ?? '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [jobSearch, jobs]);

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

  const hasRequiredIdentifiers = useMemo(
    () => !!jobId.trim() && !!customerId.trim(),
    [customerId, jobId]
  );

  const hasServerEstimate = useMemo(() => /^EST-/i.test(estimateId.trim()), [estimateId]);

  function defaultUnitPriceForEquipmentId(equipmentId: string | null | undefined) {
    if (!equipmentId) {
      return null;
    }

    const found = equipmentCatalog.find((item) => item.id === equipmentId);
    return found ? found.baseCost : null;
  }

  useEffect(() => {
    const hasAnyData =
      !!jobId.trim() ||
      !!customerId.trim() ||
      !!estimateName.trim() ||
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
    estimateName,
    notes,
    workingDraftId,
  ]);

  function buildCurrentDraft(): EstimateDraftInput {
    const composedNotes = [estimateName.trim() ? `[Estimate Name] ${estimateName.trim()}` : '', notes]
      .filter(Boolean)
      .join('\n');

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
      specialNotes: composedNotes || null,
    };
  }

  function parseEstimateNameAndNotes(rawNotes: string | null | undefined) {
    const value = rawNotes ?? '';
    const lines = value.split('\n');
    const firstLine = lines[0] ?? '';
    const prefix = '[Estimate Name] ';

    if (firstLine.startsWith(prefix)) {
      return {
        name: firstLine.slice(prefix.length).trim(),
        notes: lines.slice(1).join('\n').trim(),
      };
    }

    return {
      name: '',
      notes: value,
    };
  }

  function findBestEquipmentId(value: string | null | undefined) {
    const needle = (value ?? '').trim().toLowerCase();
    if (!needle) {
      return null;
    }

    const exact = equipmentCatalog.find((item) => item.id.toLowerCase() === needle);
    if (exact) {
      return exact.id;
    }

    const fuzzy = equipmentCatalog.find(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.brand.toLowerCase().includes(needle) ||
        item.modelNumber.toLowerCase().includes(needle) ||
        needle.includes(item.id.toLowerCase())
    );

    return fuzzy?.id ?? null;
  }

  function enhanceAiDraftWithCatalog(draft: EstimateDraftInput, sourceText?: string | null) {
    const text = `${sourceText ?? ''}\n${draft.specialNotes ?? ''}`.toLowerCase();

    const normalizedEquipment = (draft.equipmentLines ?? []).map((line) => {
      const matchedId = findBestEquipmentId(line.equipmentId ?? line.freeText ?? null);
      return {
        ...line,
        equipmentId: matchedId ?? line.equipmentId ?? null,
      };
    });

    const matchedBundles = bundles.filter((bundle) => {
      const name = bundle.name.toLowerCase();
      return !!name && text.includes(name);
    });

    const bundleEquipment = matchedBundles.flatMap((bundle) =>
      bundle.equipmentLines.map((line) => ({
        equipmentId: line.equipmentId ?? null,
        freeText: null,
        qty: line.qty,
      }))
    );

    const mergedEquipmentLines = [...normalizedEquipment, ...bundleEquipment];

    return {
      ...draft,
      equipmentLines: mergedEquipmentLines,
      adjustments:
        draft.adjustments && draft.adjustments.length > 0
          ? draft.adjustments
          : matchedBundles.flatMap((bundle) => bundle.adjustments.map((adj) => ({ code: adj.code }))),
    } satisfies EstimateDraftInput;
  }

  function applyLocalDraftToScreen(draft: EstimateDraftInput) {
    if (draft.jobId) {
      setJobId(draft.jobId);
    }
    if (draft.customerId) {
      setCustomerId(draft.customerId);
    }
    if (draft.specialNotes !== undefined && draft.specialNotes !== null) {
      const parsed = parseEstimateNameAndNotes(draft.specialNotes);
      setEstimateName(parsed.name);
      setNotes(parsed.notes);
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
          unitPrice: defaultUnitPriceForEquipmentId(line.equipmentId ?? null),
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
    const parsed = parseEstimateNameAndNotes(estimate.specialNotes ?? '');
    setEstimateName(parsed.name);
    setNotes(parsed.notes);
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
        unitPrice: line.unitPrice ?? null,
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

  function applyDraftLocally(draft: EstimateDraftInput, successMessage: string) {
    const draftWithFallbacks: EstimateDraftInput = {
      ...draft,
      jobId: draft.jobId ?? (jobId || null),
      customerId: draft.customerId ?? (customerId || null),
    };

    applyLocalDraftToScreen(draftWithFallbacks);

    const parsedDraft = estimateDraftSchema.parse({
      ...draftWithFallbacks,
      equipmentLines: draftWithFallbacks.equipmentLines ?? [],
      adjustments: draftWithFallbacks.adjustments ?? [],
      missingRequiredFields: draftWithFallbacks.missingRequiredFields ?? [],
    });

    saveDraft(
      workingDraftId,
      JSON.stringify(parsedDraft),
      draftWithFallbacks.jobId ?? undefined,
      draftWithFallbacks.customerId ?? undefined
    );

    setAutoSaveNote(`Saved AI local draft ${workingDraftId}`);
    setMessage(`${successMessage} Saved locally. Create a server estimate when ready.`);
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
        specialNotes: buildCurrentDraft().specialNotes ?? null,
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
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const aiResult = await api.aiVoiceToDraft(file);
      const enhancedDraft = enhanceAiDraftWithCatalog(aiResult.draft, aiResult.transcript);
      if (hasServerEstimate) {
        await applyDraft(enhancedDraft, 'AI voice draft applied to estimate.');
      } else {
        applyDraftLocally(enhancedDraft, 'AI voice draft applied to local draft.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply AI voice draft');
    } finally {
      setBusy(false);
    }
  }

  async function onApplyAiDraftFromPhoto(file: UploadFileInput) {
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const aiResult = await api.aiNotesImageToDraft(file);
      const enhancedDraft = enhanceAiDraftWithCatalog(aiResult.draft, aiResult.extractedText);
      if (hasServerEstimate) {
        await applyDraft(enhancedDraft, 'AI notes draft applied to estimate.');
      } else {
        applyDraftLocally(enhancedDraft, 'AI notes draft applied to local draft.');
      }
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
      await api.updateEstimate(estimateId, {
        equipmentLines: equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          freeText: line.freeText ?? null,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
        })),
      });

      const draft = estimateDraftSchema.parse({
        ...buildCurrentDraft(),
        equipmentLines,
        adjustments,
        missingRequiredFields: [],
      });

      await api.applyEstimateDraft(estimateId, draft);

      const repriced = await api.repriceEstimate(estimateId);
      setTotals(repriced.totals);
      setEquipmentLines(
        repriced.equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          freeText: line.freeText ?? null,
          qty: line.qty,
          unitPrice: line.unitPrice ?? defaultUnitPriceForEquipmentId(line.equipmentId ?? null),
        }))
      );
      if (repriced.labor) {
        setLaborJobType(repriced.labor.jobType ?? laborJobType);
        setLaborLevel(repriced.labor.level ?? laborLevel);
        setLaborHoursChosen(
          repriced.labor.hoursChosen === undefined || repriced.labor.hoursChosen === null
            ? laborHoursChosen
            : String(repriced.labor.hoursChosen)
        );
      }
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
      await api.updateEstimate(estimateId, {
        equipmentLines: equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          freeText: line.freeText ?? null,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
        })),
      });

      const draft = estimateDraftSchema.parse({
        ...buildCurrentDraft(),
        equipmentLines,
        adjustments,
        missingRequiredFields: [],
      });

      await api.applyEstimateDraft(estimateId, draft);
      const repriced = await api.repriceEstimate(estimateId);
      setTotals(repriced.totals);
      setEquipmentLines(
        repriced.equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          freeText: line.freeText ?? null,
          qty: line.qty,
          unitPrice: line.unitPrice ?? defaultUnitPriceForEquipmentId(line.equipmentId ?? null),
        }))
      );
      const finalized = await api.finalizeEstimate(estimateId);
      syncEstimate(finalized);
      setMessage(`Finalized estimate ${finalized.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to finalize estimate';
      if (message.includes('Finalized estimate cannot be updated')) {
        setMessage(`Estimate ${estimateId} is already finalized.`);
        setError(null);
        return;
      }

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function onAddEquipmentLine(line: { equipmentId: string; qty: number; unitPrice?: number | null }) {
    setEquipmentLines((prev) => [
      ...prev,
      {
        equipmentId: line.equipmentId,
        qty: line.qty,
        unitPrice: line.unitPrice ?? null,
      },
    ]);
  }

  function onUpdateEquipmentQty(indexToUpdate: number, value: string) {
    const parsed = Number(value);
    setEquipmentLines((prev) =>
      prev.map((line, index) =>
        index === indexToUpdate ? { ...line, qty: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 } : line
      )
    );
  }

  function onUpdateEquipmentUnitPrice(indexToUpdate: number, value: string) {
    const parsed = Number(value);
    setEquipmentLines((prev) =>
      prev.map((line, index) =>
        index === indexToUpdate
          ? {
              ...line,
              unitPrice: Number.isFinite(parsed) && parsed >= 0 ? parsed : null,
            }
          : line
      )
    );
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
        ...bundle.equipmentLines.map((line) => ({
          equipmentId: line.equipmentId ?? null,
          qty: line.qty,
          unitPrice: defaultUnitPriceForEquipmentId(line.equipmentId ?? null),
        })),
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

  async function onVoiceFabPress() {
    setCaptureBusy(true);
    setError(null);
    try {
      if (!recording) {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          setError('Microphone permission is required.');
          return;
        }

        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(created.recording);
        setMessage('Recording started. Tap mic again to stop and apply.');
        return;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setError('Recording failed to save.');
        return;
      }

      await onApplyAiDraftFromVoice({
        uri,
        name: `voice-${Date.now()}.m4a`,
        type: 'audio/mp4',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice capture failed');
    } finally {
      setCaptureBusy(false);
    }
  }

  async function onPhotoFabPress() {
    setCaptureBusy(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await onApplyAiDraftFromPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `notes-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo capture failed');
    } finally {
      setCaptureBusy(false);
    }
  }

  async function onUploadPhotoFabPress() {
    setCaptureBusy(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await onApplyAiDraftFromPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `upload-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setCaptureBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text variant="titleMedium">Estimate Builder</Text>
        <Text style={styles.mutedText}>Build a quote, apply AI notes, reprice totals, then finalize.</Text>
        {!hasRequiredIdentifiers && (
          <Text style={styles.mutedText}>Step 1: Enter Job ID and Customer ID, then create a server estimate.</Text>
        )}
        {!hasServerEstimate && (
          <Text style={styles.mutedText}>Step 2: You can use AI now on local draft. Create server estimate before reprice/finalize/review.</Text>
        )}
        {!!autoSaveNote && <Text style={styles.mutedText}>{autoSaveNote}</Text>}
      </View>

      <View style={styles.card}>
      <TextInput
        label="Estimate Name"
        value={estimateName}
        onChangeText={setEstimateName}
        mode="outlined"
        placeholder="Spring tune-up quote"
      />
      <TextInput label="Job ID" value={jobId} onChangeText={setJobId} mode="outlined" />
      <Searchbar
        placeholder="Search Jobs by ID or address"
        value={jobSearch}
        onChangeText={setJobSearch}
      />
      {jobSearch.trim().length > 0 && filteredJobs.map((job) => (
        <Button
          key={job.id}
          mode="text"
          compact
          onPress={() => {
            setJobId(job.id);
            setCustomerId(job.customerId);
            setJobSearch('');
          }}
        >
          {job.id} · {job.address || job.status || 'Job'}
        </Button>
      ))}
      <TextInput
        label="Customer ID"
        value={customerId}
        onChangeText={setCustomerId}
        mode="outlined"
      />
      <Searchbar
        placeholder="Search Customers by name"
        value={customerSearch}
        onChangeText={setCustomerSearch}
      />
      {customerSearch.trim().length > 0 && filteredCustomers.map((customer) => (
        <Button
          key={customer.id}
          mode="text"
          compact
          onPress={() => {
            setCustomerId(customer.id);
            setCustomerSearch('');
          }}
        >
          {customer.name || customer.id} · {customer.id}
        </Button>
      ))}
      <TextInput
        label="Estimate ID"
        value={estimateId}
        onChangeText={setEstimateId}
        mode="outlined"
        placeholder="Auto-filled after creating estimate"
      />
      <TextInput
        label="Special Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
      />
      <TextInput
        label="Search Local Draft"
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
              <View style={styles.equipmentLabel}>
                <Text variant="bodySmall" style={styles.textRow}>
                  {index + 1}. {line.equipmentId ?? line.freeText ?? 'Unknown item'}
                </Text>
                <View style={styles.equipmentEditRow}>
                  <TextInput
                    label="Qty"
                    mode="outlined"
                    keyboardType="numeric"
                    value={String(line.qty)}
                    onChangeText={(value) => onUpdateEquipmentQty(index, value)}
                    style={styles.equipmentQtyInput}
                  />
                  <TextInput
                    label="Unit Cost"
                    mode="outlined"
                    keyboardType="numeric"
                    value={line.unitPrice == null ? '' : String(line.unitPrice)}
                    onChangeText={(value) => onUpdateEquipmentUnitPrice(index, value)}
                    style={styles.equipmentCostInput}
                  />
                </View>
              </View>
              <Button mode="text" compact onPress={() => onRemoveEquipmentLine(index)}>Remove</Button>
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
      <Button mode="contained" onPress={onCreateEstimate} disabled={busy || !hasRequiredIdentifiers} loading={busy}>
        Create Server Estimate
      </Button>
      <Button
        mode="outlined"
        disabled={busy}
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
        Save Draft Locally
      </Button>
      <Text style={styles.mutedText}>Save Draft Locally stores current form data on-device in SQLite for offline restore.</Text>
      <Button
        mode="outlined"
        disabled={busy}
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
        Load Saved Draft
      </Button>
      <Text style={styles.mutedText}>Load Saved Draft restores the latest matching local draft by estimate/job/customer search.</Text>
      </View>

      <View style={styles.card}>
      <Text style={styles.mutedText}>Use the bottom-right AI buttons to record voice or capture notes photo.</Text>
      <Button mode="outlined" onPress={onReprice} disabled={busy || !hasServerEstimate} loading={busy}>
        Recalculate Totals
      </Button>
      <Button mode="contained-tonal" onPress={onFinalize} disabled={busy || !hasServerEstimate} loading={busy}>
        Finalize Estimate
      </Button>
      <Button
        mode="text"
        disabled={!hasServerEstimate}
        onPress={() => navigation.navigate('EstimateReview', { estimateId })}
      >
        Review & Share PDF
      </Button>
      </View>

      <EstimateStatusCard status={status} message={message} error={error} />

      <EstimateTotalsCard totals={totals} />
      </ScrollView>

      {recording ? (
        <FAB
          icon="stop-circle"
          label="Stop Recording"
          style={styles.stopRecordingFab}
          onPress={() => {
            if (busy || captureBusy) {
              return;
            }
            onVoiceFabPress();
          }}
        />
      ) : (
      <FAB.Group
        open={mediaFabOpen}
        visible
        icon="plus"
        actions={[
          {
            icon: 'microphone',
            label: 'Voice',
            onPress: () => {
              setMediaFabOpen(false);
              if (busy || captureBusy) {
                return;
              }
              onVoiceFabPress();
            },
          },
          {
            icon: 'camera',
            label: 'Take Picture',
            onPress: () => {
              setMediaFabOpen(false);
              if (busy || captureBusy) {
                return;
              }
              onPhotoFabPress();
            },
          },
          {
            icon: 'image',
            label: 'Upload Picture',
            onPress: () => {
              setMediaFabOpen(false);
              if (busy || captureBusy) {
                return;
              }
              onUploadPhotoFabPress();
            },
          },
        ]}
        onStateChange={({ open }) => setMediaFabOpen(open)}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.bg,
  },
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
    flex: 1,
  },
  equipmentEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentQtyInput: {
    flex: 1,
  },
  equipmentCostInput: {
    flex: 1.2,
  },
  stopRecordingFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#EF4444',
  },
});
