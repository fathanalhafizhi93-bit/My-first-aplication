/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AboutView } from './components/AboutView';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { AuthGate } from './components/AuthGate';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { FeatureTutorialModal } from './components/FeatureTutorialModal';
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
import { audioEngine, BUILTIN_RINGTONES } from './lib/audioEngine';
import {
  computeNextAlarm,
  formatHHMM,
  formatLocalDateKey,
  getTodayDayKey,
} from './lib/dateUtils';
import {
  LanguageProvider,
  PHASE_THEME_TOKENS,
  resolveDayTimePhase,
  useI18n,
} from './lib/i18n';
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

function AppContent() {
  const { lang, t, todayThemeMode, uiTheme } = useI18n();
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
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

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [activePopup, setActivePopup] = useState<'settings' | 'about' | null>(null);
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
    if (!restRunning) return;
    if (restEndAtRef.current === null) {
      restEndAtRef.current = Date.now() + restRemaining * 1000;
    }
    const tick = () => {
      const endAt = restEndAtRef.current;
      if (endAt === null) return;
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRestRemaining(rem);
      if (rem <= 0) {
        restEndAtRef.current = null;
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
    (seconds: number, label?: string) => {
      void handleUnlockAudio();
      if (restBannerTimeoutRef.current !== null) {
        window.clearTimeout(restBannerTimeoutRef.current);
        restBannerTimeoutRef.current = null;
      }
      const safeSec = Math.max(10, Math.min(600, seconds));
      restEndAtRef.current = Date.now() + safeSec * 1000;
      restShouldChimeRef.current = true;
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
        const finishedAll = willFinishAllSets(
          effectiveTodayEntriesRef.current,
          exerciseId,
          setNumber
        );
        setDayJustChanged(false);
        setIsOpeningGreeting(false);
        triggerClapBurst(finishedAll);

        if (profile?.autoStartRestTimer && schedules && nextIncomplete && !finishedAll) {
          const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
          if (spec) {
            startRestTimer(spec.restSeconds, spec.name);
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
    if (restBannerTimeoutRef.current !== null) {
      window.clearTimeout(restBannerTimeoutRef.current);
      restBannerTimeoutRef.current = null;
    }
    if (restRemaining === 0) {
      restEndAtRef.current = Date.now() + restTotalSeconds * 1000;
      restShouldChimeRef.current = true;
      setRestRemaining(restTotalSeconds);
      setRestRunning(true);
      setRestFinishedBanner(false);
      return;
    }
    setRestRunning((currentlyRunning) => {
      if (currentlyRunning) {
        restEndAtRef.current = null;
        return false;
      }
      restEndAtRef.current = Date.now() + restRemaining * 1000;
      restShouldChimeRef.current = true;
      return true;
    });
  }, [handleUnlockAudio, restRemaining, restTotalSeconds]);

  const handleResetRest = useCallback(() => {
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
        setCooldownAlertTarget({ exerciseId, setNumber, exerciseName });
        return;
      }

      const willAllFinish =
        !isCurrentlyCompleted &&
        willFinishAllSets(effectiveTodayEntries, exerciseId, setNumber);

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
            startRestTimer(spec.restSeconds, spec.name);
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
          startRestTimer(spec.restSeconds, spec.name);
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
    audioEngine.stop();
    setActiveAlarm(null);
    setSnoozeTargetMs(null);
    snoozedAlarmRef.current = null;
  }, []);

  const handleSnoozeAlarm = useCallback(() => {
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
    audioEngine.stop();
    setActiveAlarm(null);
    setSnoozeTargetMs(null);
    snoozedAlarmRef.current = null;
    setActiveTab('today');
  }, []);

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

  const handleSelectTab = useCallback((tab: AppTab) => {
    if (tab === 'settings' || tab === 'about') {
      setActivePopup(tab);
      return;
    }
    setActivePopup(null);
    setActiveTab(tab);
  }, []);

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
            onOpenSettings={() =>
              setActivePopup((prev) => (prev === 'settings' ? null : 'settings'))
            }
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
            isCarbon ? 'opacity-45' : 'opacity-100'
          }`}
          style={{ background: phaseToken.ambientGlow }}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed -left-24 top-28 z-0 rounded-full transition-all duration-500 ${
            isFrosted ? 'h-96 w-96 opacity-45' : isCarbon ? 'h-72 w-72 opacity-10' : 'h-80 w-80 opacity-25'
          }`}
          style={{
            background: isFrosted
              ? `radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.72) 0%, ${phaseToken.accent}52 42%, transparent 74%)`
              : `radial-gradient(circle, ${phaseToken.accent}55 0%, transparent 70%)`,
          }}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed -right-24 top-44 z-0 rounded-full transition-all duration-500 ${
            isFrosted ? 'h-[28rem] w-[28rem] opacity-35' : isCarbon ? 'h-80 w-80 opacity-8' : 'h-96 w-96 opacity-20'
          }`}
          style={{
            background: isFrosted
              ? `radial-gradient(circle, rgba(var(--ip-accent-rgb), 0.24) 0%, ${phaseToken.accentBright}35 44%, transparent 74%)`
              : `radial-gradient(circle, ${phaseToken.accentBright}44 0%, transparent 72%)`,
          }}
        />
        {isFrosted && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-10 left-1/3 z-0 h-80 w-80 rounded-full opacity-30 transition-all duration-500"
            style={{
              background:
                'radial-gradient(circle, rgba(var(--ip-glass-rgb), 0.65) 0%, rgba(var(--ip-accent-rgb), 0.14) 48%, transparent 75%)',
            }}
          />
        )}

        <TopBar
          activeTab={activeTab}
          activePopup={activePopup}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          onOpenSettings={() =>
            setActivePopup((prev) => (prev === 'settings' ? null : 'settings'))
          }
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.995 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
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
                  justClapped={justClapped}
                  dayJustChanged={dayJustChanged}
                  userName={profile.displayName}
                  isOpeningGreeting={isOpeningGreeting}
                  exerciseTimers={exerciseTimers}
                  onToggleRestPause={handleToggleRestPause}
                  onResetRest={handleResetRest}
                  onAdjustRest={handleAdjustRest}
                      onStartRestTimer={startRestTimer}
                      onStartWorkout={() => {
                        setActiveTab('workout');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onOpenExerciseManager={(dayKey) => {
                        setExerciseDayKey(dayKey);
                        setActiveTab('exercises');
                      }}
                      onOpenScheduleManager={() => setActiveTab('schedule')}
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
                        setActiveTab('today');
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
                        setActiveTab('exercises');
                      }}
                      onOpenScheduleManager={() => setActiveTab('schedule')}
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
                        setActiveTab('exercises');
                      }}
                    />
                  )}

                  {activeTab === 'history' && (
                    <HistoryProgressView
                      workoutHistory={workoutHistory}
                      loading={historyLoading}
                      todayDateKey={todayDateKey}
                      onGoToToday={() => setActiveTab('today')}
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
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileBottomNav
          activeTab={activeTab}
          timePhase={timePhase}
          onSelectTab={handleSelectTab}
          restRemaining={restRemaining}
          restRunning={restRunning}
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
          open={activePopup === 'settings'}
          onClose={() => setActivePopup(null)}
          title={t('Pengaturan Aplikasi', 'App Settings')}
          subtitle={t(
            'Atur tema material, warna tombol, bahasa, format jam, dan preferensi alarm.',
            'Configure material theme, button colors, language, clock format, and alarm preferences.'
          )}
          maxWidthClass="max-w-2xl"
          accentBorderClass="border-pulse/30"
          closeAriaLabel={t('Tutup Pengaturan', 'Close Settings')}
        >
          <SettingsView
            now={now}
            profile={profile}
            embeddedInModal
            onUpdateProfile={updateProfile}
            onOpenRingtones={() => {
              setActivePopup(null);
              setActiveTab('ringtones');
            }}
            onOpenTutorial={() => {
              setActivePopup(null);
              handleOpenTutorialFromUi();
            }}
            onSignOut={async () => {
              setActivePopup(null);
              await signOutUser();
            }}
          />
        </GlassModal>

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
