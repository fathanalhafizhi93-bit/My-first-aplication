/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, MotionConfig, useReducedMotion } from 'motion/react';
import { AboutView } from './components/AboutView';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { AuthGate } from './components/AuthGate';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { FeatureTutorialModal } from './components/FeatureTutorialModal';
import { FloatingMascotDock } from './components/FloatingMascotDock';
import { GlassModal } from './components/GlassModal';
import { HistoryProgressView } from './components/HistoryProgressView';
import { LaunchIntro } from './components/LaunchIntro';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NamePromptModal } from './components/NamePromptModal';
import { OfflineIndicator, PWAInstallCard } from './components/PWAInstallBanner';
import { RingtoneManagerView } from './components/RingtoneManagerView';
import { SettingsView } from './components/SettingsView';
import { ExerciseTimerState, TodayWorkoutView } from './components/TodayWorkoutView';
import { TopBar } from './components/TopBar';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { WorkoutSessionView } from './components/WorkoutSessionView';
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
import { TAB_GLIDE_SPRING } from './lib/motionTokens';
import { syncNativeWeeklyAlarms } from './lib/nativeAlarmBridge';
import {
  AppTab,
  DayKey,
  DaySchedule,
  resolveTargetDurationSeconds,
  TimerDirection,
  WorkoutLogEntry,
} from './types/gym';

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

const TAB_ORDER: Record<AppTab, number> = {
  today: 0,
  workout: 0.5,
  schedule: 1,
  history: 2,
  exercises: 3,
  ringtones: 4,
  settings: 5,
  about: 6,
};

const TAB_SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : direction < 0 ? -28 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : direction < 0 ? 28 : 0,
    opacity: 0,
  }),
};

