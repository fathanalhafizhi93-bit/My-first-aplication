import { memo, RefObject, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Dumbbell,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import gymArenaBackdrop from '../assets/images/gym_arena_backdrop_1794848258829.jpg';
import {
  formatAlarmTime,
  formatCompactDuration,
  formatIndonesianDate,
  formatRestDuration,
  NextAlarmInfo,
} from '../lib/dateUtils';
import {
  DAY_LABELS,
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
import { MascotCompanionState } from '../hooks/useMascotCompanion';
import { resolveCardRadiusPx } from '../lib/motionTokens';
import { LiveFluidClock } from './FluidClockDisplay';
import { PhaseLogoEmblem } from './PhaseLogoEmblem';
import { PWAInstallCard } from './PWAInstallBanner';
import { TodayMascot } from './TodayMascot';

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
  nextAlarm: NextAlarmInfo | null;
  audioUnlocked: boolean;
  onUnlockAudio: () => Promise<void>;
  restTotalSeconds: number;
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  companion: MascotCompanionState;
  heroOrbAnchorRef: RefObject<HTMLButtonElement | null>;
  hideHeroOrbVisual: boolean;
  onHeroMascotVisibilityChange: (visible: boolean) => void;
  onToggleRestPause: () => void;
  onResetRest: () => void;
  onAdjustRest: (deltaSeconds: number) => void;
  onStartRestTimer: (seconds: number, exerciseName?: string) => void;
  onStartWorkout: (exerciseId?: string) => void;
  onOpenExerciseManager: (dayKey: DayKey) => void;
  onOpenScheduleManager: () => void;
}

export const TodayWorkoutView = memo(function TodayWorkoutView({
  now,
  todayDayKey,
  schedules,
  todayEntries,
  nextAlarm,
  audioUnlocked,
  onUnlockAudio,
  restTotalSeconds,
  restRemaining,
  restRunning,
  restExerciseLabel,
  companion,
  heroOrbAnchorRef,
  hideHeroOrbVisual,
  onHeroMascotVisibilityChange,
  onToggleRestPause,
  onResetRest,
  onAdjustRest,
  onStartRestTimer,
  onStartWorkout,
  onOpenExerciseManager,
  onOpenScheduleManager,
}: TodayWorkoutViewProps) {
  const { lang, t, clockFormat, todayThemeMode, uiTheme } = useI18n();
  const cardRadiusPx = resolveCardRadiusPx(uiTheme);
  const [imgFailed, setImgFailed] = useState(false);

  const activeSchedule = schedules[todayDayKey];
  const dayLabel = DAY_LABELS[lang][todayDayKey].label;
  const timePhase = resolveDayTimePhase(todayThemeMode, now);
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const formattedAlarm = formatAlarmTime(activeSchedule.alarmTime, clockFormat);

  const specById = useMemo(
    () => new Map(activeSchedule.exercises.map((ex) => [ex.id, ex])),
    [activeSchedule.exercises]
  );

  const { totalSets, completedSets, totalVolumeKg, totalTimedSeconds } = useMemo(() => {
    let total = 0;
    let completed = 0;
    let volume = 0;
    let timed = 0;

    for (const e of todayEntries) {
      const spec = specById.get(e.exerciseId);
      const mode = resolveExerciseTrackingMode(spec || e);
      const usesWeight = resolveExerciseUsesWeight({
        usesWeight: e.usesWeight ?? spec?.usesWeight,
        trackingMode: mode,
        targetWeightKg: spec?.targetWeightKg ?? e.sets[0]?.weightKg ?? 0,
        equipment: spec?.equipment,
      });

      for (const s of e.sets) {
        total += 1;
        if (s.completed) {
          completed += 1;
          if (mode === 'timer') {
            timed += Math.max(0, s.durationSeconds || 0);
          } else if (usesWeight) {
            volume += Math.max(0, s.weightKg) * Math.max(0, s.reps);
          }
        }
      }
    }

    return {
      totalSets: total,
      completedSets: completed,
      totalVolumeKg: Math.round(volume),
      totalTimedSeconds: timed,
    };
  }, [todayEntries, specById]);

  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const restProgressRatio =
    restTotalSeconds > 0
      ? Math.max(0, Math.min(1, restRemaining / restTotalSeconds))
      : 0;
  const restCircumference = 2 * Math.PI * 38;
  const restStrokeDashoffset = restCircumference * (1 - restProgressRatio);
  const secUnit = t('d', 's');

  const phaseLabel =
    timePhase === 'morning'
      ? t('Pagi', 'Morning')
      : timePhase === 'afternoon'
        ? t('Siang', 'Afternoon')
        : t('Malam', 'Night');

  const startBtnLabel =
    totalSets > 0 && completedSets === totalSets
      ? t('Lihat / Ubah Set Latihan', 'Review Workout Sets')
      : completedSets > 0
        ? t('Lanjutkan Latihan', 'Continue Workout')
        : t('Mulai Latihan', 'Start Workout');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Left Primary Column Row 1: Merged Hero Banner with Clock, Next Alarm, Mascot & Progress */}
      <section
        style={{ borderRadius: cardRadiusPx }}
        className={`glass-surface relative overflow-hidden rounded-2xl border transition-colors duration-300 lg:col-span-8 lg:col-start-1 lg:row-start-1 ${phaseToken.heroBorder}`}
      >
        {!imgFailed ? (
          <img
            src={gymArenaBackdrop}
            alt={t('Suasana ruang latihan gym', 'Gym training arena backdrop')}
            decoding="async"
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

        <div className="relative z-10 p-4 sm:p-7 space-y-4 sm:space-y-5">
          {/* Zone 1 (Dominant Focal Anchor): Flat Phase Emblem + Enlarged Left-Aligned Fluid Clock */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
              <PhaseLogoEmblem timePhase={timePhase} uiTheme={uiTheme} />

              <div className="min-w-0">
                <LiveFluidClock clockFormat={clockFormat} />

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className={`text-xs sm:text-sm font-bold tracking-tight ${phaseToken.labelClass}`}>
                    {phaseLabel}
                  </span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-medium tabular-nums text-[#CBD5E1]">
                    {activeSchedule.isGymDay
                      ? activeSchedule.alarmEnabled
                        ? `${t('Alarm Hari Ini', 'Today Alarm')} ${formattedAlarm}`
                        : `${formattedAlarm} (${t('Alarm Mati', 'Alarm Off')})`
                      : t('Hari Istirahat', 'Rest Day')}
                  </span>
                </div>
              </div>
            </div>

            {!audioUnlocked && (
              <button
                type="button"
                onClick={onUnlockAudio}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-pulse/35 bg-pulse/10 px-3 py-1.5 text-xs font-bold text-pulse transition-colors hover:bg-pulse/20 whitespace-nowrap"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {t('Aktifkan Audio', 'Enable Audio')}
              </button>
            )}
          </div>

          {/* Zone 2: Dominant Workout Schedule Title, Crisp Date Lead-In & Next Alarm Summary */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="space-y-1.5">
              <p className="text-[13px] sm:text-sm font-bold tracking-wide text-pulse">
                {formatIndonesianDate(now, lang)}
              </p>

              <h1
                className="font-display text-[2.375rem] sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.0] tracking-[-0.015em] text-[#F8FAFC]"
                style={{ textWrap: 'balance' }}
              >
                {activeSchedule.isGymDay
                  ? activeSchedule.focusTitle
                  : `${dayLabel} — ${t('Hari Istirahat', 'Rest Day')}`}
              </h1>
            </div>

            <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-[13px] text-[#CBD5E1] min-w-0">
              <Bell className="h-3.5 w-3.5 shrink-0 text-pulse" />
              {nextAlarm ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                  <span className="font-semibold text-[#9CA3AF]">
                    {t('Alarm Berikutnya:', 'Next Alarm:')}
                  </span>
                  <span className="font-semibold text-[#F4F5F7]">{nextAlarm.dayLabel}</span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-mono font-bold tabular-nums text-pulse">
                    {formatAlarmTime(nextAlarm.alarmTime, clockFormat)}
                  </span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-medium text-[#E2E8F0]">{nextAlarm.countdownText}</span>
                  <span aria-hidden="true" className="hidden sm:inline text-[#6B7280]">
                    ·
                  </span>
                  <span className="hidden sm:inline truncate text-[#9CA3AF]">
                    {nextAlarm.focusTitle}
                  </span>
                </div>
              ) : (
                <span className="text-[#9CA3AF]">
                  {t(
                    'Belum ada alarm aktif. Aktifkan di tab Jadwal.',
                    'No active alarms yet. Enable one in the Schedule tab.'
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Circular Living Companion Orb */}
          <TodayMascot
            companion={companion}
            orbAnchorRef={heroOrbAnchorRef}
            hideOrbVisual={hideHeroOrbVisual}
            onVisibilityChange={onHeroMascotVisibilityChange}
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
                <span className="font-mono text-sm font-bold tabular-nums text-pulse">
                  {progressPct}%
                </span>
              </div>
              <div
                style={{ borderRadius: 9999 }}
                className="h-2 w-full overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-pulse transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, progressPct / 100))})` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Sticky Column on Desktop (Below Hero on Mobile): Rest Timer + Start Workout CTA */}
      <aside className="space-y-4 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
        <section
          style={{ borderRadius: cardRadiusPx }}
          className={`glass-surface rounded-2xl border p-4 sm:p-5 transition-colors ${
            restRunning
              ? 'border-pulse/50'
              : restRemaining === 0
                ? 'border-[#16A34A]/50'
                : 'border-white/12'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
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
                    stroke={restRemaining === 0 ? '#16A34A' : 'var(--ip-accent)'}
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
                        ? 'text-pulse'
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

            <div className="flex flex-col gap-2.5 sm:items-end lg:items-stretch">
              <div className="grid grid-cols-4 gap-2 w-full">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onStartRestTimer(sec, restExerciseLabel || undefined)}
                    className="min-h-[38px] rounded-lg border border-white/10 bg-[#0A0B0E] px-2.5 font-mono text-xs font-semibold tabular-nums text-[#D1D5DB] hover:border-pulse hover:text-pulse"
                  >
                    {sec}
                    {secUnit}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                <button
                  type="button"
                  onClick={() => onAdjustRest(-15)}
                  className="min-h-[42px] shrink-0 rounded-xl border border-white/10 bg-[#1A1E26] px-2.5 sm:px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37] whitespace-nowrap"
                >
                  -15{secUnit}
                </button>

                <button
                  type="button"
                  onClick={onToggleRestPause}
                  className="flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-pulse px-3 sm:px-4 text-xs font-bold text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.97] whitespace-nowrap"
                >
                  {restRunning ? (
                    <>
                      <Pause className="h-4 w-4 shrink-0 fill-current" />
                      {t('Jeda', 'Pause')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 shrink-0 fill-current" />
                      {restRemaining > 0 ? t('Mulai', 'Start') : t('Ulangi', 'Restart')}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onAdjustRest(15)}
                  className="min-h-[42px] shrink-0 rounded-xl border border-white/10 bg-[#1A1E26] px-2.5 sm:px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37] whitespace-nowrap"
                >
                  +15{secUnit}
                </button>

                <button
                  type="button"
                  aria-label={t('Reset timer istirahat', 'Reset rest timer')}
                  onClick={onResetRest}
                  className="flex min-h-[42px] min-w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Start Workout CTA Directly Below Rest Timer Card */}
        {activeSchedule.isGymDay && todayEntries.length > 0 && (
          <button
            type="button"
            onClick={() => onStartWorkout()}
            className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl bg-pulse px-5 py-3.5 text-left text-pulse-fg shadow-lg shadow-pulse/10 transition-transform duration-150 hover:brightness-105 active:scale-[0.98]"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/12">
                <Dumbbell className="h-5 w-5" strokeWidth={2.3} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-extrabold tracking-tight">
                  {startBtnLabel}
                </span>
                <span className="block truncate text-xs font-semibold opacity-80">
                  {t(
                    'Buka fokus set, beban & repetisi',
                    'Open focused sets & reps view'
                  )}
                </span>
              </span>
            </span>

            <span className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-extrabold tabular-nums">
              <span>
                {completedSets}/{totalSets}
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </button>
        )}

        <div className="hidden lg:block">
          <PWAInstallCard />
        </div>
      </aside>

      {/* Left Primary Column Row 2: Exercise Overview / Rest Day / Empty State */}
      <div className="lg:col-span-8 lg:col-start-1 lg:row-start-2">
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
              className="mt-5 min-h-[44px] rounded-xl bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.97]"
            >
              {t('Buka Tab Jadwal', 'Open Schedule Tab')}
            </button>
          </div>
        )}

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
              className="mt-5 min-h-[44px] rounded-xl bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.97]"
            >
              {t('+ Tambah Gerakan Sekarang', '+ Add Exercise Now')}
            </button>
          </div>
        )}

        {activeSchedule.isGymDay && todayEntries.length > 0 && (
          <section className="glass-surface rounded-2xl border border-white/12 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-[#F4F5F7]">
                  {t('Ringkasan Gerakan Hari Ini', "Today's Exercise Overview")}
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  {todayEntries.length} {t('gerakan terjadwal', 'scheduled exercises')} ·{' '}
                  {t('Ketuk gerakan untuk mulai mengisi set', 'Tap an exercise to log sets')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/8">
              {todayEntries.map((entry, index) => {
                const spec = specById.get(entry.exerciseId);
                const mode = resolveExerciseTrackingMode(spec || entry);
                const defaultTargetDuration = resolveTargetDurationSeconds(spec || entry);
                const doneCount = entry.sets.filter((s) => s.completed).length;
                const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
                const muscleLabel = MUSCLE_LABELS[lang][entry.muscleGroup] || entry.muscleGroup;

                return (
                  <button
                    key={entry.exerciseId}
                    type="button"
                    onClick={() => onStartWorkout(entry.exerciseId)}
                    className="flex min-h-[56px] w-[calc(100%+1rem)] -mx-2 items-center justify-between gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-white/[0.03] first:pt-2 last:pb-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tabular-nums text-pulse">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <span className="truncate text-sm font-bold text-[#F4F5F7]">
                          {entry.name}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">
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
                                ? `${spec.targetSets}×${formatCompactDuration(
                                    defaultTargetDuration,
                                    lang
                                  )}`
                                : `${spec.targetSets}×${spec.targetReps}`}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 font-mono text-xs font-bold tabular-nums ${
                        allDone ? 'text-[#4ADE80]' : 'text-[#D1D5DB]'
                      }`}
                    >
                      {allDone && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
                      {doneCount}/{entry.sets.length} {t('Set', 'Sets')}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});
