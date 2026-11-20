/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { AuthGate } from './components/AuthGate';
import { GlassModal } from './components/GlassModal';
import { LaunchIntro } from './components/LaunchIntro';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator, PWAInstallCard } from './components/PWAInstallBanner';
import { ExerciseTimerState, TodayWorkoutView } from './components/TodayWorkoutView';
import { TopBar } from './components/TopBar';
import { useGymData } from './hooks/useGymData';
import { MascotMood, useMascotCompanion } from './hooks/useMascotCompanion';
import { audioEngine, BUILTIN_RINGTONES } from './lib/audioEngine';
import {
  computeNextAlarm,
  formatHHMM,
  formatLocalDateKey,
  formatRestDuration,
  getTodayDayKey,
} from './lib/dateUtils';
import {
  DAY_LABELS,
  LanguageProvider,
  PHASE_THEME_TOKENS,
  resolveDayTimePhase,
  useI18n,
} from './lib/i18n';
import { attachGlobalButtonHaptics, haptics } from './lib/haptics';
import { syncNativeWeeklyAlarms } from './lib/nativeAlarmBridge';
import {
  AppTab,
  DayKey,
  DaySchedule,
  resolveTargetDurationSeconds,
  TimerDirection,
  WorkoutLogEntry,
} from './types/gym';

const loadWorkoutSessionView = () => import('./components/WorkoutSessionView');
const loadWeeklyScheduleView = () => import('./components/WeeklyScheduleView');

