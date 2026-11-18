import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Dumbbell,
  Edit3,
  Plus,
  Repeat,
  Search,
  Timer,
  Trash2,
} from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/presets';
import { formatCompactDuration } from '../lib/dateUtils';
import { DAY_LABELS, MUSCLE_LABELS, useI18n } from '../lib/i18n';
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

interface ExerciseFormState {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  trackingMode: ExerciseTrackingMode;
  usesWeight: boolean;
  timerDirection: TimerDirection;
  targetSets: number;
  targetReps: string;
  targetWeightKg: number;
  durationMinutes: number;
  durationSeconds: number;
  restSeconds: number;
  notes: string;
}

const EMPTY_FORM: ExerciseFormState = {
  name: '',
  muscleGroup: 'Dada',
  equipment: 'Barbel',
  trackingMode: 'reps',
  usesWeight: true,
  timerDirection: 'countdown',
  targetSets: 3,
  targetReps: '10-12',
  targetWeightKg: 20,
  durationMinutes: 1,
  durationSeconds: 0,
  restSeconds: 90,
  notes: '',
};

export function ExerciseManagerView({
  selectedDayKey,
  onSelectDayKey,
  schedules,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onMoveExercise,
}: ExerciseManagerViewProps) {
  const { lang, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<'Semua' | MuscleGroup>('Semua');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExerciseFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const schedule = schedules[selectedDayKey];
  const dayLabel = DAY_LABELS[lang][selectedDayKey].label;
  const secUnit = t('d', 's');

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchMuscle = muscleFilter === 'Semua' || ex.muscleGroup === muscleFilter;
      const localizedMuscle = MUSCLE_LABELS[lang][ex.muscleGroup].toLowerCase();
      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        localizedMuscle.includes(q);
      return matchMuscle && matchQuery;
    });
  }, [searchQuery, muscleFilter, lang]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setShowCustomForm(true);
  };

  const handleCloseForm = () => {
    setShowCustomForm(false);
    setEditingId(null);
    setFormState(EMPTY_FORM);
  };

  const handleOpenEditForm = (ex: ExerciseItem) => {
    const mode = resolveExerciseTrackingMode(ex);
    const usesWeight = resolveExerciseUsesWeight(ex);
    const totalDur = resolveTargetDurationSeconds(ex);
    setEditingId(ex.id);
    setFormState({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      trackingMode: mode,
      usesWeight,
      timerDirection: ex.timerDirection === 'countup' ? 'countup' : 'countdown',
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      durationMinutes: Math.floor(totalDur / 60),
      durationSeconds: totalDur % 60,
      restSeconds: ex.restSeconds,
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
          targetWeightKg: 0,
          targetSets: prev.targetSets === 3 ? 1 : prev.targetSets,
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
      return {
        ...prev,
        usesWeight: nextUsesWeight,
        equipment: nextEquipment,
        targetWeightKg: nextUsesWeight ? prev.targetWeightKg || 10 : 0,
      };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const totalDur = Math.max(
      5,
      Math.min(
        10800,
        (Math.max(0, Number(formState.durationMinutes) || 0) * 60) +
          Math.max(0, Math.min(59, Number(formState.durationSeconds) || 0))
      )
    );

    const formattedTargetText =
      formState.trackingMode === 'timer'
        ? formatCompactDuration(totalDur, lang)
        : formState.targetReps.trim().slice(0, 20) || '10';

    const cleanPayload: Omit<ExerciseItem, 'id'> = {
      name: formState.name.trim().slice(0, 60),
      muscleGroup: formState.muscleGroup,
      equipment:
        formState.equipment.trim().slice(0, 40) ||
        (formState.usesWeight ? t('Bebas', 'Free Weights') : t('Tanpa Alat', 'No Equipment')),
      targetSets: Math.max(1, Math.min(12, Number(formState.targetSets) || 1)),
      targetReps: formattedTargetText,
      targetWeightKg: formState.usesWeight
        ? Math.max(0, Math.min(999, Number(formState.targetWeightKg) || 0))
        : 0,
      restSeconds: Math.max(15, Math.min(600, Number(formState.restSeconds) || 60)),
      notes: formState.notes.trim().slice(0, 200),
      trackingMode: formState.trackingMode,
      usesWeight: formState.usesWeight,
      timerDirection: formState.timerDirection,
      targetDurationSeconds: totalDur,
    };

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
  };

  const handleQuickAddPreset = async (preset: Omit<ExerciseItem, 'id'>) => {
    await onAddExercise(selectedDayKey, preset);
    showToast(
      t(
        `"${preset.name}" ditambahkan ke hari ${dayLabel}.`,
        `"${preset.name}" added to ${dayLabel}.`
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
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

        <button
          type="button"
          onClick={handleOpenNewForm}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t('Buat Gerakan Baru', 'New Custom Exercise')}
        </button>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/15 px-4 py-3 text-sm font-medium text-[#86EFAC]">
          {feedbackMsg}
        </div>
      )}

      {/* Day Tabs */}
      <div className="glass-surface-subtle flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/12 p-1.5">
        {DAY_LIST.map((day) => {
          const active = selectedDayKey === day.key;
          const count = schedules[day.key]?.exercises.length || 0;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDayKey(day.key)}
              className={`min-h-[40px] flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#C8FF2E] text-[#0A0B0E] font-bold'
                  : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              {DAY_LABELS[lang][day.key].label} ({count})
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
        accentBorderClass="border-[#C8FF2E]/35"
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
                    ? 'border-[#C8FF2E] bg-[#C8FF2E]/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <Repeat
                  className={`h-4 w-4 shrink-0 ${
                    formState.trackingMode === 'reps' ? 'text-[#C8FF2E]' : 'text-[#6B7280]'
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
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
                      ? 'bg-[#C8FF2E] text-[#0A0B0E]'
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
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
              />
            </div>

            {formState.trackingMode === 'reps' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Target Set', 'Target Sets')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formState.targetSets}
                    onChange={(e) =>
                      setFormState({ ...formState, targetSets: Number(e.target.value) })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
                    type="number"
                    min={1}
                    max={12}
                    value={formState.targetSets}
                    onChange={(e) =>
                      setFormState({ ...formState, targetSets: Number(e.target.value) })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                    {t('Menit', 'Minutes')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formState.durationMinutes}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        durationMinutes: Math.max(0, Math.min(180, Number(e.target.value) || 0)),
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
                    type="number"
                    min={0}
                    max={59}
                    value={formState.durationSeconds}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        durationSeconds: Math.max(0, Math.min(59, Number(e.target.value) || 0)),
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
                        ? 'border-[#C8FF2E] bg-[#C8FF2E]/15 text-[#F4F5F7]'
                        : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 text-[#C8FF2E]" />
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
                  type="number"
                  min={0}
                  max={999}
                  step="0.5"
                  value={formState.targetWeightKg}
                  onChange={(e) =>
                    setFormState({ ...formState, targetWeightKg: Number(e.target.value) })
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                {t('Durasi Istirahat Antar Set (detik)', 'Rest Between Sets (seconds)')}
              </label>
              <input
                type="number"
                min={15}
                max={600}
                step="15"
                value={formState.restSeconds}
                onChange={(e) =>
                  setFormState({ ...formState, restSeconds: Number(e.target.value) })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
            />
          </div>

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
              className="min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105 active:scale-[0.98]"
            >
              {editingId ? t('Simpan Perubahan', 'Save Changes') : t('Tambahkan Gerakan', 'Add Exercise')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Scheduled Movements for Selected Day */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            {t('Gerakan Terjadwal', 'Scheduled Exercises')} — {dayLabel} ({schedule.focusTitle})
          </h2>
          <span className="font-mono text-xs tabular-nums text-[#9CA3AF]">
            {schedule.exercises.length}/30 {t('Gerakan', 'Exercises')}
          </span>
        </div>

        {schedule.exercises.length === 0 ? (
          <div className="glass-surface rounded-2xl border border-white/12 p-6 text-center text-sm text-[#9CA3AF]">
            {t(
              `Belum ada gerakan pada hari ${dayLabel}. Pilih gerakan dari pustaka di bawah atau buat gerakan baru.`,
              `No exercises scheduled for ${dayLabel}. Pick movements from the library below or create a custom one.`
            )}
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
                      <span className="mr-2 font-mono text-xs text-[#C8FF2E]">
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
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#D1D5DB] hover:border-[#C8FF2E]"
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

      {/* Curated Exercise Library */}
      <section className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-[#F4F5F7]">
            {t('Pustaka Gerakan Siap Pakai', 'Ready-to-Use Exercise Library')}
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari nama gerakan atau alat...', 'Search exercise or equipment...')}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#13161C] pl-9 pr-3 text-sm text-[#F4F5F7] placeholder:text-[#6B7280] focus:border-[#C8FF2E] focus:outline-none"
            />
          </div>
        </div>

        {/* Muscle Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['Semua', ...MUSCLE_GROUPS] as const).map((group) => {
            const active = muscleFilter === group;
            const groupLabel =
              group === 'Semua' ? t('Semua', 'All') : MUSCLE_LABELS[lang][group];
            return (
              <button
                key={group}
                type="button"
                onClick={() => setMuscleFilter(group)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                    : 'border border-white/10 bg-[#13161C] text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                {groupLabel}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredLibrary.map((preset) => {
            const mode = resolveExerciseTrackingMode(preset);
            return (
              <div
                key={preset.name}
                className="glass-surface flex items-center justify-between gap-3 rounded-2xl border border-white/12 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#F4F5F7]">{preset.name}</p>
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
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAddPreset(preset)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 px-3 py-2 text-xs font-bold text-[#C8FF2E] hover:bg-[#C8FF2E] hover:text-[#0A0B0E] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('Tambah', 'Add')}
                </button>
              </div>
            );
          })}
        </div>
      </section>

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
}