const SHARED_PAIR_VARIANTS = {
  enter: { opacity: 0.94 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const REDUCED_TAB_VARIANTS = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function AppContent() {
  const { lang, t, todayThemeMode, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const isMaterialYou = uiTheme === 'material-you';
  const isAero = uiTheme === 'aeroglass';
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

  const [tabState, setTabState] = useState<{
    activeTab: AppTab;
    prevTab: AppTab;
    direction: number;
  }>({
    activeTab: 'today',
    prevTab: 'today',
    direction: 0,
  });
  const { activeTab, prevTab, direction: tabDirection } = tabState;
  const isSharedPairTransition =
    (prevTab === 'today' && activeTab === 'workout') ||
    (prevTab === 'workout' && activeTab === 'today');
  const [activePopup, setActivePopup] = useState<'about' | null>(null);
  const [heroMascotVisible, setHeroMascotVisible] = useState<boolean>(true);
  const [floatingOrbPresent, setFloatingOrbPresent] = useState<boolean>(false);
  const heroOrbAnchorRef = useRef<HTMLButtonElement | null>(null);

  const navigateToTab = useCallback((nextTab: AppTab) => {
    setTabState((curr) => {
      if (curr.activeTab === nextTab) return curr;
      haptics.tabSwitch();
      const dir = TAB_ORDER[nextTab] >= TAB_ORDER[curr.activeTab] ? 1 : -1;
      return {
        activeTab: nextTab,
        prevTab: curr.activeTab,
        direction: dir,
      };
    });
  }, []);
  const [showIntro, setShowIntro] = useState(true);
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStartWithLang, setTutorialStartWithLang] = useState(true);
  const [isOpeningGreeting, setIsOpeningGreeting] = useState(true);
  const [exerciseDayKey, setExerciseDayKey] = useState<DayKey>(todayDayKey);
  const [now, setNow] = useState<Date>(() => new Date());
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

  // 1-second clock + midnight rollover + alarm watcher
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      setNow(current);

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

  // Derived 30s cooldown remaining seconds
  const cooldownRemaining = useMemo(() => {
    if (cooldownUntilMs === null) return 0;
    return Math.max(0, Math.ceil((cooldownUntilMs - now.getTime()) / 1000));
  }, [cooldownUntilMs, now]);

  useEffect(() => {
    if (cooldownUntilMs !== null && now.getTime() >= cooldownUntilMs) {
      setCooldownUntilMs(null);
      setCooldownAlertTarget(null);
    }
  }, [cooldownUntilMs, now]);

  // Sync scheduled alarms to native Android background scheduler when running in Capacitor APK
  useEffect(() => {
    if (!schedules) return;
    void syncNativeWeeklyAlarms(schedules);
  }, [schedules]);

  // Rest timer countdown loop (wall-clock anchored so backgrounding never drifts)
  useEffect(() => {
    if (!restRunning) {
      lastRestTickHapticRef.current = null;
      return;
    }
    if (restEndAtRef.current === null) {
      restEndAtRef.current = Date.now() + restRemaining * 1000;
    }
    const tick = () => {
      const endAt = restEndAtRef.current;
      if (endAt === null) return;
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRestRemaining(rem);
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
        return {
          ...prev,
          [exerciseId]: {
            ...cur,
            elapsedSeconds: 0,
            running: false,
            activeSetNumber: nextIncomplete ? nextIncomplete.setNumber : setNumber,
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
        setIsOpeningGreeting(false);
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
    setRestRunning(false);
    setRestRemaining(restTotalSeconds);
    setRestFinishedBanner(false);
  }, [restTotalSeconds]);

  const handleAdjustRest = useCallback(
    (delta: number) => {
      haptics.timerAdjust();
      lastRestTickHapticRef.current = null;
      const nextRemaining = Math.max(0, Math.min(600, restRemaining + delta));
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
        setIsOpeningGreeting(false);
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
      setIsOpeningGreeting(false);
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
    setIsOpeningGreeting(true);
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
      setIsOpeningGreeting(true);
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

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{
          opacity: showIntro ? 0.72 : 1,
          scale: showIntro ? 0.978 : 1,
        }}
        transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-screen bg-[var(--ip-canvas-bg)] text-[#F4F5F7]"
      >
        {/* Lightweight Fixed Atmospheric Time-of-Day Ambient Glow & Glass Refraction Orbs */}
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
          className={`pointer-events-none fixed -left-24 top-28 z-0 rounded-full transition-all duration-500 ${
            isAero
              ? 'h-[26rem] w-[26rem] opacity-55'
              : isFrosted
                ? 'h-96 w-96 opacity-45'
                : isCarbon || isMaterialYou
                  ? 'h-72 w-72 opacity-10'
                  : 'h-80 w-80 opacity-25'
          }`}
          style={{
            backgroundImage: isAero
              ? 'radial-gradient(circle, rgba(125, 211, 252, 0.42) 0%, rgba(14, 165, 233, 0.22) 45%, transparent 74%)'
              : isFrosted
                ? `radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.72) 0%, ${phaseToken.accent}52 42%, transparent 74%)`
                : `radial-gradient(circle, ${phaseToken.accent}55 0%, transparent 70%)`,
          }}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed -right-24 top-44 z-0 rounded-full transition-all duration-500 ${
            isAero
              ? 'h-[28rem] w-[28rem] opacity-42'
              : isFrosted
                ? 'h-[28rem] w-[28rem] opacity-35'
                : isCarbon || isMaterialYou
                  ? 'h-80 w-80 opacity-8'
                  : 'h-96 w-96 opacity-20'
          }`}
          style={{
            backgroundImage: isAero
              ? 'radial-gradient(circle, rgba(56, 189, 248, 0.32) 0%, rgba(var(--ip-accent-rgb), 0.16) 44%, transparent 74%)'
              : isFrosted
                ? `radial-gradient(circle, rgba(var(--ip-accent-rgb), 0.24) 0%, ${phaseToken.accentBright}35 44%, transparent 74%)`
                : `radial-gradient(circle, ${phaseToken.accentBright}44 0%, transparent 72%)`,
          }}
        />
        {(isFrosted || isAero) && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-10 left-1/3 z-0 h-80 w-80 rounded-full opacity-32 transition-all duration-500"
            style={{
              backgroundImage: isAero
                ? 'radial-gradient(circle, rgba(186, 230, 253, 0.26) 0%, rgba(14, 165, 233, 0.12) 48%, transparent 75%)'
                : 'radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.65) 0%, rgba(var(--ip-accent-rgb), 0.14) 48%, transparent 75%)',
            }}
          />
        )}

        <LayoutGroup id="ironpulse-shell">
        <TopBar
          activeTab={activeTab}
          activePopup={activePopup}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          onOpenSettings={handleOpenSettingsTab}
          onOpenAbout={() =>
            setActivePopup((prev) => (prev === 'about' ? null : 'about'))
          }
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

        <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8">
          <div className="mb-5 lg:hidden">
            <PWAInstallCard />
          </div>
          <div className="relative overflow-x-clip">
            <AnimatePresence mode="popLayout" initial={false} custom={tabDirection}>
              <motion.div
                key={activeTab}
                custom={tabDirection}
                variants={
                  prefersReducedMotion
                    ? REDUCED_TAB_VARIANTS
                    : isSharedPairTransition
                      ? SHARED_PAIR_VARIANTS
                      : TAB_SLIDE_VARIANTS
                }
                initial="enter"
                animate="center"
                exit="exit"
                transition={
                  prefersReducedMotion
                    ? { duration: 0.12 }
                    : isSharedPairTransition
                      ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                      : {
                          x: TAB_GLIDE_SPRING,
                          opacity: { duration: 0.18, ease: 'easeOut' },
                        }
                }
                className="w-full will-change-transform"
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
                    onStartWorkout={() => {
                      navigateToTab('workout');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenExerciseManager={(dayKey) => {
                      setExerciseDayKey(dayKey);
                      navigateToTab('exercises');
                    }}
                    onOpenScheduleManager={() => navigateToTab('schedule')}
                  />
                )}

                {activeTab === 'workout' && (
                  <WorkoutSessionView
                    now={now}
                    todayDayKey={todayDayKey}
                    schedules={schedules}
                    todayEntries={effectiveTodayEntries}
                    restRemaining={restRemaining}
                    restRunning={restRunning}
                    restExerciseLabel={restExerciseLabel}
                    cooldownRemaining={cooldownRemaining}
                    cooldownAlertTarget={cooldownAlertTarget}
                    exerciseTimers={exerciseTimers}
                    onBackToToday={() => {
                      navigateToTab('today');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onToggleRestPause={handleToggleRestPause}
                    onResetRest={handleResetRest}
                    onAdjustRest={handleAdjustRest}
                    onStartRestTimer={startRestTimer}
                    onToggleSetComplete={handleToggleSetWithAutoRest}
                    onBypassCooldownAndComplete={handleBypassCooldownAndComplete}
                    onDismissCooldownAlert={() => setCooldownAlertTarget(null)}
                    onUpdateSetMetrics={updateSetMetrics}
                    onUpdateSetDuration={updateSetDuration}
                    onToggleExerciseTimer={handleToggleExerciseTimer}
                    onResetExerciseTimer={handleResetExerciseTimer}
                    onChangeExerciseTimerDirection={handleChangeExerciseTimerDirection}
                    onSelectExerciseTimerSet={handleSelectExerciseTimerSet}
                    onSaveExerciseTimerSet={handleSaveExerciseTimerSet}
                    onAddSet={addSetToExercise}
                    onRemoveSet={removeSetFromExercise}
                    onOpenExerciseManager={(dayKey) => {
                      setExerciseDayKey(dayKey);
                      navigateToTab('exercises');
                    }}
                    onOpenScheduleManager={() => navigateToTab('schedule')}
                  />
                )}

                {activeTab === 'schedule' && (
                  <WeeklyScheduleView
                    todayDayKey={todayDayKey}
                    schedules={schedules}
                    customRingtones={customRingtones}
                    onUpdateSchedule={updateSchedule}
                    onOpenExerciseManager={(dayKey) => {
                      setExerciseDayKey(dayKey);
                      navigateToTab('exercises');
                    }}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryProgressView
                    workoutHistory={workoutHistory}
                    loading={historyLoading}
                    todayDateKey={todayDateKey}
                    onGoToToday={() => navigateToTab('today')}
                  />
                )}

                {activeTab === 'exercises' && (
                  <ExerciseManagerView
                    selectedDayKey={exerciseDayKey}
                    onSelectDayKey={setExerciseDayKey}
                    schedules={schedules}
                    onAddExercise={addExerciseToDay}
                    onUpdateExercise={updateExerciseInDay}
                    onRemoveExercise={removeExerciseFromDay}
                    onMoveExercise={moveExerciseInDay}
                  />
                )}

                {activeTab === 'ringtones' && (
                  <RingtoneManagerView
                    profile={profile}
                    customRingtones={customRingtones}
                    onUpdateProfile={updateProfile}
                    onUploadRingtone={addCustomRingtone}
                    onDeleteRingtone={deleteCustomRingtone}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    now={now}
                    profile={profile}
                    onUpdateProfile={updateProfile}
                    onOpenRingtones={() => navigateToTab('ringtones')}
                    onOpenTutorial={handleOpenTutorialFromUi}
                    onSignOut={async () => {
                      await signOutUser();
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <MobileBottomNav
          activeTab={activeTab}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          restRemaining={restRemaining}
          restRunning={restRunning}
        />
        </LayoutGroup>

        <FloatingMascotDock
          companion={companion}
          shouldFloat={shouldFloatCompanion}
          suppressed={suppressFloatingCompanion}
          activeTab={activeTab}
          getHeroOrbRect={getHeroOrbRect}
          onFloatingPresenceChange={setFloatingOrbPresent}
        />

        {activeAlarm && (
          <ActiveAlarmOverlay
            schedule={activeAlarm.schedule}
            snoozeMinutes={profile.snoozeMinutes}
            ringtoneName={activeAlarm.ringtoneName}
            isTest={activeAlarm.isTest}
            onStartWorkout={handleStartWorkoutFromAlarm}
            onSnooze={handleSnoozeAlarm}
            onDismiss={handleDismissAlarm}
          />
        )}

        <GlassModal
          open={activePopup === 'about'}
          onClose={() => setActivePopup(null)}
          title="About IronPulse"
          subtitle={t(
            'Informasi pengembang, konsep, rilis, dan ringkasan aplikasi.',
            'Developer credits, concept notes, release info, and app overview.'
          )}
          maxWidthClass="max-w-xl"
          accentBorderClass="border-pulse/30"
          closeAriaLabel={t('Tutup Tentang Aplikasi', 'Close About')}
        >
          <AboutView embeddedInModal />
        </GlassModal>

        <NamePromptModal
          open={!showIntro && !nameConfirmed}
          initialName={profile.displayName}
          onSaveName={handleSaveNameFromPrompt}
        />

        <FeatureTutorialModal
          open={tutorialOpen && nameConfirmed}
          startAtLanguageStep={tutorialStartWithLang}
          onComplete={handleCompleteTutorial}
          onJumpToTab={handleSelectTab}
        />

        <OfflineIndicator />
      </motion.div>
    );
  };

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <LaunchIntro
            timePhase={timePhase}
            onComplete={handleIntroComplete}
          />
        )}
      </AnimatePresence>
      {renderBody()}
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </MotionConfig>
  );
}
