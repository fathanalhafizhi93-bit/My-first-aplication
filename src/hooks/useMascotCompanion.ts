import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';

export type MascotMood =
  | 'welcome'
  | 'ready'
  | 'starting'
  | 'clap'
  | 'milestone'
  | 'timerActive'
  | 'rest'
  | 'celebrate'
  | 'restday';

export type TimePhasePose =
  | 'tea'
  | 'stretch'
  | 'perk'
  | 'coffee'
  | 'wink'
  | 'hydrate'
  | 'shades'
  | 'curious'
  | 'flex'
  | 'music'
  | 'sleep'
  | 'yawn'
  | 'nightChill'
  | 'stargaze'
  | 'zen';

export interface MascotSpeechLine {
  headline: string;
  subline: string;
}

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

const PHASE_POSE_POOL: Record<DayTimePhase, readonly TimePhasePose[]> = {
  morning: ['tea', 'coffee', 'stretch', 'perk', 'wink'],
  afternoon: ['hydrate', 'shades', 'flex', 'music', 'curious'],
  night: ['sleep', 'yawn', 'nightChill', 'stargaze', 'zen'],
};

// Autonomous speech cadence: much calmer so floating bubble never feels intrusive
const DAYTIME_SILENT_POSE_MS = 26_000;
const DAYTIME_AUTO_CHAT_MS = 68_000;
const NIGHT_AUTO_CHAT_MS = 120_000;
const QUOTE_SLOT_SPACE = 12;

function getInitialPhasePoseIndex(timePhase: DayTimePhase, hour: number): number {
  if (timePhase === 'morning') {
    if (hour < 7) return 0; // tea
    if (hour < 9) return 1; // coffee
    return 2; // stretch
  }
  if (timePhase === 'afternoon') {
    if (hour < 13) return 0; // hydrate
    if (hour < 15) return 1; // shades
    return 2; // flex
  }
  if (hour >= 22 || hour < 4) return 0; // sleep
  return 3; // stargaze
}

