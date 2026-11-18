import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sun,
  Sunrise,
  Timer,
} from 'lucide-react';
import {
  formatAlarmTime,
  formatClockTime,
  formatCompactDuration,
  formatIndonesianDate,
  formatRestDuration,
  formatTimerClock,
} from '../lib/dateUtils';
import {
  DAY_LABELS,
  DayTimePhase,
  MUSCLE_LABELS,
  PHASE_THEME_TOKENS,
  resolveDayTimePhase,
  useI18n,
} from '../lib/i18n';
import {
  DayKey,
  DaySchedule,
  resolveExerciseTrackingMode,
  resolveExerciseUsesWeight,
  resolveTargetDurationSeconds,
  TimerDirection,
  WorkoutLogEntry,
} from '../types/gym';
import { CooldownAlertModal } from './CooldownAlertModal';
import { MascotMood, TodayMascot } from './TodayMascot';

interface CooldownTarget {
  exerciseId: string;
  setNumber: number;
  exerciseName: string;
}

export interface ExerciseTimerState {
  direction: TimerDirection;
  targetSeconds: number;
  elapsedSeconds: number;
  running: boolean;
  activeSetNumber: number;
}

interface TodayWorkoutViewProps {
  now: Date;
  todayDayKey: DayKey;
  schedules: Record<DayKey, DaySchedule>;
  todayEntries: WorkoutLogEntry[];
  restTotalSeconds: number;
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  cooldownRemaining: number;
  cooldownAlertTarget: CooldownTarget | null;
  justClapped: boolean;
  dayJustChanged: boolean;
  userName: string;
  isOpeningGreeting: boolean;
  exerciseTimers: Record<string, ExerciseTimerState>;
  onToggleRestPause: () => void;
  onResetRest: () => void;
  onAdjustRest: (deltaSeconds: number) => void;
  onToggleSetComplete: (
    exerciseId: string,
    setNumber: number,
    exerciseName: string
  ) => Promise<void>;
  onBypassCooldownAndComplete: () => Promise<void>;
  onDismissCooldownAlert: () => void;
  onUpdateSetMetrics: (
    exerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number
  ) => Promise<void>;
  onUpdateSetDuration: (
    exerciseId: string,
    setNumber: number,
    durationSeconds: number
  ) => Promise<void>;
  onToggleExerciseTimer: (entry: WorkoutLogEntry) => void;
  onResetExerciseTimer: (entry: WorkoutLogEntry) => void;
  onChangeExerciseTimerDirection: (entry: WorkoutLogEntry, direction: TimerDirection) => void;
  onSelectExerciseTimerSet: (entry: WorkoutLogEntry, setNumber: number) => void;
  onSaveExerciseTimerSet: (entry: WorkoutLogEntry) => Promise<void>;
  onAddSet: (exerciseId: string) => Promise<void>;
  onRemoveSet: (exerciseId: string) => Promise<void>;
  onStartRestTimer: (seconds: number, exerciseName?: string) => void;
  onOpenExerciseManager: (dayKey: DayKey) => void;
  onOpenScheduleManager: () => void;
}

const PHASE_ICONS: Record<DayTimePhase, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

