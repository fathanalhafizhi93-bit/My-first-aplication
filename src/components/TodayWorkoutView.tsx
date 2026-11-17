import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  HelpCircle,
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
  formatIndonesianDate,
  formatRestDuration,
} from '../lib/dateUtils';
import {
  DAY_LABELS,
  DayTimeMode,
  MUSCLE_LABELS,
  resolveDayTimePhase,
  useI18n,
} from '../lib/i18n';
import { DayKey, DaySchedule, WorkoutLogEntry } from '../types/gym';
import { MascotMood, TodayMascot } from './TodayMascot';

interface CooldownTarget {
  exerciseId: string;
  setNumber: number;
  exerciseName: string;
}

interface TodayWorkoutViewProps {
  now: Date;
  todayDayKey: DayKey;
  schedules: Record<DayKey, DaySchedule>;
  todayEntries: WorkoutLogEntry[];
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  cooldownRemaining: number;
  cooldownAlertTarget: CooldownTarget | null;
  justClapped: boolean;
  dayJustChanged: boolean;
  onToggleRestPause: () => void;
  onResetRest: () => void;
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
  onAddSet: (exerciseId: string) => Promise<void>;
  onRemoveSet: (exerciseId: string) => Promise<void>;
  onStartRestTimer: (seconds: number, exerciseName: string) => void;
  onOpenExerciseManager: (dayKey: DayKey) => void;
  onOpenScheduleManager: () => void;
  onOpenTutorial: () => void;
}

const PHASE_HERO_STYLES = {
  morning: {
    gradient: 'from-[#2D1F0D]/90 via-[#15120D]/90 to-[#0A0B0E]/95',
    border: 'border-[#F59E0B]/25',
    emblemBox: 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#FBBF24]',
    badgeText: 'text-[#FBBF24]',
    Icon: Sunrise,
  },
  afternoon: {
    gradient: 'from-[#0D2136]/90 via-[#101824]/90 to-[#0A0B0E]/95',
    border: 'border-[#38BDF8]/25',
    emblemBox: 'border-[#38BDF8]/40 bg-[#38BDF8]/15 text-[#38BDF8]',
    badgeText: 'text-[#38BDF8]',
    Icon: Sun,
  },
  night: {
    gradient: 'from-[#161433]/90 via-[#111320]/90 to-[#0A0B0E]/95',
    border: 'border-[#818CF8]/25',
    emblemBox: 'border-[#818CF8]/40 bg-[#818CF8]/15 text-[#A5B4FC]',
    badgeText: 'text-[#A5B4FC]',
    Icon: Moon,
  },
} as const;

