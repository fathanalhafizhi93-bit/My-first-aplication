import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMascotSpeechPool,
  MascotMood,
  MascotSpeechLine,
  TimePhasePose,
} from '../data/mascotDialogues';
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
}: UseMascotCompanionParams): MascotCompanionState {
  const { lang, accentColor, t } = useI18n();
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

  const recentPoseIndicesRef = useRef<number[]>([]);
  const recentLineIdsRef = useRef<string[]>([]);

  const isCelebrationOrTimer =
    mood === 'clap' ||
    mood === 'milestone' ||
    mood === 'celebrate' ||
    mood === 'timerActive' ||
    mood === 'rest';

  const prevMoodRef = useRef<MascotMood>(mood);
  const prevDayLabelRef = useRef<string>(dayLabel);
  const prevTimePhaseRef = useRef<DayTimePhase>(timePhase);

  const pushRecentPose = useCallback((idx: number) => {
    const next = [...recentPoseIndicesRef.current.filter((p) => p !== idx), idx];
    recentPoseIndicesRef.current = next.slice(-5);
  }, []);

  // Reset pose cleanly on timePhase transitions
  useEffect(() => {
    if (prevTimePhaseRef.current === timePhase) return;
    prevTimePhaseRef.current = timePhase;
    recentPoseIndicesRef.current = [];
    const initialIdx = getInitialPhasePoseIndex(timePhase, hour);
    setPhasePoseIdx(initialIdx);
    pushRecentPose(initialIdx);
    setQuoteRoll((prev) => (prev + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE);
    setSpeechEventId((id) => id + 1);
  }, [timePhase, hour, pushRecentPose]);

  // Re-roll phrasing & emit speech event when urgent mood or day changes
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
    setQuoteRoll((prev) => (prev + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE);
    if (enteredUrgent || dayJustChanged) {
      setSpeechEventId((id) => id + 1);
    }
  }, [mood, dayLabel, dayJustChanged]);

  // Silent ambient expression shifts (orb stays lively without popping chat bubbles)
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase === 'night') return;
    const pool = PHASE_POSE_POOL[timePhase];
    const silentPoseInterval = window.setInterval(() => {
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
    }, DAYTIME_SILENT_POSE_MS);
    return () => window.clearInterval(silentPoseInterval);
  }, [isCelebrationOrTimer, timePhase, pushRecentPose]);

  // Calmer autonomous speech cadence (still greets automatically, far less often)
  useEffect(() => {
    if (isCelebrationOrTimer) return;

    if (timePhase === 'night') {
      let backToSleepTimeout: number | undefined;
      const rareNightChat = window.setInterval(() => {
        const nightAwakeOptions = [1, 2, 3, 4, 5, 6, 7, 8];
        const freshNight = nightAwakeOptions.filter(
          (i) => !recentPoseIndicesRef.current.includes(i)
        );
        const candidates = freshNight.length > 0 ? freshNight : nightAwakeOptions;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        setPhasePoseIdx(chosen);
        pushRecentPose(chosen);
        setQuoteRoll((prev) => (prev + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE);
        setSpeechEventId((id) => id + 1);
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
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
      setQuoteRoll((prev) => (prev + 1 + Math.floor(Math.random() * 11)) % QUOTE_SALT_RANGE);
      setSpeechEventId((id) => id + 1);
    }, DAYTIME_AUTO_CHAT_MS);

    return () => window.clearInterval(calmAutoChat);
  }, [isCelebrationOrTimer, timePhase, pushRecentPose]);

  // Drift smoothly back to sleep late at night after being woken by tap
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase !== 'night' || phasePoseIdx === 0) return;
    const sleepTimer = window.setTimeout(() => {
      setPhasePoseIdx(0);
    }, 9500);
    return () => window.clearTimeout(sleepTimer);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  const activeTimePose: TimePhasePose =
    PHASE_POSE_POOL[timePhase][phasePoseIdx % PHASE_POSE_POOL[timePhase].length];

  const isClosedEyeNightPose =
    !isCelebrationOrTimer &&
    timePhase === 'night' &&
    CLOSED_EYE_NIGHT_POSES.has(activeTimePose);

  // Natural periodic eye blinking
  useEffect(() => {
    if (isClosedEyeNightPose) {
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
  }, [isClosedEyeNightPose]);

  // Organic autonomous eye glancing around
  useEffect(() => {
    if (isCelebrationOrTimer || isClosedEyeNightPose) {
      setGlance({ x: 0, y: 0 });
      return;
    }
    const interval = window.setInterval(() => {
      const next = GLANCE_TARGETS[Math.floor(Math.random() * GLANCE_TARGETS.length)];
      setGlance(next);
    }, 2900);
    return () => window.clearInterval(interval);
  }, [isCelebrationOrTimer, isClosedEyeNightPose]);

  useEffect(() => {
    if (!tapBounce) return;
    const timer = window.setTimeout(() => setTapBounce(false), 750);
    return () => window.clearTimeout(timer);
  }, [tapBounce]);

  const triggerNextReaction = useCallback(() => {
    setTapBounce(true);
    const pool = PHASE_POSE_POOL[timePhase];
    if (!isCelebrationOrTimer) {
      setPhasePoseIdx((prev) => {
        const next = pickFreshPoseIndex(pool.length, prev, recentPoseIndicesRef.current);
        pushRecentPose(next);
        return next;
      });
    }
    setQuoteRoll((prev) => (prev + 1 + Math.floor(Math.random() * 13)) % QUOTE_SALT_RANGE);
    setSpeechEventId((id) => id + 1);
  }, [isCelebrationOrTimer, timePhase, pushRecentPose]);

  const visualPose = isCelebrationOrTimer ? mood : activeTimePose;

  const phaseColor =
    mood === 'celebrate' || mood === 'clap' || mood === 'milestone'
      ? accentColor
      : mood === 'timerActive' || mood === 'rest'
        ? '#38BDF8'
        : phaseToken.accentBright;

  const n = cleanName ? `, ${cleanName}` : '';
  const allCompleted = totalSets > 0 && completedSets === totalSets;

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

  // Smart anti-repeat line selection across poses & quotes
  const activeLine = useMemo<MascotSpeechLine>(() => {
    if (speechPool.length === 0) {
      return { id: 'fallback', headline: 'IronPulse', subline: '' };
    }
    const recent = recentLineIdsRef.current;
    const unseen = speechPool.filter((line) => !recent.includes(line.id));
    const candidates = unseen.length > 0 ? unseen : speechPool;
    return candidates[quoteRoll % candidates.length] || speechPool[0];
  }, [speechPool, quoteRoll]);

  useEffect(() => {
    if (!activeLine?.id) return;
    const prev = recentLineIdsRef.current;
    if (prev[prev.length - 1] === activeLine.id) return;
    recentLineIdsRef.current = [...prev.filter((id) => id !== activeLine.id), activeLine.id].slice(
      -MAX_RECENT_LINES
    );
  }, [activeLine.id]);

  const speechKey = `${visualPose}-${timePhase}-${activeLine.id}-${lang}`;

  return {
    mood,
    timePhase,
    visualPose,
    phaseColor,
    activeLine,
    speechKey,
    speechEventId,
    isUrgentSpeech: isCelebrationOrTimer,
    isBlinking,
    glance,
    tapBounce,
    triggerNextReaction,
  };
}
