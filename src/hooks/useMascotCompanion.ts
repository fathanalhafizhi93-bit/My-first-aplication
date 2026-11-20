import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMascotSpeechPool,
  MascotMood,
  MascotSpeechLine,
  TimePhasePose,
} from '../data/mascotDialogues';
import { audioEngine } from '../lib/audioEngine';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';

export type { MascotMood, MascotSpeechLine, TimePhasePose };

export interface UseMascotCompanionParams {
  mood: MascotMood;
  timePhase: DayTimePhase;
  hour: number;
  restRemainingFormatted?: string;
  activeTimerExerciseName?: string;
  progressPct: number;
  completedSets: number;
  totalSets: number;
  dayLabel: string;
  userName?: string;
  dayJustChanged?: boolean;
  dialogueActive?: boolean;
  voiceVolume?: number;
}

export interface MascotCompanionState {
  mood: MascotMood;
  timePhase: DayTimePhase;
  visualPose: MascotMood | TimePhasePose;
  phaseColor: string;
  activeLine: MascotSpeechLine;
  speechKey: string;
  speechEventId: number;
  isUrgentSpeech: boolean;
  isDialogueLocked: boolean;
  isBlinking: boolean;
  glance: { x: number; y: number };
  tapBounce: boolean;
  triggerNextReaction: () => void;
}

const GLANCE_TARGETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0, y: 0 },
  { x: -2.4, y: -0.5 },
  { x: 2.4, y: -0.5 },
  { x: 1.6, y: 1.1 },
  { x: -1.6, y: 0.9 },
  { x: 0, y: -1.3 },
  { x: 2.0, y: -1.0 },
  { x: -2.0, y: -1.0 },
];

// 27 distinct visual expressions across morning (9), afternoon (9), and night (9).
// Index 0 of `night` MUST remain 'sleep' for late-night auto-return-to-sleep logic.
const PHASE_POSE_POOL: Record<DayTimePhase, readonly TimePhasePose[]> = {
  morning: [
    'tea',
    'coffee',
    'stretch',
    'perk',
    'wink',
    'sunrise',
    'protein',
    'salute',
    'sparkle',
  ],
  afternoon: [
    'hydrate',
    'shades',
    'flex',
    'music',
    'curious',
    'beast',
    'sweat',
    'smirk',
    'whistle',
  ],
  night: [
    'sleep',
    'yawn',
    'nightChill',
    'stargaze',
    'zen',
    'cozy',
    'dream',
    'moonlit',
    'recharge',
  ],
};

// Closed-eye night poses where periodic blinking & glancing stay calm
const CLOSED_EYE_NIGHT_POSES: ReadonlySet<TimePhasePose> = new Set([
  'sleep',
  'zen',
  'cozy',
  'dream',
]);

// Dialogue lock duration: active speech display (~4s) + 10s post-speech cooldown
const SPEECH_ACTIVE_DISPLAY_MS = 4_000;
const DIALOGUE_POST_COOLDOWN_MS = 10_000;
const TOTAL_DIALOGUE_LOCK_MS = SPEECH_ACTIVE_DISPLAY_MS + DIALOGUE_POST_COOLDOWN_MS;

// Autonomous speech cadence: calm & non-intrusive
const DAYTIME_SILENT_POSE_MS = 26_000;
const DAYTIME_AUTO_CHAT_MS = 68_000;
const NIGHT_AUTO_CHAT_MS = 120_000;
const QUOTE_SALT_RANGE = 97;
const MAX_RECENT_LINES = 18;

function getInitialPhasePoseIndex(timePhase: DayTimePhase, hour: number): number {
  if (timePhase === 'morning') {
    if (hour < 6) return 5; // sunrise
    if (hour < 7) return 0; // tea
    if (hour < 9) return 1; // coffee
    if (hour < 10) return 6; // protein
    return 2; // stretch
  }
  if (timePhase === 'afternoon') {
    if (hour < 13) return 0; // hydrate
    if (hour < 15) return 1; // shades
    if (hour < 17) return 2; // flex
    return 3; // music
  }
  if (hour >= 22 || hour < 4) return 0; // sleep
  if (hour >= 20) return 7; // moonlit
  return 3; // stargaze
}

