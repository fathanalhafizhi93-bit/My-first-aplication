import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
} from 'lucide-react';
import { formatCompactDuration, formatLocalDateKey } from '../lib/dateUtils';
import { DAY_LABELS, MUSCLE_LABELS, useI18n } from '../lib/i18n';
import {
  DAY_LIST,
  resolveExerciseTrackingMode,
  resolveExerciseUsesWeight,
  WorkoutLog,
} from '../types/gym';

interface HistoryProgressViewProps {
  workoutHistory: WorkoutLog[];
  loading: boolean;
  todayDateKey?: string;
  onGoToToday: () => void;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function getIsoWeekKey(date: Date): string {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getLogStats(log: WorkoutLog) {
  let totalSets = 0;
  let completedSets = 0;
  let totalVolume = 0;
  let totalTimedSeconds = 0;

  for (const entry of log.entries) {
    const mode = resolveExerciseTrackingMode(entry);
    const usesWeight = resolveExerciseUsesWeight({
      usesWeight: entry.usesWeight,
      trackingMode: mode,
      targetWeightKg: entry.sets[0]?.weightKg ?? 0,
    });
    for (const set of entry.sets) {
      totalSets += 1;
      if (set.completed) {
        completedSets += 1;
        if (mode === 'timer') {
          totalTimedSeconds += Math.max(0, set.durationSeconds || 0);
        } else if (usesWeight) {
          totalVolume += Math.max(0, set.weightKg) * Math.max(0, set.reps);
        }
      }
    }
  }

  return {
    totalSets,
    completedSets,
    totalVolume: Math.round(totalVolume),
    totalTimedSeconds,
    isFull: log.completed || (totalSets > 0 && completedSets === totalSets),
    isPartial: completedSets > 0 && completedSets < totalSets && !log.completed,
  };
}

export const HistoryProgressView = memo(function HistoryProgressView({
  workoutHistory,
  loading,
  todayDateKey,
  onGoToToday,
}: HistoryProgressViewProps) {
  const { lang, t } = useI18n();
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const todayKey = todayDateKey || formatLocalDateKey();
  const today = useMemo(() => parseDateKey(todayKey), [todayKey]);

  const [viewMonthDate, setViewMonthDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const prevTodayKeyRef = useRef<string>(todayKey);

  useEffect(() => {
    if (prevTodayKeyRef.current !== todayKey) {
      const oldToday = prevTodayKeyRef.current;
      prevTodayKeyRef.current = todayKey;
      setSelectedDateKey((curr) => (curr === oldToday ? todayKey : curr));
    }
  }, [todayKey]);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale]
  );

  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [locale]
  );

  const { logByDate, statsByDate } = useMemo(() => {
    const logs = new Map<string, WorkoutLog>();
    const stats = new Map<string, ReturnType<typeof getLogStats>>();
    for (const log of workoutHistory) {
      logs.set(log.dateKey, log);
      stats.set(log.dateKey, getLogStats(log));
    }
    return { logByDate: logs, statsByDate: stats };
  }, [workoutHistory]);

  const summary = useMemo(() => {
    let completedSessions = 0;
    let totalLoggedDays = 0;
    const activeWeekSet = new Set<string>();
    const currentMonthPrefix = `${viewMonthDate.getFullYear()}-${String(
      viewMonthDate.getMonth() + 1
    ).padStart(2, '0')}`;
    let monthVolume = 0;
    let monthSessions = 0;

    for (const log of workoutHistory) {
      const stats = statsByDate.get(log.dateKey)!;
      if (stats.completedSets > 0) {
        totalLoggedDays += 1;
      }
      if (stats.isFull || stats.completedSets > 0) {
        if (stats.isFull) completedSessions += 1;
        activeWeekSet.add(getIsoWeekKey(parseDateKey(log.dateKey)));
      }
      if (log.dateKey.startsWith(currentMonthPrefix) && stats.completedSets > 0) {
        monthVolume += stats.totalVolume;
        monthSessions += 1;
      }
    }

    let weeklyStreak = 0;
    const cursor = new Date(today);
    if (!activeWeekSet.has(getIsoWeekKey(cursor))) {
      cursor.setDate(cursor.getDate() - 7);
    }
    while (activeWeekSet.has(getIsoWeekKey(cursor))) {
      weeklyStreak += 1;
      cursor.setDate(cursor.getDate() - 7);
    }

    return {
      completedSessions,
      totalLoggedDays,
      weeklyStreak,
      monthVolume,
      monthSessions,
    };
  }, [workoutHistory, statsByDate, viewMonthDate, today]);

  const calendarCells = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;

    const cells: Array<{
      key: string;
      dayNumber: number | null;
      dateKey: string | null;
    }> = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ key: `blank-${i}`, dayNumber: null, dateKey: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;
      cells.push({ key: dateKey, dayNumber: day, dateKey });
    }

