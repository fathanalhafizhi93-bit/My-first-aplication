import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

type TimePhasePose =
  | 'tea'
  | 'stretch'
  | 'perk'
  | 'hydrate'
  | 'shades'
  | 'curious'
  | 'sleep'
  | 'yawn'
  | 'nightChill';

interface TodayMascotProps {
  mood: MascotMood;
  timePhase: DayTimePhase;
  hour?: number;
  restRemainingFormatted?: string;
  activeTimerExerciseName?: string;
  progressPct?: number;
  completedSets?: number;
  totalSets?: number;
  dayLabel: string;
  userName?: string;
  dayJustChanged?: boolean;
  isOpeningGreeting?: boolean;
}

interface SpeechLine {
  headline: string;
  subline: string;
}

const GLANCE_TARGETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0, y: 0 },
  { x: -2.3, y: -0.5 },
  { x: 2.3, y: -0.5 },
  { x: 1.5, y: 1.1 },
  { x: -1.5, y: 0.9 },
  { x: 0, y: -1.2 },
];

const PHASE_POSE_POOL: Record<DayTimePhase, readonly TimePhasePose[]> = {
  morning: ['tea', 'stretch', 'perk'],
  afternoon: ['hydrate', 'shades', 'curious'],
  night: ['sleep', 'yawn', 'nightChill'],
};

function getInitialPhasePoseIndex(timePhase: DayTimePhase, hour: number): number {
  if (timePhase === 'morning') {
    return hour < 8 ? 0 : 1; // early morning defaults to tea, mid-morning to stretch
  }
  if (timePhase === 'afternoon') {
    return hour >= 14 ? 0 : 1; // midday shades, afternoon hydrate
  }
  // Night: defaults to sleeping quietly
  return 0;
}

