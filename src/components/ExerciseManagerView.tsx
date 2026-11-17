import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/presets';
import { DAY_LABELS, MUSCLE_LABELS, useI18n } from '../lib/i18n';
import {
  DAY_LIST,
  DayKey,
  DaySchedule,
  ExerciseItem,
  MUSCLE_GROUPS,
  MuscleGroup,
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

const EMPTY_FORM: Omit<ExerciseItem, 'id'> = {
  name: '',
  muscleGroup: 'Dada',
  equipment: 'Barbel',
  targetSets: 3,
  targetReps: '10-12',
  targetWeightKg: 20,
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
  const [formState, setFormState] = useState<Omit<ExerciseItem, 'id'>>(EMPTY_FORM);
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

  const handleOpenEditForm = (ex: ExerciseItem) => {
    setEditingId(ex.id);
    setFormState({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
    });
    setShowCustomForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const cleanPayload: Omit<ExerciseItem, 'id'> = {
      name: formState.name.trim().slice(0, 60),
      muscleGroup: formState.muscleGroup,
      equipment: formState.equipment.trim().slice(0, 40) || t('Bebas', 'Free Weights'),
      targetSets: Math.max(1, Math.min(12, Number(formState.targetSets) || 3)),
      targetReps: formState.targetReps.trim().slice(0, 20) || '10',
      targetWeightKg: Math.max(0, Math.min(999, Number(formState.targetWeightKg) || 0)),
      restSeconds: Math.max(15, Math.min(600, Number(formState.restSeconds) || 60)),
      notes: formState.notes.trim().slice(0, 200),
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
              'Susun variasi gerakan, target set, repetisi, beban awal, dan waktu istirahat untuk setiap hari latihan.',
              'Configure exercises, target sets, reps, starting weight, and rest duration for each training day.'
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
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-[#13161C] p-1.5">
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

      {/* Add / Edit Custom Exercise Drawer */}
      {showCustomForm && (
        <form
          onSubmit={handleSubmitForm}
          className="rounded-2xl border border-[#C8FF2E]/40 bg-[#13161C] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
              {editingId
                ? t('Edit Gerakan', 'Edit Exercise')
                : `${t('Tambah Gerakan Baru', 'Add New Exercise')} — ${dayLabel}`}
            </h2>
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/5 hover:text-[#F4F5F7]"
            >
              <X className="h-5 w-5" />
            </button>
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
                placeholder={t('Misal: Incline Dumbbell Press', 'e.g. Incline Dumbbell Press')}
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
                  'Barbel, Dumbbell, Mesin, Bodyweight',
                  'Barbell, Dumbbell, Machine, Bodyweight'
                )}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
              />
            </div>

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
                'Misal: Turunkan beban 3 detik, tahan sebentar di bawah.',
                'e.g. Control the eccentric for 3s, pause at the bottom.'
              )}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:bg-white/5"
            >
              {t('Batal', 'Cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
            >
              {editingId ? t('Simpan Perubahan', 'Save Changes') : t('Tambahkan Gerakan', 'Add Exercise')}
            </button>
          </div>
        </form>
      )}

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
          <div className="rounded-2xl border border-white/10 bg-[#13161C] p-6 text-center text-sm text-[#9CA3AF]">
            {t(
              `Belum ada gerakan pada hari ${dayLabel}. Pilih gerakan dari pustaka di bawah atau buat gerakan baru.`,
              `No exercises scheduled for ${dayLabel}. Pick movements from the library below or create a custom one.`
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#13161C]">
            {schedule.exercises.map((ex, idx) => (
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
                    <span className="font-mono tabular-nums">
                      {ex.targetSets}×{ex.targetReps}
                    </span>{' '}
                    · <span className="font-mono tabular-nums">{ex.targetWeightKg} kg</span> ·{' '}
                    {t('Istirahat', 'Rest')} {ex.restSeconds}
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
                    onClick={() => onRemoveExercise(selectedDayKey, ex.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:border-[#DC2626]/60 hover:text-[#FCA5A5]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
          {filteredLibrary.map((preset) => (
            <div
              key={preset.name}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#13161C] p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#F4F5F7]">{preset.name}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {MUSCLE_LABELS[lang][preset.muscleGroup]} · {preset.equipment} ·{' '}
                  <span className="font-mono tabular-nums">
                    {preset.targetSets}×{preset.targetReps}
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
          ))}
        </div>
      </section>
    </div>
  );
}
