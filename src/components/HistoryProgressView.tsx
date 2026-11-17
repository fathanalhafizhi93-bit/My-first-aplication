import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { formatLocalDateKey } from '../lib/dateUtils';
import { DAY_LIST, WorkoutLog } from '../types/gym';

interface HistoryProgressViewProps {
  workoutHistory: WorkoutLog[];
  loading: boolean;
  onGoToToday: () => void;
}

type ChartMetric = 'maxWeight' | 'volume';

interface ExerciseDataPoint {
  dateKey: string;
  shortDate: string;
  maxWeight: number;
  volume: number;
  bestSetLabel: string;
  completedSets: number;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatShortDate(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
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

  for (const entry of log.entries) {
    for (const set of entry.sets) {
      totalSets += 1;
      if (set.completed) {
        completedSets += 1;
        totalVolume += Math.max(0, set.weightKg) * Math.max(0, set.reps);
      }
    }
  }

  return {
    totalSets,
    completedSets,
    totalVolume: Math.round(totalVolume),
    isFull: log.completed || (totalSets > 0 && completedSets === totalSets),
    isPartial: completedSets > 0 && completedSets < totalSets && !log.completed,
  };
}

export function HistoryProgressView({
  workoutHistory,
  loading,
  onGoToToday,
}: HistoryProgressViewProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatLocalDateKey(today);

  const [viewMonthDate, setViewMonthDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [metric, setMetric] = useState<ChartMetric>('maxWeight');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const logByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog>();
    for (const log of workoutHistory) {
      map.set(log.dateKey, log);
    }
    return map;
  }, [workoutHistory]);

