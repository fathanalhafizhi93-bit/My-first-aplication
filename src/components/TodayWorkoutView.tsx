import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Minus,
  Plus,
  Timer,
} from 'lucide-react';
import {
  DAY_LIST,
  DayKey,
  DaySchedule,
  WorkoutLogEntry,
} from '../types/gym';
import { formatIndonesianDate } from '../lib/dateUtils';

interface TodayWorkoutViewProps {
  todayDayKey: DayKey;
  schedules: Record<DayKey, DaySchedule>;
  todayEntries: WorkoutLogEntry[];
  onToggleSetComplete: (exerciseId: string, setNumber: number) => Promise<void>;
  onUpdateSetMetrics: (
    exerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number
  ) => Promise<void>;
  onAddSet: (exerciseId: string) => Promise<void>;
  onRemoveSet: (exerciseId: string) => Promise<void>;
  onStartRestTimer: (seconds: number, exerciseName: string) => void;
  onOpenExerciseManager: (dayKey: DayKey) => void;
  onOpenScheduleManager: () => void;
}

export function TodayWorkoutView({
  todayDayKey,
  schedules,
  todayEntries,
  onToggleSetComplete,
  onUpdateSetMetrics,
  onAddSet,
  onRemoveSet,
  onStartRestTimer,
  onOpenExerciseManager,
  onOpenScheduleManager,
}: TodayWorkoutViewProps) {
  const [inspectDayKey, setInspectDayKey] = useState<DayKey>(todayDayKey);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [imgFailed, setImgFailed] = useState(false);

  const isViewingToday = inspectDayKey === todayDayKey;
  const activeSchedule = schedules[inspectDayKey];
  const dayMeta = DAY_LIST.find((d) => d.key === inspectDayKey)!;

  const totalSets = todayEntries.reduce((acc, e) => acc + e.sets.length, 0);
  const completedSets = todayEntries.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0
  );
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const totalVolumeKg = todayEntries.reduce(
    (acc, e) =>
      acc +
      e.sets
        .filter((s) => s.completed)
        .reduce((sAcc, s) => sAcc + s.weightKg * s.reps, 0),
    0
  );

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Day Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DAY_LIST.map((day) => {
          const sched = schedules[day.key];
          const isSelected = inspectDayKey === day.key;
          const isToday = day.key === todayDayKey;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setInspectDayKey(day.key)}
              className={`flex min-h-[44px] min-w-[68px] flex-1 flex-col items-center justify-center rounded-xl border px-3 py-2 text-xs transition-colors whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'border-[#C8FF2E] bg-[#C8FF2E] text-[#0A0B0E] font-bold'
                  : 'border-white/10 bg-[#13161C] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
              }`}
            >
              <span className="tracking-wider">{day.shortLabel}</span>
              <span
                className={`mt-0.5 text-[11px] ${
                  isSelected
                    ? 'text-[#0A0B0E]/80 font-semibold'
                    : sched?.isGymDay
                    ? 'text-[#E5E7EB]'
                    : 'text-[#6B7280]'
                }`}
              >
                {isToday ? 'Hari Ini' : sched?.isGymDay ? sched.alarmTime : 'Istirahat'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13161C]">
        {!imgFailed ? (
          <img
            src="/src/assets/images/gym_arena_backdrop_1794848258829.jpg"
            alt="Suasana ruang latihan gym"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1E26] to-[#0A0B0E]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E]/95 via-[#0A0B0E]/80 to-[#0A0B0E]/60" />

        <div className="relative z-10 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#9CA3AF]">
              <span className="font-semibold text-[#C8FF2E]">
                {isViewingToday ? formatIndonesianDate() : `Pratinjau Jadwal ${dayMeta.label}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {activeSchedule.isGymDay
                  ? activeSchedule.alarmEnabled
                    ? `Alarm ${activeSchedule.alarmTime}`
                    : `Jam ${activeSchedule.alarmTime} (Alarm Mati)`
                  : 'Hari Istirahat'}
              </span>
            </div>

            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setInspectDayKey(todayDayKey)}
                className="min-h-[36px] rounded-lg border border-white/15 bg-[#1A1E26] px-3 py-1.5 text-xs font-semibold text-[#F4F5F7] hover:bg-[#222834] whitespace-nowrap"
              >
                Kembali ke Hari Ini
              </button>
            )}
          </div>

          <h1
            className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {activeSchedule.focusTitle}
          </h1>

          {isViewingToday && activeSchedule.isGymDay && (
            <div className="mt-5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-4 text-[#D1D5DB]">
                  <span className="font-mono tabular-nums">
                    {completedSets}/{totalSets} Set Selesai
                  </span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    Volume: {totalVolumeKg.toLocaleString('id-ID')} kg
                  </span>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#C8FF2E]">
                  {progressPct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C8FF2E] transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenExerciseManager(inspectDayKey)}
              className="min-h-[40px] rounded-lg border border-white/15 bg-[#1A1E26] px-4 py-2 text-xs font-semibold text-[#F4F5F7] transition-colors hover:bg-[#242A35] whitespace-nowrap"
            >
              Atur Gerakan ({activeSchedule.exercises.length})
            </button>
            <button
              type="button"
              onClick={onOpenScheduleManager}
              className="min-h-[40px] rounded-lg border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold text-[#D1D5DB] transition-colors hover:bg-white/5 whitespace-nowrap"
            >
              Ubah Jam &amp; Hari Gym
            </button>
          </div>
        </div>
      </section>

      {/* Rest Day State */}
      {!activeSchedule.isGymDay && (
        <div className="rounded-2xl border border-white/10 bg-[#13161C] p-6 text-center sm:p-8">
          <Clock className="mx-auto h-9 w-9 text-[#9CA3AF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F4F5F7]">
            {dayMeta.label} Dijadwalkan Sebagai Hari Istirahat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#9CA3AF]">
            Pemulihan otot sama pentingnya dengan latihan beban. Jika ingin tetap berlatih di hari{' '}
            {dayMeta.label}, ubah status hari ini menjadi Hari Gym di menu Jadwal Hari.
          </p>
          <button
            type="button"
            onClick={onOpenScheduleManager}
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
          >
            Aktifkan Hari Gym
          </button>
        </div>
      )}

      {/* Empty Exercise List for Active Gym Day */}
      {activeSchedule.isGymDay && activeSchedule.exercises.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#13161C] p-8 text-center">
          <Dumbbell className="mx-auto h-9 w-9 text-[#9CA3AF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F4F5F7]">
            Belum Ada Gerakan untuk {dayMeta.label}
          </h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Tambahkan gerakan dari pustaka latihan atau buat gerakan Anda sendiri.
          </p>
          <button
            type="button"
            onClick={() => onOpenExerciseManager(inspectDayKey)}
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
          >
            + Tambah Gerakan Sekarang
          </button>
        </div>
      )}

      {/* Today's Interactive Exercise Logger */}
      {isViewingToday && activeSchedule.isGymDay && todayEntries.length > 0 && (
        <div className="space-y-4">
          {todayEntries.map((entry, index) => {
            const spec = activeSchedule.exercises.find((e) => e.id === entry.exerciseId);
            const doneCount = entry.sets.filter((s) => s.completed).length;
            const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
            const isExpanded = Boolean(expandedNotes[entry.exerciseId]);

            return (
              <article
                key={entry.exerciseId}
                className={`rounded-2xl border bg-[#13161C] p-4 sm:p-6 transition-colors ${
                  allDone ? 'border-[#16A34A]/50' : 'border-white/10'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold tabular-nums text-[#C8FF2E]">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <h2 className="truncate text-lg font-bold text-[#F4F5F7]">
                        {entry.name}
                      </h2>
                    </div>

                    {/* Zero-Pill Metadata */}
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      <span>{entry.muscleGroup}</span>
                      {spec?.equipment && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{spec.equipment}</span>
                        </>
                      )}
                      {spec && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            Target {spec.targetSets}×{spec.targetReps}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            Istirahat {spec.restSeconds}d
                          </span>
                        </>
                      )}
                      <span aria-hidden="true"> · </span>
                      <span
                        className={`font-mono tabular-nums ${
                          allDone ? 'text-[#4ADE80] font-semibold' : 'text-[#D1D5DB]'
                        }`}
                      >
                        {doneCount}/{entry.sets.length} Set
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {spec && (
                      <button
                        type="button"
                        onClick={() => onStartRestTimer(spec.restSeconds, entry.name)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E26] px-3 py-2 text-xs font-semibold text-[#F4F5F7] hover:bg-[#252B36] whitespace-nowrap"
                      >
                        <Timer className="h-3.5 w-3.5 text-[#C8FF2E]" />
                        Istirahat {spec.restSeconds}d
                      </button>
                    )}

                    {spec?.notes && (
                      <button
                        type="button"
                        onClick={() => toggleNotes(entry.exerciseId)}
                        aria-label="Lihat catatan teknik"
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && spec?.notes && (
                  <p className="mt-3 rounded-xl bg-[#0A0B0E]/70 px-3.5 py-2.5 text-xs leading-relaxed text-[#D1D5DB]">
                    {spec.notes}
                  </p>
                )}

                {/* Sets Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        <th className="py-2 pr-2 w-14">Set</th>
                        <th className="py-2 px-2">Beban (kg)</th>
                        <th className="py-2 px-2">Reps</th>
                        <th className="py-2 pl-2 text-right w-20">Selesai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entry.sets.map((setRow) => (
                        <tr
                          key={setRow.setNumber}
                          className={setRow.completed ? 'bg-[#16A34A]/10' : ''}
                        >
                          <td className="py-2.5 pr-2 font-mono text-xs font-bold tabular-nums text-[#9CA3AF]">
                            #{setRow.setNumber}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              max={999}
                              step="0.5"
                              aria-label={`Beban set ${setRow.setNumber} ${entry.name}`}
                              value={setRow.weightKg}
                              onChange={(e) =>
                                onUpdateSetMetrics(
                                  entry.exerciseId,
                                  setRow.setNumber,
                                  parseFloat(e.target.value) || 0,
                                  setRow.reps
                                )
                              }
                              className="h-11 w-24 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              max={999}
                              step="1"
                              aria-label={`Repetisi set ${setRow.setNumber} ${entry.name}`}
                              value={setRow.reps}
                              onChange={(e) =>
                                onUpdateSetMetrics(
                                  entry.exerciseId,
                                  setRow.setNumber,
                                  setRow.weightKg,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="h-11 w-20 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                            />
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              aria-label={`Tandai set ${setRow.setNumber} ${entry.name} selesai`}
                              onClick={() =>
                                onToggleSetComplete(entry.exerciseId, setRow.setNumber)
                              }
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                                setRow.completed
                                  ? 'border-[#16A34A] bg-[#16A34A] text-white'
                                  : 'border-white/15 bg-[#1A1E26] text-[#6B7280] hover:border-[#C8FF2E] hover:text-[#C8FF2E]'
                              }`}
                            >
                              <Check className="h-5 w-5" strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Set Add / Remove Controls */}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAddSet(entry.exerciseId)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:bg-white/5"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#C8FF2E]" />
                      Tambah Set
                    </button>
                    {entry.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveSet(entry.exerciseId)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-[#FCA5A5]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                        Kurangi Set
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Preview Mode when viewing another day */}
      {!isViewingToday && activeSchedule.isGymDay && activeSchedule.exercises.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#13161C] divide-y divide-white/10">
          {activeSchedule.exercises.map((ex, idx) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#F4F5F7]">
                  <span className="mr-2 font-mono text-xs text-[#C8FF2E]">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  {ex.name}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {ex.muscleGroup} · {ex.equipment} · Istirahat {ex.restSeconds}d
                </p>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-[#E5E7EB] shrink-0">
                {ex.targetSets} × {ex.targetReps}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