export function TodayWorkoutView({
  now,
  todayDayKey,
  schedules,
  todayEntries,
  restTotalSeconds,
  restRemaining,
  restRunning,
  restExerciseLabel,
  cooldownRemaining,
  cooldownAlertTarget,
  justClapped,
  dayJustChanged,
  userName,
  isOpeningGreeting,
  exerciseTimers,
  onToggleRestPause,
  onResetRest,
  onAdjustRest,
  onToggleSetComplete,
  onBypassCooldownAndComplete,
  onDismissCooldownAlert,
  onUpdateSetMetrics,
  onUpdateSetDuration,
  onToggleExerciseTimer,
  onResetExerciseTimer,
  onChangeExerciseTimerDirection,
  onSelectExerciseTimerSet,
  onSaveExerciseTimerSet,
  onAddSet,
  onRemoveSet,
  onStartRestTimer,
  onOpenExerciseManager,
  onOpenScheduleManager,
}: TodayWorkoutViewProps) {
  const { lang, t, clockFormat, todayThemeMode } = useI18n();
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [imgFailed, setImgFailed] = useState(false);

  const activeSchedule = schedules[todayDayKey];
  const dayLabel = DAY_LABELS[lang][todayDayKey].label;
  const timePhase = resolveDayTimePhase(todayThemeMode, now);
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const PhaseIcon = PHASE_ICONS[timePhase];
  const formattedClock = formatClockTime(now, clockFormat, true);
  const formattedAlarm = formatAlarmTime(activeSchedule.alarmTime, clockFormat);

  const totalSets = todayEntries.reduce((acc, e) => acc + e.sets.length, 0);
  const completedSets = todayEntries.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0
  );
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const activeTimerEntry = todayEntries.find((e) => exerciseTimers[e.exerciseId]?.running);
  const hasAnyTimerRunning = Boolean(activeTimerEntry);

  const totalVolumeKg = todayEntries.reduce((acc, e) => {
    if (resolveExerciseTrackingMode(e) === 'timer') return acc;
    return (
      acc +
      e.sets
        .filter((s) => s.completed)
        .reduce((sAcc, s) => sAcc + s.weightKg * s.reps, 0)
    );
  }, 0);

  const totalTimedSeconds = todayEntries.reduce((acc, e) => {
    if (resolveExerciseTrackingMode(e) !== 'timer') return acc;
    return (
      acc +
      e.sets
        .filter((s) => s.completed)
        .reduce((sAcc, s) => sAcc + (s.durationSeconds || 0), 0)
    );
  }, 0);

  // Celebration ('clap', 'milestone', 'celebrate') triggers ONLY during the set-completion burst,
  // then returns smoothly to time-of-day living reactions ('ready' / 'restday').
  let mascotMood: MascotMood = 'ready';
  if (justClapped) {
    if (totalSets > 0 && completedSets === totalSets) {
      mascotMood = 'celebrate';
    } else if (progressPct >= 50) {
      mascotMood = 'milestone';
    } else {
      mascotMood = 'clap';
    }
  } else if (hasAnyTimerRunning) {
    mascotMood = 'timerActive';
  } else if (restRunning) {
    mascotMood = 'rest';
  } else if (!activeSchedule.isGymDay) {
    mascotMood = 'restday';
  } else {
    mascotMood = 'ready';
  }

  const restProgressRatio =
    restTotalSeconds > 0
      ? Math.max(0, Math.min(1, restRemaining / restTotalSeconds))
      : 0;
  const restCircumference = 2 * Math.PI * 38;
  const restStrokeDashoffset = restCircumference * (1 - restProgressRatio);
  const secUnit = t('d', 's');

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const phaseLabel =
    timePhase === 'morning'
      ? t('Pagi', 'Morning')
      : timePhase === 'afternoon'
        ? t('Siang', 'Afternoon')
        : t('Malam', 'Night');

  return (
    <div className="space-y-6">
      {/* Focused Hero Banner with Frosted Dark Glass & Time-of-Day Atmosphere */}
      <section
        className={`glass-surface relative overflow-hidden rounded-2xl border transition-colors duration-300 ${phaseToken.heroBorder}`}
      >
        {!imgFailed ? (
          <img
            src="/src/assets/images/gym_arena_backdrop_1794848258829.jpg"
            alt={t('Suasana ruang latihan gym', 'Gym training arena backdrop')}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1E26] to-[#0A0B0E]" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-br ${phaseToken.heroGradient}`} />

        {/* Lightweight Decorative Horizon Arc */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 120"
          className="pointer-events-none absolute -right-10 -top-6 h-36 w-72 opacity-20"
          fill="none"
        >
          <circle cx="280" cy="40" r="110" stroke={phaseToken.accent} strokeWidth="1.5" strokeDasharray="5 6" />
          <circle cx="280" cy="40" r="74" stroke={phaseToken.accentBright} strokeWidth="1" />
        </svg>

        <div className="relative z-10 p-5 sm:p-7 space-y-5">
          {/* Row 1: Enlarged Time-of-Day Emblem + Live Real Clock */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div
              className={`flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300 ${phaseToken.emblemClass}`}
            >
              <PhaseIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl sm:text-5xl font-extrabold leading-none tracking-tight tabular-nums text-[#F4F5F7]">
                  {formattedClock.timeText}
                </span>
                {formattedClock.meridiem && (
                  <span className="font-mono text-sm sm:text-base font-bold text-[#C8FF2E]">
                    {formattedClock.meridiem}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`text-sm sm:text-base font-bold tracking-tight ${phaseToken.labelClass}`}>
                  {phaseLabel}
                </span>
                <span aria-hidden="true" className="text-[#6B7280]">
                  ·
                </span>
                <span className="font-mono text-xs sm:text-sm font-medium tabular-nums text-[#9CA3AF]">
                  {activeSchedule.isGymDay
                    ? activeSchedule.alarmEnabled
                      ? `${t('Alarm', 'Alarm')} ${formattedAlarm}`
                      : `${formattedAlarm} (${t('Alarm Mati', 'Alarm Off')})`
                    : t('Hari Istirahat', 'Rest Day')}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Enlarged Day, Date & Year + Focused Schedule Title */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-base sm:text-xl font-bold tracking-tight text-[#C8FF2E]">
              {formatIndonesianDate(now, lang)}
            </p>

            <h1
              className="font-display text-3xl sm:text-5xl font-extrabold leading-[1.06] tracking-tight text-[#F4F5F7]"
              style={{ textWrap: 'balance' }}
            >
              {activeSchedule.isGymDay
                ? activeSchedule.focusTitle
                : `${dayLabel} — ${t('Hari Istirahat', 'Rest Day')}`}
            </h1>
          </div>

          {/* Interactive Circular Living Companion Orb */}
          <TodayMascot
            mood={mascotMood}
            timePhase={timePhase}
            hour={now.getHours()}
            restRemainingFormatted={restRunning ? formatRestDuration(restRemaining) : undefined}
            activeTimerExerciseName={activeTimerEntry?.name}
            progressPct={progressPct}
            completedSets={completedSets}
            totalSets={totalSets}
            dayLabel={dayLabel}
            userName={userName}
            dayJustChanged={dayJustChanged}
            isOpeningGreeting={isOpeningGreeting}
          />

          {activeSchedule.isGymDay && activeSchedule.exercises.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#D1D5DB]">
                  <span className="font-mono tabular-nums">
                    {completedSets}/{totalSets} {t('Set Selesai', 'Sets Done')}
                  </span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {t('Volume', 'Volume')}: {totalVolumeKg.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')} kg
                  </span>
                  {totalTimedSeconds > 0 && (
                    <>
                      <span aria-hidden="true" className="text-[#6B7280]">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-[#38BDF8]">
                        {t('Durasi', 'Duration')}: {formatCompactDuration(totalTimedSeconds, lang)}
                      </span>
                    </>
                  )}
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#C8FF2E]">
                  {progressPct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-full origin-left rounded-full bg-[#C8FF2E] transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, progressPct / 100))})` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Centered Anti-Misclick Cooldown Popup */}
      <CooldownAlertModal
        open={Boolean(cooldownAlertTarget && cooldownRemaining > 0)}
        cooldownRemaining={cooldownRemaining}
        exerciseName={cooldownAlertTarget?.exerciseName || ''}
        setNumber={cooldownAlertTarget?.setNumber || 1}
        onBypass={onBypassCooldownAndComplete}
        onDismiss={onDismissCooldownAlert}
      />

      {/* Dedicated Rest Timer Directly Below Hero */}
      <section
        className={`glass-surface rounded-2xl border p-4 sm:p-5 transition-colors ${
          restRunning
            ? 'border-[#C8FF2E]/50'
            : restRemaining === 0
              ? 'border-[#16A34A]/50'
              : 'border-white/12'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke={restRemaining === 0 ? '#16A34A' : '#C8FF2E'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={restCircumference}
                  strokeDashoffset={restStrokeDashoffset}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute font-mono text-xl font-bold tabular-nums text-[#F4F5F7]">
                {formatRestDuration(restRemaining)}
              </span>
            </div>

            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight text-[#F4F5F7]">
                {t('Timer Istirahat', 'Rest Timer')}
              </h2>
              <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">
                {restExerciseLabel || t('Waktu pemulihan antar set', 'Between-set recovery')}
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${
                  restRemaining === 0
                    ? 'text-[#4ADE80]'
                    : restRunning
                      ? 'text-[#C8FF2E]'
                      : 'text-[#D1D5DB]'
                }`}
              >
                {restRemaining === 0
                  ? t('Istirahat selesai — lanjutkan set berikutnya', 'Rest complete — start next set')
                  : restRunning
                    ? t('Sedang berjalan', 'Running')
                    : t('Siap dimulai', 'Ready to start')}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:items-end">
            <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
              {[45, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onStartRestTimer(sec, restExerciseLabel || undefined)}
                  className="min-h-[38px] rounded-lg border border-white/10 bg-[#0A0B0E] px-3 font-mono text-xs font-semibold tabular-nums text-[#D1D5DB] hover:border-[#C8FF2E] hover:text-[#C8FF2E]"
                >
                  {sec}
                  {secUnit}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onAdjustRest(-15)}
                className="min-h-[42px] rounded-xl border border-white/10 bg-[#1A1E26] px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37] whitespace-nowrap"
              >
                -15{secUnit}
              </button>

              <button
                type="button"
                onClick={onToggleRestPause}
                className="flex min-h-[42px] flex-1 sm:flex-initial sm:min-w-[116px] items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 text-xs font-bold text-[#0A0B0E] transition-transform duration-150 hover:brightness-105 active:scale-[0.97] whitespace-nowrap"
              >
                {restRunning ? (
                  <>
                    <Pause className="h-4 w-4 fill-current" />
                    {t('Jeda', 'Pause')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    {restRemaining > 0 ? t('Mulai', 'Start') : t('Ulangi', 'Restart')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onAdjustRest(15)}
                className="min-h-[42px] rounded-xl border border-white/10 bg-[#1A1E26] px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37] whitespace-nowrap"
              >
                +15{secUnit}
              </button>

              <button
                type="button"
                aria-label={t('Reset timer istirahat', 'Reset rest timer')}
                onClick={onResetRest}
                className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rest Day State */}
      {!activeSchedule.isGymDay && (
        <div className="glass-surface rounded-2xl border border-white/12 p-6 text-center sm:p-8">
          <Clock className="mx-auto h-9 w-9 text-[#9CA3AF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F4F5F7]">
            {t(
              `${dayLabel} Dijadwalkan Sebagai Hari Istirahat`,
              `${dayLabel} is Scheduled as a Rest Day`
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#9CA3AF]">
            {t(
              `Pemulihan otot sama pentingnya dengan latihan beban. Jika ingin berlatih hari ini, aktifkan hari ${dayLabel} di tab Jadwal.`,
              `Muscle recovery matters just as much as lifting. If you want to train today, enable ${dayLabel} in the Schedule tab.`
            )}
          </p>
          <button
            type="button"
            onClick={onOpenScheduleManager}
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] transition-transform duration-150 hover:brightness-105 active:scale-[0.97]"
          >
            {t('Buka Tab Jadwal', 'Open Schedule Tab')}
          </button>
        </div>
      )}

      {/* Empty Exercise List for Active Gym Day */}
      {activeSchedule.isGymDay && activeSchedule.exercises.length === 0 && (
        <div className="glass-surface rounded-2xl border border-white/12 p-8 text-center">
          <Dumbbell className="mx-auto h-9 w-9 text-[#9CA3AF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F4F5F7]">
            {t(`Belum Ada Gerakan untuk ${dayLabel}`, `No Exercises Yet for ${dayLabel}`)}
          </h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {t(
              'Tambahkan gerakan untuk hari ini dari tab Gerakan.',
              'Add movements for today from the Exercises tab.'
            )}
          </p>
          <button
            type="button"
            onClick={() => onOpenExerciseManager(todayDayKey)}
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] transition-transform duration-150 hover:brightness-105 active:scale-[0.97]"
          >
            {t('+ Tambah Gerakan Sekarang', '+ Add Exercise Now')}
          </button>
        </div>
      )}

      {/* Today's Interactive Exercise Logger */}
      {activeSchedule.isGymDay && todayEntries.length > 0 && (
        <div className="space-y-4">
          {todayEntries.map((entry, index) => {
            const spec = activeSchedule.exercises.find((e) => e.id === entry.exerciseId);
            const mode = resolveExerciseTrackingMode(spec || entry);
            const usesWeight = resolveExerciseUsesWeight({
              usesWeight: entry.usesWeight ?? spec?.usesWeight,
              trackingMode: mode,
              targetWeightKg: spec?.targetWeightKg ?? entry.sets[0]?.weightKg ?? 0,
              equipment: spec?.equipment,
            });
            const defaultTargetDuration = resolveTargetDurationSeconds(spec || entry);

            const doneCount = entry.sets.filter((s) => s.completed).length;
            const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
            const isExpanded = Boolean(expandedNotes[entry.exerciseId]);
            const muscleLabel = MUSCLE_LABELS[lang][entry.muscleGroup] || entry.muscleGroup;

            // Active Exercise Timer state (for mode === 'timer')
            const firstIncompleteSet =
              entry.sets.find((s) => !s.completed)?.setNumber || entry.sets[0]?.setNumber || 1;
            const rawTimer = exerciseTimers[entry.exerciseId];
            const timerDirection: TimerDirection =
              rawTimer?.direction ||
              spec?.timerDirection ||
              entry.timerDirection ||
              'countdown';
            const activeSetNumber =
              rawTimer?.activeSetNumber &&
              entry.sets.some((s) => s.setNumber === rawTimer.activeSetNumber)
                ? rawTimer.activeSetNumber
                : firstIncompleteSet;
            const activeSetObj = entry.sets.find((s) => s.setNumber === activeSetNumber);
            const activeTargetSeconds =
              (activeSetObj?.durationSeconds && activeSetObj.durationSeconds > 0
                ? activeSetObj.durationSeconds
                : defaultTargetDuration) || 60;
            const elapsedSeconds = rawTimer?.elapsedSeconds || 0;
            const timerRunning = Boolean(rawTimer?.running);

            const displayClockSeconds =
              timerDirection === 'countdown'
                ? Math.max(0, activeTargetSeconds - elapsedSeconds)
                : elapsedSeconds;
            const timerProgressPct =
              timerDirection === 'countdown' && activeTargetSeconds > 0
                ? Math.min(100, Math.round((elapsedSeconds / activeTargetSeconds) * 100))
                : activeTargetSeconds > 0
                  ? Math.min(100, Math.round((elapsedSeconds / activeTargetSeconds) * 100))
                  : 0;

            return (
              <article
                key={entry.exerciseId}
                className={`glass-surface rounded-2xl border p-4 sm:p-6 transition-colors ${
                  allDone
                    ? 'border-[#16A34A]/50'
                    : timerRunning
                      ? 'border-[#38BDF8]/60'
                      : 'border-white/12'
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
                      <span>{muscleLabel}</span>
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
                            {mode === 'timer'
                              ? `${t('Timer', 'Timer')} ${spec.targetSets}×${formatCompactDuration(
                                  defaultTargetDuration,
                                  lang
                                )}`
                              : `${t('Target', 'Target')} ${spec.targetSets}×${spec.targetReps}`}
                          </span>
                          {!usesWeight && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span>{t('Tanpa Beban', 'Bodyweight')}</span>
                            </>
                          )}
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            {t('Istirahat', 'Rest')} {spec.restSeconds}
                            {secUnit}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true"> · </span>
                      <span
                        className={`font-mono tabular-nums ${
                          allDone ? 'text-[#4ADE80] font-semibold' : 'text-[#D1D5DB]'
                        }`}
                      >
                        {doneCount}/{entry.sets.length} {t('Set', 'Sets')}
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
                        {t('Istirahat', 'Rest')} {spec.restSeconds}
                        {secUnit}
                      </button>
                    )}

                    {spec?.notes && (
                      <button
                        type="button"
                        onClick={() => toggleNotes(entry.exerciseId)}
                        aria-label={t('Lihat catatan teknik', 'View form notes')}
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

                <AnimatePresence initial={false}>
                  {isExpanded && spec?.notes && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-3 rounded-xl border border-white/10 bg-[#0A0B0E]/60 px-3.5 py-2.5 text-xs leading-relaxed text-[#D1D5DB]"
                    >
                      {spec.notes}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Dedicated Interactive Timer Panel for Timer Exercises */}
                {mode === 'timer' && (
                  <div className="glass-surface-subtle mt-4 rounded-xl border border-white/12 p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#38BDF8]">
                          {t('Timer Gerakan', 'Exercise Timer')} · #{activeSetNumber}
                        </span>
                        {entry.sets.length > 1 && (
                          <div className="flex items-center gap-1">
                            {entry.sets.map((s) => (
                              <button
                                key={s.setNumber}
                                type="button"
                                onClick={() => onSelectExerciseTimerSet(entry, s.setNumber)}
                                className={`min-h-[28px] rounded-md px-2 font-mono text-[11px] font-bold tabular-nums transition-colors ${
                                  s.setNumber === activeSetNumber
                                    ? 'bg-[#38BDF8] text-[#0A0B0E]'
                                    : s.completed
                                      ? 'bg-[#16A34A]/20 text-[#86EFAC]'
                                      : 'bg-white/5 text-[#9CA3AF] hover:text-[#F4F5F7]'
                                }`}
                              >
                                S{s.setNumber}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Countdown vs Count-Up Direction Toggle */}
                      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#13161C] p-1">
                        <button
                          type="button"
                          onClick={() => onChangeExerciseTimerDirection(entry, 'countdown')}
                          className={`min-h-[32px] rounded-md px-2.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                            timerDirection === 'countdown'
                              ? 'bg-[#38BDF8] text-[#0A0B0E]'
                              : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                          }`}
                        >
                          {t('Hitung Mundur', 'Countdown')}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeExerciseTimerDirection(entry, 'countup')}
                          className={`min-h-[32px] rounded-md px-2.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                            timerDirection === 'countup'
                              ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                              : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                          }`}
                        >
                          {t('Hitung Maju', 'Count-Up')}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none tracking-tight tabular-nums text-[#F4F5F7]">
                          {formatTimerClock(displayClockSeconds)}
                        </div>
                        <p className="mt-1.5 text-xs text-[#9CA3AF] font-mono tabular-nums">
                          {timerDirection === 'countdown'
                            ? `${t('Target durasi', 'Target duration')}: ${formatCompactDuration(
                                activeTargetSeconds,
                                lang
                              )}`
                            : `${t('Stopwatch dari 00:00 · Target', 'Stopwatch from 00:00 · Target')} ${formatCompactDuration(
                                activeTargetSeconds,
                                lang
                              )}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleExerciseTimer(entry)}
                          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                            timerRunning
                              ? 'bg-[#F59E0B] text-[#0A0B0E]'
                              : timerDirection === 'countdown'
                                ? 'bg-[#38BDF8] text-[#0A0B0E]'
                                : 'bg-[#C8FF2E] text-[#0A0B0E]'
                          }`}
                        >
                          {timerRunning ? (
                            <>
                              <Pause className="h-4 w-4 fill-current" />
                              {t('Jeda', 'Pause')}
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 fill-current" />
                              {elapsedSeconds > 0 ? t('Lanjut', 'Resume') : t('Mulai Timer', 'Start Timer')}
                            </>
                          )}
                        </button>

                        {elapsedSeconds > 0 && (
                          <button
                            type="button"
                            onClick={() => onSaveExerciseTimerSet(entry)}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-4 text-xs font-bold text-white hover:brightness-110 whitespace-nowrap"
                          >
                            <Check className="h-4 w-4" strokeWidth={2.5} />
                            {t('Selesai & Simpan', 'Done & Save')}
                          </button>
                        )}

                        <button
                          type="button"
                          aria-label={t('Reset timer gerakan', 'Reset exercise timer')}
                          onClick={() => onResetExerciseTimer(entry)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full w-full origin-left rounded-full transition-transform duration-300 ease-out ${
                          timerDirection === 'countdown' ? 'bg-[#38BDF8]' : 'bg-[#C8FF2E]'
                        }`}
                        style={{ transform: `scaleX(${Math.max(0, Math.min(1, timerProgressPct / 100))})` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sets Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        <th className="py-2 pr-2 w-14">{t('Set', 'Set')}</th>
                        {usesWeight && <th className="py-2 px-2">{t('Beban (kg)', 'Weight (kg)')}</th>}
                        <th className="py-2 px-2">
                          {mode === 'timer'
                            ? t('Durasi (Mnt : Dtk)', 'Duration (Min : Sec)')
                            : t('Reps', 'Reps')}
                        </th>
                        <th className="py-2 pl-2 text-right w-20">{t('Selesai', 'Done')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entry.sets.map((setRow) => {
                        const isBlockedByCooldown = !setRow.completed && cooldownRemaining > 0;
                        const rowDur = setRow.durationSeconds ?? defaultTargetDuration;
                        const rowMins = Math.floor(rowDur / 60);
                        const rowSecs = rowDur % 60;
                        const isFocusedTimerSet =
                          mode === 'timer' && setRow.setNumber === activeSetNumber;

                        return (
                          <tr
                            key={setRow.setNumber}
                            className={
                              setRow.completed
                                ? 'bg-[#16A34A]/10'
                                : isFocusedTimerSet
                                  ? 'bg-[#38BDF8]/5'
                                  : ''
                            }
                          >
                            <td className="py-2.5 pr-2 font-mono text-xs font-bold tabular-nums text-[#9CA3AF]">
                              #{setRow.setNumber}
                            </td>

                            {usesWeight && (
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  step="0.5"
                                  aria-label={`${t('Beban set', 'Weight set')} ${setRow.setNumber} ${entry.name}`}
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
                            )}

                            {mode === 'timer' ? (
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={180}
                                    aria-label={`${t('Menit set', 'Minutes set')} ${setRow.setNumber} ${entry.name}`}
                                    value={rowMins}
                                    onChange={(e) => {
                                      const m = Math.max(
                                        0,
                                        Math.min(180, parseInt(e.target.value, 10) || 0)
                                      );
                                      void onUpdateSetDuration(
                                        entry.exerciseId,
                                        setRow.setNumber,
                                        Math.max(1, m * 60 + rowSecs)
                                      );
                                    }}
                                    className="h-11 w-16 rounded-lg border border-white/10 bg-[#0A0B0E] px-2.5 text-center font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                                  />
                                  <span className="font-mono text-sm font-bold text-[#6B7280]">:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    aria-label={`${t('Detik set', 'Seconds set')} ${setRow.setNumber} ${entry.name}`}
                                    value={String(rowSecs).padStart(2, '0')}
                                    onChange={(e) => {
                                      const s = Math.max(
                                        0,
                                        Math.min(59, parseInt(e.target.value, 10) || 0)
                                      );
                                      void onUpdateSetDuration(
                                        entry.exerciseId,
                                        setRow.setNumber,
                                        Math.max(1, rowMins * 60 + s)
                                      );
                                    }}
                                    className="h-11 w-16 rounded-lg border border-white/10 bg-[#0A0B0E] px-2.5 text-center font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
                                  />
                                </div>
                              </td>
                            ) : (
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  step="1"
                                  aria-label={`${t('Repetisi set', 'Reps set')} ${setRow.setNumber} ${entry.name}`}
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
                            )}

                            <td className="py-2 pl-2 text-right">
                              <button
                                type="button"
                                aria-label={`${t('Tandai set', 'Mark set')} ${setRow.setNumber} ${entry.name} ${t('selesai', 'done')}`}
                                onClick={() =>
                                  onToggleSetComplete(
                                    entry.exerciseId,
                                    setRow.setNumber,
                                    entry.name
                                  )
                                }
                                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                                  setRow.completed
                                    ? 'border-[#16A34A] bg-[#16A34A] text-white'
                                    : isBlockedByCooldown
                                      ? 'border-[#38BDF8]/40 bg-[#1A1E26] font-mono text-xs font-bold tabular-nums text-[#38BDF8] hover:border-[#FBBF24] hover:text-[#FBBF24]'
                                      : 'border-white/15 bg-[#1A1E26] text-[#6B7280] hover:border-[#C8FF2E] hover:text-[#C8FF2E]'
                                }`}
                              >
                                {setRow.completed ? (
                                  <Check className="h-5 w-5" strokeWidth={2.5} />
                                ) : isBlockedByCooldown ? (
                                  <span>
                                    {cooldownRemaining}
                                    {secUnit}
                                  </span>
                                ) : (
                                  <Check className="h-5 w-5" strokeWidth={2.5} />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                      {t('Tambah Set', 'Add Set')}
                    </button>
                    {entry.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveSet(entry.exerciseId)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-[#FCA5A5]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                        {t('Kurangi Set', 'Remove Set')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
