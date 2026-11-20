import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Dumbbell,
  LayoutList,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Target,
  Timer,
} from 'lucide-react';
import {
  formatCompactDuration,
  formatTimerClock,
} from '../lib/dateUtils';
import { haptics } from '../lib/haptics';
import {
  DAY_LABELS,
  MUSCLE_LABELS,
  PHASE_THEME_TOKENS,
  resolveDayTimePhase,
  useI18n,
} from '../lib/i18n';
import { resolveCardRadiusPx } from '../lib/motionTokens';
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
import type { ExerciseTimerState } from './TodayWorkoutView';
import { WorkoutFloatingRestBar } from './WorkoutFloatingRestBar';

interface CooldownTarget {
  exerciseId: string;
  setNumber: number;
  exerciseName: string;
}

interface WorkoutSessionViewProps {
  now: Date;
  todayDayKey: DayKey;
  schedules: Record<DayKey, DaySchedule>;
  todayEntries: WorkoutLogEntry[];
  initialExerciseId?: string | null;
  restTotalSeconds: number;
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  cooldownRemaining: number;
  cooldownAlertTarget: CooldownTarget | null;
  exerciseTimers: Record<string, ExerciseTimerState>;
  onBackToToday: () => void;
  onToggleRestPause: () => void;
  onResetRest: () => void;
  onAdjustRest: (deltaSeconds: number) => void;
  onStartRestTimer: (seconds: number, exerciseName?: string) => void;
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
  onOpenExerciseManager: (dayKey: DayKey) => void;
  onOpenScheduleManager: () => void;
}

interface BufferedNumberInputProps {
  value: number;
  min: number;
  max: number;
  allowDecimal?: boolean;
  padTwo?: boolean;
  ariaLabel: string;
  className: string;
  onCommit: (nextValue: number) => void | Promise<void>;
}

