import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { createDefaultSchedules } from '../data/presets';
import { formatLocalDateKey, getTodayDayKey } from '../lib/dateUtils';
import {
  deleteAudioFromIndexedDB,
  readUploadedAudioFile,
  saveAudioToIndexedDB,
} from '../lib/audioEngine';
import {
  CustomRingtone,
  DAY_LIST,
  DayKey,
  DaySchedule,
  ExerciseItem,
  resolveExerciseTrackingMode,
  resolveExerciseUsesWeight,
  resolveTargetDurationSeconds,
  UserProfile,
  WorkoutLog,
  WorkoutLogEntry,
} from '../types/gym';

function sanitizeExerciseItem(ex: ExerciseItem): ExerciseItem {
  const trackingMode = resolveExerciseTrackingMode(ex);
  const usesWeight = resolveExerciseUsesWeight(ex);
  const timerDirection = ex.timerDirection === 'countup' ? 'countup' : 'countdown';
  const targetDurationSeconds = resolveTargetDurationSeconds(ex);
  return {
    id: ex.id,
    name: ex.name.trim().slice(0, 60),
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment.trim().slice(0, 40) || (usesWeight ? 'Bebas' : 'Tanpa Alat'),
    targetSets: Math.max(1, Math.min(12, Number(ex.targetSets) || 3)),
    targetReps: ex.targetReps.trim().slice(0, 20) || '10',
    targetWeightKg: usesWeight
      ? Math.max(0, Math.min(999, Number(ex.targetWeightKg) || 0))
      : 0,
    restSeconds: Math.max(15, Math.min(600, Number(ex.restSeconds) || 60)),
    notes: (ex.notes || '').trim().slice(0, 200),
    trackingMode,
    usesWeight,
    timerDirection,
    targetDurationSeconds,
  };
}

function buildEntriesFromSchedule(
  exercises: ExerciseItem[],
  existingEntries: WorkoutLogEntry[] = []
): WorkoutLogEntry[] {
  const existingMap = new Map(existingEntries.map((e) => [e.exerciseId, e]));
  return exercises.slice(0, 30).map((ex) => {
    const trackingMode = resolveExerciseTrackingMode(ex);
    const usesWeight = resolveExerciseUsesWeight(ex);
    const timerDirection = ex.timerDirection === 'countup' ? 'countup' : 'countdown';
    const targetDurationSeconds = resolveTargetDurationSeconds(ex);
    const prev = existingMap.get(ex.id);
    if (prev && prev.sets.length > 0) {
      return {
        ...prev,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        trackingMode,
        usesWeight,
        timerDirection,
        targetDurationSeconds,
        sets: prev.sets.map((s) => ({
          ...s,
          weightKg: usesWeight ? s.weightKg : 0,
          durationSeconds:
            typeof s.durationSeconds === 'number' && Number.isFinite(s.durationSeconds)
              ? s.durationSeconds
              : trackingMode === 'timer'
                ? targetDurationSeconds
                : 0,
        })),
      };
    }
    const setsCount = Math.max(1, Math.min(12, ex.targetSets || 3));
    const parsedReps = parseInt(ex.targetReps, 10);
    const defaultReps = Number.isFinite(parsedReps) && parsedReps > 0 ? parsedReps : 10;
    return {
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      trackingMode,
      usesWeight,
      timerDirection,
      targetDurationSeconds,
      sets: Array.from({ length: setsCount }, (_, idx) => ({
        setNumber: idx + 1,
        weightKg: usesWeight ? ex.targetWeightKg || 0 : 0,
        reps: trackingMode === 'timer' ? 1 : defaultReps,
        durationSeconds: trackingMode === 'timer' ? targetDurationSeconds : 0,
        completed: false,
      })),
    };
  });
}