function pickNonRepeatingIndex(length: number, prevIndex: number): number {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === prevIndex) {
    next = (prevIndex + 1 + Math.floor(Math.random() * (length - 1))) % length;
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
  const [quoteIdx, setQuoteIdx] = useState<number>(() =>
    Math.floor(Math.random() * QUOTE_SLOT_SPACE)
  );
  const [tapBounce, setTapBounce] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glance, setGlance] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [speechEventId, setSpeechEventId] = useState(0);

  const isCelebrationOrTimer =
    mood === 'clap' ||
    mood === 'milestone' ||
    mood === 'celebrate' ||
    mood === 'timerActive' ||
    mood === 'rest';

  const prevMoodRef = useRef<MascotMood>(mood);
  const prevDayLabelRef = useRef<string>(dayLabel);
  const prevTimePhaseRef = useRef<DayTimePhase>(timePhase);

  // Reset pose cleanly on timePhase transitions
  useEffect(() => {
    if (prevTimePhaseRef.current === timePhase) return;
    prevTimePhaseRef.current = timePhase;
    setPhasePoseIdx(getInitialPhasePoseIndex(timePhase, hour));
    setQuoteIdx((prev) => pickNonRepeatingIndex(QUOTE_SLOT_SPACE, prev));
    setSpeechEventId((id) => id + 1);
  }, [timePhase, hour]);

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
    setQuoteIdx((prev) => pickNonRepeatingIndex(QUOTE_SLOT_SPACE, prev));
    if (enteredUrgent || dayJustChanged) {
      setSpeechEventId((id) => id + 1);
    }
  }, [mood, dayLabel, dayJustChanged]);

  // Silent ambient expression shifts (orb stays lively without popping chat bubbles)
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase === 'night') return;
    const pool = PHASE_POSE_POOL[timePhase];
    const silentPoseInterval = window.setInterval(() => {
      setPhasePoseIdx((prev) => pickNonRepeatingIndex(pool.length, prev));
    }, DAYTIME_SILENT_POSE_MS);
    return () => window.clearInterval(silentPoseInterval);
  }, [isCelebrationOrTimer, timePhase]);

  // Calmer autonomous speech cadence (still greets automatically, far less often)
  useEffect(() => {
    if (isCelebrationOrTimer) return;

    if (timePhase === 'night') {
      let backToSleepTimeout: number | undefined;
      const rareNightChat = window.setInterval(() => {
        const nightAwakeOptions = [1, 2, 3, 4];
        const chosen =
          nightAwakeOptions[Math.floor(Math.random() * nightAwakeOptions.length)];
        setPhasePoseIdx(chosen);
        setQuoteIdx((prev) => pickNonRepeatingIndex(QUOTE_SLOT_SPACE, prev));
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
      setPhasePoseIdx((prev) => pickNonRepeatingIndex(pool.length, prev));
      setQuoteIdx((prev) => pickNonRepeatingIndex(QUOTE_SLOT_SPACE, prev));
      setSpeechEventId((id) => id + 1);
    }, DAYTIME_AUTO_CHAT_MS);

    return () => window.clearInterval(calmAutoChat);
  }, [isCelebrationOrTimer, timePhase]);

  // Drift smoothly back to sleep late at night after being woken by tap
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase !== 'night' || phasePoseIdx === 0) return;
    const sleepTimer = window.setTimeout(() => {
      setPhasePoseIdx(0);
    }, 9500);
    return () => window.clearTimeout(sleepTimer);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  // Natural periodic eye blinking
  useEffect(() => {
    if (
      !isCelebrationOrTimer &&
      timePhase === 'night' &&
      (phasePoseIdx === 0 || phasePoseIdx === 4)
    ) {
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
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  // Organic autonomous eye glancing around
  useEffect(() => {
    if (
      isCelebrationOrTimer ||
      (timePhase === 'night' && (phasePoseIdx === 0 || phasePoseIdx === 4))
    ) {
      setGlance({ x: 0, y: 0 });
      return;
    }
    const interval = window.setInterval(() => {
      const next = GLANCE_TARGETS[Math.floor(Math.random() * GLANCE_TARGETS.length)];
      setGlance(next);
    }, 2900);
    return () => window.clearInterval(interval);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  useEffect(() => {
    if (!tapBounce) return;
    const timer = window.setTimeout(() => setTapBounce(false), 750);
    return () => window.clearTimeout(timer);
  }, [tapBounce]);

  const triggerNextReaction = useCallback(() => {
    setTapBounce(true);
    const pool = PHASE_POSE_POOL[timePhase];
    if (!isCelebrationOrTimer) {
      setPhasePoseIdx((prev) => (prev + 1) % pool.length);
    }
    setQuoteIdx((prev) => pickNonRepeatingIndex(QUOTE_SLOT_SPACE, prev));
    setSpeechEventId((id) => id + 1);
  }, [isCelebrationOrTimer, timePhase]);

  const activeTimePose: TimePhasePose =
    PHASE_POSE_POOL[timePhase][phasePoseIdx % PHASE_POSE_POOL[timePhase].length];

  const visualPose = isCelebrationOrTimer ? mood : activeTimePose;

  const phaseColor =
    mood === 'celebrate' || mood === 'clap' || mood === 'milestone'
      ? accentColor
      : mood === 'timerActive' || mood === 'rest'
        ? '#38BDF8'
        : phaseToken.accentBright;

  const n = cleanName ? `, ${cleanName}` : '';
  const allCompleted = totalSets > 0 && completedSets === totalSets;

  const speechPool = useMemo<MascotSpeechLine[]>(() => {
    if (mood === 'clap') {
      return [
        {
          headline: t(`Mantap${n}! Set selesai!`, `Nice${n}! Set done!`),
          subline: t(
            `${completedSets}/${totalSets || 1} set beres. Tepuk tangan buat kerja kerasmu!`,
            `${completedSets}/${totalSets || 1} sets done. Quick cheer for that clean effort!`
          ),
        },
        {
          headline: t(`Keren${n}! Satu set terkunci!`, `Awesome${n}! Set banked!`),
          subline: t(
            'Eksekusi rapi — tarik napas dulu sebelum lanjut ke set berikutnya.',
            'Clean execution — catch your breath before the next set.'
          ),
        },
        {
          headline: t(`Progres tercatat${n}!`, `Progress logged${n}!`),
          subline: t(
            'Ritme bagus! Satu langkah lebih dekat menuntaskan target hari ini.',
            'Great rhythm! One step closer to clearing today’s target.'
          ),
        },
        {
          headline: t(`Solid banget${n}!`, `Super solid${n}!`),
          subline: t(
            'Kontrol repetisi tadi terasa mantap — jaga postur tetap rapat di set selanjutnya.',
            'Great rep control — keep that crisp form rolling into the next set.'
          ),
        },
        {
          headline: t(`Terus nyala${n}!`, `Keeping the spark alive${n}!`),
          subline: t(
            `Sudah ${completedSets} set terkumpul. Konsistensi kecil seperti ini yang bikin beda.`,
            `${completedSets} sets banked already. Small consistent wins add up fast.`
          ),
        },
        {
          headline: t(`Bersih tanpa ragu${n}!`, `Clean & decisive${n}!`),
          subline: t(
            'Beban tadi lewat mulus — beri otot jeda singkat biar tenaga balik penuh.',
            'That set went up smooth — give your muscles a quick breather.'
          ),
        },
      ];
    }

    if (mood === 'milestone') {
      return [
        {
          headline: t(
            `Mantap${n}! Sudah ${progressPct}%!`,
            `Awesome${n}! ${progressPct}% cleared!`
          ),
          subline: t(
            `${completedSets}/${totalSets} set beres — lebih dari separuh jalan terlewati!`,
            `${completedSets}/${totalSets} sets done — over halfway through today’s session!`
          ),
        },
        {
          headline: t(`Dorongan hebat${n}! (${progressPct}%)`, `Strong push${n}! (${progressPct}%)`),
          subline: t(
            'Momentum lagi puncak! Nikmati jedamu sebelum menyapu sisa set.',
            'Peak momentum! Enjoy a brief breather before clearing the remaining sets.'
          ),
        },
        {
          headline: t(`Set selesai dengan rapi${n}!`, `Clean set logged${n}!`),
          subline: t(
            'Tinggal sedikit lagi menuju 100%. Pertahankan fokusmu!',
            'Just a bit more to 100%. Keep that focus steady!'
          ),
        },
        {
          headline: t(`Paruh akhir dimulai${n}!`, `Home stretch unlocked${n}!`),
          subline: t(
            `Sisa ${Math.max(0, totalSets - completedSets)} set lagi — tutup sesi hari ini dengan kuat!`,
            `${Math.max(0, totalSets - completedSets)} sets left — finish today’s session strong!`
          ),
        },
        {
          headline: t(`Mesin sudah panas${n}!`, `Fully dialed in${n}!`),
          subline: t(
            'Tenaga masih stabil di atas 50%. Pastikan hidrasi tetap terjaga ya!',
            'Holding steady past halfway. Keep sipping water between sets!'
          ),
        },
        {
          headline: t(`Hampir finis${n}! (${progressPct}%)`, `Almost across the line${n}! (${progressPct}%)`),
          subline: t(
            'Bagian tersulit sudah lewat — sekarang tinggal kunci kemenangan hari ini.',
            'The hardest part is behind you — now lock in today’s finish.'
          ),
        },
      ];
    }

    if (mood === 'celebrate') {
      return [
        {
          headline: t(`Luar biasa${n}! Sesi Tuntas 100%!`, `Awesome${n}! 100% Complete!`),
          subline: t(
            `Semua ${totalSets} set beres dikerjakan! Riwayat latihanmu otomatis tersimpan.`,
            `All ${totalSets} sets finished! Your workout history is saved automatically.`
          ),
        },
        {
          headline: t(`Sesi ${dayLabel} tamat${n}!`, `${dayLabel} conquered${n}!`),
          subline: t(
            'Tepuk tangan meriah! Sekarang waktunya pendinginan dan pemulihan.',
            'Big applause! Time to cool down and enjoy your recovery.'
          ),
        },
        {
          headline: t(`Juara hari ini${n}!`, `Champion effort${n}!`),
          subline: t(
            'Target latihan hari ini tuntas sempurna. Kamu hebat!',
            'Today’s workout target is completely cleared. Great job!'
          ),
        },
        {
          headline: t(`Misi selesai 100%${n}!`, `Mission 100% cleared${n}!`),
          subline: t(
            'Jangan lupa peregangan singkat, minum air, dan isi protein biar pulih optimal.',
            'Take a quick stretch, hydrate well, and refuel for optimal recovery.'
          ),
        },
        {
          headline: t(`Rekor konsistensi bertambah${n}!`, `Another win on the board${n}!`),
          subline: t(
            'Hari ini resmi masuk catatan kalender. Bangga sama disiplinmu!',
            'Today is officially stamped in your calendar. Proud of your discipline!'
          ),
        },
      ];
    }

    if (mood === 'timerActive') {
      return [
        {
          headline: activeTimerExerciseName
            ? t(`Tahan fokus — ${activeTimerExerciseName}`, `Hold strong — ${activeTimerExerciseName}`)
            : t(`Timer gerakan aktif${n}!`, `Exercise timer running${n}!`),
          subline: t(
            'Jaga napas tetap stabil dan postur terkunci sampai hitungan selesai.',
            'Keep your breathing steady and posture braced until the timer finishes.'
          ),
        },
        {
          headline: t(`Setiap detik berharga${n}!`, `Every second counts${n}!`),
          subline: t(
            'Tetap stabil — durasi otomatis tersimpan begitu hitungan selesai.',
            'Stay steady — duration saves automatically when the timer finishes.'
          ),
        },
        {
          headline: t(`Fokus penuh di waktu${n}!`, `Locked on the clock${n}!`),
          subline: t(
            'Kendalikan napasmu perlahan sampai bunyi selesai berbunyi.',
            'Breathe evenly and hold strong until the finish chime.'
          ),
        },
        {
          headline: t(`Kunci core & stabilkan ritme${n}!`, `Brace your core & hold${n}!`),
          subline: t(
            'Jangan tahan napas — embuskan perlahan biar daya tahan tetap panjang.',
            'Don’t hold your breath — steady exhales keep your stamina steady.'
          ),
        },
        {
          headline: t(`Sedikit lagi menuju bel${n}!`, `Stay locked to the chime${n}!`),
          subline: t(
            'Pikiran tenang, otot bekerja — kamu pegang kendali penuh sekarang.',
            'Calm mind, steady tension — you’re in complete control right now.'
          ),
        },
      ];
    }

    if (mood === 'rest') {
      return [
        {
          headline: restRemainingFormatted
            ? t(`Timer Istirahat Aktif (${restRemainingFormatted})`, `Rest Timer Active (${restRemainingFormatted})`)
            : t('Timer Istirahat Aktif', 'Rest Timer Running'),
          subline: t(
            'Biarkan otot pulih sejenak sambil menunggu timer istirahat selesai.',
            'Let your muscles recover briefly while the rest timer counts down.'
          ),
        },
        {
          headline: restRemainingFormatted
            ? t(`Isi ulang tenaga · ${restRemainingFormatted}`, `Recharging · ${restRemainingFormatted}`)
            : t('Isi ulang tenaga antar set', 'Recharging between sets'),
          subline: t(
            'Tarik napas pelan dan teguk air sebelum masuk ke set berikutnya.',
            'Breathe slow and grab a sip of water before the next set.'
          ),
        },
        {
          headline: restRemainingFormatted
            ? t(`Pemulihan otot (${restRemainingFormatted})`, `Muscle recovery (${restRemainingFormatted})`)
            : t('Pemulihan otot antar set', 'Between-set recovery'),
          subline: t(
            'Lemaskan bahu — sebentar lagi waktunya lanjut!',
            'Relax your shoulders — almost time to jump back in!'
          ),
        },
        {
          headline: restRemainingFormatted
            ? t(`Jeda singkat · ${restRemainingFormatted}`, `Quick breather · ${restRemainingFormatted}`)
            : t('Jeda singkat antar set', 'Short rest between sets'),
          subline: t(
            'Kibaskan tangan sebentar dan bayangkan eksekusi set berikutnya.',
            'Shake out your grip and visualize a clean next set.'
          ),
        },
        {
          headline: restRemainingFormatted
            ? t(`Detak napas turun · ${restRemainingFormatted}`, `Heart rate settling · ${restRemainingFormatted}`)
            : t('Atur napas sebelum lanjut', 'Reset your breath'),
          subline: t(
            'Istirahat terukur bikin kekuatanmu tetap maksimal di setiap set.',
            'Timed rest keeps your strength output sharp across every set.'
          ),
        },
      ];
    }

    // ─── MORNING POSES (tea, coffee, stretch, perk, wink) ───
    if (timePhase === 'morning') {
      if (activeTimePose === 'tea') {
        return [
          {
            headline: allCompleted
              ? t(`Sruput teh hangat dulu${n}...`, `Sipping warm morning tea${n}...`)
              : t(`Minum teh pagi dulu${n}~`, `Morning tea break${n}~`),
            subline: allCompleted
              ? t(
                  'Latihan pagi sudah tuntas! Nikmati teh hangatmu buat pemulihan santai.',
                  'Morning workout cleared! Enjoy your warm tea for a calm recovery.'
                )
              : dayJustChanged
                ? t(
                    `Hari baru di ${dayLabel}! Ngeteh hangat bentar biar badan siap bergerak.`,
                    `Fresh ${dayLabel}! A warm cup of tea helps wake the body up gently.`
                  )
                : t(
                    'Pagi yang adem! Ngeteh hangat dulu sambil nyiapin semangat latihan.',
                    'Crisp morning air! Sipping warm tea while getting ready for today.'
                  ),
          },
          {
            headline: t(`Teh hangat & udara pagi${n}`, `Warm cup & morning breeze${n}`),
            subline:
              mood === 'restday'
                ? t(
                    'Hari istirahat di pagi hari paling nikmat ditemani teh hangat dan santai.',
                    'Morning rest day feels best with warm tea and unhurried recovery.'
                  )
                : t(
                    'Isi energi pelan-pelan di pagi hari sebelum mulai gerak.',
                    'Easing into the morning before getting into your sets.'
                  ),
          },
          {
            headline: t(`Selamat Pagi${n}! Segelas teh dulu`, `Good Morning${n}! Tea time`),
            subline: t(
              'Biar pikiran tenang dan tubuh hangat — siap kalau kamu mau mulai!',
              'Warming up mind and body — ready whenever you want to begin!'
            ),
          },
          {
            headline: t(`Aroma teh pagi bikin rileks${n}`, `Calm morning tea aroma${n}`),
            subline: t(
              'Awali hari tanpa tergesa — tubuh yang siap menghasilkan sesi terbaik.',
              'Start unhurried — a calm warm-up sets up the strongest sessions.'
            ),
          },
        ];
      }

      if (activeTimePose === 'coffee') {
        return [
          {
            headline: t(`Ngopi pagi biar makin melek${n}!`, `Morning espresso boost${n}!`),
            subline: allCompleted
              ? t(
                  'Latihan sudah beres, kopi pagi jadi hadiah paling pas hari ini!',
                  'Workout already done — that morning coffee tastes even better now!'
                )
              : t(
                  'Tegukan kafein tipis bikin fokus tajam pas mulai pemanasan nanti.',
                  'A crisp morning brew sharpens your focus right before warm-up.'
                ),
          },
          {
            headline: t(`Energi pagi siap dinyalakan${n}!`, `Morning fuel locked in${n}!`),
            subline: t(
              'Jangan lupa imbangi kopi dengan segelas air putih biar hidrasi aman.',
              'Pair your coffee with a glass of water so hydration stays on track.'
            ),
          },
          {
            headline: t(`Aroma kopi di hari ${dayLabel}${n}`, `Fresh roast for ${dayLabel}${n}`),
            subline: t(
              'Mata sudah cerah, otot tinggal dipanaskan pelan-pelan.',
              'Eyes wide awake — just a quick warm-up and you’re ready to roll.'
            ),
          },
          {
            headline: t(`Siap ngebut pagi ini${n}?`, `Ready to spark the morning${n}?`),
            subline: t(
              'Mulai dari set pemanasan ringan dulu biar sendi ikut bangun.',
              'Ease in with a light warm-up set so your joints wake up smoothly.'
            ),
          },
        ];
      }

      if (activeTimePose === 'stretch') {
        return [
          {
            headline: t(`Peregangan pagi yuk${n}!`, `Morning stretch time${n}!`),
            subline: allCompleted
              ? t(
                  'Pendinginan ringan di bawah sinar pagi bikin otot makin lega.',
                  'Light morning stretching keeps your muscles loose after finishing.'
                )
              : t(
                  'Rentangkan bahu dan tarik napas segar — cahaya pagi lagi bagus nih!',
                  'Open up your shoulders and breathe deep — morning light feels great!'
                ),
          },
          {
            headline: t(`Bangun segar pagi ini${n}!`, `Fresh morning wake-up${n}!`),
            subline: t(
              'Matahari pagi mulai naik, pas banget buat bangun konsistensi hari ini.',
              'The morning sun is rising — a great time to build momentum.'
            ),
          },
          {
            headline: t(`Gerak ringan di pagi hari${n}`, `Gentle morning mobility${n}`),
            subline: t(
              'Sendi yang lentur bikin setiap gerakan terasa jauh lebih nyaman.',
              'Warm, mobile joints make every rep feel smoother.'
            ),
          },
          {
            headline: t(`Putar bahu, tarik napas dalam${n}`, `Roll your shoulders & breathe${n}`),
            subline: t(
              'Dua menit mobilitas ringan cukup bikin punggung dan leher terasa enteng.',
              'Two minutes of mobility loosens up your neck and back right away.'
            ),
          },
        ];
      }

      if (activeTimePose === 'wink') {
        return [
          {
            headline: t(`Hari ini bakal keren${n}!`, `Today’s looking strong${n}!`),
            subline: allCompleted
              ? t(
                  'Tuh kan bener, sesi pagi langsung tuntas tanpa drama!',
                  'Called it — morning session cleared smoothly!'
                )
              : t(
                  'Aku yakin kamu bisa ngelewatin target hari ini dengan gaya santai.',
                  'I’ve got a good feeling you’re going to crush today’s plan.'
                ),
          },
          {
            headline: t(`Siap cetak progres baru${n}?`, `Ready for a small PR${n}?`),
            subline: t(
              'Tambah satu repetisi ekstra atau kontrol tempo lebih rapi sudah terhitung menang!',
              'Even one extra clean rep or tighter form counts as a win today!'
            ),
          },
          {
            headline: t(`Pagi yang penuh percaya diri${n}`, `Confident morning vibe${n}`),
            subline: t(
              'Nggak perlu buru-buru — yang penting datang dan mulai bergerak.',
              'No rush at all — showing up and moving is half the victory.'
            ),
          },
          {
            headline: t(`Yuk bikin ${dayLabel} berkesan${n}`, `Let’s make ${dayLabel} count${n}`),
            subline: t(
              'Jadwal sudah rapi menunggu. Aku standby di sudut kalau kamu butuh!',
              'Your schedule is lined up. I’ll be chilling in the corner if you need me!'
            ),
          },
        ];
      }

      return [
        {
          headline: t(`Selamat Pagi${n}! Energi baru!`, `Good Morning${n}! Fresh energy!`),
          subline:
            mood === 'restday'
              ? t(
                  'Hari ini jatah istirahat — nikmati pagi santai tanpa beban berat.',
                  'Today is a rest day — enjoy a calm morning recharge.'
                )
              : allCompleted
                ? t(
                    `Pagi-pagi semua ${totalSets} set sudah beres! Hari ${dayLabel} terasa ringan.`,
                    `All ${totalSets} sets done early! Your ${dayLabel} is wide open now.`
                  )
                : t(
                    `Jadwal ${dayLabel} siap di bawah. Mulai kapan saja kamu siap!`,
                    `${dayLabel}’s plan is lined up below. Start whenever you’re ready!`
                  ),
        },
        {
          headline: t(`Pagi cerah di ${dayLabel}${n}`, `Bright ${dayLabel} morning${n}`),
          subline: t(
            'Awali pagi dengan mood baik — langkah kecil hari ini berarti besar.',
            'Start the morning in good spirits — every small step counts today.'
          ),
        },
        {
          headline: t(`Semangat pagi${n}!`, `Morning boost${n}!`),
          subline: t(
            'Aku temani dari pagi sampai sesi hari ini beres.',
            'Right beside you from the morning warm-up to the finish.'
          ),
        },
        {
          headline: t(`Fokus segar di awal hari${n}`, `Sharp focus early on${n}`),
          subline: t(
            'Cek dulu urutan gerakan hari ini biar transisi antar alat makin mulus.',
            'Glance over today’s lineup so transitions between sets stay effortless.'
          ),
        },
      ];
    }

    // ─── AFTERNOON POSES (hydrate, shades, flex, music, curious) ───
    if (timePhase === 'afternoon') {
      if (activeTimePose === 'hydrate') {
        return [
          {
            headline: t(`Minum air dulu siang ini${n}!`, `Midday hydration check${n}!`),
            subline: allCompleted
              ? t(
                  'Sesi siang sudah tuntas! Jangan lupa ganti cairan tubuh biar tetap segar.',
                  'Afternoon workout cleared! Replenish fluids so you stay refreshed.'
                )
              : t(
                  'Siang hari bikin cepat haus — teguk air dingin biar tenaga tetap penuh!',
                  'Midday heat drains focus fast — take a cool sip to stay energized!'
                ),
          },
          {
            headline: t(`Jaga hidrasi siang${n}`, `Stay hydrated this afternoon${n}`),
            subline: t(
              'Air putih cukup bikin otot dan fokus tetap tajam sepanjang siang.',
              'Steady water intake keeps your muscles and focus sharp all afternoon.'
            ),
          },
          {
            headline: t(`Segarkan diri sejenak${n}`, `Quick midday refresh${n}`),
            subline: t(
              'Istirahat sebentar, minum air, lalu lanjutkan aktivitasmu.',
              'Take a brief pause, sip some water, and keep rolling.'
            ),
          },
          {
            headline: t(`Botol minum aman di dekatmu${n}?`, `Water bottle nearby${n}?`),
            subline: t(
              'Tegukan kecil tapi rutin jauh lebih efektif buat stamina otot.',
              'Small regular sips keep your energy way steadier than gulping later.'
            ),
          },
        ];
      }

      if (activeTimePose === 'shades') {
        return [
          {
            headline: t(`Siang terik? Tetap santai${n}!`, `Bright sun? Stay cool${n}!`),
            subline: allCompleted
              ? t(
                  `Semua ${totalSets} set beres di tengah hari! Mode santai aktif.`,
                  `All ${totalSets} sets knocked out! Afternoon chill mode unlocked.`
                )
              : t(
                  'Matahari lagi tinggi-tingginya — pakai kacamata keren biar tetap adem!',
                  'Sun’s high outside — keeping cool and composed all afternoon!'
                ),
          },
          {
            headline: t(`Selamat Siang${n}! Tetap kalem`, `Good Afternoon${n}! Looking sharp`),
            subline:
              mood === 'restday'
                ? t(
                    'Siang santai di hari istirahat — nikmati waktumu tanpa buru-buru.',
                    'Easy afternoon on a rest day — enjoy your pace with zero rush.'
                  )
                : t(
                    'Atur tempo latihanmu di siang hari agar napas tetap nyaman.',
                    'Pace your afternoon sets calmly so your breathing stays smooth.'
                  ),
          },
          {
            headline: t(`Vibe siang lagi oke nih${n}`, `Afternoon vibe is on point${n}`),
            subline: t(
              'Tenaga siang hari lagi stabil — mantap buat gerak atau sekadar santai.',
              'Midday energy feels steady — great for training or unwinding.'
            ),
          },
          {
            headline: t(`Kalem tapi tetap konsisten${n}`, `Cool, calm & consistent${n}`),
            subline: t(
              'Gaya santai nggak berarti kendor — tiap set rapi tetap bawa hasil besar.',
              'Staying chill never slows progress — clean reps always deliver.'
            ),
          },
        ];
      }

      if (activeTimePose === 'flex') {
        return [
          {
            headline: t(`Mode kuat aktif siang ini${n}!`, `Strength mode activated${n}!`),
            subline: allCompleted
              ? t(
                  'Otot sudah kerja maksimal hari ini — mantap banget performamu!',
                  'Muscles put in serious work today — rock-solid performance!'
                )
              : t(
                  'Suhu tubuh siang hari biasanya paling pas buat angkat beban optimal.',
                  'Afternoon body temperature is often prime time for peak strength!'
                ),
          },
          {
            headline: t(`Fokus ke kualitas repetisi${n}!`, `Quality over speed${n}!`),
            subline: t(
              'Turunkan beban terkontrol, dorong penuh — otot kerasa jauh lebih kena.',
              'Controlled eccentric, crisp drive — your muscles feel every rep.'
            ),
          },
          {
            headline: t(`Tunjukkan tenaga terbaikmu${n}!`, `Bring your best power${n}!`),
            subline: t(
              'Set demi set bikin tubuh makin kuat dari minggu lalu.',
              'Set by set you’re building stronger than last week.'
            ),
          },
          {
            headline: t(`Siap hajar target ${dayLabel}${n}!`, `Ready to crush ${dayLabel}${n}!`),
            subline: t(
              'Kunci postur, atur napas, dan biarkan konsistensimu bicara.',
              'Lock your posture, set your breath, and let consistency speak.'
            ),
          },
        ];
      }

      if (activeTimePose === 'music') {
        return [
          {
            headline: t(`Pasang playlist favoritmu${n}!`, `Cue up your hype track${n}!`),
            subline: t(
              'Irama yang pas bikin jeda istirahat dan tempo latihan terasa jauh lebih asyik.',
              'The right beat makes every set and transition flow effortlessly.'
            ),
          },
          {
            headline: t(`Masuk ke zona ritme${n}~`, `Dropping into the groove${n}~`),
            subline: allCompleted
              ? t(
                  'Putar lagu santai buat pendinginan setelah menuntaskan semua set!',
                  'Switch to a chill track for your post-workout cool-down!'
                )
              : t(
                  'Nikmati alur latihanmu tanpa tekanan — satu lagu, satu set mantap.',
                  'Enjoy your flow with zero pressure — one track, one clean set.'
                ),
          },
          {
            headline: t(`Vibe latihan lagi enak nih${n}`, `Workout vibe feels dialed${n}`),
            subline: t(
              'Mood bagus bikin beban terasa lebih ringan dan fokus tetap terjaga.',
              'A good vibe makes heavy sets feel smoother and keeps focus locked.'
            ),
          },
          {
            headline: t(`Ikuti temponya pelan-pelan${n}`, `Ride the rhythm steady${n}`),
            subline: t(
              'Kombinasi ritme napas dan musik bikin sesi sore cepat terasa selesai.',
              'Syncing your breath with your pace makes the whole session fly by.'
            ),
          },
        ];
      }

      return [
        {
          headline: t(`Lagi ngapain siang ini${n}?`, `How’s your afternoon going${n}?`),
          subline: allCompleted
            ? t(
                `Target ${dayLabel} sudah selesai 100%! Selamat menikmati sisa siangmu.`,
                `${dayLabel} target is 100% cleared! Enjoy the rest of your afternoon.`
              )
            : t(
                'Kalau sudah sempat istirahat makan siang, yuk cek daftar set di bawah!',
                'Once lunch settles, check out your afternoon sets whenever you’re ready!'
              ),
        },
        {
          headline: t(`Cek ritme siang${n}`, `Midday rhythm check${n}`),
          subline: t(
            'Aku lagi lihat-lihat progresmu hari ini — tetap santai tapi konsisten.',
            'Checking in on today’s rhythm — calm, steady, and consistent.'
          ),
        },
        {
          headline: t(`Siang produktif di ${dayLabel}${n}`, `Productive ${dayLabel} afternoon${n}`),
          subline: t(
            'Satu dua set sore atau siang tetap jauh lebih baik daripada diam saja.',
            'Even a couple clean afternoon sets beat skipping the day.'
          ),
        },
        {
          headline: t(`Penasaran sama gerakan berikutnya${n}?`, `Checking the next move${n}?`),
          subline: t(
            'Semua catatan beban terakhir tersimpan rapi biar kamu gampang naik progres.',
            'Your previous weights stay logged so progressive overload is effortless.'
          ),
        },
      ];
    }

    // ─── NIGHT POSES (sleep, yawn, nightChill, stargaze, zen) ───
    if (activeTimePose === 'sleep') {
      return [
        {
          headline: t(`Zzz... waktunya tidur malam${n}`, `Zzz... sleepy night mode${n}`),
          subline: allCompleted
            ? t(
                'Sesi hari ini sudah tamat! Malam adalah waktu terbaik ototmu pulih dan tumbuh.',
                'Today’s session is wrapped! Night sleep is when your muscles rebuild best.'
              )
            : t(
                'Malam makin larut... kalau selesai gerak, jangan begadang biar besok segar!',
                'Getting late tonight... wrap up well and get deep sleep for tomorrow!'
              ),
        },
        {
          headline: t(`Mode ngantuk malam · Zzz${n}`, `Cozy night snooze · Zzz${n}`),
          subline: t(
            'Hening malam hari cocok buat menurunkan detak jantung dan istirahat.',
            'Quiet night hours are perfect for winding down and resting deeply.'
          ),
        },
        {
          headline: t(`Istirahat nyenyak malam ini${n}`, `Rest well tonight${n}`),
          subline: t(
            'Tidur cukup bantu hormon pemulihan bekerja maksimal semalaman.',
            'Quality sleep lets your body recover at full strength overnight.'
          ),
        },
        {
          headline: t(`Otot tumbuh saat tidur${n}... Zzz`, `Muscles grow while you sleep${n}... Zzz`),
          subline: t(
            'Simpan tenagamu malam ini supaya besok bangun dengan badan lebih kuat.',
            'Bank deep rest tonight so you wake up stronger tomorrow.'
          ),
        },
      ];
    }

    if (activeTimePose === 'yawn') {
      return [
        {
          headline: t(`Hoamm... kebangun di malam hari${n}`, `Yawn... waking up a bit${n}`),
          subline: allCompleted
            ? t(
                'Baru melek bentar buat ngecek — semua setmu sudah aman selesai semua!',
                'Just peeking awake — all your sets for today are safely checked off!'
              )
            : t(
                'Mata agak berat nih, tapi kalau kamu masih mau latihan malam, aku tetap nemenin!',
                'Feeling a little sleepy, but if you’re training tonight I’m right with you!'
              ),
        },
        {
          headline: t(`Ngantuk dikit, tapi tetap sigap${n}`, `Half-awake night watch${n}`),
          subline: t(
            'Kalau latihan malam, utamakan gerakan terkontrol dan pendinginan setelahnya.',
            'If lifting late, keep reps controlled and take time to cool down after.'
          ),
        },
        {
          headline: t(`Kebangun bentar ngecek kamu${n}`, `Waking up to check on you${n}`),
          subline: t(
            'Jangan lupa matikan layar lebih awal kalau sudah selesai malam ini.',
            'Remember to wind down away from bright screens once you’re done tonight.'
          ),
        },
        {
          headline: t(`Masih melek di jam segini${n}?`, `Still up this late${n}?`),
          subline: t(
            'Bereskan yang penting saja lalu istirahat — pemulihan juga bagian dari latihan.',
            'Wrap up what matters and get some sleep — recovery is part of training.'
          ),
        },
      ];
    }

    if (activeTimePose === 'stargaze') {
      return [
        {
          headline: t(`Menatap langit malam yang tenang${n}`, `Stargazing through the night${n}`),
          subline: allCompleted
            ? t(
                'Hari ini sudah kamu lewati dengan hebat. Nikmati tenangnya malam!',
                'You handled today brilliantly. Soak in the quiet night sky!'
              )
            : t(
                'Malam yang hening pas banget buat evaluasi pelan dan siapkan rencana besok.',
                'Quiet night hours are perfect for reflecting and prepping tomorrow’s plan.'
              ),
        },
        {
          headline: t(`Malam berbintang di ${dayLabel}${n}`, `Starry ${dayLabel} evening${n}`),
          subline: t(
            'Setiap sesi kecil yang kamu selesaikan perlahan membentuk versi terkuatmu.',
            'Every quiet session you complete steadily builds your strongest self.'
          ),
        },
        {
          headline: t(`Suasana malam begitu damai${n}`, `Peaceful late-night glow${n}`),
          subline: t(
            'Lepaskan lelah seharian — besok kita mulai babak baru lagi.',
            'Let go of the day’s tension — tomorrow brings a fresh chapter.'
          ),
        },
        {
          headline: t(`Refleksi singkat sebelum tidur${n}`, `Quiet night reflection${n}`),
          subline: t(
            'Cek jadwal alarm besok biar bangun pagi sudah siap tanpa panik.',
            'Double-check tomorrow’s alarm so your morning starts smooth and stress-free.'
          ),
        },
      ];
    }

    if (activeTimePose === 'zen') {
      return [
        {
          headline: t(`Mode relaksasi & pemulihan${n}`, `Calm recovery & zen mode${n}`),
          subline: t(
            'Tarik napas 4 detik, tahan sebentar, embuskan 6 detik — otot langsung rileks.',
            'Inhale 4 seconds, pause, exhale 6 — feel your shoulders drop right away.'
          ),
        },
        {
          headline: t(`Tenangkan ritme malam ini${n}`, `Unwinding for the night${n}`),
          subline: allCompleted
            ? t(
                'Tubuh sudah bekerja keras hari ini, sekarang beri ruang buat pulih total.',
                'Your body worked hard today — give it calm space to recover fully.'
              )
            : t(
                'Peregangan ringan lima menit malam ini bikin tidur jauh lebih nyenyak.',
                'Five minutes of gentle stretching tonight makes sleep noticeably deeper.'
              ),
        },
        {
          headline: t(`Napas tenang, pikiran jernih${n}`, `Steady breath, clear mind${n}`),
          subline: t(
            'Keseimbangan antara kerja keras dan istirahat tenang adalah kunci jangka panjang.',
            'Balancing hard effort with calm recovery is the secret to long-term gains.'
          ),
        },
        {
          headline: t(`Waktunya isi ulang penuh${n}`, `Full-battery night recharge${n}`),
          subline: t(
            'Aku tetap tenang di sini menemani penutup harimu.',
            'Resting quietly right here as you wrap up your evening.'
          ),
        },
      ];
    }

    return [
      {
        headline: t(`Malam tenang di ${dayLabel}${n}`, `Peaceful ${dayLabel} night${n}`),
        subline:
          mood === 'restday'
            ? t(
                'Malam hari istirahat yang damai — isi ulang energi penuh untuk esok hari.',
                'Calm rest-day evening — recharge your batteries completely for tomorrow.'
              )
            : allCompleted
              ? t(
                  `Semua ${totalSets} set hari ini sudah tuntas! Malam yang tenang buatmu.`,
                  `All ${totalSets} sets done today! Enjoy a well-earned peaceful night.`
                )
              : t(
                  'Suasana malam lagi kalem — cocok buat latihan santai tanpa terburu-buru.',
                  'Calm night atmosphere — great for an unhurried evening session.'
                ),
      },
      {
        headline: t(`Selamat Malam${n}! Suasana adem`, `Good Evening${n}! Calm night`),
        subline: t(
          'Langit sudah gelap, tetap jaga napas rileks di penghujung hari.',
          'Night has settled in — keep your breathing relaxed at the end of the day.'
        ),
      },
      {
        headline: t(`Penutup hari yang nyaman${n}`, `Cozy end to the day${n}`),
        subline: t(
          'Minum air hangat atau peregangan ringan sebelum tidur terasa sangat pas.',
          'Warm water or gentle stretching feels great right before sleep.'
        ),
      },
      {
        headline: t(`Malam santai penuh syukur${n}`, `Easy evening unwind${n}`),
        subline: t(
          'Apapun progres hari ini, kamu sudah melangkah maju. Istirahat yang baik ya!',
          'Whatever you achieved today, you moved forward. Have a restful night!'
        ),
      },
    ];
  }, [
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
  ]);

  const activeLine = speechPool[quoteIdx % speechPool.length] || speechPool[0];
  const speechKey = `${visualPose}-${timePhase}-${quoteIdx}-${lang}`;

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