function pickNonRepeatingIndex(length: number, prevIndex: number): number {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === prevIndex) {
    next = (prevIndex + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return next;
}

export function TodayMascot({
  mood,
  timePhase,
  hour = new Date().getHours(),
  restRemainingFormatted,
  activeTimerExerciseName,
  progressPct = 0,
  completedSets = 0,
  totalSets = 0,
  dayLabel,
  userName,
  dayJustChanged = false,
}: TodayMascotProps) {
  const { lang, accentColor, t } = useI18n();
  const cleanName = (userName || '').trim();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

  const [phasePoseIdx, setPhasePoseIdx] = useState<number>(() =>
    getInitialPhasePoseIndex(timePhase, hour)
  );
  const [quoteIdx, setQuoteIdx] = useState<number>(() => Math.floor(Math.random() * 3));
  const [tapBounce, setTapBounce] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glance, setGlance] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isCelebrationOrTimer =
    mood === 'clap' ||
    mood === 'milestone' ||
    mood === 'celebrate' ||
    mood === 'timerActive' ||
    mood === 'rest';

  // Reset to a natural pose for the new timePhase whenever timePhase changes
  useEffect(() => {
    setPhasePoseIdx(getInitialPhasePoseIndex(timePhase, hour));
    setQuoteIdx(0);
  }, [timePhase]); // intentionally keyed on timePhase switches

  // Re-roll fresh phrasing when urgent mood or day changes
  useEffect(() => {
    setQuoteIdx((prev) => pickNonRepeatingIndex(3, prev));
  }, [mood, dayLabel]);

  // Autonomous periodic time-of-day behavior:
  // - Morning & Afternoon: lively cycle every 9.5s
  // - Night: sleeps quietly most of the time, only rarely stirs awake (~42s) then falls back asleep
  useEffect(() => {
    if (isCelebrationOrTimer) return;

    if (timePhase === 'night') {
      let backToSleepTimeout: number | undefined;
      const rareStirInterval = window.setInterval(() => {
        const briefPose = Math.random() < 0.7 ? 1 : 2; // mostly brief yawn, rarely quiet night stargaze
        setPhasePoseIdx(briefPose);
        setQuoteIdx((prev) => pickNonRepeatingIndex(3, prev));
        backToSleepTimeout = window.setTimeout(() => {
          setPhasePoseIdx(0);
          setQuoteIdx(0);
        }, 5000);
      }, 42000);

      return () => {
        window.clearInterval(rareStirInterval);
        if (backToSleepTimeout !== undefined) window.clearTimeout(backToSleepTimeout);
      };
    }

    const pool = PHASE_POSE_POOL[timePhase];
    const interval = window.setInterval(() => {
      setPhasePoseIdx((prev) => (prev + 1) % pool.length);
      setQuoteIdx((prev) => pickNonRepeatingIndex(3, prev));
    }, 9500);
    return () => window.clearInterval(interval);
  }, [isCelebrationOrTimer, timePhase]);

  // If woken up at night (e.g. by tapping), drift smoothly back to sleep after ~6.5s
  useEffect(() => {
    if (isCelebrationOrTimer || timePhase !== 'night' || phasePoseIdx === 0) return;
    const sleepTimer = window.setTimeout(() => {
      setPhasePoseIdx(0);
      setQuoteIdx(0);
    }, 6500);
    return () => window.clearTimeout(sleepTimer);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  // Natural periodic eye blinking (paused while sleeping at night)
  useEffect(() => {
    if (!isCelebrationOrTimer && timePhase === 'night' && phasePoseIdx === 0) {
      setIsBlinking(false);
      return;
    }
    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 135);
    }, 3400);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== undefined) window.clearTimeout(blinkTimeout);
    };
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  // Organic autonomous eye glancing around (still while sleeping at night)
  useEffect(() => {
    if (isCelebrationOrTimer || (timePhase === 'night' && phasePoseIdx === 0)) {
      setGlance({ x: 0, y: 0 });
      return;
    }
    const interval = window.setInterval(() => {
      const next = GLANCE_TARGETS[Math.floor(Math.random() * GLANCE_TARGETS.length)];
      setGlance(next);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [isCelebrationOrTimer, timePhase, phasePoseIdx]);

  useEffect(() => {
    if (!tapBounce) return;
    const timer = window.setTimeout(() => setTapBounce(false), 750);
    return () => window.clearTimeout(timer);
  }, [tapBounce]);

  const handleTapOrb = useCallback(() => {
    setTapBounce(true);
    const pool = PHASE_POSE_POOL[timePhase];
    if (!isCelebrationOrTimer) {
      setPhasePoseIdx((prev) => (prev + 1) % pool.length);
    }
    setQuoteIdx((prev) => pickNonRepeatingIndex(3, prev));
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

  const speechPool = useMemo<SpeechLine[]>(() => {
    // 1. Brief celebration ONLY right when finishing a set / completing all sets
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
      ];
    }

    // 2. Time-of-Day Ambient Reactions (default before, between, after completion, and on rest days)
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
      ];
    }

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
      ];
    }

    // Night phase reactions (sleep, yawn/wake up, nightChill)
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
    ];
  }, [
    mood,
    timePhase,
    activeTimePose,
    n,
    cleanName,
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

  const isCelebration =
    visualPose === 'clap' || visualPose === 'celebrate' || visualPose === 'milestone';
  const isSleepPose = visualPose === 'sleep';
  const isYawnPose = visualPose === 'yawn';
  const isTeaPose = visualPose === 'tea';
  const isShadesPose = visualPose === 'shades';
  const isHydratePose = visualPose === 'hydrate';
  const isStretchPose = visualPose === 'stretch';
  const isNightChillPose = visualPose === 'nightChill';
  const isCalmEyes = visualPose === 'rest';
  const isFocusedEyes = visualPose === 'timerActive';
  const isCuriousPose = visualPose === 'curious';

  // Fluid GPU-composited orb body animation
  const orbAnimation = tapBounce
    ? { scale: [1, 1.13, 0.95, 1.04, 1], y: [0, -4, 0] }
    : isCelebration
      ? { scale: [1, 1.13, 0.95, 1.09, 1], y: [0, -3.5, 0] }
      : isSleepPose
        ? { scale: [1, 1.03, 1], y: [0, 1.2, 0] }
        : isYawnPose
          ? { scale: [1, 1.045, 0.99, 1], rotate: [0, -3, 2, 0] }
          : isTeaPose
            ? { y: [0, -1.5, 0], rotate: [0, 2.5, 0, -2, 0] }
            : isStretchPose
              ? { y: [0, -3.5, 0], scale: [1, 1.04, 1] }
              : isCuriousPose
                ? { rotate: [0, -7, 4, 0], y: [0, -1.5, 0] }
                : visualPose === 'timerActive'
                  ? { scale: [1, 1.045, 1] }
                  : { scale: [1, 1.025, 1] };

  const orbTransition =
    tapBounce || isCelebration
      ? { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const }
      : {
          duration: isSleepPose ? 3.8 : isTeaPose ? 3.2 : 2.6,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        };

  const speechKey = `${visualPose}-${timePhase}-${quoteIdx}-${lang}`;

  return (
    <div
      className={`glass-surface-subtle flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition-colors duration-300 ${phaseToken.subtleBorder}`}
    >
      {/* Original Circular Orb Mascot with Set-Celebration + Time-of-Day Living Activities */}
      <motion.button
        type="button"
        onClick={handleTapOrb}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        aria-label={
          lang === 'en'
            ? 'IronPulse circular companion orb. Tap to switch reaction.'
            : 'Orb pendamping bulat IronPulse. Ketuk untuk ganti reaksi.'
        }
        className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
      >
        {/* Outer Breathing Pulse Ring */}
        <motion.span
          aria-hidden="true"
          animate={
            isCelebration || tapBounce
              ? { scale: [0.95, 1.32], opacity: [0.72, 0] }
              : isSleepPose
                ? { scale: [0.98, 1.1, 0.98], opacity: [0.22, 0.06, 0.22] }
                : { scale: [0.98, 1.18, 0.98], opacity: [0.38, 0.1, 0.38] }
          }
          transition={{
            duration: isCelebration ? 0.85 : isSleepPose ? 3.6 : 2.7,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="pointer-events-none absolute inset-0 rounded-full border-2"
          style={{ borderColor: phaseColor }}
        />

        {/* Core Circular Orb Body */}
        <motion.div
          animate={orbAnimation}
          transition={orbTransition}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-[#121620]/90 shadow-[inset_0_2px_6px_rgba(255,255,255,0.1)]"
          style={{ borderColor: phaseColor }}
        >
          {/* Minimalist Living Expressions & Time-of-Day Props Inside Original Circular Orb */}
          <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" aria-hidden="true">
            {/* Subtle Eyebrows */}
            {isFocusedEyes ? (
              <>
                <path d="M17.5 21.5L25.5 23.8" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M46.5 21.5L38.5 23.8" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : isCuriousPose ? (
              <>
                <path d="M18 22.5C20 20.5 23 20.5 25 22.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
                <path d="M39 20C41 17.8 44 17.8 46 20" stroke="#D1D5DB" strokeWidth="2.1" strokeLinecap="round" />
              </>
            ) : isYawnPose ? (
              <>
                <path d="M18 22C20 20.5 23.5 21 25 22.5" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
                <path d="M39 22.5C40.5 21 44 20.5 46 22" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
              </>
            ) : null}

            {/* Animated Glancing Eye Group */}
            <motion.g
              animate={isSleepPose ? { x: 0, y: 0 } : { x: glance.x, y: glance.y }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {isCelebration ? (
                <>
                  {/* Joyful Celebration "^ ^" Arcs */}
                  <path d="M18 28C19.8 24.4 24.2 24.4 26 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M38 28C39.8 24.4 44.2 24.4 46 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isShadesPose ? (
                <>
                  {/* Afternoon Cool Sunglasses */}
                  <rect x="14.5" y="23" width="14.5" height="9.2" rx="3" fill="#0B0E14" stroke={phaseColor} strokeWidth="2" />
                  <rect x="35" y="23" width="14.5" height="9.2" rx="3" fill="#0B0E14" stroke={phaseColor} strokeWidth="2" />
                  <path d="M29 26.5H35" stroke={phaseColor} strokeWidth="2" strokeLinecap="round" />
                  <path d="M17.5 25.5L21 29.2" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M38 25.5L41.5 29.2" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : isSleepPose ? (
                <>
                  {/* Peaceful Closed Sleeping Eyes */}
                  <path d="M17.5 28.2C19.8 31.2 24.2 31.2 26.5 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M37.5 28.2C39.8 31.2 44.2 31.2 46.5 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : isYawnPose ? (
                <>
                  {/* Drowsy Half-Awake Eyes */}
                  <path d="M17.5 27.8H26.5" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="22" cy="29.4" r="1.8" fill="#F4F5F7" />
                  <path d="M38 28.4C40 30.8 44 30.8 46 28.4" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : isTeaPose ? (
                <>
                  {/* Cozy Happy Morning Tea Sipping Eyes */}
                  <path d="M18 28.2C19.8 25.2 24.2 25.2 26 28.2" stroke="#F4F5F7" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M38 28.2C39.8 25.2 44.2 25.2 46 28.2" stroke="#F4F5F7" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : isCalmEyes || isBlinking ? (
                <>
                  <path d="M18 28.2C20 30.8 24 30.8 26 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M38 28.2C40 30.8 44 30.8 46 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* Bright Living Eyes with Specular Glint */}
                  <circle cx="22" cy="27.5" r={visualPose === 'perk' || isStretchPose ? 3.2 : 2.9} fill="#F4F5F7" />
                  <circle cx="42" cy="27.5" r={visualPose === 'perk' || isStretchPose ? 3.2 : 2.9} fill="#F4F5F7" />
                  <circle cx="21" cy="26.3" r="0.95" fill={phaseColor} />
                  <circle cx="41" cy="26.3" r="0.95" fill={phaseColor} />
                </>
              )}
            </motion.g>

            {/* Subtle Cheek Warmth */}
            {(isCelebration || isTeaPose || isStretchPose || visualPose === 'perk') && (
              <>
                <circle cx="16.2" cy="34" r="2.5" fill={phaseColor} fillOpacity="0.22" />
                <circle cx="47.8" cy="34" r="2.5" fill={phaseColor} fillOpacity="0.22" />
              </>
            )}

            {/* Dynamic Mouth Expressions */}
            {isCelebration ? (
              <path
                d="M22.5 36.5C25.5 42.5 38.5 42.5 41.5 36.5Z"
                fill={phaseColor}
                fillOpacity="0.22"
                stroke={phaseColor}
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : isYawnPose ? (
              <motion.ellipse
                cx="32"
                cy="39.2"
                rx="3.1"
                ry="4"
                fill={phaseColor}
                fillOpacity="0.18"
                stroke={phaseColor}
                strokeWidth="2.3"
                animate={{ scaleY: [0.85, 1.15, 0.9] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : isSleepPose ? (
              <motion.circle
                cx="32"
                cy="38.5"
                r="2.1"
                fill={phaseColor}
                fillOpacity="0.2"
                stroke={phaseColor}
                strokeWidth="2.1"
                animate={{ scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : isCuriousPose ? (
              <circle cx="32" cy="38.5" r="2.4" stroke={phaseColor} strokeWidth="2.4" />
            ) : isFocusedEyes ? (
              <path d="M25.5 38.5H38.5" stroke={phaseColor} strokeWidth="2.6" strokeLinecap="round" />
            ) : isTeaPose ? (
              <path d="M25 36.5C27.5 39.2 33 39.2 35.5 36.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
            ) : isShadesPose ? (
              <path d="M24.5 37.5C28.5 40.8 36 40.2 40 36" stroke={phaseColor} strokeWidth="2.7" strokeLinecap="round" />
            ) : isNightChillPose || isCalmEyes ? (
              <path d="M26.5 37.5C29 39.8 35 39.8 37.5 37.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M23.5 36.5C27 40.8 37 40.8 40.5 36.5" stroke={phaseColor} strokeWidth="2.8" strokeLinecap="round" />
            )}

            {/* === TIME-OF-DAY & CELEBRATION CONTEXTUAL PROPS === */}

            {/* 1. Celebration Rim Sparks (Set/Workout Completed Only) */}
            {isCelebration && (
              <motion.path
                d="M11 18L15.5 20.5M53 18L48.5 20.5M32 9V14"
                stroke={phaseColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.65, repeat: Infinity }}
              />
            )}

            {/* 2. Morning: Warm Steaming Tea Mug */}
            {isTeaPose && (
              <g>
                {/* Rising Steam Wisps */}
                <motion.path
                  d="M44.5 35.5C43.5 33.8 45.8 32.5 44.8 30.8"
                  stroke={phaseColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  animate={{ y: [1.5, -2.5], opacity: [0.25, 0.95, 0.15] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M49 35.8C48.2 34 50.2 32.6 49.2 31"
                  stroke={phaseColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ y: [1.5, -2.5], opacity: [0.2, 0.85, 0.1] }}
                  transition={{ duration: 1.8, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Cup & Handle */}
                <rect x="41" y="38.5" width="11" height="9" rx="2.5" fill="#1F2937" stroke={phaseColor} strokeWidth="2" />
                <path d="M52 40.5C54.6 40.5 54.6 45.5 52 45.5" stroke={phaseColor} strokeWidth="1.8" strokeLinecap="round" />
              </g>
            )}

            {/* 3. Morning: Sunrise Rays (Stretch / Fresh Wake) */}
            {isStretchPose && (
              <motion.g
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.05, 0.96] }}
                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '32px', originY: '16px' }}
              >
                <path d="M32 7.5V12.5" stroke={phaseColor} strokeWidth="2.3" strokeLinecap="round" />
                <path d="M21 10.5L24 14.5" stroke={phaseColor} strokeWidth="2.1" strokeLinecap="round" />
                <path d="M43 10.5L40 14.5" stroke={phaseColor} strokeWidth="2.1" strokeLinecap="round" />
              </motion.g>
            )}

            {/* 4. Afternoon: Refreshing Water Drop (Hydrate) */}
            {isHydratePose && (
              <motion.path
                d="M49.5 13C49.5 13 54 18 54 20.6C54 23.1 52 25 49.5 25C47 25 45 23.1 45 20.6C45 18 49.5 13 49.5 13Z"
                fill="#38BDF8"
                fillOpacity="0.88"
                stroke="#BAE6FD"
                strokeWidth="1.4"
                animate={{ y: [0, 2.2, 0], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* 5. Night: Floating Zzz (Sleep) */}
            {isSleepPose && (
              <g>
                <motion.path
                  d="M44 17H50L44 23H50"
                  stroke={phaseColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ y: [2, -3.5], opacity: [0.3, 1, 0.15] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M51 11H55L51 15H55"
                  stroke={phaseColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ y: [2, -3.5], opacity: [0.2, 0.9, 0.1] }}
                  transition={{ duration: 2.4, delay: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                />
              </g>
            )}

            {/* 6. Night: Crescent Moon & Twinkle Star (Yawn / NightChill) */}
            {(isYawnPose || isNightChillPose) && (
              <g>
                <path
                  d="M48.5 11.5C45.8 12.1 44 14.5 44.3 17.3C44.6 20 47.1 22 49.9 21.8C51.2 21.7 52.4 21.1 53.2 20.2C51.1 20.4 49 18.8 48.7 16.4C48.4 14.6 49.2 12.9 50.5 11.9C49.9 11.5 49.2 11.4 48.5 11.5Z"
                  fill={phaseColor}
                />
                <motion.path
                  d="M15.5 13V17M13.5 15H17.5"
                  stroke={phaseColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ originX: '15.5px', originY: '15px' }}
                />
              </g>
            )}

            {/* 7. Exercise Timer Active Sweat Drop */}
            {isFocusedEyes && (
              <motion.path
                d="M50 18C50 18 53 21.5 53 23.3C53 24.8 51.7 26 50 26C48.3 26 47 24.8 47 23.3C47 21.5 50 18 50 18Z"
                fill="#38BDF8"
                animate={{ y: [0, 3.5, 0], opacity: [0.95, 0.45, 0.95] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </svg>
        </motion.div>
      </motion.button>

      {/* Speech Text with Snappy Swap */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={speechKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="truncate text-xs sm:text-sm font-bold" style={{ color: phaseColor }}>
              {activeLine.headline}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#D1D5DB]">
              {activeLine.subline}
            </p>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={handleTapOrb}
          className="mt-1.5 inline-flex items-center text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#D1D5DB]"
        >
          {t('Ketuk orb untuk reaksi lain', 'Tap orb for another reaction')}
        </button>
      </div>
    </div>
  );
}
