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
import { NamePromptModal } from './components/NamePromptModal';
import { OfflineIndicator, PWAInstallCard } from './components/PWAInstallBanner';
import { RightUtilityPanel } from './components/RightUtilityPanel';
import { RingtoneManagerView } from './components/RingtoneManagerView';
import { SettingsView } from './components/SettingsView';
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
import { LanguageProvider, useI18n } from './lib/i18n';
import { syncNativeWeeklyAlarms } from './lib/nativeAlarmBridge';
import { AppTab, DayKey, DaySchedule } from './types/gym';

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
  const { lang, t } = useI18n();
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
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStartWithLang, setTutorialStartWithLang] = useState(true);
  const [isOpeningGreeting, setIsOpeningGreeting] = useState(true);
  const [exerciseDayKey, setExerciseDayKey] = useState<DayKey>(todayDayKey);
  const [now, setNow] = useState<Date>(() => new Date());
  const [audioUnlocked, setAudioUnlocked] = useState(false);

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

  // Cleanup mascot clap timeout on unmount
  useEffect(() => {
    return () => {
      if (clapTimeoutRef.current !== null) {
        window.clearTimeout(clapTimeoutRef.current);
      }
    };
  }, []);

  const triggerClapBurst = useCallback(() => {
    if (clapTimeoutRef.current !== null) {
      window.clearTimeout(clapTimeoutRef.current);
    }
    setJustClapped(true);
    clapTimeoutRef.current = window.setTimeout(() => {
      setJustClapped(false);
      clapTimeoutRef.current = null;
    }, 2800);
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
    async (exerciseId: string, setNumber: number, exerciseName: string) => {
      const currentEntry = effectiveTodayEntries.find((e) => e.exerciseId === exerciseId);
      const currentSet = currentEntry?.sets.find((s) => s.setNumber === setNumber);
      const isCurrentlyCompleted = Boolean(currentSet?.completed);

      // Block rapid subsequent check-offs during the 30s cooldown unless bypassed
      if (!isCurrentlyCompleted && cooldownRemaining > 0) {
        setCooldownAlertTarget({ exerciseId, setNumber, exerciseName });
        return;
      }

      const becameCompleted = await toggleSetComplete(exerciseId, setNumber);
      if (becameCompleted) {
        setCooldownUntilMs(Date.now() + 30_000);
        setCooldownAlertTarget(null);
        setDayJustChanged(false);
        setIsOpeningGreeting(false);
        triggerClapBurst();

        if (profile?.autoStartRestTimer && schedules) {
          const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
          if (spec) {
            startRestTimer(spec.restSeconds, spec.name);
          }
        }
      }
    },
    [
      effectiveTodayEntries,
      cooldownRemaining,
      toggleSetComplete,
      triggerClapBurst,
      profile,
      schedules,
      todayDayKey,
      startRestTimer,
    ]
  );

  const handleBypassCooldownAndComplete = useCallback(async () => {
    if (!cooldownAlertTarget) return;
    const { exerciseId, setNumber } = cooldownAlertTarget;
    const becameCompleted = await toggleSetComplete(exerciseId, setNumber);
    setCooldownAlertTarget(null);

    if (becameCompleted) {
      setCooldownUntilMs(Date.now() + 30_000);
      setDayJustChanged(false);
      setIsOpeningGreeting(false);
      triggerClapBurst();

      if (profile?.autoStartRestTimer && schedules) {
        const spec = schedules[todayDayKey]?.exercises.find((e) => e.id === exerciseId);
        if (spec) {
          startRestTimer(spec.restSeconds, spec.name);
        }
      }
    }
  }, [
    cooldownAlertTarget,
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
    () => (schedules ? computeNextAlarm(schedules, now, lang) : null),
    [schedules, now, lang]
  );

  // Check whether signed-in user has confirmed their display name after login
  useEffect(() => {
    setIsOpeningGreeting(true);
    if (!user) {
      setNameConfirmed(true);
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

  const renderBody = () => {
    if (!authReady) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0B0E] text-sm text-[#9CA3AF]">
          {t('Memuat sesi IronPulse...', 'Loading IronPulse session...')}
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
            {t(
              'Waktu istirahat selesai — lanjutkan set berikutnya.',
              'Rest time finished — start your next set.'
            )}
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
                      now={now}
                      todayDayKey={todayDayKey}
                      schedules={schedules}
                      todayEntries={effectiveTodayEntries}
                      restTotalSeconds={restTotalSeconds}
                      restRemaining={restRemaining}
                      restRunning={restRunning}
                      restExerciseLabel={restExerciseLabel}
                      cooldownRemaining={cooldownRemaining}
                      cooldownAlertTarget={cooldownAlertTarget}
                      justClapped={justClapped}
                      dayJustChanged={dayJustChanged}
                      userName={profile.displayName}
                      isOpeningGreeting={isOpeningGreeting}
                      onToggleRestPause={handleToggleRestPause}
                      onResetRest={handleResetRest}
                      onAdjustRest={handleAdjustRest}
                      onToggleSetComplete={handleToggleSetWithAutoRest}
                      onBypassCooldownAndComplete={handleBypassCooldownAndComplete}
                      onDismissCooldownAlert={() => setCooldownAlertTarget(null)}
                      onUpdateSetMetrics={updateSetMetrics}
                      onAddSet={addSetToExercise}
                      onRemoveSet={removeSetFromExercise}
                      onStartRestTimer={startRestTimer}
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

                  {activeTab === 'settings' && (
                    <SettingsView
                      now={now}
                      profile={profile}
                      onUpdateProfile={updateProfile}
                      onOpenRingtones={() => setActiveTab('ringtones')}
                      onOpenTutorial={handleOpenTutorialFromUi}
                      onSignOut={signOutUser}
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
                profile={profile}
                onSignOut={signOutUser}
                onOpenSettings={() => setActiveTab('settings')}
                onOpenAbout={() => setActiveTab('about')}
                onOpenTutorial={handleOpenTutorialFromUi}
                isSettingsActive={activeTab === 'settings'}
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

        <NamePromptModal
          open={!showIntro && !nameConfirmed}
          initialName={profile.displayName}
          onSaveName={handleSaveNameFromPrompt}
        />

        <FeatureTutorialModal
          open={tutorialOpen && nameConfirmed}
          startAtLanguageStep={tutorialStartWithLang}
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

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
