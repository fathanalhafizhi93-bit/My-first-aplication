import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckSquare,
  Clock,
  Dumbbell,
  Edit3,
  Plus,
  Repeat,
  Search,
  Square,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/presets';
import { formatCompactDuration } from '../lib/dateUtils';
import { haptics } from '../lib/haptics';
import { DAY_LABELS, MUSCLE_LABELS, useI18n } from '../lib/i18n';
import { SHARED_IDS, TAB_INDICATOR_SPRING } from '../lib/motionTokens';
import { ConfirmDeleteModal, GlassModal } from './GlassModal';
import {
  DAY_LIST,
  DayKey,
  DaySchedule,
  ExerciseItem,
  ExerciseTrackingMode,
  MUSCLE_GROUPS,
  MuscleGroup,
  resolveExerciseTrackingMode,
  resolveExerciseUsesWeight,
  resolveTargetDurationSeconds,
  TimerDirection,
} from '../types/gym';

interface ExerciseManagerViewProps {
  selectedDayKey: DayKey;
  onSelectDayKey: (dayKey: DayKey) => void;
  schedules: Record<DayKey, DaySchedule>;
  onAddExercise: (dayKey: DayKey, exercise: Omit<ExerciseItem, 'id'>) => Promise<void>;
  onAddExercises: (dayKey: DayKey, exercises: Array<Omit<ExerciseItem, 'id'>>) => Promise<void>;
  onUpdateExercise: (
    dayKey: DayKey,
    exerciseId: string,
    patch: Partial<ExerciseItem>
  ) => Promise<void>;
  onRemoveExercise: (dayKey: DayKey, exerciseId: string) => Promise<void>;
  onMoveExercise: (
    dayKey: DayKey,
    exerciseId: string,
    direction: 'up' | 'down'
  ) => Promise<void>;
}

type EquipmentBucket =
  | 'all'
  | 'barbel'
  | 'dumbbell'
  | 'kabel'
  | 'mesin'
  | 'kettlebell'
  | 'bodyweight'
  | 'kardio';

const EQUIPMENT_FILTERS: ReadonlyArray<{
  id: EquipmentBucket;
  labelId: string;
  labelEn: string;
}> = [
  { id: 'all', labelId: 'Semua Alat', labelEn: 'All Equipment' },
  { id: 'barbel', labelId: 'Barbel & EZ-Bar', labelEn: 'Barbell & EZ-Bar' },
  { id: 'dumbbell', labelId: 'Dumbbell', labelEn: 'Dumbbell' },
  { id: 'kabel', labelId: 'Kabel', labelEn: 'Cable' },
  { id: 'mesin', labelId: 'Mesin', labelEn: 'Machine' },
  { id: 'kettlebell', labelId: 'Kettlebell', labelEn: 'Kettlebell' },
  { id: 'bodyweight', labelId: 'Tanpa Alat & Bar', labelEn: 'Bodyweight & Bars' },
  { id: 'kardio', labelId: 'Alat Kardio', labelEn: 'Cardio Gear' },
];

function resolveEquipmentBucket(
  equipment: string,
  muscleGroup: MuscleGroup
): Exclude<EquipmentBucket, 'all'> {
  const eq = equipment.toLowerCase();
  if (
    eq.includes('treadmill') ||
    eq.includes('air bike') ||
    eq.includes('sepeda') ||
    eq.includes('elliptical') ||
    eq.includes('stairmaster') ||
    eq.includes('dayung') ||
    eq.includes('skipping')
  ) {
    return 'kardio';
  }
  if (eq.includes('kettlebell')) return 'kettlebell';
  if (eq.includes('kabel')) return 'kabel';
  if (eq.includes('dumbbell')) return 'dumbbell';
  if (eq.includes('barbel') || eq.includes('ez-bar') || eq.includes('smith')) {
    return eq.includes('mesin / smith') ? 'mesin' : 'barbel';
  }
  if (eq.includes('mesin')) return 'mesin';
  if (
    eq.includes('tanpa alat') ||
    eq.includes('pull-up bar') ||
    eq.includes('dip bar') ||
    eq.includes('pelat beban')
  ) {
    return 'bodyweight';
  }
  return muscleGroup === 'Kardio' ? 'kardio' : 'bodyweight';
}

interface ExerciseFormState {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  trackingMode: ExerciseTrackingMode;
  usesWeight: boolean;
  timerDirection: TimerDirection;
  targetSets: string;
  targetReps: string;
  targetWeightKg: string;
  durationMinutes: string;
  durationSeconds: string;
  restSeconds: string;
  notes: string;
}