const BufferedNumberInput = memo(function BufferedNumberInput({
  value,
  min,
  max,
  allowDecimal = false,
  padTwo = false,
  ariaLabel,
  className,
  onCommit,
}: BufferedNumberInputProps) {
  const formatProp = (num: number) =>
    padTwo ? String(num).padStart(2, '0') : String(num);

  const [draft, setDraft] = useState(() => formatProp(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatProp(value));
    }
  }, [value, focused, padTwo]);

  const commitValue = (raw: string) => {
    const trimmed = raw.trim().replace(',', '.');
    const parsed = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
    const clamped = Number.isFinite(parsed)
      ? Math.max(min, Math.min(max, allowDecimal ? Math.round(parsed * 10) / 10 : parsed))
      : value;
    setDraft(formatProp(clamped));
    if (clamped !== value) {
      void onCommit(clamped);
    }
  };

  return (
    <input
      type="text"
      data-stepper-input="true"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      value={draft}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onChange={(e) => {
        const cleaned = allowDecimal
          ? e.target.value.replace(/[^0-9.,]/g, '')
          : e.target.value.replace(/[^0-9]/g, '');
        setDraft(cleaned);
      }}
      onBlur={() => {
        setFocused(false);
        commitValue(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
});

interface TactileStepperControlProps {
  label: string;
  unit?: string;
  value: number;
  step: number;
  min: number;
  max: number;
  allowDecimal?: boolean;
  isMaterialYou: boolean;
  ariaLabelPrefix: string;
  onCommit: (nextValue: number) => void | Promise<void>;
}

const TactileStepperControl = memo(function TactileStepperControl({
  label,
  unit,
  value,
  step,
  min,
  max,
  allowDecimal = false,
  isMaterialYou,
  ariaLabelPrefix,
  onCommit,
}: TactileStepperControlProps) {
  const applyDelta = (delta: number) => {
    const rawNext = value + delta;
    const clamped = Math.max(
      min,
      Math.min(max, allowDecimal ? Math.round(rawNext * 10) / 10 : Math.round(rawNext))
    );
    if (clamped !== value) {
      haptics.timerAdjust();
      void onCommit(clamped);
    }
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between px-0.5 text-[11px] font-medium text-[#9CA3AF]">
        <span>{label}</span>
        {unit && <span className="font-mono text-[10px] text-[#6B7280]">{unit}</span>}
      </div>
      <div
        className={`flex items-center overflow-hidden rounded-xl border transition-colors focus-within:border-pulse ${
          isMaterialYou
            ? 'border-md-outline-variant bg-md-surface-lowest'
            : 'border-white/12 bg-[#0A0B0E]/90'
        }`}
      >
        <button
          type="button"
          aria-label={`${ariaLabelPrefix} -${step}`}
          disabled={value <= min}
          onClick={() => applyDelta(-step)}
          className={`flex h-11 w-10 sm:w-11 shrink-0 items-center justify-center transition-colors active:scale-90 disabled:opacity-30 ${
            isMaterialYou
              ? 'text-md-on-surface-variant hover:bg-md-surface-high hover:text-md-on-surface'
              : 'text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#F4F5F7]'
          }`}
        >
          <Minus className="h-4 w-4" strokeWidth={2.4} />
        </button>

        <BufferedNumberInput
          min={min}
          max={max}
          allowDecimal={allowDecimal}
          ariaLabel={ariaLabelPrefix}
          value={value}
          onCommit={onCommit}
          className="h-11 w-full min-w-[3.2rem] bg-transparent px-1 text-center font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[#F4F5F7] focus:outline-none"
        />

        <button
          type="button"
          aria-label={`${ariaLabelPrefix} +${step}`}
          disabled={value >= max}
          onClick={() => applyDelta(step)}
          className={`flex h-11 w-10 sm:w-11 shrink-0 items-center justify-center transition-colors active:scale-90 disabled:opacity-30 ${
            isMaterialYou
              ? 'text-md-on-surface-variant hover:bg-md-surface-high hover:text-pulse'
              : 'text-[#9CA3AF] hover:bg-white/[0.06] hover:text-pulse'
          }`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
});

const MINI_RING_SIZE = 44;
const MINI_RING_STROKE = 3.5;
const MINI_RING_RADIUS = (MINI_RING_SIZE - MINI_RING_STROKE) / 2;
const MINI_RING_CIRC = 2 * Math.PI * MINI_RING_RADIUS;

export const WorkoutSessionView = memo(function WorkoutSessionView({
  now,
  todayDayKey,
  schedules,
  todayEntries,
  initialExerciseId,
  restTotalSeconds,
  restRemaining,
  restRunning,
  restExerciseLabel,
  cooldownRemaining,
  cooldownAlertTarget,
  exerciseTimers,
  onBackToToday,
  onToggleRestPause,
  onResetRest,
  onAdjustRest,
  onStartRestTimer,
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
  onOpenExerciseManager,
  onOpenScheduleManager,
}: WorkoutSessionViewProps) {
  const { lang, t, todayThemeMode, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const cardRadiusPx = resolveCardRadiusPx(uiTheme);
  const isMaterialYou = uiTheme === 'material-you';

  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'focus' | 'all'>('focus');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
    if (initialExerciseId && todayEntries.some((e) => e.exerciseId === initialExerciseId)) {
      return initialExerciseId;
    }
    const firstIncomplete = todayEntries.find((e) => e.sets.some((s) => !s.completed));
    return firstIncomplete?.exerciseId || todayEntries[0]?.exerciseId || '';
  });
  const [manualRestBarOpen, setManualRestBarOpen] = useState(false);
  const [restBarDismissed, setRestBarDismissed] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const switcherScrollRef = useRef<HTMLDivElement | null>(null);
  const switcherItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeSchedule = schedules[todayDayKey];
  const dayLabel = DAY_LABELS[lang][todayDayKey].label;
  const timePhase = resolveDayTimePhase(todayThemeMode, now);
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const secUnit = t('d', 's');

  // Jump directly to requested exercise when opened from Today overview
  useEffect(() => {
    if (initialExerciseId && todayEntries.some((e) => e.exerciseId === initialExerciseId)) {
      setSelectedExerciseId(initialExerciseId);
      setViewMode('focus');
    }
  }, [initialExerciseId, todayEntries]);

  // Keep selectedExerciseId valid if schedule/entries change
  useEffect(() => {
    if (todayEntries.length === 0) return;
    if (!todayEntries.some((e) => e.exerciseId === selectedExerciseId)) {
      const firstIncomplete = todayEntries.find((e) => e.sets.some((s) => !s.completed));
      setSelectedExerciseId(firstIncomplete?.exerciseId || todayEntries[0].exerciseId);
    }
  }, [todayEntries, selectedExerciseId]);

  // Re-show floating rest bar whenever rest timer starts running again
  useEffect(() => {
    if (restRunning) {
      setRestBarDismissed(false);
    }
  }, [restRunning]);

  // Update horizontal switcher rail alpha edge-fade bounds
  const updateSwitcherScrollBounds = useCallback(() => {
    const el = switcherScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = switcherScrollRef.current;
    if (!el) return;
    updateSwitcherScrollBounds();
    const rafId = window.requestAnimationFrame(updateSwitcherScrollBounds);
    el.addEventListener('scroll', updateSwitcherScrollBounds, { passive: true });
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSwitcherScrollBounds);
      observer.observe(el);
    }
    window.addEventListener('resize', updateSwitcherScrollBounds);
    return () => {
      window.cancelAnimationFrame(rafId);
      el.removeEventListener('scroll', updateSwitcherScrollBounds);
      observer?.disconnect();
      window.removeEventListener('resize', updateSwitcherScrollBounds);
    };
  }, [updateSwitcherScrollBounds, todayEntries.length]);

  const switcherFadeClass =
    canScrollLeft && canScrollRight
      ? 'edge-fade-mask-both'
      : canScrollRight
        ? 'edge-fade-mask-right'
        : canScrollLeft
          ? 'edge-fade-mask-left'
          : '';

  // Center active switcher button cleanly when navigating between exercises
  useEffect(() => {
    const btn = switcherItemRefs.current[selectedExerciseId];
    if (btn) {
      btn.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      window.setTimeout(updateSwitcherScrollBounds, 260);
    }
  }, [selectedExerciseId, prefersReducedMotion, updateSwitcherScrollBounds]);

  const specById = useMemo(
    () => new Map(activeSchedule.exercises.map((e) => [e.id, e])),
    [activeSchedule.exercises]
  );

  const { totalSets, completedSets, totalVolumeKg, completedExercisesCount } = useMemo(() => {
    let total = 0;
    let done = 0;
    let volume = 0;
    let finishedExercises = 0;

    for (const entry of todayEntries) {
      const spec = specById.get(entry.exerciseId);
      const mode = resolveExerciseTrackingMode(spec || entry);
      const usesWeight = resolveExerciseUsesWeight({
        usesWeight: entry.usesWeight ?? spec?.usesWeight,
        trackingMode: mode,
        targetWeightKg: spec?.targetWeightKg ?? entry.sets[0]?.weightKg ?? 0,
        equipment: spec?.equipment,
      });

      let entryDone = 0;
      for (const s of entry.sets) {
        total += 1;
        if (s.completed) {
          done += 1;
          entryDone += 1;
          if (mode !== 'timer' && usesWeight) {
            volume += Math.max(0, s.weightKg) * Math.max(0, s.reps);
          }
        }
      }
      if (entry.sets.length > 0 && entryDone === entry.sets.length) {
        finishedExercises += 1;
      }
    }

    return {
      totalSets: total,
      completedSets: done,
      totalVolumeKg: Math.round(volume),
      completedExercisesCount: finishedExercises,
    };
  }, [todayEntries, specById]);

  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const allSessionCompleted =
    activeSchedule.isGymDay && totalSets > 0 && completedSets === totalSets;

  // Floating rest bar appears automatically when running, paused mid-way, finished, or manually opened
  const isRestMidway = restRemaining > 0 && restRemaining < restTotalSeconds;
  const isRestFinished = restRemaining === 0;
  const showFloatingRestBar =
    activeSchedule.isGymDay &&
    todayEntries.length > 0 &&
    !restBarDismissed &&
    (restRunning || isRestMidway || isRestFinished || manualRestBarOpen);

  const selectedIndex = Math.max(
    0,
    todayEntries.findIndex((e) => e.exerciseId === selectedExerciseId)
  );
  const focusedEntry = todayEntries[selectedIndex] || todayEntries[0];

  const selectExerciseByIndex = (idx: number) => {
    const target = todayEntries[idx];
    if (!target) return;
    haptics.tabSwitch();
    setSelectedExerciseId(target.exerciseId);
  };

  const toggleNotes = (id: string) => {
    haptics.toggle();
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartRestAndShowBar = (seconds: number, exerciseName?: string) => {
    setRestBarDismissed(false);
    setManualRestBarOpen(true);
    onStartRestTimer(seconds, exerciseName);
  };

  const renderExerciseCockpitCard = (entry: WorkoutLogEntry, index: number, isFocusCard: boolean) => {
    const spec = specById.get(entry.exerciseId);
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
      activeTargetSeconds > 0
        ? Math.min(100, Math.round((elapsedSeconds / activeTargetSeconds) * 100))
        : 0;

    // Next incomplete exercise recommendation when current focused exercise is done
    const nextIncompleteIndex = todayEntries.findIndex(
      (candidate, cIdx) =>
        cIdx !== index && candidate.sets.some((s) => !s.completed)
    );
    const nextExerciseAfterDone =
      nextIncompleteIndex >= 0 ? todayEntries[nextIncompleteIndex] : null;

    return (
      <article
        key={entry.exerciseId}
        style={{ borderRadius: cardRadiusPx }}
        className={`glass-surface rounded-3xl border p-4 sm:p-6 transition-colors ${
          allDone
            ? 'border-[#16A34A]/50'
            : timerRunning
              ? 'border-[#38BDF8]/60'
              : isMaterialYou
                ? 'border-md-outline-variant'
                : 'border-white/12'
        }`}
      >
        {/* Spotlight Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF]">
              <span className="font-mono font-bold tabular-nums text-pulse">
                {String(index + 1).padStart(2, '0')} / {String(todayEntries.length).padStart(2, '0')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{muscleLabel}</span>
              {spec?.equipment && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{spec.equipment}</span>
                </>
              )}
            </div>

            <h2 className="mt-1 font-display text-2xl sm:text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#F4F5F7]">
              {entry.name}
            </h2>

            {/* Unboxed Zero-Pill Target & Progress Metadata */}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#9CA3AF]">
              {spec && (
                <span className="font-mono tabular-nums text-[#D1D5DB]">
                  {mode === 'timer'
                    ? `${t('Timer', 'Timer')} ${spec.targetSets}×${formatCompactDuration(
                        defaultTargetDuration,
                        lang
                      )}`
                    : `${t('Target', 'Target')} ${spec.targetSets}×${spec.targetReps}`}
                </span>
              )}
              {!usesWeight && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t('Tanpa Beban', 'Bodyweight')}</span>
                </>
              )}
              {spec && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {t('Istirahat', 'Rest')} {spec.restSeconds}
                    {secUnit}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  allDone ? 'text-[#4ADE80]' : 'text-pulse'
                }`}
              >
                {doneCount}/{entry.sets.length} {t('Set', 'Sets')}
              </span>
            </p>
          </div>

          {/* Right Quick Actions: Rest Trigger & Form Notes */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleStartRestAndShowBar(spec?.restSeconds || 60, entry.name)
              }
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                isMaterialYou
                  ? 'border-md-outline-variant bg-md-secondary-container text-md-on-secondary-container hover:brightness-110'
                  : 'border-pulse/35 bg-pulse/12 text-pulse hover:bg-pulse/20'
              }`}
            >
              <Timer className="h-4 w-4" />
              {t('Istirahat', 'Rest')} {spec?.restSeconds || 60}
              {secUnit}
            </button>

            {spec?.notes && (
              <button
                type="button"
                onClick={() => toggleNotes(entry.exerciseId)}
                aria-label={t('Lihat catatan teknik', 'View form notes')}
                aria-expanded={isExpanded}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors active:scale-95 ${
                  isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface-variant hover:text-md-on-surface'
                    : 'border-white/12 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
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

        {/* Collapsible Form Notes */}
        <AnimatePresence initial={false}>
          {isExpanded && spec?.notes && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`mt-3.5 rounded-2xl border px-4 py-3 text-xs leading-relaxed text-[#D1D5DB] ${
                isMaterialYou
                  ? 'border-md-outline-variant bg-md-surface-lowest'
                  : 'border-white/10 bg-[#0A0B0E]/65'
              }`}
            >
              {spec.notes}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Dedicated Exercise Timer Stage (Timer-Mode Movements) */}
        {mode === 'timer' && (
          <div
            className={`mt-4 rounded-2xl border p-4 space-y-4 ${
              timerRunning
                ? 'border-[#38BDF8]/55 bg-[#0C1924]/70'
                : isMaterialYou
                  ? 'border-md-outline-variant bg-md-surface-lowest'
                  : 'border-white/12 bg-[#0A0B0E]/65'
            }`}
          >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#38BDF8]">
                  {t('Timer Gerakan', 'Exercise Timer')} · #{activeSetNumber}
                </span>
                {entry.sets.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {entry.sets.map((s) => (
                      <button
                        key={s.setNumber}
                        type="button"
                        onClick={() => onSelectExerciseTimerSet(entry, s.setNumber)}
                        className={`min-h-[34px] min-w-[36px] rounded-full px-2.5 font-mono text-[11px] font-bold tabular-nums transition-colors ${
                          s.setNumber === activeSetNumber
                            ? 'bg-[#38BDF8] text-[#0A0B0E]'
                            : s.completed
                              ? 'bg-[#16A34A]/20 text-[#86EFAC]'
                              : 'bg-white/[0.06] text-[#9CA3AF] hover:text-[#F4F5F7]'
                        }`}
                      >
                        S{s.setNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-full border border-white/10 bg-[#13161C] p-1">
                <button
                  type="button"
                  onClick={() => onChangeExerciseTimerDirection(entry, 'countdown')}
                  className={`flex-1 sm:flex-initial min-h-[34px] rounded-full px-3 text-[11px] font-bold transition-colors whitespace-nowrap ${
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
                  className={`flex-1 sm:flex-initial min-h-[34px] rounded-full px-3 text-[11px] font-bold transition-colors whitespace-nowrap ${
                    timerDirection === 'countup'
                      ? 'bg-pulse text-pulse-fg'
                      : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  {t('Hitung Maju', 'Count-Up')}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-4xl sm:text-5xl font-extrabold leading-none tracking-tight tabular-nums text-[#F4F5F7]">
                  {formatTimerClock(displayClockSeconds)}
                </div>
                <p className="mt-1.5 font-mono text-xs tabular-nums text-[#9CA3AF]">
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
                  className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-xs font-bold transition-transform active:scale-95 whitespace-nowrap ${
                    timerRunning
                      ? 'bg-[#F59E0B] text-[#0A0B0E]'
                      : timerDirection === 'countdown'
                        ? 'bg-[#38BDF8] text-[#0A0B0E]'
                        : 'bg-pulse text-pulse-fg'
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
                    className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-[#16A34A] px-4 text-xs font-bold text-white transition-transform hover:brightness-110 active:scale-95 whitespace-nowrap"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    {t('Selesai & Simpan', 'Done & Save')}
                  </button>
                )}

                <button
                  type="button"
                  aria-label={t('Reset timer gerakan', 'Reset exercise timer')}
                  onClick={() => onResetExerciseTimer(entry)}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-white/12 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7] active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full w-full origin-left rounded-full transition-transform duration-300 ease-out ${
                  timerDirection === 'countdown' ? 'bg-[#38BDF8]' : 'bg-pulse'
                }`}
                style={{
                  transform: `scaleX(${Math.max(0, Math.min(1, timerProgressPct / 100))})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Tactile Set Row Cards (Ergonomic Large Numbers + Steppers) */}
        <div className="mt-5 space-y-2.5">
          {entry.sets.map((setRow) => {
            const isBlockedByCooldown = !setRow.completed && cooldownRemaining > 0;
            const isNextActiveSet = !allDone && setRow.setNumber === firstIncompleteSet;
            const rowDur = setRow.durationSeconds ?? defaultTargetDuration;
            const rowMins = Math.floor(rowDur / 60);
            const rowSecs = rowDur % 60;
            const isFocusedTimerSet =
              mode === 'timer' && setRow.setNumber === activeSetNumber;

            return (
              <div
                key={setRow.setNumber}
                className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:gap-3.5 sm:p-3.5 transition-colors ${
                  setRow.completed
                    ? 'border-[#16A34A]/45 bg-[#16A34A]/10'
                    : isFocusedTimerSet
                      ? 'border-[#38BDF8]/45 bg-[#38BDF8]/[0.07]'
                      : isNextActiveSet
                        ? isMaterialYou
                          ? 'border-pulse/45 bg-md-surface-high/90'
                          : 'border-pulse/40 bg-white/[0.04]'
                        : isMaterialYou
                          ? 'border-md-outline-variant/80 bg-md-surface-low/80'
                          : 'border-white/8 bg-[#0E1117]/75'
                }`}
              >
                {/* Set Indicator + Mobile Top Row Done Action */}
                <div className="flex items-center justify-between gap-2 sm:w-16 sm:flex-col sm:items-start sm:justify-center sm:shrink-0">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                    <span
                      className={`font-mono text-sm font-extrabold tabular-nums ${
                        setRow.completed
                          ? 'text-[#4ADE80]'
                          : isNextActiveSet
                            ? 'text-pulse'
                            : 'text-[#D1D5DB]'
                      }`}
                    >
                      SET {setRow.setNumber}
                    </span>
                    {isNextActiveSet && !setRow.completed && (
                      <span className="text-[10px] font-semibold text-pulse">
                        {t('Berikutnya', 'Up next')}
                      </span>
                    )}
                    {setRow.completed && (
                      <span className="text-[10px] font-semibold text-[#86EFAC]">
                        {t('Selesai', 'Done')}
                      </span>
                    )}
                  </div>

                  {/* Mobile-Only Balanced Top-Right Done Button */}
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
                    className={`inline-flex sm:hidden min-h-[40px] items-center justify-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                      setRow.completed
                        ? 'border-[#16A34A] bg-[#16A34A] text-white shadow-[0_4px_14px_rgba(22,163,74,0.28)]'
                        : isBlockedByCooldown
                          ? 'border-[#38BDF8]/45 bg-[#16202C] font-mono tabular-nums text-[#38BDF8]'
                          : isNextActiveSet
                            ? 'border-pulse/60 bg-pulse text-pulse-fg'
                            : isMaterialYou
                              ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface hover:border-pulse'
                              : 'border-white/15 bg-[#1A1E26] text-[#E5E7EB] hover:border-pulse'
                    }`}
                  >
                    {setRow.completed ? (
                      <>
                        <Check className="h-4 w-4" strokeWidth={2.8} />
                        <span>{t('Selesai', 'Done')}</span>
                      </>
                    ) : isBlockedByCooldown ? (
                      <span>
                        {cooldownRemaining}
                        {secUnit}
                      </span>
                    ) : (
                      <>
                        <Check className="h-4 w-4" strokeWidth={2.6} />
                        <span>{t('Selesai', 'Done')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Balanced Steppers Grid + Desktop Done Button */}
                <div className="flex flex-1 items-end gap-2.5 sm:items-center sm:gap-3">
                  <div
                    className={`grid flex-1 gap-2.5 sm:gap-3 ${
                      usesWeight ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {usesWeight && (
                      <TactileStepperControl
                        label={t('Beban', 'Weight')}
                        unit="kg"
                        value={setRow.weightKg}
                        step={2.5}
                        min={0}
                        max={999}
                        allowDecimal
                        isMaterialYou={isMaterialYou}
                        ariaLabelPrefix={`${t('Beban set', 'Weight set')} ${setRow.setNumber} ${entry.name}`}
                        onCommit={(nextWeight) =>
                          onUpdateSetMetrics(
                            entry.exerciseId,
                            setRow.setNumber,
                            nextWeight,
                            setRow.reps
                          )
                        }
                      />
                    )}

                    {mode === 'timer' ? (
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between px-0.5 text-[11px] font-medium text-[#9CA3AF]">
                          <span>{t('Durasi', 'Duration')}</span>
                          <span className="font-mono text-[10px] text-[#6B7280]">
                            {t('Mnt : Dtk', 'Min : Sec')}
                          </span>
                        </div>
                        <div
                          className={`flex items-center overflow-hidden rounded-xl border transition-colors focus-within:border-[#38BDF8] ${
                            isMaterialYou
                              ? 'border-md-outline-variant bg-md-surface-lowest'
                              : 'border-white/12 bg-[#0A0B0E]/90'
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={`${t('Kurangi 10 detik set', 'Subtract 10s set')} ${setRow.setNumber}`}
                            disabled={rowDur <= 5}
                            onClick={() => {
                              haptics.timerAdjust();
                              void onUpdateSetDuration(
                                entry.exerciseId,
                                setRow.setNumber,
                                Math.max(5, rowDur - 10)
                              );
                            }}
                            className="flex h-11 w-9 sm:w-10 shrink-0 items-center justify-center text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#F4F5F7] active:scale-90 disabled:opacity-30"
                          >
                            <Minus className="h-4 w-4" strokeWidth={2.4} />
                          </button>

                          <div className="flex flex-1 items-center justify-center gap-0.5 px-0.5">
                            <BufferedNumberInput
                              min={0}
                              max={180}
                              ariaLabel={`${t('Menit set', 'Minutes set')} ${setRow.setNumber} ${entry.name}`}
                              value={rowMins}
                              onCommit={(m) =>
                                onUpdateSetDuration(
                                  entry.exerciseId,
                                  setRow.setNumber,
                                  Math.max(1, m * 60 + rowSecs)
                                )
                              }
                              className="h-11 w-10 sm:w-12 bg-transparent text-center font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[#F4F5F7] focus:outline-none"
                            />
                            <span className="font-mono text-base font-bold text-[#6B7280]">:</span>
                            <BufferedNumberInput
                              min={0}
                              max={59}
                              padTwo
                              ariaLabel={`${t('Detik set', 'Seconds set')} ${setRow.setNumber} ${entry.name}`}
                              value={rowSecs}
                              onCommit={(s) =>
                                onUpdateSetDuration(
                                  entry.exerciseId,
                                  setRow.setNumber,
                                  Math.max(1, rowMins * 60 + s)
                                )
                              }
                              className="h-11 w-10 sm:w-12 bg-transparent text-center font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[#F4F5F7] focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            aria-label={`${t('Tambah 10 detik set', 'Add 10s set')} ${setRow.setNumber}`}
                            onClick={() => {
                              haptics.timerAdjust();
                              void onUpdateSetDuration(
                                entry.exerciseId,
                                setRow.setNumber,
                                Math.min(10800, rowDur + 10)
                              );
                            }}
                            className="flex h-11 w-9 sm:w-10 shrink-0 items-center justify-center text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#38BDF8] active:scale-90"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <TactileStepperControl
                        label={t('Repetisi', 'Reps')}
                        unit="reps"
                        value={setRow.reps}
                        step={1}
                        min={0}
                        max={999}
                        isMaterialYou={isMaterialYou}
                        ariaLabelPrefix={`${t('Repetisi set', 'Reps set')} ${setRow.setNumber} ${entry.name}`}
                        onCommit={(nextReps) =>
                          onUpdateSetMetrics(
                            entry.exerciseId,
                            setRow.setNumber,
                            setRow.weightKg,
                            nextReps
                          )
                        }
                      />
                    )}
                  </div>

                  {/* Desktop Large Tactile Set Complete Button */}
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
                    className={`hidden sm:flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-[0.92] ${
                      setRow.completed
                        ? 'border-[#16A34A] bg-[#16A34A] text-white shadow-[0_6px_18px_rgba(22,163,74,0.3)]'
                        : isBlockedByCooldown
                          ? 'border-[#38BDF8]/45 bg-[#16202C] font-mono text-xs font-bold tabular-nums text-[#38BDF8] hover:border-[#FBBF24] hover:text-[#FBBF24]'
                          : isNextActiveSet
                            ? 'border-pulse/60 bg-pulse/15 text-pulse hover:bg-pulse hover:text-pulse-fg'
                            : isMaterialYou
                              ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface-variant hover:border-pulse hover:text-pulse'
                              : 'border-white/15 bg-[#1A1E26] text-[#9CA3AF] hover:border-pulse hover:text-pulse'
                    }`}
                  >
                    {setRow.completed ? (
                      <Check className="h-5 w-5" strokeWidth={2.8} />
                    ) : isBlockedByCooldown ? (
                      <span>
                        {cooldownRemaining}
                        {secUnit}
                      </span>
                    ) : (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Exercise Quick Transition Banner when Current Focused Exercise is 100% Done */}
        {isFocusCard && allDone && nextExerciseAfterDone && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#16A34A]/40 bg-[#16A34A]/10 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ADE80]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F4F5F7]">
                  {t('Gerakan ini selesai!', 'Exercise complete!')}
                </p>
                <p className="truncate text-xs text-[#D1D5DB]">
                  {t('Lanjut ke', 'Up next')}: {nextExerciseAfterDone.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectExerciseByIndex(nextIncompleteIndex)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-pulse px-4 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-95 whitespace-nowrap"
            >
              {t('Gerakan Berikutnya', 'Next Exercise')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Card Footer: Add/Remove Set + Focus Mode Prev/Next Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAddSet(entry.exerciseId)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#D1D5DB] transition-colors hover:bg-white/[0.06] whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 text-pulse" />
              {t('Tambah Set', 'Add Set')}
            </button>
            {entry.sets.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveSet(entry.exerciseId)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-[#FCA5A5] whitespace-nowrap"
              >
                <Minus className="h-3.5 w-3.5" />
                {t('Hapus Set', 'Remove Set')}
              </button>
            )}
          </div>

          {isFocusCard && todayEntries.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={index <= 0}
                onClick={() => selectExerciseByIndex(index - 1)}
                className={`inline-flex min-h-[40px] items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors active:scale-95 disabled:opacity-35 whitespace-nowrap ${
                  isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface hover:border-pulse'
                    : 'border-white/12 bg-white/[0.05] text-[#D1D5DB] hover:border-white/25'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('Sebelumnya', 'Prev')}
              </button>
              <button
                type="button"
                disabled={index >= todayEntries.length - 1}
                onClick={() => selectExerciseByIndex(index + 1)}
                className={`inline-flex min-h-[40px] items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors active:scale-95 disabled:opacity-35 whitespace-nowrap ${
                  isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface hover:border-pulse'
                    : 'border-white/12 bg-white/[0.05] text-[#D1D5DB] hover:border-white/25'
                }`}
              >
                {t('Berikutnya', 'Next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </article>
    );
  };

  const progressRingOffset = MINI_RING_CIRC * (1 - progressPct / 100);

  return (
    <div className={`space-y-4 sm:space-y-5 ${showFloatingRestBar ? 'pb-24 md:pb-24' : ''}`}>
      {/* 1. Compact Focused Session Header */}
      <section
        style={{ borderRadius: cardRadiusPx }}
        className={`glass-surface rounded-3xl border p-4 sm:p-5 transition-colors ${
          isMaterialYou ? 'border-md-outline-variant' : phaseToken.subtleBorder
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToToday}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0 ${
              isMaterialYou
                ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface hover:border-pulse hover:text-pulse'
                : 'border-white/15 bg-[#13161C]/80 text-[#F4F5F7] hover:border-pulse/50 hover:text-pulse'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Hari Ini', 'Today')}
          </button>

          {/* Compact Session Telemetry: Sets + Volume + Progress Ring */}
          {activeSchedule.isGymDay && totalSets > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs font-bold text-[#F4F5F7]">
                  {completedSets}/{totalSets} {t('Set', 'Sets')}
                </div>
                <div className="text-[11px] text-[#9CA3AF]">
                  {totalVolumeKg > 0
                    ? `${totalVolumeKg.toLocaleString(locale)} kg`
                    : `${completedExercisesCount}/${todayEntries.length} ${t('Gerakan', 'Moves')}`}
                </div>
              </div>

              <div className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center">
                <svg
                  width={MINI_RING_SIZE}
                  height={MINI_RING_SIZE}
                  viewBox={`0 0 ${MINI_RING_SIZE} ${MINI_RING_SIZE}`}
                  className="-rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx={MINI_RING_SIZE / 2}
                    cy={MINI_RING_SIZE / 2}
                    r={MINI_RING_RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={MINI_RING_STROKE}
                  />
                  <circle
                    cx={MINI_RING_SIZE / 2}
                    cy={MINI_RING_SIZE / 2}
                    r={MINI_RING_RADIUS}
                    fill="none"
                    stroke={allSessionCompleted ? '#4ADE80' : 'var(--md-sys-color-primary, #FF6B2B)'}
                    strokeWidth={MINI_RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={MINI_RING_CIRC}
                    strokeDashoffset={progressRingOffset}
                    className="transition-[stroke-dashoffset] duration-300 ease-out"
                  />
                </svg>
                <span className="pointer-events-none absolute font-mono text-[10px] font-extrabold tabular-nums text-[#F4F5F7]">
                  {progressPct}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/8 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#9CA3AF]">
              {dayLabel} · {t('Sesi Latihan Aktif', 'Active Workout Session')}
            </p>
            <h1 className="mt-0.5 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
              {activeSchedule.isGymDay
                ? activeSchedule.focusTitle
                : `${dayLabel} — ${t('Hari Istirahat', 'Rest Day')}`}
            </h1>
          </div>

          {/* Quick Rest Launcher (Desktop & Mobile) when Floating Bar is Hidden */}
          {activeSchedule.isGymDay && todayEntries.length > 0 && !showFloatingRestBar && (
            <button
              type="button"
              onClick={() => {
                haptics.toggle();
                setRestBarDismissed(false);
                setManualRestBarOpen(true);
              }}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors active:scale-95 whitespace-nowrap ${
                isMaterialYou
                  ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface-variant hover:border-pulse hover:text-pulse'
                  : 'border-white/12 bg-white/[0.05] text-[#D1D5DB] hover:border-pulse hover:text-pulse'
              }`}
            >
              <Timer className="h-3.5 w-3.5 text-pulse" />
              {t('Timer Istirahat', 'Rest Timer')}
            </button>
          )}
        </div>

        {activeSchedule.isGymDay && totalSets > 0 && (
          <div
            style={{ borderRadius: 9999 }}
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className={`h-full w-full origin-left rounded-full transition-transform duration-300 ease-out ${
                allSessionCompleted ? 'bg-[#4ADE80]' : 'bg-pulse'
              }`}
              style={{ transform: `scaleX(${Math.max(0, Math.min(1, progressPct / 100))})` }}
            />
          </div>
        )}
      </section>

      {/* Session Complete Celebration Banner */}
      {allSessionCompleted && (
        <section className="glass-surface flex flex-col gap-3 rounded-3xl border border-[#16A34A]/50 bg-[#16A34A]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4ADE80]" />
            <div>
              <p className="text-sm font-bold text-[#F4F5F7]">
                {t('Semua Set Hari Ini Tuntas 100%!', 'All Sets Completed 100%!')}
              </p>
              <p className="mt-0.5 text-xs text-[#D1D5DB]">
                {totalVolumeKg > 0
                  ? t(
                      `Total ${totalSets} set dan ${totalVolumeKg.toLocaleString(locale)} kg volume tercatat otomatis.`,
                      `${totalSets} sets and ${totalVolumeKg.toLocaleString(locale)} kg total volume saved automatically.`
                    )
                  : t(
                      'Riwayat latihan sudah tersimpan. Kembali ke tab Hari Ini untuk melihat perayaan karakter hero.',
                      'Your workout history is saved. Return to Today to view the companion celebration.'
                    )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToToday}
            className="min-h-[44px] shrink-0 rounded-full bg-pulse px-5 py-2 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-95 whitespace-nowrap"
          >
            {t('Lihat Perayaan di Hari Ini', 'Back to Today')}
          </button>
        </section>
      )}

      {/* Centered Anti-Misclick Cooldown Popup */}
      <CooldownAlertModal
        open={Boolean(cooldownAlertTarget) && cooldownRemaining > 0}
        cooldownRemaining={cooldownRemaining}
        exerciseName={cooldownAlertTarget?.exerciseName || ''}
        setNumber={cooldownAlertTarget?.setNumber || 1}
        onBypass={onBypassCooldownAndComplete}
        onDismiss={onDismissCooldownAlert}
      />

      {/* Rest Day State */}
      {!activeSchedule.isGymDay && (
        <div className="glass-surface rounded-3xl border border-white/12 p-6 text-center sm:p-8">
          <Clock className="mx-auto h-9 w-9 text-[#9CA3AF]" />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#F4F5F7]">
            {t(
              `${dayLabel} Dijadwalkan Sebagai Hari Istirahat`,
              `${dayLabel} is Scheduled as a Rest Day`
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#9CA3AF]">
            {t(
              `Aktifkan hari ${dayLabel} di tab Jadwal jika ingin mengisi set latihan hari ini.`,
              `Enable ${dayLabel} in the Schedule tab if you want to log sets today.`
            )}
          </p>
          <button
            type="button"
            onClick={onOpenScheduleManager}
            className="mt-5 min-h-[44px] rounded-full bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-95"
          >
            {t('Buka Tab Jadwal', 'Open Schedule Tab')}
          </button>
        </div>
      )}

      {/* Empty Exercise List */}
      {activeSchedule.isGymDay && activeSchedule.exercises.length === 0 && (
        <div className="glass-surface rounded-3xl border border-white/12 p-8 text-center">
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
            className="mt-5 min-h-[44px] rounded-full bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-95"
          >
            {t('+ Tambah Gerakan Sekarang', '+ Add Exercise Now')}
          </button>
        </div>
      )}

      {/* 2. Seamless Alpha-Masked Exercise Switcher Rail & View Mode Toggle */}
      {activeSchedule.isGymDay && todayEntries.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={`min-w-0 flex-1 ${switcherFadeClass}`}>
              <div
                ref={switcherScrollRef}
                role="tablist"
                aria-label={t('Pilih gerakan aktif', 'Select active exercise')}
                className="no-scrollbar flex items-center gap-2 overflow-x-auto py-2 px-0.5"
              >
                {todayEntries.map((entry, idx) => {
                  const doneCount = entry.sets.filter((s) => s.completed).length;
                  const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
                  const isSelected =
                    viewMode === 'focus' && entry.exerciseId === focusedEntry?.exerciseId;
                  const hasRunningTimer = Boolean(exerciseTimers[entry.exerciseId]?.running);

                  return (
                    <button
                      key={entry.exerciseId}
                      ref={(el) => {
                        switcherItemRefs.current[entry.exerciseId] = el;
                      }}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => {
                        haptics.tabSwitch();
                        setSelectedExerciseId(entry.exerciseId);
                        if (viewMode === 'all') {
                          setViewMode('focus');
                        }
                      }}
                      className={`inline-flex min-h-[42px] max-w-[195px] shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                        isSelected
                          ? isMaterialYou
                            ? 'border-pulse bg-md-secondary-container text-md-on-secondary-container shadow-[0_4px_14px_rgba(var(--ip-accent-rgb),0.2)]'
                            : 'border-pulse bg-pulse text-pulse-fg shadow-[0_4px_14px_rgba(var(--ip-accent-rgb),0.26)]'
                          : allDone
                            ? 'border-[#16A34A]/45 bg-[#16A34A]/12 text-[#86EFAC] hover:border-[#16A34A]'
                            : hasRunningTimer
                              ? 'border-[#38BDF8]/55 bg-[#38BDF8]/12 text-[#7DD3FC]'
                              : isMaterialYou
                                ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:border-md-outline hover:text-md-on-surface'
                                : 'border-white/10 bg-[#13161C]/85 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                      }`}
                    >
                      {allDone ? (
                        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.8} />
                      ) : (
                        <span className="font-mono text-[11px] opacity-80 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                      <span className="truncate">{entry.name}</span>
                      {!allDone && (
                        <span className="font-mono text-[10px] opacity-75 tabular-nums">
                          {doneCount}/{entry.sets.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus vs All Segmented Toggle */}
            {todayEntries.length > 1 && (
              <div
                className={`inline-flex shrink-0 self-end sm:self-auto items-center gap-1 rounded-full border p-1 ${
                  isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-container'
                    : 'border-white/12 bg-[#13161C]/85'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    haptics.toggle();
                    setViewMode('focus');
                  }}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                    viewMode === 'focus'
                      ? isMaterialYou
                        ? 'bg-md-secondary-container text-md-on-secondary-container'
                        : 'bg-pulse text-pulse-fg'
                      : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  {t('Fokus', 'Focus')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptics.toggle();
                    setViewMode('all');
                  }}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                    viewMode === 'all'
                      ? isMaterialYou
                        ? 'bg-md-secondary-container text-md-on-secondary-container'
                        : 'bg-pulse text-pulse-fg'
                      : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  {t('Semua', 'All')}
                </button>
              </div>
            )}
          </div>

          {/* 3. Main Cockpit Stage (Focus 2-Col on Desktop / Single-Col on Mobile) */}
          {viewMode === 'focus' && focusedEntry ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
              {/* Spotlight Exercise Stage */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={focusedEntry.exerciseId}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderExerciseCockpitCard(focusedEntry, selectedIndex, true)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Desktop Queue & Quick Rest Sidebar */}
              <aside className="hidden lg:block lg:col-span-4 space-y-4">
                <div
                  style={{ borderRadius: cardRadiusPx }}
                  className={`glass-surface rounded-3xl border p-4 ${
                    isMaterialYou ? 'border-md-outline-variant' : 'border-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/8">
                    <h3 className="text-sm font-bold text-[#F4F5F7]">
                      {t('Antrean Gerakan', 'Exercise Queue')}
                    </h3>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#9CA3AF]">
                      {completedExercisesCount}/{todayEntries.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {todayEntries.map((entry, idx) => {
                      const doneCount = entry.sets.filter((s) => s.completed).length;
                      const allDone = entry.sets.length > 0 && doneCount === entry.sets.length;
                      const isCurrent = entry.exerciseId === focusedEntry.exerciseId;

                      return (
                        <button
                          key={entry.exerciseId}
                          type="button"
                          onClick={() => selectExerciseByIndex(idx)}
                          className={`flex w-full items-center justify-between gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                            isCurrent
                              ? isMaterialYou
                                ? 'border-pulse/50 bg-md-secondary-container/70 text-md-on-secondary-container'
                                : 'border-pulse/50 bg-pulse/12 text-[#F4F5F7]'
                              : allDone
                                ? 'border-[#16A34A]/30 bg-[#16A34A]/8 text-[#86EFAC] hover:border-[#16A34A]/50'
                                : 'border-transparent bg-transparent text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F4F5F7]'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums ${
                                allDone
                                  ? 'bg-[#16A34A] text-white'
                                  : isCurrent
                                    ? 'bg-pulse text-pulse-fg'
                                    : 'bg-white/8 text-[#9CA3AF]'
                              }`}
                            >
                              {allDone ? (
                                <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                              ) : (
                                idx + 1
                              )}
                            </span>
                            <span className="truncate text-xs font-semibold">
                              {entry.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums opacity-85">
                            {doneCount}/{entry.sets.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Quick Rest Preset Launcher */}
                <div
                  style={{ borderRadius: cardRadiusPx }}
                  className={`glass-surface rounded-3xl border p-4 ${
                    isMaterialYou ? 'border-md-outline-variant' : 'border-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F4F5F7]">
                      {t('Istirahat Cepat', 'Quick Rest')}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[#9CA3AF]">
                      {formatTimerClock(restRemaining)}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                    {[45, 60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          handleStartRestAndShowBar(sec, focusedEntry.name)
                        }
                        className={`min-h-[40px] rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors active:scale-95 ${
                          isMaterialYou
                            ? 'border-md-outline-variant bg-md-surface-lowest text-md-on-surface hover:border-pulse hover:text-pulse'
                            : 'border-white/10 bg-[#0A0B0E]/80 text-[#D1D5DB] hover:border-pulse hover:text-pulse'
                        }`}
                      >
                        {sec}
                        {secUnit}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            /* Optional All-Exercises Overview Mode */
            <div className="space-y-4">
              {todayEntries.map((entry, idx) =>
                renderExerciseCockpitCard(entry, idx, false)
              )}
            </div>
          )}
        </>
      )}

      {/* 4. Conditional Compact Floating Rest Bar with SVG Progress Ring */}
      <WorkoutFloatingRestBar
        visible={showFloatingRestBar}
        restTotalSeconds={restTotalSeconds}
        restRemaining={restRemaining}
        restRunning={restRunning}
        restExerciseLabel={restExerciseLabel}
        onToggleRestPause={onToggleRestPause}
        onAdjustRest={onAdjustRest}
        onResetRest={() => {
          onResetRest();
          setManualRestBarOpen(false);
        }}
        onStartRestTimer={handleStartRestAndShowBar}
        onDismiss={() => {
          setManualRestBarOpen(false);
          setRestBarDismissed(true);
        }}
      />
    </div>
  );
});