    return cells;
  }, [viewMonthDate]);

  const selectedLog = logByDate.get(selectedDateKey) || null;
  const selectedLogStats = statsByDate.get(selectedDateKey) || null;

  const shiftMonth = (delta: number) => {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const jumpToCurrentMonth = () => {
    setViewMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(todayKey);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-5">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[#13161C]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[#13161C]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-[#13161C]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#13161C]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#13161C]" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-[#13161C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <span
          aria-hidden="true"
          className="mb-2 block h-[3px] w-10 rounded-full bg-pulse"
        />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          {t('Riwayat & Kalender Latihan', 'Workout History & Calendar')}
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          {t(
            'Pantau konsistensi jadwal gym bulanan dan rincian beban serta repetisi tiap tanggal.',
            'Track your monthly workout consistency and inspect logged weights and reps by date.'
          )}
        </p>
      </div>

      {/* Top Consistency & Volume Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="glass-surface rounded-2xl border border-white/12 p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">
              {t('Sesi Selesai', 'Completed Sessions')}
            </span>
            <CalendarDays className="h-4 w-4 text-pulse" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#F4F5F7]">
            {summary.completedSessions}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
            {summary.totalLoggedDays} {t('hari aktif tercatat', 'active days logged')}
          </p>
        </section>

        <section className="glass-surface rounded-2xl border border-white/12 p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">
              {t('Streak Mingguan', 'Weekly Streak')}
            </span>
            <Flame className="h-4 w-4 text-pulse" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-pulse">
            {summary.weeklyStreak} {t('Minggu', 'Weeks')}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {t('Konsisten minimal 1 sesi/minggu', 'At least 1 session per week')}
          </p>
        </section>

        <section className="glass-surface rounded-2xl border border-white/12 p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">
              {t('Volume Bulan Ini', 'Month Volume')}
            </span>
            <Dumbbell className="h-4 w-4 text-pulse" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#F4F5F7]">
            {summary.monthVolume.toLocaleString(locale)}{' '}
            <span className="text-base font-semibold text-[#9CA3AF]">kg</span>
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
            {summary.monthSessions} {t('sesi di bulan dipilih', 'sessions in selected month')}
          </p>
        </section>
      </div>

      {/* Monthly Interactive Calendar */}
      <section className="glass-surface rounded-2xl border border-white/12 p-3.5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="font-display text-xl font-bold capitalize text-[#F4F5F7]">
            {monthFormatter.format(viewMonthDate)}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('Bulan sebelumnya', 'Previous month')}
              onClick={() => shiftMonth(-1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={jumpToCurrentMonth}
              className="min-h-[44px] rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-xs font-semibold text-[#D1D5DB] hover:border-pulse/50 hover:text-pulse"
            >
              {t('Bulan Ini', 'This Month')}
            </button>

            <button
              type="button"
              aria-label={t('Bulan berikutnya', 'Next month')}
              onClick={() => shiftMonth(1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day Labels (MON - SUN) */}
        <div className="mt-4 grid grid-cols-7 gap-1 text-center sm:gap-1.5">
          {DAY_LIST.map((d) => (
            <div
              key={d.key}
              className="py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
            >
              {DAY_LABELS[lang][d.key].shortLabel}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarCells.map((cell) => {
            if (!cell.dateKey || cell.dayNumber === null) {
              return <div key={cell.key} className="min-h-[46px]" />;
            }

            const stats = statsByDate.get(cell.dateKey) || null;
            const isSelected = cell.dateKey === selectedDateKey;
            const isToday = cell.dateKey === todayKey;

            let surfaceClass =
              'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25';
            if (stats?.isFull) {
              surfaceClass =
                'border-pulse/40 bg-pulse/12 text-[#F4F5F7] hover:border-pulse/70';
            } else if (stats?.isPartial) {
              surfaceClass =
                'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#F4F5F7] hover:border-[#38BDF8]/70';
            }

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDateKey(cell.dateKey!)}
                className={`relative flex min-h-[46px] flex-col items-center justify-center rounded-xl border font-mono text-sm font-semibold tabular-nums transition-colors ${surfaceClass} ${
                  isSelected
                    ? 'border-pulse shadow-[0_0_0_2px_rgba(var(--ip-accent-rgb),0.45)]'
                    : ''
                }`}
              >
                <span className={isToday ? 'text-pulse font-bold' : ''}>
                  {cell.dayNumber}
                </span>

                {stats?.isFull && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-pulse" />
                )}
                {stats?.isPartial && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-[#38BDF8]" />
                )}
                {!stats?.isFull && !stats?.isPartial && isToday && (
                  <span className="mt-0.5 h-1 w-1.5 rounded-full bg-[#9CA3AF]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Minimal Calendar Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-3 text-xs text-[#9CA3AF]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-full bg-pulse" />
            {t('Selesai penuh', 'Fully completed')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-full bg-[#38BDF8]" />
            {t('Sebagian set selesai', 'Partially completed')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full ring-2 ring-pulse" />
            {t('Tanggal dipilih', 'Selected date')}
          </span>
        </div>
      </section>

      {/* Selected Date Session Details */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pulse">
              {t('Detail Sesi', 'Session Detail')}
            </p>
            <h2 className="mt-0.5 font-display text-xl font-bold capitalize text-[#F4F5F7]">
              {fullDateFormatter.format(parseDateKey(selectedDateKey))}
            </h2>
          </div>

          {selectedLog && selectedLogStats && (
            <div className="font-mono text-xs tabular-nums sm:text-right">
              <p className="font-bold text-[#F4F5F7]">
                {selectedLogStats.completedSets}/{selectedLogStats.totalSets}{' '}
                {t('Set Selesai', 'Sets Done')}
              </p>
              <p className="text-[#9CA3AF]">
                {t('Volume', 'Volume')} {selectedLogStats.totalVolume.toLocaleString(locale)} kg
                {selectedLogStats.totalTimedSeconds > 0 && (
                  <>
                    {' · '}
                    {t('Durasi', 'Duration')}{' '}
                    {formatCompactDuration(selectedLogStats.totalTimedSeconds, lang)}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {selectedLog && selectedLog.entries.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-[#D1D5DB]">
              {t('Fokus', 'Focus')}:{' '}
              <span className="text-[#F4F5F7]">{selectedLog.focusTitle}</span>
            </p>

            <ul className="divide-y divide-white/10">
              {selectedLog.entries.map((entry) => {
                const doneSets = entry.sets.filter((s) => s.completed);
                const muscleLabel = MUSCLE_LABELS[lang][entry.muscleGroup] || entry.muscleGroup;
                const mode = resolveExerciseTrackingMode(entry);
                const usesWeight = resolveExerciseUsesWeight({
                  usesWeight: entry.usesWeight,
                  trackingMode: mode,
                  targetWeightKg: entry.sets[0]?.weightKg ?? 0,
                });

                return (
                  <li key={entry.exerciseId} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-bold text-[#F4F5F7]">{entry.name}</p>
                      <span className="shrink-0 whitespace-nowrap font-mono text-xs text-[#9CA3AF] tabular-nums">
                        {doneSets.length}/{entry.sets.length} {t('set', 'sets')} · {muscleLabel}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.sets.map((set) => {
                        let summaryText = `S${set.setNumber}: ${set.weightKg}kg × ${set.reps}`;
                        if (mode === 'timer') {
                          const durText = formatCompactDuration(
                            set.durationSeconds ?? entry.targetDurationSeconds ?? 60,
                            lang
                          );
                          summaryText =
                            usesWeight && set.weightKg > 0
                              ? `S${set.setNumber}: ${set.weightKg}kg · ${durText}`
                              : `S${set.setNumber}: ${durText}`;
                        } else if (!usesWeight) {
                          summaryText = `S${set.setNumber}: ${set.reps} reps`;
                        }

                        return (
                          <span
                            key={set.setNumber}
                            className={`rounded-lg border px-2.5 py-1 font-mono text-xs tabular-nums ${
                              set.completed
                                ? 'border-pulse/35 bg-pulse/10 text-[#F4F5F7]'
                                : 'border-white/10 bg-[#0A0B0E] text-[#6B7280]'
                            }`}
                          >
                            {summaryText}
                          </span>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-[#9CA3AF]">
              {t(
                'Belum ada catatan latihan pada tanggal ini.',
                'No workout sets logged on this date.'
              )}
            </p>
            {selectedDateKey === todayKey && (
              <button
                type="button"
                onClick={onGoToToday}
                className="min-h-[44px] rounded-xl bg-pulse px-4 py-2 text-xs font-bold text-pulse-fg hover:brightness-105"
              >
                {t('Mulai Catat Latihan Hari Ini', "Log Today's Workout")}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
});