const WorkoutSessionView = lazy(() =>
  loadWorkoutSessionView().then((m) => ({ default: m.WorkoutSessionView }))
);
const WeeklyScheduleView = lazy(() =>
  loadWeeklyScheduleView().then((m) => ({ default: m.WeeklyScheduleView }))
);
const HistoryProgressView = lazy(() =>
  import('./components/HistoryProgressView').then((m) => ({ default: m.HistoryProgressView }))
);
const ExerciseManagerView = lazy(() =>
  import('./components/ExerciseManagerView').then((m) => ({ default: m.ExerciseManagerView }))
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const AboutView = lazy(() =>
  import('./components/AboutView').then((m) => ({ default: m.AboutView }))
);
const ActiveAlarmOverlay = lazy(() =>
  import('./components/ActiveAlarmOverlay').then((m) => ({ default: m.ActiveAlarmOverlay }))
);
const FeatureTutorialModal = lazy(() =>
  import('./components/FeatureTutorialModal').then((m) => ({ default: m.FeatureTutorialModal }))
);
const NamePromptModal = lazy(() =>
  import('./components/NamePromptModal').then((m) => ({ default: m.NamePromptModal }))
);
const FloatingMascotDock = lazy(() =>
  import('./components/FloatingMascotDock').then((m) => ({ default: m.FloatingMascotDock }))
);

interface TriggeredAlarmState {
  schedule: DaySchedule;
  ringtoneName: string;
  isTest: boolean;
}

interface CooldownAlertTarget {
  exerciseId: string;
  setNumber: number;
  exerciseName: string;
}

function AppContent() {
  const { lang, t, todayThemeMode, uiTheme, performance } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const disableAnim = Boolean(prefersReducedMotion || performance.noAnimations);
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const isMaterialYou = uiTheme === 'material-you';
  const isAero = uiTheme === 'aeroglass';
  const isYaru = uiTheme === 'ubuntu-yaru';
  const {
    user,
    authReady,
    dataLoading,
    authError,
    profile,
    schedules,
    customRingtones,
    todayDayKey,
    todayDateKey,
    workoutHistory,
    historyLoading,
    effectiveTodayEntries,
    signInWithGoogle,
    signOutUser,
    updateProfile,
    updateSchedule,
    addExerciseToDay,
    addExercisesToDay,
    updateExerciseInDay,
    removeExerciseFromDay,
    moveExerciseInDay,
    toggleSetComplete,
    updateSetMetrics,
    updateSetDuration,
    completeTimerSet,
    addSetToExercise,
    removeSetFromExercise,
    addCustomRingtone,
    deleteCustomRingtone,
  } = useGymData();

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [activePopup, setActivePopup] = useState<'about' | null>(null);
  const [heroMascotVisible, setHeroMascotVisible] = useState<boolean>(true);
  const [floatingOrbPresent, setFloatingOrbPresent] = useState<boolean>(false);
  const heroOrbAnchorRef = useRef<HTMLButtonElement | null>(null);

  const navigateToTab = useCallback((nextTab: AppTab) => {
    setActiveTab((curr) => {
      if (curr === nextTab) return curr;
      haptics.tabSwitch();
      return nextTab;
    });
  }, []);
  const [showIntro, setShowIntro] = useState(() => !performance.noAnimations);
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStartWithLang, setTutorialStartWithLang] = useState(true);
  const [exerciseDayKey, setExerciseDayKey] = useState<DayKey>(todayDayKey);
  const [focusedWorkoutExerciseId, setFocusedWorkoutExerciseId] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const lastMinuteBucketRef = useRef<number>(Math.floor(Date.now() / 60_000));
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const timePhase = resolveDayTimePhase(todayThemeMode, now);
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

  // Midnight day-change detection + mascot reaction state
  const lastDateKeyRef = useRef<string>(formatLocalDateKey());
  const [dayJustChanged, setDayJustChanged] = useState(false);
  const [justClapped, setJustClapped] = useState(false);
  const clapTimeoutRef = useRef<number | null>(null);

  // Global 30-second set check cooldown state
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const [cooldownAlertTarget, setCooldownAlertTarget] = useState<CooldownAlertTarget | null>(null);

  // Active alarm & snooze state
  const [activeAlarm, setActiveAlarm] = useState<TriggeredAlarmState | null>(null);
  const [snoozeTargetMs, setSnoozeTargetMs] = useState<number | null>(null);
  const snoozedAlarmRef = useRef<{ schedule: DaySchedule; isTest: boolean } | null>(null);
  const lastTriggeredSlotRef = useRef<string | null>(null);

  // Inter-set rest timer state
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [restRunning, setRestRunning] = useState(false);
  const [restExerciseLabel, setRestExerciseLabel] = useState<string | null>(null);
  const [restFinishedBanner, setRestFinishedBanner] = useState(false);
  const restEndAtRef = useRef<number | null>(null);
  const restShouldChimeRef = useRef(false);
  const restBannerTimeoutRef = useRef<number | null>(null);
  const lastRestTickHapticRef = useRef<number | null>(null);
  const lastRestRemainingRef = useRef<number>(90);
  const lastCooldownRemainingRef = useRef<number>(0);

  // Per-exercise timer state (Countdown & Count-Up for timed movements like Plank / Incline Walk)
  const [exerciseTimers, setExerciseTimers] = useState<Record<string, ExerciseTimerState>>({});
  const exerciseTimersRef = useRef<Record<string, ExerciseTimerState>>({});
  const effectiveTodayEntriesRef = useRef<WorkoutLogEntry[]>(effectiveTodayEntries);

  useEffect(() => {
    exerciseTimersRef.current = exerciseTimers;
  }, [exerciseTimers]);

  useEffect(() => {
    effectiveTodayEntriesRef.current = effectiveTodayEntries;
  }, [effectiveTodayEntries]);

  const resolveRingtoneMeta = useCallback(
    (dayRingtoneId: string) => {
      const targetId =
        !dayRingtoneId || dayRingtoneId === 'default'
          ? profile?.defaultRingtoneId || 'builtin_athletic_bell'
          : dayRingtoneId;

      const builtIn = BUILTIN_RINGTONES.find((r) => r.id === targetId);
      if (builtIn) return { id: builtIn.id, name: builtIn.name };

      const custom = customRingtones.find((r) => r.id === targetId);
      if (custom) return { id: custom.id, name: custom.name };

      return { id: 'builtin_athletic_bell', name: 'Athletic Bell' };
    },
    [profile, customRingtones]
  );

  const handleUnlockAudio = useCallback(async () => {
    const ok = await audioEngine.unlock();
    setAudioUnlocked(ok);
  }, []);

  // Automatically unlock Web Audio on first user interaction
  useEffect(() => {
    const unlockOnce = () => {
      void audioEngine.unlock().then((ok) => {
        if (ok) setAudioUnlocked(true);
      });
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, []);

  // Global tactile button click haptics (automatically yields to richer semantic haptics)
  useEffect(() => {
    return attachGlobalButtonHaptics();
  }, []);

  // Cleanup mascot clap & rest banner timeouts on unmount
  useEffect(() => {
    return () => {
      if (clapTimeoutRef.current !== null) {
        window.clearTimeout(clapTimeoutRef.current);
      }
      if (restBannerTimeoutRef.current !== null) {
        window.clearTimeout(restBannerTimeoutRef.current);
      }
    };
  }, []);

  const clearClapBurst = useCallback(() => {
    if (clapTimeoutRef.current !== null) {
      window.clearTimeout(clapTimeoutRef.current);
      clapTimeoutRef.current = null;
    }
    setJustClapped(false);
  }, []);

  const triggerClapBurst = useCallback((isWorkoutComplete = false) => {
    if (clapTimeoutRef.current !== null) {
      window.clearTimeout(clapTimeoutRef.current);
    }
    setJustClapped(true);
    const durationMs = isWorkoutComplete ? 60_000 : 3_200;
    clapTimeoutRef.current = window.setTimeout(() => {
      setJustClapped(false);
      clapTimeoutRef.current = null;
    }, durationMs);
  }, []);

  const willFinishAllSets = useCallback(
    (
      entries: WorkoutLogEntry[],
      completedExerciseId: string,
      completedSetNumber: number
    ): boolean => {
      let total = 0;
      let done = 0;
      for (const entry of entries) {
        for (const s of entry.sets) {
          total += 1;
          if (
            s.completed ||
            (entry.exerciseId === completedExerciseId && s.setNumber === completedSetNumber)
          ) {
            done += 1;
          }
        }
      }
      return total > 0 && done === total;
    },
    []
  );

  const triggerAlarm = useCallback(
    (sched: DaySchedule, isTest: boolean) => {
      const tone = resolveRingtoneMeta(sched.ringtoneId);
      setActiveAlarm({
        schedule: sched,
        ringtoneName: tone.name,
        isTest,
      });
      haptics.alarmAlert();

      void audioEngine.play(tone.id, {
        volume: profile?.volume ?? 0.85,
        loop: true,
        customRingtones,
      });

      if (
        !isTest &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(`IronPulse · ${sched.alarmTime}`, {
            body: `${t('Waktunya latihan:', 'Time to train:')} ${sched.focusTitle}`,
          });
        } catch {
          // ignore notification error in restricted iframe contexts
        }
      }
    },
    [resolveRingtoneMeta, profile, customRingtones, t]
  );

  // Staggered idle prefetch of most likely next tabs so launch frame never stalls
  useEffect(() => {
    if (showIntro) return;
    let idleId: number | undefined;
    const t1 = globalThis.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => {
          void loadWorkoutSessionView();
        });
      } else {
        void loadWorkoutSessionView();
      }
    }, 1200);
    const t2 = globalThis.setTimeout(() => {
      void loadWeeklyScheduleView();
    }, 2400);
    return () => {
      globalThis.clearTimeout(t1);
      globalThis.clearTimeout(t2);
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [showIntro]);

  // Minute-isolated root clock + midnight rollover + alarm watcher (avoids per-second root re-renders)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      const minuteBucket = Math.floor(current.getTime() / 60_000);
      if (minuteBucket !== lastMinuteBucketRef.current) {
        lastMinuteBucketRef.current = minuteBucket;
        setNow(current);
      }

      const currentDateKey = formatLocalDateKey(current);
      if (currentDateKey !== lastDateKeyRef.current) {
        lastDateKeyRef.current = currentDateKey;
        setDayJustChanged(true);
        setCooldownUntilMs(null);
        setCooldownAlertTarget(null);
      }

      if (!schedules || !profile) return;

      // Check snoozed alarm
      if (snoozeTargetMs !== null && current.getTime() >= snoozeTargetMs) {
        setSnoozeTargetMs(null);
        const snoozed = snoozedAlarmRef.current;
        snoozedAlarmRef.current = null;
        if (snoozed) {
          triggerAlarm(snoozed.schedule, snoozed.isTest);
        } else {
          const dayKey = getTodayDayKey(current);
          const sched = schedules[dayKey];
          if (sched) {
            triggerAlarm(sched, false);
          }
        }
        return;
      }

      // Check scheduled alarm for current day & minute
      const dayKey = getTodayDayKey(current);
      const sched = schedules[dayKey];
      if (!sched || !sched.isGymDay || !sched.alarmEnabled) return;

      const hhmm = formatHHMM(current);
      const slotKey = `${currentDateKey}_${hhmm}`;

      if (sched.alarmTime === hhmm && lastTriggeredSlotRef.current !== slotKey) {
        lastTriggeredSlotRef.current = slotKey;
        triggerAlarm(sched, false);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [schedules, profile, snoozeTargetMs, triggerAlarm]);

  // Isolated 30s cooldown ticker (runs ONLY while cooldown is active)
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  useEffect(() => {
    if (cooldownUntilMs === null) {
      if (lastCooldownRemainingRef.current !== 0) {
        lastCooldownRemainingRef.current = 0;
        setCooldownRemaining(0);
      }
      return;
    }
    const tickCooldown = () => {
      const rem = Math.max(0, Math.ceil((cooldownUntilMs - Date.now()) / 1000));
      if (rem !== lastCooldownRemainingRef.current) {
        lastCooldownRemainingRef.current = rem;
        setCooldownRemaining(rem);
      }
      if (rem <= 0) {
        setCooldownUntilMs(null);
        setCooldownAlertTarget(null);
      }
    };
    tickCooldown();
    const id = window.setInterval(tickCooldown, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntilMs]);

  // Sync scheduled alarms to native Android background scheduler when running in Capacitor APK
  useEffect(() => {
    if (!schedules) return;
    void syncNativeWeeklyAlarms(schedules);
  }, [schedules]);

  // Rest timer countdown loop (wall-clock anchored; only commits React state on whole-second changes)
  useEffect(() => {
    if (!restRunning) {
      lastRestTickHapticRef.current = null;
      return;
    }
    if (restEndAtRef.current === null) {
      restEndAtRef.current = Date.now() + lastRestRemainingRef.current * 1000;
    }
    const tick = () => {
      const endAt = restEndAtRef.current;
      if (endAt === null) return;
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (rem !== lastRestRemainingRef.current) {
        lastRestRemainingRef.current = rem;
        setRestRemaining(rem);
      }
      if (rem >= 1 && rem <= 3 && lastRestTickHapticRef.current !== rem) {
        lastRestTickHapticRef.current = rem;
        haptics.timerCountdownTick();
      }
      if (rem <= 0) {
        restEndAtRef.current = null;
        lastRestTickHapticRef.current = null;
        setRestRunning(false);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);

    return () => window.clearInterval(timer);
  }, [restRunning]);

  // Pure completion effect for rest timer (fires once when timer reaches 0)
  useEffect(() => {
    if (restRunning || restRemaining !== 0 || !restShouldChimeRef.current) return;
    restShouldChimeRef.current = false;
    setRestFinishedBanner(true);
    haptics.timerFinished();

    const restToneId = profile?.restRingtoneId || 'builtin_kettlebell_chime';
    void audioEngine.play(restToneId, {
      volume: profile?.volume ?? 0.85,
      loop: false,
      customRingtones,
    });

    if (restBannerTimeoutRef.current !== null) {
      window.clearTimeout(restBannerTimeoutRef.current);
    }
    restBannerTimeoutRef.current = window.setTimeout(() => {
      setRestFinishedBanner(false);
      restBannerTimeoutRef.current = null;
    }, 5000);
  }, [restRunning, restRemaining, profile, customRingtones]);

  const startRestTimer = useCallback(
    (seconds: number, label?: string, silentHaptic = false) => {
      void handleUnlockAudio();
      if (!silentHaptic) {
        haptics.timerStart();
      }
      if (restBannerTimeoutRef.current !== null) {
        window.clearTimeout(restBannerTimeoutRef.current);
        restBannerTimeoutRef.current = null;
      }
      const safeSec = Math.max(10, Math.min(600, seconds));
      restEndAtRef.current = Date.now() + safeSec * 1000;
      restShouldChimeRef.current = true;
      lastRestTickHapticRef.current = null;
      lastRestRemainingRef.current = safeSec;
      setRestFinishedBanner(false);
      setRestTotalSeconds(safeSec);
      setRestRemaining(safeSec);
      setRestExerciseLabel(label || null);
      setRestRunning(true);
    },
    [handleUnlockAudio]
  );

  const handleFinishExerciseTimerSet = useCallback(
    async (
      exerciseId: string,
      setNumber: number,
      durationSeconds: number,
      playCompletionChime: boolean
    ) => {
      const safeDuration = Math.max(1, Math.min(10800, Math.round(durationSeconds)));
      const finishedAll = willFinishAllSets(
        effectiveTodayEntriesRef.current,
        exerciseId,
        setNumber
      );

      if (finishedAll) {
        haptics.workoutComplete();
      } else if (playCompletionChime) {
        haptics.timerFinished();
      } else {
        haptics.setComplete();
      }

      const becameCompleted = await completeTimerSet(exerciseId, setNumber, safeDuration);

      // Advance active set selector to next incomplete set if available
      const entry = effectiveTodayEntriesRef.current.find((e) => e.exerciseId === exerciseId);
      const nextIncomplete = entry?.sets.find(
        (s) => s.setNumber !== setNumber && !s.completed
      );

      setExerciseTimers((prev) => {
        const cur = prev[exerciseId];
        if (!cur) return prev;
        const nextTargetSeconds =
          nextIncomplete &&
          typeof nextIncomplete.durationSeconds === 'number' &&
          nextIncomplete.durationSeconds > 0
            ? nextIncomplete.durationSeconds
            : cur.targetSeconds;
        return {
          ...prev,
          [exerciseId]: {
            ...cur,
            elapsedSeconds: 0,
            running: false,
            activeSetNumber: nextIncomplete ? nextIncomplete.setNumber : setNumber,
            targetSeconds: nextTargetSeconds,
          },
        };
      });

      if (playCompletionChime) {
        const toneId = profile?.restRingtoneId || 'builtin_kettlebell_chime';
        void audioEngine.play(toneId, {
          volume: profile?.volume ?? 0.85,
          loop: false,
          customRingtones,
        });
      }

      if (becameCompleted) {
        setDayJustChanged(false);
        triggerClapBurst(finishedAll);

        if (profile?.autoStartRestTimer && schedules && nextIncomplete && !finishedAll) {
          const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
          if (spec) {
            startRestTimer(spec.restSeconds, spec.name, true);
          }
        }
      }
    },
    [
      completeTimerSet,
      willFinishAllSets,
      profile,
      customRingtones,
      triggerClapBurst,
      schedules,
      todayDayKey,
      startRestTimer,
    ]
  );

  // Per-exercise timer 1-second tick loop
  const hasRunningExerciseTimer = useMemo(
    () => Object.values(exerciseTimers).some((tState) => tState.running),
    [exerciseTimers]
  );

  useEffect(() => {
    if (!hasRunningExerciseTimer) return;
    const timer = window.setInterval(() => {
      const current = exerciseTimersRef.current;
      const runningIds = Object.keys(current).filter((id) => current[id]?.running);
      if (runningIds.length === 0) return;

      const nextMap: Record<string, ExerciseTimerState> = { ...current };
      const finished: Array<{
        exerciseId: string;
        setNumber: number;
        durationSeconds: number;
      }> = [];

      for (const id of runningIds) {
        const state = nextMap[id];
        if (!state) continue;
        const nextElapsed = state.elapsedSeconds + 1;
        if (state.direction === 'countdown' && nextElapsed >= state.targetSeconds) {
          nextMap[id] = {
            ...state,
            elapsedSeconds: 0,
            running: false,
          };
          finished.push({
            exerciseId: id,
            setNumber: state.activeSetNumber,
            durationSeconds: state.targetSeconds,
          });
        } else {
          if (state.direction === 'countdown') {
            const remAfterTick = state.targetSeconds - nextElapsed;
            if (remAfterTick >= 1 && remAfterTick <= 3) {
              haptics.timerCountdownTick();
            }
          }
          nextMap[id] = {
            ...state,
            elapsedSeconds: nextElapsed,
          };
        }
      }

      exerciseTimersRef.current = nextMap;
      setExerciseTimers(nextMap);

      for (const item of finished) {
        void handleFinishExerciseTimerSet(
          item.exerciseId,
          item.setNumber,
          item.durationSeconds,
          true
        );
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasRunningExerciseTimer, handleFinishExerciseTimerSet]);

  const buildInitialExerciseTimer = useCallback(
    (entry: WorkoutLogEntry): ExerciseTimerState => {
      const spec = schedules?.[todayDayKey]?.exercises.find((e) => e.id === entry.exerciseId);
      const firstIncomplete =
        entry.sets.find((s) => !s.completed)?.setNumber || entry.sets[0]?.setNumber || 1;
      const activeSet = entry.sets.find((s) => s.setNumber === firstIncomplete);
      const targetSeconds =
        (activeSet?.durationSeconds && activeSet.durationSeconds > 0
          ? activeSet.durationSeconds
          : resolveTargetDurationSeconds(spec || entry)) || 60;
      return {
        direction: spec?.timerDirection || entry.timerDirection || 'countdown',
        targetSeconds,
        elapsedSeconds: 0,
        running: false,
        activeSetNumber: firstIncomplete,
      };
    },
    [schedules, todayDayKey]
  );

  const handleToggleExerciseTimer = useCallback(
    (entry: WorkoutLogEntry) => {
      void handleUnlockAudio();
      const existing = exerciseTimersRef.current[entry.exerciseId];
      const willRun = !(existing?.running ?? false);
      if (willRun) {
        haptics.timerStart();
      } else {
        haptics.timerPause();
      }
      setExerciseTimers((prev) => {
        const cur = prev[entry.exerciseId] || buildInitialExerciseTimer(entry);
        const setObj = entry.sets.find((s) => s.setNumber === cur.activeSetNumber);
        const targetSec =
          (setObj?.durationSeconds && setObj.durationSeconds > 0
            ? setObj.durationSeconds
            : cur.targetSeconds) || 60;
        const nextState: ExerciseTimerState = {
          ...cur,
          targetSeconds: targetSec,
          running: !cur.running,
        };
        const updated = { ...prev, [entry.exerciseId]: nextState };
        exerciseTimersRef.current = updated;
        return updated;
      });
    },
    [handleUnlockAudio, buildInitialExerciseTimer]
  );

  const handleResetExerciseTimer = useCallback(
    (entry: WorkoutLogEntry) => {
      haptics.timerReset();
      setExerciseTimers((prev) => {
        const cur = prev[entry.exerciseId] || buildInitialExerciseTimer(entry);
        const updated = {
          ...prev,
          [entry.exerciseId]: {
            ...cur,
            elapsedSeconds: 0,
            running: false,
          },
        };
        exerciseTimersRef.current = updated;
        return updated;
      });
    },
    [buildInitialExerciseTimer]
  );

  const handleChangeExerciseTimerDirection = useCallback(
    (entry: WorkoutLogEntry, direction: TimerDirection) => {
      haptics.toggle();
      setExerciseTimers((prev) => {
        const cur = prev[entry.exerciseId] || buildInitialExerciseTimer(entry);
        const updated = {
          ...prev,
          [entry.exerciseId]: {
            ...cur,
            direction,
            elapsedSeconds: 0,
            running: false,
          },
        };
        exerciseTimersRef.current = updated;
        return updated;
      });
    },
    [buildInitialExerciseTimer]
  );

  const handleSelectExerciseTimerSet = useCallback(
    (entry: WorkoutLogEntry, setNumber: number) => {
      haptics.tabSwitch();
      const setObj = entry.sets.find((s) => s.setNumber === setNumber);
      const spec = schedules?.[todayDayKey]?.exercises.find((e) => e.id === entry.exerciseId);
      const targetSec =
        (setObj?.durationSeconds && setObj.durationSeconds > 0
          ? setObj.durationSeconds
          : resolveTargetDurationSeconds(spec || entry)) || 60;

      setExerciseTimers((prev) => {
        const cur = prev[entry.exerciseId] || buildInitialExerciseTimer(entry);
        const updated = {
          ...prev,
          [entry.exerciseId]: {
            ...cur,
            activeSetNumber: setNumber,
            targetSeconds: targetSec,
            elapsedSeconds: 0,
            running: false,
          },
        };
        exerciseTimersRef.current = updated;
        return updated;
      });
    },
    [schedules, todayDayKey, buildInitialExerciseTimer]
  );

  const handleSaveExerciseTimerSet = useCallback(
    async (entry: WorkoutLogEntry) => {
      const cur = exerciseTimersRef.current[entry.exerciseId] || buildInitialExerciseTimer(entry);
      const recordedSeconds = Math.max(1, cur.elapsedSeconds);
      await handleFinishExerciseTimerSet(
        entry.exerciseId,
        cur.activeSetNumber,
        recordedSeconds,
        false
      );
    },
    [buildInitialExerciseTimer, handleFinishExerciseTimerSet]
  );

  const handleToggleRestPause = useCallback(() => {
    void handleUnlockAudio();
    lastRestTickHapticRef.current = null;
    if (restBannerTimeoutRef.current !== null) {
      window.clearTimeout(restBannerTimeoutRef.current);
      restBannerTimeoutRef.current = null;
    }
    if (restRemaining === 0) {
      haptics.timerStart();
      restEndAtRef.current = Date.now() + restTotalSeconds * 1000;
      restShouldChimeRef.current = true;
      lastRestRemainingRef.current = restTotalSeconds;
      setRestRemaining(restTotalSeconds);
      setRestRunning(true);
      setRestFinishedBanner(false);
      return;
    }
    if (restRunning) {
      haptics.timerPause();
      restEndAtRef.current = null;
      setRestRunning(false);
    } else {
      haptics.timerStart();
      restEndAtRef.current = Date.now() + restRemaining * 1000;
      restShouldChimeRef.current = true;
      setRestRunning(true);
    }
  }, [handleUnlockAudio, restRemaining, restRunning, restTotalSeconds]);

  const handleResetRest = useCallback(() => {
    haptics.timerReset();
    lastRestTickHapticRef.current = null;
    if (restBannerTimeoutRef.current !== null) {
      window.clearTimeout(restBannerTimeoutRef.current);
      restBannerTimeoutRef.current = null;
    }
    restShouldChimeRef.current = false;
    restEndAtRef.current = null;
    lastRestRemainingRef.current = restTotalSeconds;
    setRestRunning(false);
    setRestRemaining(restTotalSeconds);
    setRestFinishedBanner(false);
  }, [restTotalSeconds]);

  const handleAdjustRest = useCallback(
    (delta: number) => {
      haptics.timerAdjust();
      lastRestTickHapticRef.current = null;
      const nextRemaining = Math.max(0, Math.min(600, restRemaining + delta));
      if (nextRemaining === 0) {
        restShouldChimeRef.current = false;
      }
      lastRestRemainingRef.current = nextRemaining;
      setRestRemaining(nextRemaining);
      setRestTotalSeconds((prev) =>
        Math.max(15, Math.min(600, Math.max(nextRemaining, prev + delta)))
      );
      if (restRunning) {
        if (nextRemaining === 0) {
          restEndAtRef.current = null;
          setRestRunning(false);
        } else {
          restEndAtRef.current = Date.now() + nextRemaining * 1000;
        }
      }
    },
    [restRemaining, restRunning]
  );

  const handleToggleSetWithAutoRest = useCallback(
    async (exerciseId: string, setNumber: number, exerciseName: string) => {
      const currentEntry = effectiveTodayEntries.find((e) => e.exerciseId === exerciseId);
      const currentSet = currentEntry?.sets.find((s) => s.setNumber === setNumber);
      const isCurrentlyCompleted = Boolean(currentSet?.completed);

      // Block rapid subsequent check-offs during the 30s cooldown unless bypassed
      if (!isCurrentlyCompleted && cooldownRemaining > 0) {
        haptics.cooldownBlocked();
        setCooldownAlertTarget({ exerciseId, setNumber, exerciseName });
        return;
      }

      const willAllFinish =
        !isCurrentlyCompleted &&
        willFinishAllSets(effectiveTodayEntries, exerciseId, setNumber);

      // Fire crisp tactile response immediately for zero-latency physical feel
      if (!isCurrentlyCompleted) {
        if (willAllFinish) {
          haptics.workoutComplete();
        } else {
          haptics.setComplete();
        }
      } else {
        haptics.setUncheck();
      }

      const becameCompleted = await toggleSetComplete(exerciseId, setNumber);
      if (becameCompleted) {
        setCooldownUntilMs(Date.now() + 30_000);
        setCooldownAlertTarget(null);
        setDayJustChanged(false);
        triggerClapBurst(willAllFinish);

        if (profile?.autoStartRestTimer && schedules && !willAllFinish) {
          const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
          if (spec) {
            startRestTimer(spec.restSeconds, spec.name, true);
          }
        }
      } else if (isCurrentlyCompleted) {
        clearClapBurst();
      }
    },
    [
      effectiveTodayEntries,
      cooldownRemaining,
      willFinishAllSets,
      toggleSetComplete,
      triggerClapBurst,
      clearClapBurst,
      profile,
      schedules,
      todayDayKey,
      startRestTimer,
    ]
  );

  const handleBypassCooldownAndComplete = useCallback(async () => {
    if (!cooldownAlertTarget) return;
    const { exerciseId, setNumber } = cooldownAlertTarget;
    const willAllFinish = willFinishAllSets(
      effectiveTodayEntries,
      exerciseId,
      setNumber
    );
    if (willAllFinish) {
      haptics.workoutComplete();
    } else {
      haptics.setComplete();
    }
    const becameCompleted = await toggleSetComplete(exerciseId, setNumber);
    setCooldownAlertTarget(null);

    if (becameCompleted) {
      setCooldownUntilMs(Date.now() + 30_000);
      setDayJustChanged(false);
      triggerClapBurst(willAllFinish);

      if (profile?.autoStartRestTimer && schedules && !willAllFinish) {
        const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
        if (spec) {
          startRestTimer(spec.restSeconds, spec.name, true);
        }
      }
    }
  }, [
    cooldownAlertTarget,
    effectiveTodayEntries,
    willFinishAllSets,
    toggleSetComplete,
    triggerClapBurst,
    profile,
    schedules,
    todayDayKey,
    startRestTimer,
  ]);

  const handleTestAlarm = useCallback(() => {
    if (!schedules) return;
    void handleUnlockAudio();
    const todaySched = schedules[todayDayKey];
    triggerAlarm(todaySched, true);
  }, [schedules, todayDayKey, handleUnlockAudio, triggerAlarm]);

  const handleDismissAlarm = useCallback(() => {
    haptics.toggle();
    audioEngine.stop();
    setActiveAlarm(null);
    setSnoozeTargetMs(null);
    snoozedAlarmRef.current = null;
  }, []);

  const handleSnoozeAlarm = useCallback(() => {
    haptics.timerReset();
    audioEngine.stop();
    const mins = profile?.snoozeMinutes ?? 5;
    if (activeAlarm) {
      snoozedAlarmRef.current = {
        schedule: activeAlarm.schedule,
        isTest: activeAlarm.isTest,
      };
    }
    setSnoozeTargetMs(Date.now() + mins * 60 * 1000);
    setActiveAlarm(null);
  }, [profile, activeAlarm]);

  const handleStartWorkoutFromAlarm = useCallback(() => {
    haptics.timerStart();
    audioEngine.stop();
    setActiveAlarm(null);
    setSnoozeTargetMs(null);
    snoozedAlarmRef.current = null;
    navigateToTab('today');
  }, [navigateToTab]);

  const nextAlarm = useMemo(
    () => (schedules ? computeNextAlarm(schedules, now, lang) : null),
    [schedules, now, lang]
  );

  // Check whether signed-in user has confirmed their display name after login,
  // and reset active session timers/alarms cleanly on sign-out.
  useEffect(() => {
    if (!user) {
      setNameConfirmed(true);
      audioEngine.stop();
      setActiveAlarm(null);
      setSnoozeTargetMs(null);
      snoozedAlarmRef.current = null;
      lastTriggeredSlotRef.current = null;
      restShouldChimeRef.current = false;
      restEndAtRef.current = null;
      if (restBannerTimeoutRef.current !== null) {
        window.clearTimeout(restBannerTimeoutRef.current);
        restBannerTimeoutRef.current = null;
      }
      setRestRunning(false);
      setRestFinishedBanner(false);
      setExerciseTimers({});
      exerciseTimersRef.current = {};
      setCooldownUntilMs(null);
      setCooldownAlertTarget(null);
      setActivePopup(null);
      setTutorialOpen(false);
      return;
    }
    try {
      const key = `ironpulse_name_confirmed_${user.uid}`;
      setNameConfirmed(localStorage.getItem(key) === '1');
    } catch {
      setNameConfirmed(true);
    }
  }, [user]);

  const handleSaveNameFromPrompt = useCallback(
    async (name: string) => {
      await updateProfile({ displayName: name });
      if (user) {
        try {
          localStorage.setItem(`ironpulse_name_confirmed_${user.uid}`, '1');
        } catch {
          // ignore storage errors
        }
      }
      setNameConfirmed(true);
    },
    [updateProfile, user]
  );

  // Auto-open tutorial (starting with Language Picker) once per user after name confirmation
  useEffect(() => {
    if (
      showIntro ||
      !authReady ||
      !user ||
      dataLoading ||
      !profile ||
      !schedules ||
      !nameConfirmed
    ) {
      return;
    }
    try {
      const seenKey = `ironpulse_tutorial_seen_${user.uid}`;
      if (!localStorage.getItem(seenKey)) {
        setTutorialStartWithLang(true);
        setTutorialOpen(true);
      }
    } catch {
      // ignore storage errors in restricted contexts
    }
  }, [showIntro, authReady, user, dataLoading, profile, schedules, nameConfirmed]);

  const handleOpenTutorialFromUi = useCallback(() => {
    setTutorialStartWithLang(false);
    setTutorialOpen(true);
  }, []);

  const handleCompleteTutorial = useCallback(() => {
    if (user) {
      try {
        localStorage.setItem(`ironpulse_tutorial_seen_${user.uid}`, '1');
      } catch {
        // ignore storage errors
      }
    }
    setTutorialOpen(false);
  }, [user]);

  const handleSelectTab = useCallback(
    (tab: AppTab) => {
      if (tab === 'about') {
        setActivePopup('about');
        return;
      }
      setActivePopup(null);
      navigateToTab(tab);
      if (tab === 'settings') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [navigateToTab]
  );

  const handleOpenSettingsTab = useCallback(() => {
    setActivePopup(null);
    if (activeTab === 'settings') {
      navigateToTab('today');
    } else {
      navigateToTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, navigateToTab]);

  const handleToggleAboutPopup = useCallback(() => {
    setActivePopup((prev) => (prev === 'about' ? null : 'about'));
  }, []);

  const handleCloseAboutPopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const handleStartWorkout = useCallback(
    (exerciseId?: string) => {
      setFocusedWorkoutExerciseId(exerciseId || null);
      navigateToTab('workout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigateToTab]
  );

  const handleBackToToday = useCallback(() => {
    navigateToTab('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigateToTab]);

  const handleOpenExerciseManagerForDay = useCallback(
    (dayKey: DayKey) => {
      setExerciseDayKey(dayKey);
      navigateToTab('exercises');
    },
    [navigateToTab]
  );

  const handleOpenScheduleTab = useCallback(() => {
    navigateToTab('schedule');
  }, [navigateToTab]);

  const handleGoToTodayTab = useCallback(() => {
    navigateToTab('today');
  }, [navigateToTab]);

  const handleDismissCooldownAlert = useCallback(() => {
    setCooldownAlertTarget(null);
  }, []);

  const handleSignOutAction = useCallback(async () => {
    await signOutUser();
  }, [signOutUser]);

  // Shared live companion state powering both the Hero inline orb and the Floating Corner Orb
  const todayScheduleForMascot = schedules?.[todayDayKey];
  const todayDayLabel = DAY_LABELS[lang][todayDayKey].label;
  const totalTodaySets = useMemo(
    () => effectiveTodayEntries.reduce((acc, e) => acc + e.sets.length, 0),
    [effectiveTodayEntries]
  );
  const completedTodaySets = useMemo(
    () =>
      effectiveTodayEntries.reduce(
        (acc, e) => acc + e.sets.filter((s) => s.completed).length,
        0
      ),
    [effectiveTodayEntries]
  );
  const todayProgressPct =
    totalTodaySets > 0 ? Math.round((completedTodaySets / totalTodaySets) * 100) : 0;
  const activeTimerEntryForMascot = useMemo(
    () => effectiveTodayEntries.find((e) => exerciseTimers[e.exerciseId]?.running),
    [effectiveTodayEntries, exerciseTimers]
  );

  let mascotMood: MascotMood = 'ready';
  if (justClapped) {
    if (totalTodaySets > 0 && completedTodaySets === totalTodaySets) {
      mascotMood = 'celebrate';
    } else if (todayProgressPct >= 50) {
      mascotMood = 'milestone';
    } else {
      mascotMood = 'clap';
    }
  } else if (activeTimerEntryForMascot) {
    mascotMood = 'timerActive';
  } else if (restRunning) {
    mascotMood = 'rest';
  } else if (todayScheduleForMascot && !todayScheduleForMascot.isGymDay) {
    mascotMood = 'restday';
  } else {
    mascotMood = 'ready';
  }

  const dialogueActive =
    !showIntro &&
    authReady &&
    !dataLoading &&
    Boolean(profile) &&
    nameConfirmed &&
    !tutorialOpen &&
    !activeAlarm &&
    activePopup === null;

  const companion = useMascotCompanion({
    mood: mascotMood,
    timePhase,
    hour: now.getHours(),
    restRemainingFormatted: restRunning ? formatRestDuration(restRemaining) : undefined,
    activeTimerExerciseName: activeTimerEntryForMascot?.name,
    progressPct: todayProgressPct,
    completedSets: completedTodaySets,
    totalSets: totalTodaySets,
    dayLabel: todayDayLabel,
    userName: profile?.displayName,
    dayJustChanged,
    dialogueActive,
    voiceVolume: profile?.volume ?? 0.85,
  });

  const getHeroOrbRect = useCallback(() => {
    return heroOrbAnchorRef.current ? heroOrbAnchorRef.current.getBoundingClientRect() : null;
  }, []);

  const shouldFloatCompanion =
    activeTab !== 'today' || !heroMascotVisible;
  const suppressFloatingCompanion =
    showIntro ||
    Boolean(activeAlarm) ||
    activePopup !== null ||
    !nameConfirmed ||
    tutorialOpen ||
    Boolean(cooldownAlertTarget);

  const renderBody = () => {
    if (!authReady) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ip-canvas-bg)] text-sm text-[#9CA3AF]">
          {t('Memuat sesi IronPulse...', 'Loading IronPulse session...')}
        </div>
      );
    }

    if (!user) {
      return <AuthGate onSignIn={signInWithGoogle} authError={authError} />;
    }

    if (dataLoading || !profile || !schedules) {
      return (
        <div className="min-h-screen bg-[var(--ip-canvas-bg)] text-[#F4F5F7]">
          <TopBar
            activeTab={activeTab}
            activePopup={activePopup}
            timePhase={timePhase}
            onSelectTab={handleSelectTab}
            onOpenSettings={handleOpenSettingsTab}
            onOpenAbout={() =>
              setActivePopup((prev) => (prev === 'about' ? null : 'about'))
            }
            onTestAlarm={() => {}}
          />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <div className="h-44 animate-pulse rounded-2xl bg-[#13161C]" />
                <div className="h-64 animate-pulse rounded-2xl bg-[#13161C]" />
              </div>
              <div className="space-y-4 lg:col-span-4">
                <div className="h-40 animate-pulse rounded-2xl bg-[#13161C]" />
                <div className="h-64 animate-pulse rounded-2xl bg-[#13161C]" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    const tabFallback = (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-[#13161C]/75" />
        <div className="h-56 animate-pulse rounded-2xl bg-[#13161C]/75" />
      </div>
    );

    return (
      <div className="relative min-h-screen bg-[var(--ip-canvas-bg)] text-[#F4F5F7]">
        {/* Fixed Atmospheric Time-of-Day Ambient Glow & Glass Refraction Orbs (disabled on ubuntu-yaru or when No Ambient Glow is active) */}
        {!isYaru && !performance.noAmbientGlow && (
          <>
            <div
              aria-hidden="true"
              className={`pointer-events-none fixed inset-x-0 top-0 z-0 h-[440px] transition-opacity duration-500 ${
                isCarbon || isMaterialYou ? 'opacity-40' : 'opacity-100'
              }`}
              style={{
                backgroundImage: isAero
                  ? 'radial-gradient(ellipse 88% 58% at 50% -10%, rgba(56, 189, 248, 0.34), rgba(14, 165, 233, 0.1) 50%, transparent 78%)'
                  : phaseToken.ambientGlow,
              }}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none fixed -left-10 top-20 z-0 rounded-full transition-all duration-500 sm:-left-20 ${
                isAero
                  ? 'h-80 w-80 opacity-60 sm:h-[26rem] sm:w-[26rem]'
                  : isFrosted
                    ? 'h-80 w-80 opacity-50 sm:h-96 sm:w-96'
                    : isCarbon || isMaterialYou
                      ? 'h-64 w-64 opacity-10 sm:h-72 sm:w-72'
                      : 'h-72 w-72 opacity-34 sm:h-80 sm:w-80'
              }`}
              style={{
                backgroundImage: isAero
                  ? 'radial-gradient(circle, rgba(125, 211, 252, 0.44) 0%, rgba(14, 165, 233, 0.22) 45%, transparent 74%)'
                  : isMaterialYou
                    ? 'radial-gradient(circle, rgba(var(--md-sys-color-primary-rgb), 0.28) 0%, transparent 72%)'
                    : isFrosted
                      ? `radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.72) 0%, ${phaseToken.accent}52 42%, transparent 74%)`
                      : `radial-gradient(circle, ${phaseToken.accent}55 0%, transparent 70%)`,
              }}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none fixed -right-10 top-48 z-0 rounded-full transition-all duration-500 sm:-right-20 ${
                isAero
                  ? 'h-80 w-80 opacity-45 sm:h-[28rem] sm:w-[28rem]'
                  : isFrosted
                    ? 'h-80 w-80 opacity-40 sm:h-[28rem] sm:w-[28rem]'
                    : isMaterialYou
                      ? 'h-72 w-72 opacity-16 sm:h-96 sm:w-96'
                      : isCarbon
                        ? 'h-64 w-64 opacity-8 sm:h-80 sm:w-80'
                        : 'h-80 w-80 opacity-26 sm:h-96 sm:w-96'
              }`}
              style={{
                backgroundImage: isAero
                  ? 'radial-gradient(circle, rgba(56, 189, 248, 0.34) 0%, rgba(var(--ip-accent-rgb), 0.18) 44%, transparent 74%)'
                  : isMaterialYou
                    ? 'radial-gradient(circle, rgba(var(--md-sys-color-secondary-container-rgb), 0.55) 0%, rgba(var(--md-sys-color-primary-rgb), 0.14) 48%, transparent 74%)'
                    : isFrosted
                      ? `radial-gradient(circle, rgba(var(--ip-accent-rgb), 0.26) 0%, ${phaseToken.accentBright}35 44%, transparent 74%)`
                      : `radial-gradient(circle, ${phaseToken.accentBright}44 0%, transparent 72%)`,
              }}
            />
            {!isCarbon && !isMaterialYou && (
              <div
                aria-hidden="true"
                className={`pointer-events-none fixed inset-x-0 top-64 z-0 mx-auto h-72 w-72 rounded-full transition-all duration-500 sm:h-80 sm:w-80 ${
                  isAero ? 'opacity-36' : isFrosted ? 'opacity-38' : 'opacity-26'
                }`}
                style={{
                  backgroundImage: isAero
                    ? 'radial-gradient(circle, rgba(186, 230, 253, 0.32) 0%, rgba(14, 165, 233, 0.14) 48%, transparent 75%)'
                    : isFrosted
                      ? `radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.65) 0%, ${phaseToken.accent}24 48%, transparent 75%)`
                      : `radial-gradient(circle, ${phaseToken.accentBright}40 0%, rgba(var(--ip-accent-rgb), 0.14) 48%, transparent 75%)`,
                }}
              />
            )}
          </>
        )}

        <TopBar
          activeTab={activeTab}
          activePopup={activePopup}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          onOpenSettings={handleOpenSettingsTab}
          onOpenAbout={handleToggleAboutPopup}
          onTestAlarm={handleTestAlarm}
        />

        {restFinishedBanner && (
          <div className="relative z-10 border-b border-[#16A34A]/40 bg-[#16A34A]/15 px-4 py-2.5 text-center text-xs font-semibold text-[#86EFAC]">
            {t(
              'Waktu istirahat selesai — lanjutkan set berikutnya.',
              'Rest time finished — start your next set.'
            )}
          </div>
        )}

        <main className="relative z-10 mx-auto max-w-7xl px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-12 lg:px-8">
          <div className="mb-5 lg:hidden">
            <PWAInstallCard />
          </div>
          <Suspense fallback={tabFallback}>
            <div
              key={activeTab}
              className={disableAnim ? 'w-full' : 'w-full ip-tab-enter'}
            >
              {activeTab === 'today' && (
                <TodayWorkoutView
                  now={now}
                  todayDayKey={todayDayKey}
                  schedules={schedules}
                  todayEntries={effectiveTodayEntries}
                  nextAlarm={nextAlarm}
                  audioUnlocked={audioUnlocked}
                  onUnlockAudio={handleUnlockAudio}
                  restTotalSeconds={restTotalSeconds}
                  restRemaining={restRemaining}
                  restRunning={restRunning}
                  restExerciseLabel={restExerciseLabel}
                  companion={companion}
                  heroOrbAnchorRef={heroOrbAnchorRef}
                  hideHeroOrbVisual={floatingOrbPresent}
                  onHeroMascotVisibilityChange={setHeroMascotVisible}
                  onToggleRestPause={handleToggleRestPause}
                  onResetRest={handleResetRest}
                  onAdjustRest={handleAdjustRest}
                  onStartRestTimer={startRestTimer}
                  onStartWorkout={handleStartWorkout}
                  onOpenExerciseManager={handleOpenExerciseManagerForDay}
                  onOpenScheduleManager={handleOpenScheduleTab}
                />
              )}

              {activeTab === 'workout' && (
                <WorkoutSessionView
                  now={now}
                  todayDayKey={todayDayKey}
                  schedules={schedules}
                  todayEntries={effectiveTodayEntries}
                  initialExerciseId={focusedWorkoutExerciseId}
                  restTotalSeconds={restTotalSeconds}
                  restRemaining={restRemaining}
                  restRunning={restRunning}
                  restExerciseLabel={restExerciseLabel}
                  cooldownRemaining={cooldownRemaining}
                  cooldownAlertTarget={cooldownAlertTarget}
                  exerciseTimers={exerciseTimers}
                  onBackToToday={handleBackToToday}
                  onToggleRestPause={handleToggleRestPause}
                  onResetRest={handleResetRest}
                  onAdjustRest={handleAdjustRest}
                  onStartRestTimer={startRestTimer}
                  onToggleSetComplete={handleToggleSetWithAutoRest}
                  onBypassCooldownAndComplete={handleBypassCooldownAndComplete}
                  onDismissCooldownAlert={handleDismissCooldownAlert}
                  onUpdateSetMetrics={updateSetMetrics}
                  onUpdateSetDuration={updateSetDuration}
                  onToggleExerciseTimer={handleToggleExerciseTimer}
                  onResetExerciseTimer={handleResetExerciseTimer}
                  onChangeExerciseTimerDirection={handleChangeExerciseTimerDirection}
                  onSelectExerciseTimerSet={handleSelectExerciseTimerSet}
                  onSaveExerciseTimerSet={handleSaveExerciseTimerSet}
                  onAddSet={addSetToExercise}
                  onRemoveSet={removeSetFromExercise}
                  onOpenExerciseManager={handleOpenExerciseManagerForDay}
                  onOpenScheduleManager={handleOpenScheduleTab}
                />
              )}

              {activeTab === 'schedule' && (
                <WeeklyScheduleView
                  todayDayKey={todayDayKey}
                  schedules={schedules}
                  customRingtones={customRingtones}
                  onUpdateSchedule={updateSchedule}
                  onOpenExerciseManager={handleOpenExerciseManagerForDay}
                />
              )}

              {activeTab === 'history' && (
                <HistoryProgressView
                  workoutHistory={workoutHistory}
                  loading={historyLoading}
                  todayDateKey={todayDateKey}
                  onGoToToday={handleGoToTodayTab}
                />
              )}

              {activeTab === 'exercises' && (
                <ExerciseManagerView
                  selectedDayKey={exerciseDayKey}
                  onSelectDayKey={setExerciseDayKey}
                  schedules={schedules}
                  onAddExercise={addExerciseToDay}
                  onAddExercises={addExercisesToDay}
                  onUpdateExercise={updateExerciseInDay}
                  onRemoveExercise={removeExerciseFromDay}
                  onMoveExercise={moveExerciseInDay}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  now={now}
                  profile={profile}
                  customRingtones={customRingtones}
                  onUpdateProfile={updateProfile}
                  onUploadRingtone={addCustomRingtone}
                  onDeleteRingtone={deleteCustomRingtone}
                  onOpenTutorial={handleOpenTutorialFromUi}
                  onSignOut={handleSignOutAction}
                />
              )}
            </div>
          </Suspense>
        </main>

        <MobileBottomNav
          activeTab={activeTab}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          restRemaining={restRunning ? restRemaining : 0}
          restRunning={restRunning}
        />

        {!showIntro && (
          <Suspense fallback={null}>
            <FloatingMascotDock
              companion={companion}
              shouldFloat={shouldFloatCompanion}
              suppressed={suppressFloatingCompanion}
              activeTab={activeTab}
              getHeroOrbRect={getHeroOrbRect}
              onFloatingPresenceChange={setFloatingOrbPresent}
            />
          </Suspense>
        )}

        {activeAlarm && (
          <Suspense fallback={null}>
            <ActiveAlarmOverlay
              schedule={activeAlarm.schedule}
              snoozeMinutes={profile.snoozeMinutes}
              ringtoneName={activeAlarm.ringtoneName}
              isTest={activeAlarm.isTest}
              onStartWorkout={handleStartWorkoutFromAlarm}
              onSnooze={handleSnoozeAlarm}
              onDismiss={handleDismissAlarm}
            />
          </Suspense>
        )}

        <GlassModal
          open={activePopup === 'about'}
          onClose={handleCloseAboutPopup}
          title="About IronPulse"
          subtitle={t(
            'Informasi pengembang, konsep, rilis, dan ringkasan aplikasi.',
            'Developer credits, concept notes, release info, and app overview.'
          )}
          maxWidthClass="max-w-xl"
          accentBorderClass="border-pulse/30"
          closeAriaLabel={t('Tutup Tentang Aplikasi', 'Close About')}
        >
          <Suspense fallback={null}>
            <AboutView embeddedInModal />
          </Suspense>
        </GlassModal>

        {!showIntro && !nameConfirmed && (
          <Suspense fallback={null}>
            <NamePromptModal
              open={!showIntro && !nameConfirmed}
              initialName={profile.displayName}
              onSaveName={handleSaveNameFromPrompt}
            />
          </Suspense>
        )}

        {tutorialOpen && nameConfirmed && (
          <Suspense fallback={null}>
            <FeatureTutorialModal
              open={tutorialOpen && nameConfirmed}
              startAtLanguageStep={tutorialStartWithLang}
              onComplete={handleCompleteTutorial}
              onJumpToTab={handleSelectTab}
            />
          </Suspense>
        )}

        <OfflineIndicator />
      </div>
    );
  };

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <MotionConfig reducedMotion={performance.noAnimations ? 'always' : 'user'}>
      <AnimatePresence>
        {showIntro && !performance.noAnimations && (
          <LaunchIntro
            timePhase={timePhase}
            onComplete={handleIntroComplete}
          />
        )}
      </AnimatePresence>
      {renderBody()}
    </MotionConfig>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