export function useGymData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [schedules, setSchedules] = useState<Record<DayKey, DaySchedule> | null>(null);
  const [customRingtones, setCustomRingtones] = useState<CustomRingtone[]>([]);
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [dateClock, setDateClock] = useState<{ dayKey: DayKey; dateKey: string }>(() => ({
    dayKey: getTodayDayKey(),
    dateKey: formatLocalDateKey(),
  }));

  useEffect(() => {
    const syncDateClock = () => {
      const nextDateKey = formatLocalDateKey();
      const nextDayKey = getTodayDayKey();
      setDateClock((prev) =>
        prev.dateKey === nextDateKey && prev.dayKey === nextDayKey
          ? prev
          : { dayKey: nextDayKey, dateKey: nextDateKey }
      );
    };

    const interval = window.setInterval(syncDateClock, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncDateClock();
      }
    };
    window.addEventListener('focus', syncDateClock);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncDateClock);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const todayDayKey = dateClock.dayKey;
  const todayDateKey = dateClock.dateKey;

  const schedulesRef = useRef(schedules);
  const todayLogRef = useRef(todayLog);
  const todayDayKeyRef = useRef(todayDayKey);
  const todayDateKeyRef = useRef(todayDateKey);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  useEffect(() => {
    todayLogRef.current = todayLog;
  }, [todayLog]);

  useEffect(() => {
    todayDayKeyRef.current = todayDayKey;
  }, [todayDayKey]);

  useEffect(() => {
    todayDateKeyRef.current = todayDateKey;
  }, [todayDateKey]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setSchedules(null);
        setCustomRingtones([]);
        setTodayLog(null);
        todayLogRef.current = null;
        setWorkoutHistory([]);
        setHistoryLoading(false);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Bootstrap initial user profile & default 7-day schedules once authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    let unsubProfile: (() => void) | undefined;
    let unsubSchedules: (() => void) | undefined;
    let unsubRingtones: (() => void) | undefined;
    let unsubHistory: (() => void) | undefined;

    setDataLoading(true);
    setHistoryLoading(true);

    async function initUserSync() {
      if (!user) return;
      const uid = user.uid;
      const userRef = doc(db, 'users', uid);

      const schedulesQuery = query(
        collection(db, 'users', uid, 'schedules'),
        where('userId', '==', uid)
      );

      let userSnap;
      let schedListSnap;
      try {
        [userSnap, schedListSnap] = await Promise.all([
          getDoc(userRef).catch((err) => {
            if (!cancelled) {
              handleFirestoreError(err, OperationType.GET, `users/${uid}`);
            }
            throw err;
          }),
          getDocs(schedulesQuery).catch((err) => {
            if (!cancelled) {
              handleFirestoreError(err, OperationType.LIST, `users/${uid}/schedules`);
            }
            throw err;
          }),
        ]);
      } catch {
        return;
      }

      if (cancelled) return;

      const writes: Promise<unknown>[] = [];

      if (!userSnap.exists()) {
        const initialProfile = {
          userId: uid,
          displayName: (user.displayName?.trim() || 'Atlet IronPulse').slice(0, 100),
          email: (user.email || '').slice(0, 200),
          defaultRingtoneId: 'builtin_athletic_bell',
          restRingtoneId: 'builtin_kettlebell_chime',
          volume: 0.85,
          notificationsEnabled: false,
          snoozeMinutes: 5,
          autoStartRestTimer: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        writes.push(
          setDoc(userRef, initialProfile).catch((err) => {
            if (!cancelled) {
              handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
            }
            throw err;
          })
        );
      }

      const existingScheduleIds = new Set(schedListSnap.docs.map((d) => d.id));
      const missingDays = DAY_LIST.filter((d) => !existingScheduleIds.has(d.key));

      if (missingDays.length > 0) {
        const defaults = createDefaultSchedules(uid);
        const batch = writeBatch(db);
        for (const dayMeta of missingDays) {
          const schedRef = doc(db, 'users', uid, 'schedules', dayMeta.key);
          const def = defaults[dayMeta.key];
          batch.set(schedRef, {
            ...def,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        writes.push(
          batch.commit().catch((err) => {
            if (!cancelled) {
              handleFirestoreError(err, OperationType.WRITE, `users/${uid}/schedules`);
            }
            throw err;
          })
        );
      }

      if (writes.length > 0) {
        try {
          await Promise.all(writes);
        } catch {
          return;
        }
      }

      if (cancelled) return;

      unsubProfile = onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      );

      unsubSchedules = onSnapshot(
        query(
          collection(db, 'users', uid, 'schedules'),
          where('userId', '==', uid)
        ),
        (snap) => {
          const defaults = createDefaultSchedules(uid);
          const next: Record<DayKey, DaySchedule> = { ...defaults };
          snap.docs.forEach((d) => {
            const data = d.data() as DaySchedule;
            if (data.dayKey && data.dayKey in next) {
              next[data.dayKey] = data;
            }
          });
          setSchedules(next);
          setDataLoading(false);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/schedules`)
      );

      unsubRingtones = onSnapshot(
        query(
          collection(db, 'users', uid, 'ringtones'),
          where('userId', '==', uid)
        ),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CustomRingtone, 'id'>),
          }));
          setCustomRingtones(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/ringtones`)
      );

      unsubHistory = onSnapshot(
        query(
          collection(db, 'users', uid, 'workoutLogs'),
          where('userId', '==', uid),
          limit(400)
        ),
        (snap) => {
          const logs = snap.docs
            .map((d) => d.data() as WorkoutLog)
            .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
          setWorkoutHistory(logs);
          setHistoryLoading(false);
        },
        (err) => {
          setHistoryLoading(false);
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/workoutLogs`);
        }
      );
    }

    void initUserSync();

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubSchedules?.();
      unsubRingtones?.();
      unsubHistory?.();
    };
  }, [authReady, user]);

  // Subscribe to today's workout log independently so midnight rollover swaps seamlessly without reload flash
  useEffect(() => {
    if (!authReady || !user) return;

    setTodayLog(null);
    todayLogRef.current = null;
    const uid = user.uid;

    const unsubTodayLog = onSnapshot(
      doc(db, 'users', uid, 'workoutLogs', todayDateKey),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as WorkoutLog;
          todayLogRef.current = data;
          setTodayLog(data);
        } else {
          todayLogRef.current = null;
          setTodayLog(null);
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `users/${uid}/workoutLogs/${todayDateKey}`)
    );

    return () => unsubTodayLog();
  }, [authReady, user, todayDateKey]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        let nativeResult;
        try {
          nativeResult = await FirebaseAuthentication.signInWithGoogle({
            skipNativeAuth: true,
            useCredentialManager: true,
          });
        } catch (cmErr) {
          const cmMsg = cmErr instanceof Error ? cmErr.message : String(cmErr);
          const isCanceled = /cancel|dismiss|aborted|12501/i.test(cmMsg);
          if (isCanceled) {
            throw cmErr;
          }
          nativeResult = await FirebaseAuthentication.signInWithGoogle({
            skipNativeAuth: true,
            useCredentialManager: false,
          });
        }

        const idToken = nativeResult.credential?.idToken;
        if (!idToken) {
          throw new Error(
            'Token login Google tidak tersedia. Pastikan app Android dan SHA-1 sudah terdaftar di Firebase Console.'
          );
        }

        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        return;
      }

      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.';
      if (/10:|DEVELOPER_ERROR|developer error/i.test(raw)) {
        setAuthError(
          `SHA-1 Android belum cocok di Firebase Console (Error 10: ${raw}). Pastikan SHA-1 terbaru sudah ditambahkan di Firebase Project Settings.`
        );
      } else if (/cancel|dismiss|12501/i.test(raw)) {
        setAuthError('Login Google dibatalkan.');
      } else {
        setAuthError(raw);
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch {
        // ignore native signOut cleanup error
      }
    }
    await signOut(auth);
  }, []);

  const updateProfile = useCallback(
    async (
      patch: Partial<
        Pick<
          UserProfile,
          | 'displayName'
          | 'defaultRingtoneId'
          | 'restRingtoneId'
          | 'volume'
          | 'notificationsEnabled'
          | 'snoozeMinutes'
          | 'autoStartRestTimer'
        >
      >
    ) => {
      if (!user) return;
      const sanitizedPatch = { ...patch };
      if (typeof sanitizedPatch.displayName === 'string') {
        const cleaned = sanitizedPatch.displayName.trim().slice(0, 100);
        if (!cleaned) return;
        sanitizedPatch.displayName = cleaned;
      }
      if (typeof sanitizedPatch.defaultRingtoneId === 'string') {
        sanitizedPatch.defaultRingtoneId =
          sanitizedPatch.defaultRingtoneId.trim().slice(0, 128) || 'builtin_athletic_bell';
      }
      if (typeof sanitizedPatch.restRingtoneId === 'string') {
        sanitizedPatch.restRingtoneId =
          sanitizedPatch.restRingtoneId.trim().slice(0, 128) || 'builtin_kettlebell_chime';
      }
      if (typeof sanitizedPatch.volume === 'number') {
        sanitizedPatch.volume = Math.max(
          0,
          Math.min(1, Number.isFinite(sanitizedPatch.volume) ? sanitizedPatch.volume : 0.85)
        );
      }
      if (typeof sanitizedPatch.snoozeMinutes === 'number') {
        sanitizedPatch.snoozeMinutes = Math.max(
          1,
          Math.min(60, Math.round(Number.isFinite(sanitizedPatch.snoozeMinutes) ? sanitizedPatch.snoozeMinutes : 5))
        );
      }
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          ...sanitizedPatch,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const updateSchedule = useCallback(
    async (
      dayKey: DayKey,
      patch: Partial<
        Pick<
          DaySchedule,
          'isGymDay' | 'alarmEnabled' | 'alarmTime' | 'focusTitle' | 'ringtoneId' | 'exercises'
        >
      >
    ) => {
      if (!user) return;
      const sanitizedPatch = { ...patch };
      if (typeof sanitizedPatch.focusTitle === 'string') {
        sanitizedPatch.focusTitle =
          sanitizedPatch.focusTitle.trim().slice(0, 80) || 'Sesi Latihan';
      }
      if (typeof sanitizedPatch.alarmTime === 'string') {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(sanitizedPatch.alarmTime)) {
          delete sanitizedPatch.alarmTime;
        }
      }
      if (typeof sanitizedPatch.ringtoneId === 'string') {
        sanitizedPatch.ringtoneId = sanitizedPatch.ringtoneId.trim().slice(0, 128) || 'default';
      }
      if (sanitizedPatch.exercises) {
        sanitizedPatch.exercises = sanitizedPatch.exercises.slice(0, 30);
      }
      const path = `users/${user.uid}/schedules/${dayKey}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'schedules', dayKey), {
          ...sanitizedPatch,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const addExerciseToDay = useCallback(
    async (dayKey: DayKey, exercise: Omit<ExerciseItem, 'id'>) => {
      if (!schedules) return;
      const current = schedules[dayKey];
      if (!current) return;
      if (current.exercises.length >= 30) {
        throw new Error('Maksimal 30 gerakan per hari latihan.');
      }
      const newEx = sanitizeExerciseItem({
        ...exercise,
        id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      });
      await updateSchedule(dayKey, {
        exercises: [...current.exercises, newEx],
      });
    },
    [schedules, updateSchedule]
  );

  const addExercisesToDay = useCallback(
    async (dayKey: DayKey, exercises: Array<Omit<ExerciseItem, 'id'>>) => {
      if (!schedules || exercises.length === 0) return;
      const current = schedules[dayKey];
      if (!current) return;
      if (current.exercises.length + exercises.length > 30) {
        const remaining = Math.max(0, 30 - current.exercises.length);
        throw new Error(
          remaining === 0
            ? 'Jadwal hari ini sudah penuh (maksimal 30 gerakan).'
            : `Maksimal 30 gerakan per hari. Tersisa ${remaining} slot gerakan.`
        );
      }
      const baseTs = Date.now();
      const newItems = exercises.map((ex, idx) =>
        sanitizeExerciseItem({
          ...ex,
          id: `ex_${baseTs}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        })
      );
      await updateSchedule(dayKey, {
        exercises: [...current.exercises, ...newItems],
      });
    },
    [schedules, updateSchedule]
  );

  const updateExerciseInDay = useCallback(
    async (dayKey: DayKey, exerciseId: string, patch: Partial<ExerciseItem>) => {
      if (!schedules) return;
      const current = schedules[dayKey];
      if (!current) return;
      const updated = current.exercises.map((ex) =>
        ex.id === exerciseId ? sanitizeExerciseItem({ ...ex, ...patch }) : ex
      );
      await updateSchedule(dayKey, { exercises: updated });
    },
    [schedules, updateSchedule]
  );

  const removeExerciseFromDay = useCallback(
    async (dayKey: DayKey, exerciseId: string) => {
      if (!schedules) return;
      const current = schedules[dayKey];
      if (!current) return;
      await updateSchedule(dayKey, {
        exercises: current.exercises.filter((ex) => ex.id !== exerciseId),
      });
    },
    [schedules, updateSchedule]
  );

  const moveExerciseInDay = useCallback(
    async (dayKey: DayKey, exerciseId: string, direction: 'up' | 'down') => {
      if (!schedules) return;
      const current = schedules[dayKey];
      if (!current) return;
      const list = [...current.exercises];
      const idx = list.findIndex((e) => e.id === exerciseId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return;
      [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
      await updateSchedule(dayKey, { exercises: list });
    },
    [schedules, updateSchedule]
  );

  // Merge today's schedule exercises with today's saved workout log entries
  const effectiveTodayEntries = useMemo<WorkoutLogEntry[]>(() => {
    if (!schedules) return [];
    const sched = schedules[todayDayKey];
    if (!sched) return [];
    return buildEntriesFromSchedule(sched.exercises, todayLog?.entries || []);
  }, [schedules, todayDayKey, todayLog]);

  const mutateTodayEntries = useCallback(
    async <T,>(
      mutator: (currentEntries: WorkoutLogEntry[]) => { next: WorkoutLogEntry[]; result: T }
    ): Promise<T> => {
      if (!user) {
        return mutator([]).result;
      }

      let resolvedResult!: T;

      const task = writeQueueRef.current.then(async () => {
        const curSchedules = schedulesRef.current;
        const curDayKey = todayDayKeyRef.current;
        const curDateKey = todayDateKeyRef.current;
        const curLog = todayLogRef.current;
        const sched = curSchedules?.[curDayKey];
        const baseEntries = sched
          ? buildEntriesFromSchedule(sched.exercises, curLog?.entries || [])
          : [];

        const { next, result } = mutator(baseEntries);
        resolvedResult = result;

        const trimmedEntries = next.slice(0, 30);
        const allSets = trimmedEntries.flatMap((e) => e.sets);
        const isAllCompleted = allSets.length > 0 && allSets.every((s) => s.completed);
        const focusTitle = (
          (sched?.focusTitle || curLog?.focusTitle || 'Latihan Hari Ini').trim() ||
          'Latihan Hari Ini'
        ).slice(0, 80);

        const optimisticLog: WorkoutLog = {
          userId: user.uid,
          dateKey: curDateKey,
          dayKey: curDayKey,
          focusTitle,
          entries: trimmedEntries,
          completed: isAllCompleted,
        };
        const existedBefore = Boolean(curLog && curLog.dateKey === curDateKey);
        todayLogRef.current = optimisticLog;
        setTodayLog(optimisticLog);

        const path = `users/${user.uid}/workoutLogs/${curDateKey}`;
        try {
          if (!existedBefore) {
            await setDoc(doc(db, 'users', user.uid, 'workoutLogs', curDateKey), {
              userId: user.uid,
              dateKey: curDateKey,
              dayKey: curDayKey,
              focusTitle,
              entries: trimmedEntries,
              completed: isAllCompleted,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(doc(db, 'users', user.uid, 'workoutLogs', curDateKey), {
              focusTitle,
              entries: trimmedEntries,
              completed: isAllCompleted,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(
            err,
            existedBefore ? OperationType.UPDATE : OperationType.CREATE,
            path
          );
        }
      });

      writeQueueRef.current = task.catch(() => {
        // Keep queue alive if one write rejects
      });

      await task;
      return resolvedResult;
    },
    [user]
  );

  const toggleSetComplete = useCallback(
    async (exerciseId: string, setNumber: number): Promise<boolean> => {
      return mutateTodayEntries((entries) => {
        let becameCompleted = false;
        const next = entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          return {
            ...entry,
            sets: entry.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              const nextVal = !s.completed;
              if (nextVal) becameCompleted = true;
              return { ...s, completed: nextVal };
            }),
          };
        });
        return { next, result: becameCompleted };
      });
    },
    [mutateTodayEntries]
  );

  const updateSetMetrics = useCallback(
    async (exerciseId: string, setNumber: number, weightKg: number, reps: number) => {
      const safeWeight = Math.max(0, Math.min(999, Number.isFinite(weightKg) ? weightKg : 0));
      const safeReps = Math.max(0, Math.min(999, Number.isFinite(reps) ? reps : 0));
      await mutateTodayEntries((entries) => ({
        next: entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          return {
            ...entry,
            sets: entry.sets.map((s) =>
              s.setNumber === setNumber ? { ...s, weightKg: safeWeight, reps: safeReps } : s
            ),
          };
        }),
        result: undefined,
      }));
    },
    [mutateTodayEntries]
  );

  const updateSetDuration = useCallback(
    async (exerciseId: string, setNumber: number, durationSeconds: number) => {
      const safeDuration = Math.max(
        1,
        Math.min(10800, Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : 1)
      );
      await mutateTodayEntries((entries) => ({
        next: entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          return {
            ...entry,
            sets: entry.sets.map((s) =>
              s.setNumber === setNumber ? { ...s, durationSeconds: safeDuration } : s
            ),
          };
        }),
        result: undefined,
      }));
    },
    [mutateTodayEntries]
  );

  const completeTimerSet = useCallback(
    async (exerciseId: string, setNumber: number, durationSeconds: number): Promise<boolean> => {
      const safeDuration = Math.max(
        1,
        Math.min(10800, Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : 1)
      );
      return mutateTodayEntries((entries) => {
        let becameCompleted = false;
        const next = entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          return {
            ...entry,
            sets: entry.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              if (!s.completed) becameCompleted = true;
              return {
                ...s,
                durationSeconds: safeDuration,
                completed: true,
              };
            }),
          };
        });
        return { next, result: becameCompleted };
      });
    },
    [mutateTodayEntries]
  );

  const addSetToExercise = useCallback(
    async (exerciseId: string) => {
      await mutateTodayEntries((entries) => ({
        next: entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          if (entry.sets.length >= 12) return entry;
          const last = entry.sets[entry.sets.length - 1];
          const fallbackDuration =
            entry.trackingMode === 'timer' ? entry.targetDurationSeconds || 60 : 0;
          return {
            ...entry,
            sets: [
              ...entry.sets,
              {
                setNumber: entry.sets.length + 1,
                weightKg: entry.usesWeight === false ? 0 : last ? last.weightKg : 0,
                reps: last ? last.reps : 10,
                durationSeconds: last?.durationSeconds ?? fallbackDuration,
                completed: false,
              },
            ],
          };
        }),
        result: undefined,
      }));
    },
    [mutateTodayEntries]
  );

  const removeSetFromExercise = useCallback(
    async (exerciseId: string) => {
      await mutateTodayEntries((entries) => ({
        next: entries.map((entry) => {
          if (entry.exerciseId !== exerciseId || entry.sets.length <= 1) return entry;
          return {
            ...entry,
            sets: entry.sets.slice(0, -1),
          };
        }),
        result: undefined,
      }));
    },
    [mutateTodayEntries]
  );

  const addCustomRingtone = useCallback(
    async (file: File, customName?: string): Promise<CustomRingtone> => {
      if (!user) throw new Error('Silakan login terlebih dahulu.');
      const parsed = await readUploadedAudioFile(file);
      const id = `rt_${Date.now()}`;
      const finalName = (customName?.trim() || parsed.name).slice(0, 80);

      if (parsed.storageMode === 'local_idb') {
        await saveAudioToIndexedDB(id, parsed.dataUrl);
      }

      const safeDuration = Math.max(0, Math.min(3600, Math.round(parsed.durationSeconds || 0)));
      const payload = {
        userId: user.uid,
        name: finalName,
        mimeType: parsed.mimeType.slice(0, 60),
        sizeBytes: parsed.sizeBytes,
        durationSeconds: safeDuration,
        storageMode: parsed.storageMode,
        audioDataUrl: parsed.storageMode === 'cloud' ? parsed.dataUrl : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const path = `users/${user.uid}/ringtones/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'ringtones', id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      return {
        id,
        userId: user.uid,
        name: finalName,
        mimeType: parsed.mimeType,
        sizeBytes: parsed.sizeBytes,
        durationSeconds: safeDuration,
        storageMode: parsed.storageMode,
        audioDataUrl: parsed.storageMode === 'cloud' ? parsed.dataUrl : '',
      };
    },
    [user]
  );

  const deleteCustomRingtone = useCallback(
    async (ringtoneId: string) => {
      if (!user) return;
      const path = `users/${user.uid}/ringtones/${ringtoneId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'ringtones', ringtoneId));
        await deleteAudioFromIndexedDB(ringtoneId);

        // Reset profile or schedule references if pointing to deleted ringtone
        if (profile?.defaultRingtoneId === ringtoneId) {
          await updateProfile({ defaultRingtoneId: 'builtin_athletic_bell' });
        }
        if (profile?.restRingtoneId === ringtoneId) {
          await updateProfile({ restRingtoneId: 'builtin_kettlebell_chime' });
        }
        const curSchedules = schedulesRef.current;
        if (curSchedules) {
          for (const dayMeta of DAY_LIST) {
            if (curSchedules[dayMeta.key]?.ringtoneId === ringtoneId) {
              await updateSchedule(dayMeta.key, { ringtoneId: 'default' });
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, profile, updateProfile, updateSchedule]
  );

  return useMemo(
    () => ({
      user,
      authReady,
      dataLoading,
      authError,
      profile,
      schedules,
      customRingtones,
      todayDayKey,
      todayDateKey,
      todayLog,
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
    }),
    [
      user,
      authReady,
      dataLoading,
      authError,
      profile,
      schedules,
      customRingtones,
      todayDayKey,
      todayDateKey,
      todayLog,
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
    ]
  );
}