  // Top summary numbers
  const summary = useMemo(() => {
    let completedSessions = 0;
    const activeWeekSet = new Set<string>();
    const currentMonthPrefix = `${viewMonthDate.getFullYear()}-${String(
      viewMonthDate.getMonth() + 1
    ).padStart(2, '0')}`;
    let monthVolume = 0;
    let monthSessions = 0;

    for (const log of workoutHistory) {
      const stats = getLogStats(log);
      if (stats.isFull || stats.completedSets > 0) {
        if (stats.isFull) completedSessions += 1;
        activeWeekSet.add(getIsoWeekKey(parseDateKey(log.dateKey)));
      }
      if (log.dateKey.startsWith(currentMonthPrefix) && stats.completedSets > 0) {
        monthVolume += stats.totalVolume;
        monthSessions += 1;
      }
    }

    // Weekly streak counting backward from current or previous ISO week
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
      totalLoggedDays: workoutHistory.filter((l) => getLogStats(l).completedSets > 0).length,
      weeklyStreak,
      monthVolume,
      monthSessions,
    };
  }, [workoutHistory, viewMonthDate, today]);

  // Monthly calendar cells (Monday first)
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

  // Available exercises with at least 1 completed set across history
  const availableExercises = useMemo(() => {
    const counts = new Map<string, { count: number; hasWeight: boolean }>();
    for (const log of workoutHistory) {
      for (const entry of log.entries) {
        const doneSets = entry.sets.filter((s) => s.completed);
        if (doneSets.length === 0) continue;
        const prev = counts.get(entry.name) || { count: 0, hasWeight: false };
        counts.set(entry.name, {
          count: prev.count + 1,
          hasWeight: prev.hasWeight || doneSets.some((s) => s.weightKg > 0),
        });
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => {
        if (a[1].hasWeight !== b[1].hasWeight) return a[1].hasWeight ? -1 : 1;
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return a[0].localeCompare(b[0]);
      })
      .map(([name]) => name);
  }, [workoutHistory]);

  useEffect(() => {
    if (availableExercises.length === 0) {
      if (selectedExercise) setSelectedExercise('');
      return;
    }
    if (!selectedExercise || !availableExercises.includes(selectedExercise)) {
      setSelectedExercise(availableExercises[0]);
    }
  }, [availableExercises, selectedExercise]);

  // Chronological progress series for the selected exercise
  const exerciseSeries = useMemo<ExerciseDataPoint[]>(() => {
    if (!selectedExercise) return [];
    const chronologicalLogs = [...workoutHistory].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey)
    );
    const points: ExerciseDataPoint[] = [];

    for (const log of chronologicalLogs) {
      const matchingEntries = log.entries.filter((e) => e.name === selectedExercise);
      if (matchingEntries.length === 0) continue;

      let maxWeight = 0;
      let volume = 0;
      let bestSetLabel = '';
      let completedSets = 0;

      for (const entry of matchingEntries) {
        for (const set of entry.sets) {
          if (!set.completed) continue;
          completedSets += 1;
          const w = Math.max(0, set.weightKg);
          const r = Math.max(0, set.reps);
          volume += w * r;
          if (w > maxWeight || (w === maxWeight && !bestSetLabel)) {
            maxWeight = w;
            bestSetLabel = `${w} kg × ${r} reps`;
          }
        }
      }

      if (completedSets > 0) {
        points.push({
          dateKey: log.dateKey,
          shortDate: formatShortDate(log.dateKey),
          maxWeight,
          volume: Math.round(volume),
          bestSetLabel,
          completedSets,
        });
      }
    }

    return points;
  }, [workoutHistory, selectedExercise]);

  useEffect(() => {
    setActivePointIndex(exerciseSeries.length > 0 ? exerciseSeries.length - 1 : null);
  }, [exerciseSeries]);

  const selectedLog = logByDate.get(selectedDateKey) || null;
  const selectedLogStats = selectedLog ? getLogStats(selectedLog) : null;

  // Chart calculations
  const chartStats = useMemo(() => {
    if (exerciseSeries.length === 0) return null;
    const values = exerciseSeries.map((p) => (metric === 'maxWeight' ? p.maxWeight : p.volume));
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values);
    const prPoint = exerciseSeries.reduce((best, curr) =>
      curr.maxWeight >= best.maxWeight ? curr : best
    );
    const latest = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : latest;
    const delta = Math.round((latest - previous) * 10) / 10;

    return {
      maxVal,
      minVal,
      prPoint,
      latest,
      delta,
    };
  }, [exerciseSeries, metric]);

  const svgGeometry = useMemo(() => {
    if (exerciseSeries.length === 0) return null;
    const width = 640;
    const height = 220;
    const padLeft = 48;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const values = exerciseSeries.map((p) => (metric === 'maxWeight' ? p.maxWeight : p.volume));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = rawMax - rawMin;
    const yMin = range === 0 ? Math.max(0, rawMin * 0.8) : Math.max(0, rawMin - range * 0.15);
    const yMax = range === 0 ? Math.max(rawMax * 1.2, 10) : rawMax + range * 0.15;
    const ySpan = Math.max(1, yMax - yMin);

    const coords = exerciseSeries.map((point, idx) => {
      const val = metric === 'maxWeight' ? point.maxWeight : point.volume;
      const x =
        exerciseSeries.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (exerciseSeries.length - 1)) * plotW;
      const y = padTop + plotH - ((val - yMin) / ySpan) * plotH;
      return { x, y, val, point };
    });

    const linePath = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const areaPath =
      coords.length > 1
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(
            1
          )} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
        : '';

    const ticks = [0, 0.33, 0.66, 1].map((ratio) => {
      const y = padTop + plotH - ratio * plotH;
      const val = Math.round(yMin + ratio * ySpan);
      return { y, val };
    });

    return { width, height, padLeft, padRight, padTop, plotH, coords, linePath, areaPath, ticks };
  }, [exerciseSeries, metric]);

  const activePoint =
    activePointIndex !== null && exerciseSeries[activePointIndex]
      ? exerciseSeries[activePointIndex]
      : exerciseSeries[exerciseSeries.length - 1] || null;

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
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          Riwayat &amp; Progres Latihan
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Pantau konsistensi jadwal gym bulanan, rincian set per tanggal, dan tren kenaikan beban
          Anda.
        </p>
      </div>

      {/* Top Consistency & Volume Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">Sesi Selesai</span>
            <CalendarDays className="h-4 w-4 text-[#C8FF2E]" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#F4F5F7]">
            {summary.completedSessions}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
            {summary.totalLoggedDays} hari aktif tercatat
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">Streak Mingguan</span>
            <Flame className="h-4 w-4 text-[#C8FF2E]" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#C8FF2E]">
            {summary.weeklyStreak} Minggu
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">Konsisten minimal 1 sesi/minggu</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider">Volume Bulan Ini</span>
            <Dumbbell className="h-4 w-4 text-[#C8FF2E]" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#F4F5F7]">
            {summary.monthVolume.toLocaleString('id-ID')}{' '}
            <span className="text-base font-semibold text-[#9CA3AF]">kg</span>
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
            {summary.monthSessions} sesi di bulan dipilih
          </p>
        </section>
      </div>

      {/* Monthly Interactive Calendar */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="font-display text-xl font-bold capitalize text-[#F4F5F7]">
            {MONTH_FORMATTER.format(viewMonthDate)}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => shiftMonth(-1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={jumpToCurrentMonth}
              className="min-h-[44px] rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-xs font-semibold text-[#D1D5DB] hover:border-[#C8FF2E]/50 hover:text-[#C8FF2E]"
            >
              Bulan Ini
            </button>

            <button
              type="button"
              aria-label="Bulan berikutnya"
              onClick={() => shiftMonth(1)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day Labels (MON - SUN) */}
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
          {DAY_LIST.map((d) => (
            <div
              key={d.key}
              className="py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
            >
              {d.shortLabel}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell) => {
            if (!cell.dateKey || cell.dayNumber === null) {
              return <div key={cell.key} className="min-h-[46px]" />;
            }

            const log = logByDate.get(cell.dateKey);
            const stats = log ? getLogStats(log) : null;
            const isSelected = cell.dateKey === selectedDateKey;
            const isToday = cell.dateKey === todayKey;

            let surfaceClass =
              'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25';
            if (stats?.isFull) {
              surfaceClass =
                'border-[#C8FF2E]/40 bg-[#C8FF2E]/12 text-[#F4F5F7] hover:border-[#C8FF2E]/70';
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
                  isSelected ? 'ring-2 ring-[#C8FF2E] ring-offset-1 ring-offset-[#13161C]' : ''
                }`}
              >
                <span className={isToday ? 'text-[#C8FF2E] font-bold' : ''}>
                  {cell.dayNumber}
                </span>

                {/* Bottom subtle indicator line */}
                {stats?.isFull && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-[#C8FF2E]" />
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
            <span className="h-2 w-4 rounded-full bg-[#C8FF2E]" />
            Selesai penuh
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-full bg-[#38BDF8]" />
            Sebagian set selesai
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full ring-2 ring-[#C8FF2E]" />
            Tanggal dipilih
          </span>
        </div>
      </section>

      {/* Selected Date Session Details */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C8FF2E]">
              Detail Sesi
            </p>
            <h2 className="mt-0.5 font-display text-xl font-bold capitalize text-[#F4F5F7]">
              {FULL_DATE_FORMATTER.format(parseDateKey(selectedDateKey))}
            </h2>
          </div>

          {selectedLog && selectedLogStats && (
            <div className="text-right font-mono text-xs tabular-nums">
              <p className="font-bold text-[#F4F5F7]">
                {selectedLogStats.completedSets}/{selectedLogStats.totalSets} Set Selesai
              </p>
              <p className="text-[#9CA3AF]">
                Volume {selectedLogStats.totalVolume.toLocaleString('id-ID')} kg
              </p>
            </div>
          )}
        </div>

        {selectedLog && selectedLog.entries.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-[#D1D5DB]">
              Fokus: <span className="text-[#F4F5F7]">{selectedLog.focusTitle}</span>
            </p>

            <ul className="divide-y divide-white/10">
              {selectedLog.entries.map((entry) => {
                const doneSets = entry.sets.filter((s) => s.completed);
                return (
                  <li key={entry.exerciseId} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-bold text-[#F4F5F7]">{entry.name}</p>
                      <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                        {doneSets.length}/{entry.sets.length} set · {entry.muscleGroup}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.sets.map((set) => (
                        <span
                          key={set.setNumber}
                          className={`rounded-lg border px-2.5 py-1 font-mono text-xs tabular-nums ${
                            set.completed
                              ? 'border-[#C8FF2E]/35 bg-[#C8FF2E]/10 text-[#F4F5F7]'
                              : 'border-white/10 bg-[#0A0B0E] text-[#6B7280]'
                          }`}
                        >
                          S{set.setNumber}: {set.weightKg}kg × {set.reps}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-[#9CA3AF]">
              Belum ada catatan latihan pada tanggal ini.
            </p>
            {selectedDateKey === todayKey && (
              <button
                type="button"
                onClick={onGoToToday}
                className="min-h-[44px] rounded-xl bg-[#C8FF2E] px-4 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
              >
                Mulai Catat Latihan Hari Ini
              </button>
            )}
          </div>
        )}
      </section>

      {/* Strength Progression SVG Chart */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5 space-y-5">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#C8FF2E]" />
              <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
                Grafik Progres Beban
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Pilih gerakan untuk melihat kenaikan beban maksimal atau total volume per sesi.
            </p>
          </div>

          {availableExercises.length > 0 && (
            <div className="inline-flex rounded-xl border border-white/10 bg-[#0A0B0E] p-1">
              <button
                type="button"
                onClick={() => setMetric('maxWeight')}
                className={`min-h-[38px] rounded-lg px-3 text-xs font-bold transition-colors ${
                  metric === 'maxWeight'
                    ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                Beban Maks
              </button>
              <button
                type="button"
                onClick={() => setMetric('volume')}
                className={`min-h-[38px] rounded-lg px-3 text-xs font-bold transition-colors ${
                  metric === 'volume'
                    ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                Total Volume
              </button>
            </div>
          )}
        </div>

        {availableExercises.length === 0 ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#0A0B0E] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">
                Belum Ada Data Progres Beban
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Centang selesai minimal satu set pada tab Hari Ini untuk memunculkan grafik progres
                beban otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToToday}
              className="min-h-[44px] shrink-0 rounded-xl bg-[#C8FF2E] px-4 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
            >
              Buka Tab Hari Ini
            </button>
          </div>
        ) : (
          <>
            {/* Horizontal Quick Exercise Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availableExercises.map((exName) => {
                const active = exName === selectedExercise;
                return (
                  <button
                    key={exName}
                    type="button"
                    onClick={() => setSelectedExercise(exName)}
                    className={`min-h-[42px] shrink-0 rounded-xl border px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'border-[#C8FF2E] bg-[#C8FF2E]/15 text-[#C8FF2E]'
                        : 'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25'
                    }`}
                  >
                    {exName}
                  </button>
                );
              })}
            </div>

            {/* PR & Delta Summary */}
            {chartStats && activePoint && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0A0B0E] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 text-[#C8FF2E]" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                      Rekor Terbaik (PR)
                    </p>
                    <p className="font-mono text-sm font-bold tabular-nums text-[#F4F5F7]">
                      {chartStats.prPoint.bestSetLabel}{' '}
                      <span className="text-xs font-normal text-[#9CA3AF]">
                        ({formatShortDate(chartStats.prPoint.dateKey)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                    Titik Dipilih · {formatShortDate(activePoint.dateKey)}
                  </p>
                  <p className="text-sm font-bold text-[#C8FF2E]">
                    {metric === 'maxWeight'
                      ? `${activePoint.maxWeight} kg maks`
                      : `${activePoint.volume.toLocaleString('id-ID')} kg vol`}{' '}
                    {exerciseSeries.length > 1 && (
                      <span
                        className={`ml-1 text-xs ${
                          chartStats.delta >= 0 ? 'text-[#4ADE80]' : 'text-[#FCA5A5]'
                        }`}
                      >
                        ({chartStats.delta >= 0 ? '+' : ''}
                        {chartStats.delta} kg)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Custom Responsive SVG Chart */}
            {svgGeometry && (
              <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0B0E] p-3">
                <svg
                  viewBox={`0 0 ${svgGeometry.width} ${svgGeometry.height}`}
                  className="h-52 w-full select-none"
                  role="img"
                  aria-label={`Grafik progres ${selectedExercise}`}
                >
                  <defs>
                    <linearGradient id="ironpulseChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C8FF2E" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#C8FF2E" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y Labels */}
                  {svgGeometry.ticks.map((tick, idx) => (
                    <g key={idx}>
                      <line
                        x1={svgGeometry.padLeft}
                        y1={tick.y}
                        x2={svgGeometry.width - svgGeometry.padRight}
                        y2={tick.y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={svgGeometry.padLeft - 8}
                        y={tick.y + 4}
                        textAnchor="end"
                        fill="#9CA3AF"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {tick.val}
                      </text>
                    </g>
                  ))}

                  {/* Gradient Area */}
                  {svgGeometry.areaPath && (
                    <path d={svgGeometry.areaPath} fill="url(#ironpulseChartFill)" />
                  )}

                  {/* Main Line */}
                  {svgGeometry.coords.length > 1 && (
                    <path
                      d={svgGeometry.linePath}
                      fill="none"
                      stroke="#C8FF2E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points & X-axis labels */}
                  {svgGeometry.coords.map((c, idx) => {
                    const isActive = idx === activePointIndex;
                    const showLabel =
                      svgGeometry.coords.length <= 7 ||
                      idx === 0 ||
                      idx === svgGeometry.coords.length - 1 ||
                      idx % Math.ceil(svgGeometry.coords.length / 6) === 0;

                    return (
                      <g key={c.point.dateKey}>
                        {showLabel && (
                          <text
                            x={c.x}
                            y={svgGeometry.height - 10}
                            textAnchor="middle"
                            fill={isActive ? '#C8FF2E' : '#9CA3AF'}
                            fontSize="11"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {c.point.shortDate}
                          </text>
                        )}

                        {isActive && (
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r="10"
                            fill="#C8FF2E"
                            fillOpacity="0.2"
                          />
                        )}

                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isActive ? '5.5' : '4'}
                          fill={isActive ? '#C8FF2E' : '#0A0B0E'}
                          stroke="#C8FF2E"
                          strokeWidth="2.5"
                        />

                        {/* Generous Touch Target */}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="20"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setActivePointIndex(idx)}
                          onClick={() => setActivePointIndex(idx)}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
