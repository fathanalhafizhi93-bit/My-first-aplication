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
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<'Semua' | MuscleGroup>('Semua');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Omit<ExerciseItem, 'id'>>(EMPTY_FORM);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const schedule = schedules[selectedDayKey];
  const dayMeta = DAY_LIST.find((d) => d.key === selectedDayKey)!;

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchMuscle = muscleFilter === 'Semua' || ex.muscleGroup === muscleFilter;
      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q);
      return matchMuscle && matchQuery;
    });
  }, [searchQuery, muscleFilter]);

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
      equipment: formState.equipment.trim().slice(0, 40) || 'Bebas',
      targetSets: Math.max(1, Math.min(12, Number(formState.targetSets) || 3)),
      targetReps: formState.targetReps.trim().slice(0, 20) || '10',
      targetWeightKg: Math.max(0, Math.min(999, Number(formState.targetWeightKg) || 0)),
      restSeconds: Math.max(15, Math.min(600, Number(formState.restSeconds) || 60)),
      notes: formState.notes.trim().slice(0, 200),
    };

    if (editingId) {
      await onUpdateExercise(selectedDayKey, editingId, cleanPayload);
      showToast(`Gerakan "${cleanPayload.name}" diperbarui.`);
    } else {
      await onAddExercise(selectedDayKey, cleanPayload);
      showToast(`"${cleanPayload.name}" ditambahkan ke hari ${dayMeta.label}.`);
    }

    setShowCustomForm(false);
    setEditingId(null);
    setFormState(EMPTY_FORM);
  };

  const handleQuickAddPreset = async (preset: Omit<ExerciseItem, 'id'>) => {
    await onAddExercise(selectedDayKey, preset);
    showToast(`"${preset.name}" ditambahkan ke hari ${dayMeta.label}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            Daftar &amp; Pustaka Gerakan
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Susun variasi gerakan, target set, repetisi, beban awal, dan waktu istirahat untuk
            setiap hari latihan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewForm}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Buat Gerakan Baru
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
              {day.label} ({count})
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
              {editingId ? 'Edit Gerakan' : `Tambah Gerakan Baru — ${dayMeta.label}`}
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
                Nama Gerakan
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Misal: Incline Dumbbell Press"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                Kelompok Otot
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
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                Alat / Peralatan
              </label>
              <input
                type="text"
                maxLength={40}
                value={formState.equipment}
                onChange={(e) => setFormState({ ...formState, equipment: e.target.value })}
                placeholder="Barbel, Dumbbell, Mesin, Bodyweight"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">
                  Target Set
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
                  Target Reps
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
                Beban Awal (kg)
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
                Durasi Istirahat Antar Set (detik)
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
              Catatan Teknik (Opsional)
            </label>
            <input
              type="text"
              maxLength={200}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Misal: Turunkan beban 3 detik, tahan sebentar di bawah."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
            >
              {editingId ? 'Simpan Perubahan' : 'Tambahkan Gerakan'}
            </button>
          </div>
        </form>
      )}

      {/* Scheduled Movements for Selected Day */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            Gerakan Terjadwal — {dayMeta.label} ({schedule.focusTitle})
          </h2>
          <span className="font-mono text-xs tabular-nums text-[#9CA3AF]">
            {schedule.exercises.length}/30 Gerakan
          </span>
        </div>

        {schedule.exercises.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#13161C] p-6 text-center text-sm text-[#9CA3AF]">
            Belum ada gerakan pada hari {dayMeta.label}. Pilih gerakan dari pustaka di bawah atau
            buat gerakan baru.
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
                    {ex.muscleGroup} · {ex.equipment} ·{' '}
                    <span className="font-mono tabular-nums">
                      {ex.targetSets}×{ex.targetReps}
                    </span>{' '}
                    · <span className="font-mono tabular-nums">{ex.targetWeightKg} kg</span> ·
                    Istirahat {ex.restSeconds}d
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    aria-label={`Geser ${ex.name} ke atas`}
                    onClick={() => onMoveExercise(selectedDayKey, ex.id, 'up')}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === schedule.exercises.length - 1}
                    aria-label={`Geser ${ex.name} ke bawah`}
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
                    aria-label={`Hapus ${ex.name}`}
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
            Pustaka Gerakan Siap Pakai
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama gerakan atau alat..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#13161C] pl-9 pr-3 text-sm text-[#F4F5F7] placeholder:text-[#6B7280] focus:border-[#C8FF2E] focus:outline-none"
            />
          </div>
        </div>

        {/* Muscle Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['Semua', ...MUSCLE_GROUPS] as const).map((group) => {
            const active = muscleFilter === group;
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
                {group}
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
                  {preset.muscleGroup} · {preset.equipment} ·{' '}
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
                Tambah
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