export function TodayWorkoutView({
  now,
  todayDayKey,
  schedules,
  todayEntries,
  restRemaining,
  restRunning,
  restExerciseLabel,
  cooldownRemaining,
  cooldownAlertTarget,
  justClapped,
  dayJustChanged,
  onToggleRestPause,
  onResetRest,
  onToggleSetComplete,
  onBypassCooldownAndComplete,
  onDismissCooldownAlert,
  onUpdateSetMetrics,
  onAddSet,
  onRemoveSet,
  onStartRestTimer,
  onOpenExerciseManager,
  onOpenScheduleManager,
  onOpenTutorial,
}: TodayWorkoutViewProps) {
  const { lang, t, clockFormat, todayThemeMode, setTodayThemeMode } = useI18n();
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [imgFailed, setImgFailed] = useState(false);

  const activeSchedule = schedules[todayDayKey];
  const dayLabel = DAY_LABELS[lang][todayDayKey].label;
  const timePhase = resolveDayTimePhase(todayThemeMode, now);
  const phaseStyle = PHASE_HERO_STYLES[timePhase];
  const PhaseIcon = phaseStyle.Icon;
  const formattedClock = formatClockTime(now, clockFormat, true);
  const formattedAlarm = formatAlarmTime(activeSchedule.alarmTime, clockFormat);

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

  // Determine circular mascot animation mood dynamically
  let mascotMood: MascotMood = 'ready';
  if (justClapped) {
    mascotMood = totalSets > 0 && completedSets === totalSets ? 'celebrate' : 'clap';
  } else if (!activeSchedule.isGymDay) {
    mascotMood = 'restday';
  } else if (totalSets > 0 && completedSets === totalSets) {
    mascotMood = 'celebrate';
  } else if (cooldownRemaining > 0 || restRunning) {
    mascotMood = 'rest';
  } else if (dayJustChanged || completedSets === 0) {
    mascotMood = 'welcome';
  }

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
      {/* Focused Hero Banner: Enlarged Time Emblem + Live Clock -> Clear Date -> Dominant Schedule Title */}
      <section
        className={`relative overflow-hidden rounded-2xl border bg-[#13161C] transition-colors duration-300 ${phaseStyle.border}`}
      >
        {!imgFailed ? (
          <img
            src="/src/assets/images/gym_arena_backdrop_1794848258829.jpg"
            alt={t('Suasana ruang latihan gym', 'Gym training arena backdrop')}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1E26] to-[#0A0B0E]" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-br ${phaseStyle.gradient}`} />

        <div className="relative z-10 p-5 sm:p-7 space-y-5">
          {/* Row 1: Enlarged Time-of-Day Emblem + Live Clock & Theme Switcher */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border ${phaseStyle.emblemBox}`}
              >
                <PhaseIcon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[#F4F5F7]">
                    {formattedClock.timeText}
                  </span>
                  {formattedClock.meridiem && (
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#C8FF2E]">
                      {formattedClock.meridiem}
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9CA3AF]">
                  <span className={`font-semibold ${phaseStyle.badgeText}`}>{phaseLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {activeSchedule.isGymDay
                      ? activeSchedule.alarmEnabled
                        ? `${t('Alarm', 'Alarm')} ${formattedAlarm}`
                        : `${formattedAlarm} (${t('Alarm Mati', 'Alarm Off')})`
                      : t('Hari Istirahat', 'Rest Day')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label={t('Tema waktu hari ini', 'Time of day theme')}
                className="inline-flex rounded-lg border border-white/10 bg-[#0A0B0E]/80 p-0.5"
              >
                {(
                  [
                    { id: 'auto', label: 'Auto' },
                    { id: 'morning', label: t('Pagi', 'AM') },
                    { id: 'afternoon', label: t('Siang', 'Day') },
                    { id: 'night', label: t('Malam', 'PM') },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTodayThemeMode(item.id as DayTimeMode)}
                    className={`min-h-[30px] rounded-md px-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      todayThemeMode === item.id
                        ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                        : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onOpenTutorial}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#13161C]/80 px-2.5 py-1 text-xs font-semibold text-[#D1D5DB] hover:border-[#C8FF2E]/40 hover:text-[#C8FF2E] whitespace-nowrap"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#C8FF2E]" />
                {t('Panduan', 'Guide')}
              </button>
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

          {/* Circular Animated Companion Mascot */}
          <TodayMascot
            mood={mascotMood}
            timePhase={timePhase}
            cooldownRemaining={cooldownRemaining}
            dayLabel={dayLabel}
            dayJustChanged={dayJustChanged}
          />

          {activeSchedule.isGymDay && activeSchedule.exercises.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-4 text-[#D1D5DB]">
                  <span className="font-mono tabular-nums">
                    {completedSets}/{totalSets} {t('Set Selesai', 'Sets Done')}
                  </span>
                  <span aria-hidden="true" className="text-[#6B7280]">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {t('Volume', 'Volume')}: {totalVolumeKg.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')} kg
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
        </div>
      </section>

      {/* Global 30-Second Set Cooldown "Istirahat" Warning + Emergency Bypass */}
      {cooldownRemaining > 0 && (
        <section
          role="status"
          aria-live="polite"
          className={`rounded-2xl border p-4 transition-colors ${
            cooldownAlertTarget
              ? 'border-[#F59E0B]/60 bg-[#F59E0B]/12'
              : 'border-[#38BDF8]/40 bg-[#13161C]'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  cooldownAlertTarget ? 'text-[#FBBF24]' : 'text-[#38BDF8]'
                }`}
              />
              <div>
                <p className="text-sm font-bold text-[#F4F5F7]">
                  {t('Istirahat dulu!', 'Rest up!')}{' '}
                  <span className="font-mono tabular-nums text-[#C8FF2E]">
                    {cooldownRemaining}
                    {t('d', 's')}
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#D1D5DB]">
                  {cooldownAlertTarget
                    ? t(
                        `Tunggu ${cooldownRemaining} detik sebelum mencentang "${cooldownAlertTarget.exerciseName}" Set #${cooldownAlertTarget.setNumber}, atau gunakan Lewati Darurat jika sedang superset.`,
                        `Wait ${cooldownRemaining}s before checking "${cooldownAlertTarget.exerciseName}" Set #${cooldownAlertTarget.setNumber}, or use Emergency Bypass for supersets.`
                      )
                    : t(
                        'Jeda 30 detik antar centang set aktif agar otot pulih dan menghindari ketidaksengajaan.',
                        '30-second set check cooldown active to pace your recovery and prevent mis-taps.'
                      )}
                </p>
              </div>
            </div>

            {cooldownAlertTarget && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onBypassCooldownAndComplete}
                  className="min-h-[42px] rounded-xl bg-[#C8FF2E] px-3.5 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105 whitespace-nowrap"
                >
                  {t('Lewati Darurat (Centang)', 'Bypass & Check Set')}
                </button>
                <button
                  type="button"
                  onClick={onDismissCooldownAlert}
                  className="min-h-[42px] rounded-xl border border-white/15 bg-[#1A1E26] px-3 py-2 text-xs font-semibold text-[#D1D5DB] hover:text-[#F4F5F7]"
                >
                  {t('Tunggu', 'Wait')}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mobile Compact Active Rest Timer Strip */}
      {(restRunning || restRemaining === 0) && (
        <section className="flex items-center justify-between gap-3 rounded-2xl border border-[#C8FF2E]/40 bg-[#13161C] px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C8FF2E]">
              {restRemaining === 0
                ? t('Istirahat Selesai', 'Rest Complete')
                : t('Timer Istirahat', 'Rest Timer')}
            </p>
            <p className="truncate text-xs text-[#9CA3AF]">
              {restExerciseLabel || t('Antar set', 'Between sets')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xl font-bold tabular-nums text-[#F4F5F7]">
              {formatRestDuration(restRemaining)}
            </span>
            <button
              type="button"
              aria-label={restRunning ? t('Jeda timer', 'Pause timer') : t('Mulai timer', 'Start timer')}
              onClick={onToggleRestPause}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8FF2E] text-[#0A0B0E]"
            >
              {restRunning ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </button>
            <button
              type="button"
              aria-label={t('Reset timer', 'Reset timer')}
              onClick={onResetRest}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF]"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Rest Day State */}
      {!activeSchedule.isGymDay && (
        <div className="rounded-2xl border border-white/10 bg-[#13161C] p-6 text-center sm:p-8">
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
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
          >
            {t('Buka Tab Jadwal', 'Open Schedule Tab')}
          </button>
        </div>
      )}

      {/* Empty Exercise List for Active Gym Day */}
      {activeSchedule.isGymDay && activeSchedule.exercises.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#13161C] p-8 text-center">
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
            className="mt-5 min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
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
            const doneCount = entry.sets.filter((s) => s.completed).length;
            const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
            const isExpanded = Boolean(expandedNotes[entry.exerciseId]);
            const muscleLabel = MUSCLE_LABELS[lang][entry.muscleGroup] || entry.muscleGroup;

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
                            {t('Target', 'Target')} {spec.targetSets}×{spec.targetReps}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            {t('Istirahat', 'Rest')} {spec.restSeconds}
                            {t('d', 's')}
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
                        {t('d', 's')}
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
                        <th className="py-2 pr-2 w-14">{t('Set', 'Set')}</th>
                        <th className="py-2 px-2">{t('Beban (kg)', 'Weight (kg)')}</th>
                        <th className="py-2 px-2">{t('Reps', 'Reps')}</th>
                        <th className="py-2 pl-2 text-right w-20">{t('Selesai', 'Done')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entry.sets.map((setRow) => {
                        const isBlockedByCooldown = !setRow.completed && cooldownRemaining > 0;
                        return (
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
                                    {t('d', 's')}
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