function pickFreshPoseIndex(
  poolLength: number,
  prevIndex: number,
  recentPoses: number[]
): number {
  if (poolLength <= 1) return 0;
  const freshCandidates: number[] = [];
  for (let i = 0; i < poolLength; i++) {
    if (i !== prevIndex && !recentPoses.includes(i)) {
      freshCandidates.push(i);
    }
  }
  if (freshCandidates.length > 0) {
    return freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
  }
  let next = Math.floor(Math.random() * poolLength);
  if (next === prevIndex) {
    next = (prevIndex + 1 + Math.floor(Math.random() * (poolLength - 1))) % poolLength;
  }
  return next;
}

function pickLineFromPool(
  pool: MascotSpeechLine[],
  roll: number,
  recentIds: string[]
): MascotSpeechLine {
  if (pool.length === 0) {
    return { id: 'fallback', headline: 'IronPulse', subline: '' };
  }
  const unseen = pool.filter((line) => !recentIds.includes(line.id));
  const candidates = unseen.length > 0 ? unseen : pool;
  return candidates[roll % candidates.length] || pool[0];
}

export function useMascotCompanion({
  mood,
  timePhase,
  hour,
  restRemainingFormatted,
  activeTimerExerciseName,
  progressPct,
  completedSets,
  totalSets,
  dayLabel,
  userName,
  dayJustChanged = false,
  dialogueActive = true,
  voiceVolume = 0.85,
}: UseMascotCompanionParams): MascotCompanionState {
  const { lang, accentColor, performance, t } = useI18n();
  const staticMode = performance.staticMascot || performance.noAnimations;
  const cleanName = (userName || '').trim();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

  const [phasePoseIdx, setPhasePoseIdx] = useState<number>(() =>
    getInitialPhasePoseIndex(timePhase, hour)
  );
  const [quoteRoll, setQuoteRoll] = useState<number>(() =>
    Math.floor(Math.random() * QUOTE_SALT_RANGE)
  );
  const [tapBounce, setTapBounce] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glance, setGlance] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [speechEventId, setSpeechEventId] = useState(0);
  const [isDialogueLocked, setIsDialogueLocked] = useState(false);

  const recentPoseIndicesRef = useRef<number[]>([]);
  const recentLineIdsRef = useRef<string[]>([]);
  const dialogueLockedUntilRef = useRef<number>(0);
  const lockReleaseTimerRef = useRef<number | null>(null);
  const hasFiredInitialGreetingRef = useRef<boolean>(false);

  const isCelebrationOrTimer =
    mood === 'clap' ||
    mood === 'milestone' ||
    mood === 'celebrate' ||
    mood === 'timerActive' ||
    mood === 'rest';

  const visualPose = isCelebrationOrTimer
    ? mood
    : PHASE_POSE_POOL[timePhase][phasePoseIdx % PHASE_POSE_POOL[timePhase].length];

  const phaseColor =
    mood === 'celebrate' || mood === 'clap' || mood === 'milestone'
      ? accentColor
      : mood === 'timerActive' || mood === 'rest'
        ? '#38BDF8'
        : phaseToken.accentBright;

  const n = cleanName ? `, ${cleanName}` : '';
  const allCompleted = totalSets > 0 && completedSets === totalSets;

  const activeTimePose =
    PHASE_POSE_POOL[timePhase][phasePoseIdx % PHASE_POSE_POOL[timePhase].length];

  const speechPool = useMemo<MascotSpeechLine[]>(
    () =>
      buildMascotSpeechPool({
        mood,
        timePhase,
        activeTimePose,
        n,
        completedSets,
        totalSets,
        progressPct,
        dayLabel,
        activeTimerExerciseName,
        restRemainingFormatted,
        allCompleted,
        dayJustChanged,
        t,
      }),
    [
      mood,
      timePhase,
      activeTimePose,
      n,
      completedSets,
      totalSets,
      progressPct,
      dayLabel,
      activeTimerExerciseName,
      restRemainingFormatted,
      allCompleted,
      dayJustChanged,
      t,
    ]
  );

  // Committed dialogue snapshot so mid-chat pose or mood shifts never cut off active dialogue
  const [committedDialogue, setCommittedDialogue] = useState<{
    line: MascotSpeechLine;
    pose: MascotMood | TimePhasePose;
    phase: DayTimePhase;
    lang: string;
  }>(() => ({
    line: pickLineFromPool(speechPool, quoteRoll, []),
    pose: visualPose,
    phase: timePhase,
    lang,
  }));

  const latestPoolRef = useRef(speechPool);
  const latestPoseRef = useRef(visualPose);
  const latestMoodRef = useRef(mood);
  const latestPhaseRef = useRef(timePhase);
  const latestLangRef = useRef(lang);
  const dialogueActiveRef = useRef(dialogueActive);
  const voiceVolumeRef = useRef(voiceVolume);

  latestPoolRef.current = speechPool;
  latestPoseRef.current = visualPose;
  latestMoodRef.current = mood;
  latestPhaseRef.current = timePhase;
  latestLangRef.current = lang;
  dialogueActiveRef.current = dialogueActive;
  voiceVolumeRef.current = voiceVolume;

  const engageDialogueLock = useCallback(() => {
    const until = Date.now() + TOTAL_DIALOGUE_LOCK_MS;
    dialogueLockedUntilRef.current = until;
    setIsDialogueLocked(true);
    if (lockReleaseTimerRef.current !== null) {
      window.clearTimeout(lockReleaseTimerRef.current);
    }
    lockReleaseTimerRef.current = window.setTimeout(() => {
      lockReleaseTimerRef.current = null;
      if (Date.now() >= dialogueLockedUntilRef.current - 50) {
        setIsDialogueLocked(false);
      }
    }, TOTAL_DIALOGUE_LOCK_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (lockReleaseTimerRef.current !== null) {
        window.clearTimeout(lockReleaseTimerRef.current);
      }
    };
  }, []);

  const commitNewDialogue = useCallback(
    (nextRoll: number, playSound: boolean): boolean => {
      const nowTs = Date.now();
      if (nowTs < dialogueLockedUntilRef.current) {
        return false;
      }
      const nextLine = pickLineFromPool(
        latestPoolRef.current,
        nextRoll,
        recentLineIdsRef.current
      );
      if (nextLine.id) {
        const prev = recentLineIdsRef.current;
        if (prev[prev.length - 1] !== nextLine.id) {
          recentLineIdsRef.current = [
            ...prev.filter((id) => id !== nextLine.id),
            nextLine.id,
          ].slice(-MAX_RECENT_LINES);
        }
      }

      setCommittedDialogue({
        line: nextLine,
        pose: latestPoseRef.current,
        phase: latestPhaseRef.current,
        lang: latestLangRef.current,
      });
      setSpeechEventId((id) => id + 1);
      engageDialogueLock();

      if (playSound && dialogueActiveRef.current) {
        const safeMood =
          latestMoodRef.current === 'starting' || latestMoodRef.current === 'welcome'
            ? 'ready'
            : latestMoodRef.current;
        const variant =
          latestPhaseRef.current === 'night' && safeMood === 'ready' ? 'night' : safeMood;
        audioEngine.playMascotChirp(variant, voiceVolumeRef.current);
      }
      return true;
    },
    [engageDialogueLock]
  );

  // Sync displayed line smoothly when user switches UI language
  useEffect(() => {
    if (committedDialogue.lang === lang) return;
    const translated = pickLineFromPool(speechPool, quoteRoll, []);
    setCommittedDialogue({
      line: translated,
      pose: visualPose,
      phase: timePhase,
      lang,
    });
  }, [lang, committedDialogue.lang, speechPool, quoteRoll, visualPose, timePhase]);

  // Initial automatic greeting once splash & onboarding clear (plays blip + starts lock)
  useEffect(() => {
    if (!dialogueActive) return;
    if (hasFiredInitialGreetingRef.current) return;
    hasFiredInitialGreetingRef.current = true;
    const roll = Math.floor(Math.random() * QUOTE_SALT_RANGE);
    setQuoteRoll(roll);
    // Engage lock immediately on greeting appearance and chirp when audio context is ready
    const timer = window.setTimeout(() => {
      commitNewDialogue(roll, true);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [dialogueActive, commitNewDialogue]);

  const prevMoodRef = useRef<MascotMood>(mood);
  const prevDayLabelRef = useRef<string>(dayLabel);
  const prevTimePhaseRef = useRef<DayTimePhase>(timePhase);

  const pushRecentPose = useCallback((idx: number) => {
    const next = [...recentPoseIndicesRef.current.filter((p) => p !== idx), idx];
    recentPoseIndicesRef.current = next.slice(-5);
  }, []);

  // Phase transition dialogue (only commits when lock + 10s cooldown is free)
  useEffect(() => {
    if (prevTimePhaseRef.current === timePhase) return;
    prevTimePhaseRef.current = timePhase;
    recentPoseIndicesRef.current = [];
    const initialIdx = getInitialPhasePoseIndex(timePhase, hour);
    setPhasePoseIdx(initialIdx);
    pushRecentPose(initialIdx);
    const nextRoll = (quoteRoll + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE;
    setQuoteRoll(nextRoll);
    commitNewDialogue(nextRoll, true);
  }, [timePhase, hour, pushRecentPose, quoteRoll, commitNewDialogue]);

  // Urgent mood or day change dialogue (strictly respects display lock + 10s cooldown)
  useEffect(() => {
    if (prevMoodRef.current === mood && prevDayLabelRef.current === dayLabel) {
      return;
    }
    const enteredUrgent =
      mood !== prevMoodRef.current &&
      (mood === 'clap' ||
        mood === 'milestone' ||
        mood === 'celebrate' ||
        mood === 'timerActive' ||
        mood === 'rest');
    prevMoodRef.current = mood;
    prevDayLabelRef.current = dayLabel;
    if (enteredUrgent || dayJustChanged) {
      const nextRoll = (quoteRoll + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE;
      setQuoteRoll(nextRoll);
      // Defer 1 tick so `speechPool` & `latestMoodRef` reflect the new mood
      const timer = window.setTimeout(() => {
        commitNewDialogue(nextRoll, true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [mood, dayLabel, dayJustChanged, quoteRoll, commitNewDialogue]);

  // Silent ambient expression shifts (paused in Static Mascot mode)
  useEffect(() => {
    if (staticMode || isCelebrationOrTimer || timePhase === 'night') return;
    const pool = PHASE_POSE_POOL[timePhase];
    const silentPoseInterval = window.setInterval(() => {
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
    }, DAYTIME_SILENT_POSE_MS);
    return () => window.clearInterval(silentPoseInterval);
  }, [staticMode, isCelebrationOrTimer, timePhase, pushRecentPose]);

  // Autonomous periodic chat (strictly obeys dialogue display lock + 10s cooldown)
  useEffect(() => {
    if (isCelebrationOrTimer || !dialogueActive) return;

    if (timePhase === 'night') {
      let backToSleepTimeout: number | undefined;
      const rareNightChat = window.setInterval(() => {
        if (Date.now() < dialogueLockedUntilRef.current) return;
        const nightAwakeOptions = [1, 2, 3, 4, 5, 6, 7, 8];
        const freshNight = nightAwakeOptions.filter(
          (i) => !recentPoseIndicesRef.current.includes(i)
        );
        const candidates = freshNight.length > 0 ? freshNight : nightAwakeOptions;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        setPhasePoseIdx(chosen);
        pushRecentPose(chosen);
        const nextRoll = Math.floor(Math.random() * QUOTE_SALT_RANGE);
        setQuoteRoll(nextRoll);
        window.setTimeout(() => {
          commitNewDialogue(nextRoll, true);
        }, 0);
        backToSleepTimeout = window.setTimeout(() => {
          setPhasePoseIdx(0);
        }, 7000);
      }, NIGHT_AUTO_CHAT_MS);

      return () => {
        window.clearInterval(rareNightChat);
        if (backToSleepTimeout !== undefined) window.clearTimeout(backToSleepTimeout);
      };
    }

    const pool = PHASE_POSE_POOL[timePhase];
    const calmAutoChat = window.setInterval(() => {
      if (Date.now() < dialogueLockedUntilRef.current) return;
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
      const nextRoll = Math.floor(Math.random() * QUOTE_SALT_RANGE);
      setQuoteRoll(nextRoll);
      window.setTimeout(() => {
        commitNewDialogue(nextRoll, true);
      }, 0);
    }, DAYTIME_AUTO_CHAT_MS);

    return () => window.clearInterval(calmAutoChat);
  }, [isCelebrationOrTimer, timePhase, pushRecentPose, dialogueActive, commitNewDialogue]);

  // Drift smoothly back to sleep late at night after being woken by tap
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase !== 'night' || phasePoseIdx === 0) return;
    const sleepTimer = window.setTimeout(() => {
      setPhasePoseIdx(0);
    }, 9500);
    return () => window.clearTimeout(sleepTimer);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  const isClosedEyeNightPose =
    !isCelebrationOrTimer &&
    timePhase === 'night' &&
    CLOSED_EYE_NIGHT_POSES.has(activeTimePose);

  // Natural periodic eye blinking (disabled in Static Mascot mode)
  useEffect(() => {
    if (staticMode || isClosedEyeNightPose) {
      setIsBlinking(false);
      return;
    }
    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 135);
    }, 3600);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== undefined) window.clearTimeout(blinkTimeout);
    };
  }, [staticMode, isClosedEyeNightPose]);

  // Organic autonomous eye glancing around (disabled in Static Mascot mode)
  useEffect(() => {
    if (staticMode || isCelebrationOrTimer || isClosedEyeNightPose) {
      setGlance({ x: 0, y: 0 });
      return;
    }
    const interval = window.setInterval(() => {
      const next = GLANCE_TARGETS[Math.floor(Math.random() * GLANCE_TARGETS.length)];
      setGlance(next);
    }, 2900);
    return () => window.clearInterval(interval);
  }, [staticMode, isCelebrationOrTimer, isClosedEyeNightPose]);

  useEffect(() => {
    if (!tapBounce) return;
    const timer = window.setTimeout(() => setTapBounce(false), 750);
    return () => window.clearTimeout(timer);
  }, [tapBounce]);

  const triggerNextReaction = useCallback(() => {
    setTapBounce(true);
    // Respect active speech + 10s cooldown lock so dialogue never gets interrupted prematurely
    if (Date.now() < dialogueLockedUntilRef.current) {
      return;
    }
    const pool = PHASE_POSE_POOL[timePhase];
    if (!isCelebrationOrTimer) {
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
    }
    const nextRoll = (quoteRoll + 1 + Math.floor(Math.random() * 13)) % QUOTE_SALT_RANGE;
    setQuoteRoll(nextRoll);
    window.setTimeout(() => {
      commitNewDialogue(nextRoll, true);
    }, 0);
  }, [isCelebrationOrTimer, timePhase, pushRecentPose, quoteRoll, commitNewDialogue]);

  const speechKey = `${committedDialogue.pose}-${committedDialogue.phase}-${committedDialogue.line.id}-${committedDialogue.lang}-${speechEventId}`;

  return useMemo(
    () => ({
      mood,
      timePhase,
      visualPose,
      phaseColor,
      activeLine: committedDialogue.line,
      speechKey,
      speechEventId,
      isUrgentSpeech: isCelebrationOrTimer,
      isDialogueLocked,
      isBlinking,
      glance,
      tapBounce,
      triggerNextReaction,
    }),
    [
      mood,
      timePhase,
      visualPose,
      phaseColor,
      committedDialogue.line,
      speechKey,
      speechEventId,
      isCelebrationOrTimer,
      isDialogueLocked,
      isBlinking,
      glance,
      tapBounce,
      triggerNextReaction,
    ]
  );
}