const EMPTY_FORM: ExerciseFormState = {
  name: '',
  muscleGroup: 'Dada',
  equipment: 'Barbel',
  trackingMode: 'reps',
  usesWeight: true,
  timerDirection: 'countdown',
  targetSets: '3',
  targetReps: '10-12',
  targetWeightKg: '20',
  durationMinutes: '1',
  durationSeconds: '0',
  restSeconds: '90',
  notes: '',
};

export const ExerciseManagerView = memo(function ExerciseManagerView({
  selectedDayKey,
  onSelectDayKey,
  schedules,
  onAddExercise,
  onAddExercises,
  onUpdateExercise,
  onRemoveExercise,
  onMoveExercise,
}: ExerciseManagerViewProps) {
  const { lang, t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<'Semua' | MuscleGroup>('Semua');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentBucket>('all');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPresetNames, setSelectedPresetNames] = useState<string[]>([]);
  const [batchAdding, setBatchAdding] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [addingPresetName, setAddingPresetName] = useState<string | null>(null);
  const [libraryErrorMsg, setLibraryErrorMsg] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExerciseFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const schedule = schedules[selectedDayKey];
  const dayLabel = DAY_LABELS[lang][selectedDayKey].label;
  const secUnit = t('d', 's');
  const remainingDaySlots = Math.max(0, 30 - schedule.exercises.length);

  const scheduledNameSet = useMemo(
    () => new Set(schedule.exercises.map((ex) => ex.name.trim().toLowerCase())),
    [schedule.exercises]
  );

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchMuscle = muscleFilter === 'Semua' || ex.muscleGroup === muscleFilter;
      const bucket = resolveEquipmentBucket(ex.equipment, ex.muscleGroup);
      const matchEquipment = equipmentFilter === 'all' || bucket === equipmentFilter;
      const localizedMuscle = MUSCLE_LABELS[lang][ex.muscleGroup].toLowerCase();
      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        localizedMuscle.includes(q);
      return matchMuscle && matchEquipment && matchQuery;
    });
  }, [searchQuery, muscleFilter, equipmentFilter, lang]);

  const showToast = (msg: string, isError = false) => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    if (isError) {
      setFeedbackMsg(null);
      setErrorMsg(msg);
    } else {
      setErrorMsg(null);
      setFeedbackMsg(msg);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMsg(null);
      setErrorMsg(null);
      toastTimeoutRef.current = null;
    }, 3200);
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setFormErrorMsg(null);
    setFormState(EMPTY_FORM);
    setShowCustomForm(true);
  };

  const handleCloseForm = () => {
    setShowCustomForm(false);
    setEditingId(null);
    setFormErrorMsg(null);
    setFormState(EMPTY_FORM);
  };

  const handleOpenEditForm = (ex: ExerciseItem) => {
    const mode = resolveExerciseTrackingMode(ex);
    const usesWeight = resolveExerciseUsesWeight(ex);
    const totalDur = resolveTargetDurationSeconds(ex);
    setEditingId(ex.id);
    setFormErrorMsg(null);
    setFormState({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      trackingMode: mode,
      usesWeight,
      timerDirection: ex.timerDirection === 'countup' ? 'countup' : 'countdown',
      targetSets: String(ex.targetSets),
      targetReps: ex.targetReps,
      targetWeightKg: String(ex.targetWeightKg),
      durationMinutes: String(Math.floor(totalDur / 60)),
      durationSeconds: String(totalDur % 60),
      restSeconds: String(ex.restSeconds),
      notes: ex.notes,
    });
    setShowCustomForm(true);
  };

  const handleSwitchTrackingMode = (mode: ExerciseTrackingMode) => {
    setFormState((prev) => {
      if (mode === prev.trackingMode) return prev;
      if (mode === 'timer') {
        const defaultEquipment =
          prev.equipment === 'Barbel' || !prev.equipment.trim() ? 'Tanpa Alat' : prev.equipment;
        return {
          ...prev,
          trackingMode: 'timer',
          usesWeight: false,
          equipment: defaultEquipment,
          targetWeightKg: '0',
          targetSets: prev.targetSets === '3' ? '1' : prev.targetSets,
        };
      }
      return {
        ...prev,
        trackingMode: 'reps',
        targetReps: prev.targetReps || '10-12',
      };
    });
  };

  const handleToggleUsesWeight = (nextUsesWeight: boolean) => {
    setFormState((prev) => {
      let nextEquipment = prev.equipment;
      if (!nextUsesWeight && (prev.equipment === 'Barbel' || !prev.equipment.trim())) {
        nextEquipment = 'Tanpa Alat';
      } else if (
        nextUsesWeight &&
        (prev.equipment === 'Tanpa Alat' || prev.equipment === 'Bodyweight')
      ) {
        nextEquipment = 'Barbel';
      }
      const parsedWeight = parseFloat(prev.targetWeightKg);
      return {
        ...prev,
        usesWeight: nextUsesWeight,
        equipment: nextEquipment,
        targetWeightKg: nextUsesWeight
          ? parsedWeight > 0
            ? prev.targetWeightKg
            : '10'
          : '0',
      };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormErrorMsg(
        t('Nama gerakan tidak boleh kosong.', 'Exercise name cannot be empty.')
      );
      return;
    }
    setFormErrorMsg(null);

    const parsedMins = Math.max(0, Math.min(180, parseInt(formState.durationMinutes, 10) || 0));
    const parsedSecs = Math.max(0, Math.min(59, parseInt(formState.durationSeconds, 10) || 0));
    const totalDur = Math.max(5, Math.min(10800, parsedMins * 60 + parsedSecs));

    const formattedTargetText =
      formState.trackingMode === 'timer'
        ? formatCompactDuration(totalDur, lang)
        : formState.targetReps.trim().slice(0, 20) || '10';

    const parsedSets = parseInt(formState.targetSets, 10);
    const parsedWeight = parseFloat(formState.targetWeightKg.replace(',', '.'));
    const parsedRest = parseInt(formState.restSeconds, 10);

    const cleanPayload: Omit<ExerciseItem, 'id'> = {
      name: formState.name.trim().slice(0, 60),
      muscleGroup: formState.muscleGroup,
      equipment:
        formState.equipment.trim().slice(0, 40) ||
        (formState.usesWeight ? t('Bebas', 'Free Weights') : t('Tanpa Alat', 'No Equipment')),
      targetSets: Math.max(1, Math.min(12, Number.isFinite(parsedSets) ? parsedSets : 1)),
      targetReps: formattedTargetText,
      targetWeightKg: formState.usesWeight
        ? Math.max(0, Math.min(999, Number.isFinite(parsedWeight) ? parsedWeight : 0))
        : 0,
      restSeconds: Math.max(15, Math.min(600, Number.isFinite(parsedRest) ? parsedRest : 60)),
      notes: formState.notes.trim().slice(0, 200),
      trackingMode: formState.trackingMode,
      usesWeight: formState.usesWeight,
      timerDirection: formState.timerDirection,
      targetDurationSeconds: totalDur,
    };

    try {
      if (editingId) {
        await onUpdateExercise(selectedDayKey, editingId, cleanPayload);
        showToast(
          t(
            `Gerakan "${cleanPayload.name}" diperbarui.`,
            `Exercise "${cleanPayload.name}" updated.`
          )
        );
      } else {
        await onAddExercise(selectedDayKey, cleanPayload);
        showToast(
          t(
            `"${cleanPayload.name}" ditambahkan ke hari ${dayLabel}.`,
            `"${cleanPayload.name}" added to ${dayLabel}.`
          )
        );
      }

      setShowCustomForm(false);
      setEditingId(null);
      setFormState(EMPTY_FORM);
    } catch (err) {
      setFormErrorMsg(
        err instanceof Error
          ? err.message
          : t('Gagal menyimpan gerakan. Coba lagi.', 'Failed to save exercise. Please try again.')
      );
    }
  };

  const handleOpenLibrary = () => {
    setLibraryErrorMsg(null);
    setSelectedPresetNames([]);
    setShowLibraryModal(true);
  };

  const handleCloseLibrary = () => {
    if (addingPresetName !== null || batchAdding) return;
    setShowLibraryModal(false);
    setLibraryErrorMsg(null);
    setSelectedPresetNames([]);
  };

  const handleToggleSelectPreset = (presetName: string) => {
    if (batchAdding || addingPresetName !== null) return;
    setLibraryErrorMsg(null);
    setSelectedPresetNames((prev) => {
      if (prev.includes(presetName)) {
        haptics.buttonTap();
        return prev.filter((name) => name !== presetName);
      }
      if (prev.length >= remainingDaySlots) {
        haptics.cooldownBlocked();
        setLibraryErrorMsg(
          remainingDaySlots === 0
            ? t(
                'Jadwal hari ini sudah penuh (maksimal 30 gerakan).',
                'This day’s schedule is full (maximum 30 exercises).'
              )
            : t(
                `Maksimal pilih ${remainingDaySlots} gerakan tambahan sesuai sisa kapasitas hari ${dayLabel}.`,
                `You can select up to ${remainingDaySlots} more exercises for ${dayLabel}.`
              )
        );
        return prev;
      }
      haptics.buttonTap();
      return [...prev, presetName];
    });
  };

  const handleBatchAddPresets = async () => {
    if (batchAdding || addingPresetName !== null || selectedPresetNames.length === 0) return;
    const chosen = selectedPresetNames
      .map((name) => EXERCISE_LIBRARY.find((ex) => ex.name === name))
      .filter((ex): ex is Omit<ExerciseItem, 'id'> => Boolean(ex));
    if (chosen.length === 0) return;

    setBatchAdding(true);
    setLibraryErrorMsg(null);
    try {
      await onAddExercises(selectedDayKey, chosen);
      haptics.setComplete();
      const addedCount = chosen.length;
      setSelectedPresetNames([]);
      setMultiSelectMode(false);
      setShowLibraryModal(false);
      showToast(
        t(
          `${addedCount} gerakan berhasil ditambahkan ke hari ${dayLabel}.`,
          `${addedCount} exercises added to ${dayLabel}.`
        )
      );
    } catch (err) {
      setLibraryErrorMsg(
        err instanceof Error
          ? err.message
          : t('Gagal menambahkan gerakan terpilih.', 'Failed to add selected exercises.')
      );
    } finally {
      setBatchAdding(false);
    }
  };

  const handleQuickAddPreset = async (preset: Omit<ExerciseItem, 'id'>) => {
    if (addingPresetName !== null || batchAdding) return;
    setAddingPresetName(preset.name);
    setLibraryErrorMsg(null);
    try {
      await onAddExercise(selectedDayKey, preset);
      setShowLibraryModal(false);
      showToast(
        t(
          `"${preset.name}" ditambahkan ke hari ${dayLabel}.`,
          `"${preset.name}" added to ${dayLabel}.`
        )
      );
    } catch (err) {
      setLibraryErrorMsg(
        err instanceof Error
          ? err.message
          : t('Gagal menambahkan gerakan.', 'Failed to add exercise.')
      );
    } finally {
      setAddingPresetName(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            aria-hidden="true"
            className="mb-2 block h-[3px] w-10 rounded-full bg-pulse"
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            {t('Daftar & Pustaka Gerakan', 'Exercises & Movement Library')}
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {t(
              'Susun gerakan berbasis repetisi beban, gerakan tanpa alat, maupun gerakan timer seperti Plank dan Incline Walk.',
              'Configure rep-based lifting, bodyweight movements, or timed exercises like Plank and Incline Walk.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenLibrary}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#13161C]/85 px-4 py-2.5 text-xs font-bold text-[#F4F5F7] transition-colors hover:border-pulse/60 hover:text-pulse active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-4 w-4 text-pulse" />
            {t('Pustaka Gerakan', 'Exercise Library')}
          </button>

          <button
            type="button"
            onClick={handleOpenNewForm}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-pulse px-4 py-2.5 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t('Buat Gerakan Baru', 'New Custom Exercise')}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/15 px-4 py-3 text-sm font-medium text-[#86EFAC]">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-[#DC2626]/45 bg-[#DC2626]/15 px-4 py-3 text-sm font-medium text-[#FCA5A5]">
          {errorMsg}
        </div>
      )}

      {/* Day Tabs */}
      <div className="glass-surface-subtle no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/12 p-1.5">
        {DAY_LIST.map((day) => {
          const active = selectedDayKey === day.key;
          const count = schedules[day.key]?.exercises.length || 0;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => {
                if (!active) haptics.tabSwitch();
                onSelectDayKey(day.key);
              }}
              className={`relative isolate min-h-[40px] flex-1 rounded-lg px-3 py-2 text-xs transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'text-pulse-fg font-bold'
                  : 'font-semibold text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : SHARED_IDS.exerciseDayPill}
                  transition={TAB_INDICATOR_SPRING}
                  style={{ borderRadius: 8 }}
                  className="pointer-events-none absolute inset-0 z-0 bg-pulse"
                />
              )}
              <span className="relative z-10">
                {DAY_LABELS[lang][day.key].label} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Add / Edit Custom Exercise Popup Modal */}
      <GlassModal
        open={showCustomForm}
        onClose={handleCloseForm}
        title={
          editingId
            ? t('Edit Gerakan', 'Edit Exercise')
            : `${t('Tambah Gerakan Baru', 'Add New Exercise')} — ${dayLabel}`
        }
        subtitle={t(
          'Pilih mode repetisi atau timer durasi, lalu atur detail target latihanmu.',
          'Pick sets & reps or duration timer mode, then customize your workout targets.'
        )}
        maxWidthClass="max-w-2xl"
        accentBorderClass="border-pulse/35"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">

          {/* Tracking Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#9CA3AF]">
              {t('Mode Pelacakan Gerakan', 'Exercise Tracking Mode')}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSwitchTrackingMode('reps')}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  formState.trackingMode === 'reps'
                    ? 'border-pulse bg-pulse/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <Repeat
                  className={`h-4 w-4 shrink-0 ${
                    formState.trackingMode === 'reps' ? 'text-pulse' : 'text-[#6B7280]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F4F5F7]">
                    {t('Set & Repetisi', 'Sets & Reps')}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {t('Angkat beban, Push-Up, Pull-Up, dll.', 'Weightlifting, Push-Ups, Pull-Ups, etc.')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTrackingMode('timer')}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  formState.trackingMode === 'timer'
                    ? 'border-[#38BDF8] bg-[#38BDF8]/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <Timer
                  className={`h-4 w-4 shrink-0 ${
                    formState.trackingMode === 'timer' ? 'text-[#38BDF8]' : 'text-[#6B7280]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F4F5F7]">
                    {t('Timer Durasi', 'Duration Timer')}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {t('Plank, Incline Walk, Lari, Wall Sit, dll.', 'Plank, Incline Walk, Running, Wall Sit, etc.')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                {t('Nama Gerakan', 'Exercise Name')}
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder={
                  formState.trackingMode === 'timer'
                    ? t('Misal: Plank / Incline Walk', 'e.g. Plank / Incline Walk')
                    : t('Misal: Push-Up / Bench Press', 'e.g. Push-Up / Bench Press')
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                {t('Kelompok Otot', 'Muscle Group')}
              </label>
              <select
                value={formState.muscleGroup}
                onChange={(e) =>
                  setFormState({ ...formState, muscleGroup: e.target.value as MuscleGroup })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
              >
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>
                    {MUSCLE_LABELS[lang][m]}
                  </option>
                ))}
              </select>
            </div>

            {/* No-Weight / Bodyweight Toggle */}
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Dumbbell className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                  <div>
                    <p className="text-xs font-bold text-[#F4F5F7]">
                      {t('Tanpa Beban / Alat (Bodyweight)', 'No Weight / Bodyweight')}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {t(
                        'Aktifkan untuk menyembunyikan kolom beban (kg) saat berlatih.',
                        'Enable to hide the Weight (kg) column while logging.'
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!formState.usesWeight}
                  onClick={() => handleToggleUsesWeight(!formState.usesWeight)}
                  className={`min-h-[38px] rounded-lg px-3.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    !formState.usesWeight
                      ? 'bg-pulse text-pulse-fg'
                      : 'border border-white/15 bg-[#1A1E26] text-[#D1D5DB] hover:border-white/30'
                  }`}
                >
                  {!formState.usesWeight
                    ? t('Tanpa Beban: Aktif', 'No Weight: On')
                    : t('Pakai Beban (kg)', 'Uses Weight (kg)')}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                {t('Alat / Peralatan', 'Equipment')}
              </label>
              <input
                type="text"
                maxLength={40}
                value={formState.equipment}
                onChange={(e) => setFormState({ ...formState, equipment: e.target.value })}
                placeholder={t(
                  'Tanpa Alat, Treadmill, Barbel, Dumbbell',
                  'No Equipment, Treadmill, Barbell, Dumbbell'
                )}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
              />
            </div>

            {formState.trackingMode === 'reps' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Target Set', 'Target Sets')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formState.targetSets}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        targetSets: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-pulse focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Target Reps', 'Target Reps')}
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={formState.targetReps}
                    onChange={(e) => setFormState({ ...formState, targetReps: e.target.value })}
                    placeholder="8-12"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Set', 'Sets')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formState.targetSets}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        targetSets: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Menit', 'Minutes')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formState.durationMinutes}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        durationMinutes: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Detik', 'Seconds')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formState.durationSeconds}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        durationSeconds: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {formState.trackingMode === 'timer' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">
                  {t('Arah Timer Bawaan', 'Default Timer Mode')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, timerDirection: 'countdown' })}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${
                      formState.timerDirection === 'countdown'
                        ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#F4F5F7]'
                        : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5 text-[#38BDF8]" />
                    {t('Hitung Mundur', 'Countdown')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, timerDirection: 'countup' })}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${
                      formState.timerDirection === 'countup'
                        ? 'border-pulse bg-pulse/15 text-[#F4F5F7]'
                        : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 text-pulse" />
                    {t('Hitung Maju (Stopwatch)', 'Count-Up (Stopwatch)')}
                  </button>
                </div>
              </div>
            )}

            {formState.usesWeight && (
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                  {t('Beban Awal (kg)', 'Starting Weight (kg)')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formState.targetWeightKg}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      targetWeightKg: e.target.value.replace(/[^0-9.,]/g, ''),
                    })
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-pulse focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                {t('Durasi Istirahat Antar Set (detik)', 'Rest Between Sets (seconds)')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formState.restSeconds}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    restSeconds: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-pulse focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
              {t('Catatan Teknik (Opsional)', 'Form Notes (Optional)')}
            </label>
            <input
              type="text"
              maxLength={200}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder={t(
                'Misal: Tahan posisi lurus, atau incline 10% kecepatan 5 km/jam.',
                'e.g. Keep a straight line, or 10% incline at 5 km/h.'
              )}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
            />
          </div>

          {formErrorMsg && (
            <p className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/15 px-3 py-2 text-xs font-medium text-[#FCA5A5]">
              {formErrorMsg}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseForm}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:bg-white/5"
            >
              {t('Batal', 'Cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-pulse px-5 py-2 text-xs font-bold text-pulse-fg hover:brightness-105 active:scale-[0.98]"
            >
              {editingId ? t('Simpan Perubahan', 'Save Changes') : t('Tambahkan Gerakan', 'Add Exercise')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Scheduled Movements for Selected Day */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 font-display text-xl font-bold text-[#F4F5F7]">
            {t('Gerakan Terjadwal', 'Scheduled Exercises')} — {dayLabel} ({schedule.focusTitle})
          </h2>
          <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-[#9CA3AF]">
            {schedule.exercises.length}/30 {t('Gerakan', 'Exercises')}
          </span>
        </div>

        {schedule.exercises.length === 0 ? (
          <div className="glass-surface rounded-2xl border border-white/12 p-6 text-center space-y-4">
            <p className="mx-auto max-w-md text-sm text-[#9CA3AF]">
              {t(
                `Belum ada gerakan pada hari ${dayLabel}. Pilih cepat dari pop-up Pustaka Gerakan atau buat gerakan kustom baru.`,
                `No exercises scheduled for ${dayLabel}. Pick quickly from the Exercise Library pop-up or create a custom exercise.`
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenLibrary}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#13161C]/85 px-4 py-2.5 text-xs font-bold text-[#F4F5F7] transition-colors hover:border-pulse/60 hover:text-pulse active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <BookOpen className="h-4 w-4 text-pulse" />
                {t('Buka Pustaka Gerakan', 'Open Exercise Library')}
              </button>
              <button
                type="button"
                onClick={handleOpenNewForm}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-pulse px-4 py-2.5 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                {t('Buat Gerakan Baru', 'New Custom Exercise')}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-surface divide-y divide-white/10 rounded-2xl border border-white/12">
            {schedule.exercises.map((ex, idx) => {
              const mode = resolveExerciseTrackingMode(ex);
              const usesWeight = resolveExerciseUsesWeight(ex);
              const targetDur = resolveTargetDurationSeconds(ex);
              return (
                <div
                  key={ex.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F4F5F7]">
                      <span className="mr-2 font-mono text-xs text-pulse">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      {ex.name}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {MUSCLE_LABELS[lang][ex.muscleGroup]} · {ex.equipment} ·{' '}
                      {mode === 'timer' ? (
                        <span className="font-mono tabular-nums text-[#38BDF8]">
                          {t('Timer', 'Timer')} {ex.targetSets}×{formatCompactDuration(targetDur, lang)}
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums">
                          {ex.targetSets}×{ex.targetReps}
                        </span>
                      )}
                      {usesWeight ? (
                        <>
                          {' '}
                          · <span className="font-mono tabular-nums">{ex.targetWeightKg} kg</span>
                        </>
                      ) : (
                        <> · {t('Tanpa Beban', 'Bodyweight')}</>
                      )}{' '}
                      · {t('Istirahat', 'Rest')} {ex.restSeconds}
                      {secUnit}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label={`${t('Geser ke atas', 'Move up')}: ${ex.name}`}
                      onClick={() => onMoveExercise(selectedDayKey, ex.id, 'up')}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7] disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === schedule.exercises.length - 1}
                      aria-label={`${t('Geser ke bawah', 'Move down')}: ${ex.name}`}
                      onClick={() => onMoveExercise(selectedDayKey, ex.id, 'down')}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7] disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${ex.name}`}
                      onClick={() => handleOpenEditForm(ex)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#D1D5DB] hover:border-pulse"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t('Hapus', 'Delete')} ${ex.name}`}
                      onClick={() => setDeleteTarget(ex)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:border-[#DC2626]/60 hover:text-[#FCA5A5]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Curated Exercise Library Popup Modal */}
      <GlassModal
        open={showLibraryModal}
        onClose={handleCloseLibrary}
        title={`${t('Pustaka Gerakan Siap Pakai', 'Ready-to-Use Exercise Library')} — ${dayLabel}`}
        subtitle={t(
          'Cari, filter otot & alat, lalu tambah langsung satu per satu atau aktifkan Pilih Banyak.',
          'Search, filter by muscle & equipment, and quick-add individually or switch on Multi-Select.'
        )}
        maxWidthClass="max-w-3xl"
        accentBorderClass="border-pulse/30"
      >
        <div className="space-y-4">
          {libraryErrorMsg && (
            <p className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/15 px-3.5 py-2.5 text-xs font-medium text-[#FCA5A5]">
              {libraryErrorMsg}
            </p>
          )}

          {/* Search & Multi-Select Mode Toolbar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Cari nama gerakan atau alat...', 'Search exercise or equipment...')}
                className="h-11 w-full rounded-xl border border-white/12 bg-[#0A0B0E]/85 pl-10 pr-10 text-sm text-[#F4F5F7] placeholder:text-[#6B7280] focus:border-pulse focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label={t('Hapus pencarian', 'Clear search')}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/10 hover:text-[#F4F5F7]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.toggle();
                setMultiSelectMode((prev) => {
                  const next = !prev;
                  if (!next) {
                    setSelectedPresetNames([]);
                    setLibraryErrorMsg(null);
                  }
                  return next;
                });
              }}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                multiSelectMode
                  ? 'border-pulse bg-pulse text-pulse-fg'
                  : 'border-white/15 bg-[#0A0B0E]/85 text-[#D1D5DB] hover:border-pulse/50 hover:text-pulse'
              }`}
            >
              {multiSelectMode ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>{t('Pilih Banyak', 'Multi-Select')}</span>
            </button>
          </div>

          {/* Muscle Group Filter Row */}
          <div className="space-y-2">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap">
              {(['Semua', ...MUSCLE_GROUPS] as const).map((group) => {
                const active = muscleFilter === group;
                const groupLabel =
                  group === 'Semua' ? t('Semua Otot', 'All Muscles') : MUSCLE_LABELS[lang][group];
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setMuscleFilter(group)}
                    className={`min-h-[36px] shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-pulse text-pulse-fg font-bold'
                        : 'border border-white/10 bg-[#0A0B0E]/75 text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {groupLabel}
                  </button>
                );
              })}
            </div>

            {/* Equipment Filter Row */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap">
              {EQUIPMENT_FILTERS.map((eq) => {
                const active = equipmentFilter === eq.id;
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setEquipmentFilter(eq.id)}
                    className={`min-h-[34px] shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'border border-pulse/60 bg-pulse/18 text-pulse font-bold'
                        : 'border border-white/10 bg-[#0A0B0E]/60 text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {t(eq.labelId, eq.labelEn)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Match Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
            <span className="font-mono tabular-nums">
              {t(
                `${filteredLibrary.length} dari ${EXERCISE_LIBRARY.length} gerakan tersedia`,
                `${filteredLibrary.length} of ${EXERCISE_LIBRARY.length} exercises shown`
              )}
            </span>
            <span className="font-mono tabular-nums">
              {t(
                `Sisa slot ${dayLabel}: ${remainingDaySlots}/30`,
                `${dayLabel} slots left: ${remainingDaySlots}/30`
              )}
            </span>
          </div>

          {/* Preset Exercise Grid */}
          {filteredLibrary.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#0A0B0E]/65 p-6 text-center space-y-3">
              <p className="text-sm text-[#9CA3AF]">
                {t(
                  'Tidak ada gerakan yang cocok dengan pencarian, filter otot, atau alat ini.',
                  'No movements match your search, muscle group, or equipment filter.'
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMuscleFilter('Semua');
                  setEquipmentFilter('all');
                }}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-[#F4F5F7] hover:border-pulse hover:text-pulse"
              >
                {t('Reset Pencarian & Filter', 'Reset Search & Filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredLibrary.map((preset) => {
                const mode = resolveExerciseTrackingMode(preset);
                const isAddingThis = addingPresetName === preset.name;
                const isAlreadyScheduled = scheduledNameSet.has(preset.name.toLowerCase());
                const isSelected = selectedPresetNames.includes(preset.name);

                if (multiSelectMode) {
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={batchAdding}
                      onClick={() => handleToggleSelectPreset(preset.name)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                        isSelected
                          ? 'border-pulse bg-pulse/12'
                          : 'border-white/10 bg-[#0A0B0E]/75 hover:border-white/25'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F4F5F7]">
                          {preset.name}
                        </p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          {MUSCLE_LABELS[lang][preset.muscleGroup]} · {preset.equipment} ·{' '}
                          <span
                            className={`font-mono tabular-nums ${
                              mode === 'timer' ? 'text-[#38BDF8]' : ''
                            }`}
                          >
                            {mode === 'timer'
                              ? `${t('Timer', 'Timer')} ${preset.targetSets}×${formatCompactDuration(
                                  resolveTargetDurationSeconds(preset),
                                  lang
                                )}`
                              : `${preset.targetSets}×${preset.targetReps}`}
                          </span>
                          {isAlreadyScheduled && (
                            <span className="text-pulse"> · {t('Sudah di jadwal', 'Scheduled')}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? 'border-pulse bg-pulse text-pulse-fg'
                            : 'border-white/20 bg-[#13161C] text-transparent'
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={preset.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E]/75 p-3.5 transition-colors hover:border-white/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#F4F5F7]">{preset.name}</p>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {MUSCLE_LABELS[lang][preset.muscleGroup]} · {preset.equipment} ·{' '}
                        <span
                          className={`font-mono tabular-nums ${
                            mode === 'timer' ? 'text-[#38BDF8]' : ''
                          }`}
                        >
                          {mode === 'timer'
                            ? `${t('Timer', 'Timer')} ${preset.targetSets}×${formatCompactDuration(
                                resolveTargetDurationSeconds(preset),
                                lang
                              )}`
                            : `${preset.targetSets}×${preset.targetReps}`}
                        </span>
                        {isAlreadyScheduled && (
                          <span className="text-pulse"> · {t('Sudah di jadwal', 'Scheduled')}</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={addingPresetName !== null || remainingDaySlots === 0}
                      onClick={() => handleQuickAddPreset(preset)}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-pulse/40 bg-pulse/10 px-3 py-2 text-xs font-bold text-pulse transition-colors hover:bg-pulse hover:text-pulse-fg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isAddingThis ? t('Menambah...', 'Adding...') : t('Tambah', 'Add')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Batch Action Bar when Multi-Select is active */}
          {multiSelectMode && (
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pulse/35 bg-[#13161C]/95 p-3 shadow-lg">
              <div className="text-xs">
                <p className="font-bold text-[#F4F5F7] font-mono tabular-nums">
                  {t(
                    `${selectedPresetNames.length} gerakan dipilih`,
                    `${selectedPresetNames.length} exercises selected`
                  )}
                </p>
                <p className="text-[11px] text-[#9CA3AF] font-mono tabular-nums">
                  {t(
                    `Kapasitas tersisa: ${remainingDaySlots} slot`,
                    `Remaining capacity: ${remainingDaySlots} slots`
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedPresetNames.length > 0 && (
                  <button
                    type="button"
                    disabled={batchAdding}
                    onClick={() => {
                      setSelectedPresetNames([]);
                      setLibraryErrorMsg(null);
                    }}
                    className="min-h-[40px] rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[#D1D5DB] hover:bg-white/5 disabled:opacity-50 whitespace-nowrap"
                  >
                    {t('Reset Pilihan', 'Clear')}
                  </button>
                )}
                <button
                  type="button"
                  disabled={batchAdding || selectedPresetNames.length === 0}
                  onClick={handleBatchAddPresets}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-pulse px-4 py-2 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {batchAdding
                    ? t('Menambahkan...', 'Adding...')
                    : t(
                        `Tambahkan (${selectedPresetNames.length})`,
                        `Add (${selectedPresetNames.length})`
                      )}
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassModal>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={t('Hapus Gerakan?', 'Delete Exercise?')}
        itemName={deleteTarget?.name || ''}
        description={t(
          `Gerakan ini akan dihapus dari jadwal hari ${dayLabel}. Riwayat latihan yang sudah tersimpan sebelumnya tidak akan hilang.`,
          `This exercise will be removed from ${dayLabel}'s schedule. Previously saved workout logs remain intact.`
        )}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const removedName = deleteTarget.name;
          await onRemoveExercise(selectedDayKey, deleteTarget.id);
          showToast(
            t(
              `Gerakan "${removedName}" dihapus dari ${dayLabel}.`,
              `Exercise "${removedName}" removed from ${dayLabel}.`
            )
          );
        }}
      />
    </div>
  );
});
