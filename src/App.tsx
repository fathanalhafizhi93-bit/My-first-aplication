/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AboutView } from './components/AboutView';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { AuthGate } from './components/AuthGate';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { FeatureTutorialModal } from './components/FeatureTutorialModal';
import { HistoryProgressView } from './components/HistoryProgressView';
import { LaunchIntro } from './components/LaunchIntro';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator, PWAInstallCard } from './components/PWAInstallBanner';
import { RightUtilityPanel } from './components/RightUtilityPanel';
import { RingtoneManagerView } from './components/RingtoneManagerView';
import { TodayWorkoutView } from './components/TodayWorkoutView';
import { TopBar } from './components/TopBar';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { useGymData } from './hooks/useGymData';
import { audioEngine, BUILTIN_RINGTONES } from './lib/audioEngine';
import {
  computeNextAlarm,
  formatHHMM,
  formatLocalDateKey,
  getTodayDayKey,
} from './lib/dateUtils';
import { syncNativeWeeklyAlarms } from './lib/nativeAlarmBridge';
import { AppTab, DayKey, DaySchedule } from './types/gym';

interface TriggeredAlarmState {
  schedule: DaySchedule;
  ringtoneName: string;
  isTest: boolean;
}

export default function App() {
  const {
    user,
    authReady,
    dataLoading,
    authError,
    profile,
    schedules,
    customRingtones,
    todayDayKey,
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
    addSetToExercise,
    removeSetFromExercise,
    addCustomRingtone,
    deleteCustomRingtone,
  } = useGymData();

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [showIntro, setShowIntro] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [exerciseDayKey, setExerciseDayKey] = useState<DayKey>(todayDayKey);
  const [now, setNow] = useState<Date>(() => new Date());
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Active alarm & snooze state
  const [activeAlarm, setActiveAlarm] = useState<TriggeredAlarmState | null>(null);
  const [snoozeTargetMs, setSnoozeTargetMs] = useState<number | null>(null);
  const lastTriggeredSlotRef = useRef<string | null>(null);

  // Inter-set rest timer state
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [restRunning, setRestRunning] = useState(false);
  const [restExerciseLabel, setRestExerciseLabel] = useState<string | null>(null);
  const [restFinishedBanner, setRestFinishedBanner] = useState(false);

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
            body: `Waktunya latihan: ${sched.focusTitle}`,
          });
        } catch {
          // ignore notification error in restricted iframe contexts
        }
      }
    },
    [resolveRingtoneMeta, profile, customRingtones]
  );

  // 1-second clock + alarm watcher
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      setNow(current);

      if (!schedules || !profile) return;

      // Check snoozed alarm
      if (snoozeTargetMs !== null && current.getTime() >= snoozeTargetMs) {
        setSnoozeTargetMs(null);
        const dayKey = getTodayDayKey(current);
        const sched = schedules[dayKey];
        if (sched) {
          triggerAlarm(sched, false);
        }
        return;
      }

      // Check scheduled alarm for current day & minute
      const dayKey = getTodayDayKey(current);
      const sched = schedules[dayKey];
      if (!sched || !sched.isGymDay || !sched.alarmEnabled) return;

      const hhmm = formatHHMM(current);
      const slotKey = `${formatLocalDateKey(current)}_${hhmm}`;

      if (sched.alarmTime === hhmm && lastTriggeredSlotRef.current !== slotKey) {
        lastTriggeredSlotRef.current = slotKey;
        triggerAlarm(sched, false);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [schedules, profile, snoozeTargetMs, triggerAlarm]);

  // Sync scheduled alarms to native Android background scheduler when running in Capacitor APK
  useEffect(() => {
    if (!schedules) return;
    void syncNativeWeeklyAlarms(schedules);
  }, [schedules]);

  // Rest timer countdown loop
  useEffect(() => {
    if (!restRunning) return;
    const timer = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setRestRunning(false);
          setRestFinishedBanner(true);
          const restToneId = profile?.restRingtoneId || 'builtin_kettlebell_chime';
          void audioEngine.play(restToneId, {
            volume: profile?.volume ?? 0.85,
            loop: false,
            customRingtones,
          });
          window.setTimeout(() => setRestFinishedBanner(false), 5000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restRunning, profile, customRingtones]);

  const startRestTimer = useCallback((seconds: number, label?: string) => {
    const safeSec = Math.max(10, Math.min(600, seconds));
    setRestFinishedBanner(false);
    setRestTotalSeconds(safeSec);
    setRestRemaining(safeSec);
    setRestExerciseLabel(label || null);
    setRestRunning(true);
  }, []);

  const handleToggleRestPause = useCallback(() => {
    if (restRemaining === 0) {
      setRestRemaining(restTotalSeconds);
      setRestRunning(true);
      setRestFinishedBanner(false);
      return;
    }
    setRestRunning((r) => !r);
  }, [restRemaining, restTotalSeconds]);

  const handleResetRest = useCallback(() => {
    setRestRunning(false);
    setRestRemaining(restTotalSeconds);
    setRestFinishedBanner(false);
  }, [restTotalSeconds]);

  const handleAdjustRest = useCallback((delta: number) => {
    setRestRemaining((prev) => Math.max(0, Math.min(600, prev + delta)));
    setRestTotalSeconds((prev) => Math.max(15, Math.min(600, prev + delta)));
  }, []);

  const handleToggleSetWithAutoRest = useCallback(
    async (exerciseId: string, setNumber: number) => {
      const becameCompleted = await toggleSetComplete(exerciseId, setNumber);
      if (becameCompleted && profile?.autoStartRestTimer && schedules) {
        const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
        if (spec) {
          startRestTimer(spec.restSeconds, spec.name);
        }
      }
    },
    [toggleSetComplete, profile, schedules, todayDayKey, startRestTimer]
  );

  const handleTestAlarm = useCallback(() => {
    if (!schedules) return;
    void handleUnlockAudio();
    const todaySched = schedules[todayDayKey];
    triggerAlarm(todaySched, true);
  }, [schedules, todayDayKey, handleUnlockAudio, triggerAlarm]);

  const handleDismissAlarm = useCallback(() => {
    audioEngine.stop();
    setActiveAlarm(null);
  }, []);

  const handleSnoozeAlarm = useCallback(() => {
    audioEngine.stop();
    const mins = profile?.snoozeMinutes ?? 5;
    setSnoozeTargetMs(Date.now() + mins * 60 * 1000);
    setActiveAlarm(null);
  }, [profile]);

  const handleStartWorkoutFromAlarm = useCallback(() => {
    audioEngine.stop();
    setActiveAlarm(null);
    setActiveTab('today');
  }, []);

  const nextAlarm = useMemo(
    () => (schedules ? computeNextAlarm(schedules, now) : null),
    [schedules, now]
  );

  // Auto-open 5-step tutorial once per user on first entry after LaunchIntro & data ready
  useEffect(() => {
    if (showIntro || !authReady || !user || dataLoading || !profile || !schedules) return;
    try {
      const seenKey = `ironpulse_tutorial_seen_${user.uid}`;
      if (!localStorage.getItem(seenKey)) {
        setTutorialOpen(true);
      }
    } catch {
      // ignore storage errors in restricted contexts
    }
  }, [showIntro, authReady, user, dataLoading, profile, schedules]);

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

  const renderBody = () => {
    if (!authReady) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0B0E] text-sm text-[#9CA3AF]">
          Memuat sesi IronPulse...
        </div>
      );
    }

    if (!user) {
      return <AuthGate onSignIn={signInWithGoogle} authError={authError} />;
    }

    if (dataLoading || !profile || !schedules) {
      return (
        <div className="min-h-screen bg-[#0A0B0E] text-[#F4F5F7]">
          <TopBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-[#0A0B0E] text-[#F4F5F7]"
      >
        <TopBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onTestAlarm={handleTestAlarm}
        />

        {restFinishedBanner && (
          <div className="border-b border-[#16A34A]/40 bg-[#16A34A]/15 px-4 py-2.5 text-center text-xs font-semibold text-[#86EFAC]">
            Waktu istirahat selesai — lanjutkan set berikutnya.
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8">
          <div className="mb-5 lg:hidden">
            <PWAInstallCard />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Primary Workspace Column */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === 'today' && (
                    <TodayWorkoutView
                      todayDayKey={todayDayKey}
                      schedules={schedules}
                      todayEntries={effectiveTodayEntries}
                      restRemaining={restRemaining}
                      restRunning={restRunning}
                      restExerciseLabel={restExerciseLabel}
                      onToggleRestPause={handleToggleRestPause}
                      onResetRest={handleResetRest}
                      onToggleSetComplete={handleToggleSetWithAutoRest}
                      onUpdateSetMetrics={updateSetMetrics}
                      onAddSet={addSetToExercise}
                      onRemoveSet={removeSetFromExercise}
                      onStartRestTimer={startRestTimer}
                      onOpenExerciseManager={(dayKey) => {
                        setExerciseDayKey(dayKey);
                        setActiveTab('exercises');
                      }}
                      onOpenScheduleManager={() => setActiveTab('schedule')}
                      onOpenTutorial={() => setTutorialOpen(true)}
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

                  {activeTab === 'about' && <AboutView />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Persistent Utility Column */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <RightUtilityPanel
                now={now}
                nextAlarm={nextAlarm}
                audioUnlocked={audioUnlocked}
                onUnlockAudio={handleUnlockAudio}
                restTotalSeconds={restTotalSeconds}
                restRemaining={restRemaining}
                restRunning={restRunning}
                restExerciseLabel={restExerciseLabel}
                onStartRest={startRestTimer}
                onToggleRestPause={handleToggleRestPause}
                onResetRest={handleResetRest}
                onAdjustRest={handleAdjustRest}
                profile={profile}
                onSignOut={signOutUser}
                onOpenAbout={() => setActiveTab('about')}
                onOpenTutorial={() => setTutorialOpen(true)}
                isAboutActive={activeTab === 'about'}
              />
            </div>
          </div>
        </main>

        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
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

        <FeatureTutorialModal
          open={tutorialOpen}
          onComplete={handleCompleteTutorial}
          onJumpToTab={(tab) => setActiveTab(tab)}
        />

        <OfflineIndicator />
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <LaunchIntro onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>
      {renderBody()}
    </>
  );
}
