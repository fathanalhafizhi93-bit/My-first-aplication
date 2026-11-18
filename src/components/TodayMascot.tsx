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

type AutonomousMicroPose = 'wink' | 'curious' | 'perk';

interface TodayMascotProps {
  mood: MascotMood;
  timePhase: DayTimePhase;
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
  { x: -2.4, y: -0.6 },
  { x: 2.4, y: -0.6 },
  { x: 1.6, y: 1.2 },
  { x: -1.6, y: 1.0 },
  { x: 0, y: -1.4 },
];

const MICRO_POSES: readonly AutonomousMicroPose[] = ['wink', 'curious', 'perk'];

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
  restRemainingFormatted,
  activeTimerExerciseName,
  progressPct = 0,
  completedSets = 0,
  totalSets = 0,
  dayLabel,
  userName,
  dayJustChanged = false,
  isOpeningGreeting = false,
}: TodayMascotProps) {
  const { lang, t } = useI18n();
  const cleanName = (userName || '').trim();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

  const [quoteIdx, setQuoteIdx] = useState<number>(() => Math.floor(Math.random() * 4));
  const [tapActive, setTapActive] = useState(false);
  const [tapPoseIdx, setTapPoseIdx] = useState(0);
  const [autoPose, setAutoPose] = useState<AutonomousMicroPose | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glance, setGlance] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Natural periodic eye blinking (living creature rhythm)
  useEffect(() => {
    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 135);
    }, 3400);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== undefined) window.clearTimeout(blinkTimeout);
    };
  }, []);

  // Organic autonomous eye glancing around so the orb feels alive even without interaction
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (mood === 'clap' || mood === 'celebrate' || mood === 'rest' || mood === 'restday') {
        setGlance({ x: 0, y: 0 });
        return;
      }
      const next = GLANCE_TARGETS[Math.floor(Math.random() * GLANCE_TARGETS.length)];
      setGlance(next);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [mood]);

  // Autonomous spontaneous micro-reaction & greeting refresh when idle/non-urgent
  useEffect(() => {
    const isUrgentMood =
      mood === 'clap' || mood === 'celebrate' || mood === 'timerActive' || mood === 'rest';
    if (isUrgentMood) {
      setAutoPose(null);
      return;
    }

    let clearPoseTimeout: number | undefined;
    const interval = window.setInterval(() => {
      const nextPose = MICRO_POSES[Math.floor(Math.random() * MICRO_POSES.length)];
      setAutoPose(nextPose);
      setQuoteIdx((prev) => pickNonRepeatingIndex(4, prev));
      clearPoseTimeout = window.setTimeout(() => setAutoPose(null), 2600);
    }, 13500);

    return () => {
      window.clearInterval(interval);
      if (clearPoseTimeout !== undefined) window.clearTimeout(clearPoseTimeout);
    };
  }, [mood]);

  // Re-roll a fresh non-repeating phrase whenever mood, day, or time phase switches
  useEffect(() => {
    setQuoteIdx((prev) => pickNonRepeatingIndex(4, prev));
    setAutoPose(null);
  }, [mood, dayLabel, timePhase]);

  // Auto-clear temporary tap pose after 2.4s
  useEffect(() => {
    if (!tapActive) return;
    const timer = window.setTimeout(() => setTapActive(false), 2400);
    return () => window.clearTimeout(timer);
  }, [tapActive, tapPoseIdx]);

  const handleTapOrb = useCallback(() => {
    setAutoPose(null);
    setTapActive(true);
    setTapPoseIdx((prev) => (prev + 1) % 3);
    setQuoteIdx((prev) => pickNonRepeatingIndex(4, prev));
  }, []);

  const phaseColor =
    mood === 'celebrate' || mood === 'clap' || mood === 'milestone'
      ? '#C8FF2E'
      : mood === 'timerActive' || mood === 'rest'
        ? '#38BDF8'
        : phaseToken.accentBright;

  const greetingByPhase =
    timePhase === 'morning'
      ? t('Selamat Pagi', 'Good Morning')
      : timePhase === 'afternoon'
        ? t('Selamat Siang', 'Good Afternoon')
        : t('Selamat Malam', 'Good Evening');

  const n = cleanName ? `, ${cleanName}` : '';
  const nLead = cleanName ? `${cleanName}! ` : '';

  const speechPool = useMemo<SpeechLine[]>(() => {
    if (tapActive || autoPose !== null) {
      if (autoPose === 'curious') {
        return [
          {
            headline: cleanName
              ? t(`Lagi siapin set berikutnya, ${cleanName}?`, `Prepping the next set, ${cleanName}?`)
              : t('Lagi siapin set berikutnya?', 'Prepping the next set?'),
            subline: t(
              'Aku di sini ngawasin progresmu. Ambil napas sejenak lalu gas lagi saat siap!',
              'I’m keeping watch on your progress. Catch a breath and go when ready!'
            ),
          },
          {
            headline: cleanName
              ? t(`Cek teknik sebentar, ${cleanName}`, `Quick form check, ${cleanName}`)
              : t('Cek teknik sebentar', 'Quick form check'),
            subline: t(
              'Bahu rileks, inti tubuh aktif, dan jangan lupa minum air di sela gerakan.',
              'Relax your shoulders, brace your core, and take a sip of water.'
            ),
          },
          {
            headline: t(`Hari ${dayLabel} tetap solid${n}!`, `${dayLabel} is looking solid${n}!`),
            subline: t(
              'Ritme konsisten kayak gini yang bikin kekuatan naik tiap minggu.',
              'Consistent pacing like this is what builds strength week after week.'
            ),
          },
          {
            headline: cleanName
              ? t(`Hei ${cleanName}, tetap semangat!`, `Hey ${cleanName}, keep going!`)
              : t('Tetap semangat latihan!', 'Keep the energy flowing!'),
            subline: t(
              'Setiap set yang kamu catat hari ini adalah investasi buat dirimu sendiri.',
              'Every set you log today is an investment in yourself.'
            ),
          },
        ];
      }

      return [
        {
          headline: cleanName
            ? t(`Semangat terus, ${cleanName}!`, `Keep pushing, ${cleanName}!`)
            : t('Semangat terus!', 'Keep pushing!'),
          subline: t(
            'Konsistensi kecil di tiap set hari ini jadi hasil besar di minggu-minggu depan.',
            'Small consistency on every set today becomes big progress in the weeks ahead.'
          ),
        },
        {
          headline: cleanName
            ? t(`Energi penuh hari ini, ${cleanName}!`, `Full energy today, ${cleanName}!`)
            : t('Energi penuh hari ini!', 'Full energy today!'),
          subline: t(
            'Atur napas, jaga gerakan tetap terkontrol, dan nikmati setiap progresnya.',
            'Control your breathing, keep every rep clean, and enjoy the momentum.'
          ),
        },
        {
          headline: cleanName
            ? t(`Aku temani sampai tuntas, ${cleanName}!`, `Right beside you to the finish, ${cleanName}!`)
            : t('Aku temani sampai sesi tuntas!', 'Right beside you to the finish!'),
          subline: t(
            `Hari ${dayLabel} ini milikmu. Fokus ke target berikutnya!`,
            `${dayLabel} belongs to you. Lock in on the next target!`
          ),
        },
        {
          headline: cleanName
            ? t(`Hidrasi jangan lupa, ${cleanName}!`, `Stay hydrated, ${cleanName}!`)
            : t('Jangan lupa minum air!', 'Remember to stay hydrated!'),
          subline: t(
            'Teguk air secukupnya di sela set agar tenaga dan fokus tetap tajam.',
            'Take a quick sip between sets so your energy and focus stay sharp.'
          ),
        },
      ];
    }

    switch (mood) {
      case 'clap':
        return [
          {
            headline: t(`Mantap${n}! Tepuk tangan!`, `Nice${n}! Clap it up!`),
            subline: t(
              'Satu set selesai dengan rapi! Tarik napas dulu sebelum set berikutnya.',
              'Clean set logged! Catch your breath before the next one.'
            ),
          },
          {
            headline: t(`Keren${n}! Satu set terkunci!`, `Awesome${n}! Set banked!`),
            subline: t(
              `${completedSets}/${totalSets || 1} set beres. Pertahankan ritme sebagus ini!`,
              `${completedSets}/${totalSets || 1} sets done. Keep that rhythm rolling!`
            ),
          },
          {
            headline: t(`Eksekusi solid${n}!`, `Solid execution${n}!`),
            subline: t(
              'Otot bekerja maksimal — manfaatkan waktu istirahatmu dengan baik.',
              'Great muscular work — make good use of your recovery window.'
            ),
          },
          {
            headline: t(`Progres tercatat${n}!`, `Progress logged${n}!`),
            subline: t(
              'Satu langkah lebih dekat menuntaskan seluruh target hari ini.',
              'One step closer to clearing today’s entire workout target.'
            ),
          },
        ];

      case 'milestone':
        return [
          {
            headline: t(
              `Separuh jalan terlewati${n}! (${progressPct}%)`,
              `Over halfway there${n}! (${progressPct}%)`
            ),
            subline: t(
              `${nLead}Momentum latihanmu lagi bagus banget. Selesaikan sisanya dengan fokus!`,
              `${nLead}Your momentum is peaking. Finish the second half strong!`
            ),
          },
          {
            headline: t(`Kekuatan mantap${n}! ${progressPct}%`, `Powering through${n}! ${progressPct}%`),
            subline: t(
              `Sudah ${completedSets} dari ${totalSets} set aman. Tinggal dorongan akhir!`,
              `${completedSets} of ${totalSets} sets locked. Strong finish ahead!`
            ),
          },
          {
            headline: t(`Jangan kendor${n}!`, `Stay sharp${n}!`),
            subline: t(
              'Kualitas repetisi di paruh akhir inilah yang paling membentuk hasil.',
              'Clean reps in the final half are where real gains happen.'
            ),
          },
          {
            headline: t(`Target makin dekat${n}!`, `Closing in on 100%${n}!`),
            subline: t(
              'Jaga napas tetap tenang meski tenaga mulai terkuras. Kamu pasti bisa!',
              'Keep your breathing steady as fatigue rises. You’ve got this!'
            ),
          },
        ];

      case 'celebrate':
        return [
          {
            headline: t(`Luar biasa${n}! Sesi Tuntas!`, `Awesome${n}! Session Complete!`),
            subline: t(
              'Semua target set selesai 100%! Jangan lupa pendinginan & hidrasi.',
              'All target sets 100% complete! Cool down and rehydrate well.'
            ),
          },
          {
            headline: t(`Sesi ${dayLabel} tamat${n}!`, `${dayLabel} conquered${n}!`),
            subline: t(
              'Kerja keras yang konsisten! Riwayat latihanmu otomatis tersimpan.',
              'Consistent hard work paid off! Your session history is saved automatically.'
            ),
          },
          {
            headline: t(`Juara hari ini${n}!`, `Champion effort${n}!`),
            subline: t(
              `Semua ${totalSets} set beres dikerjakan. Waktunya pemulihan berkualitas.`,
              `All ${totalSets} sets completed. Time for well-earned recovery.`
            ),
          },
          {
            headline: t(`Misi tuntas 100%${n}!`, `Mission 100% cleared${n}!`),
            subline: t(
              'Makan bernutrisi, istirahat cukup, dan siap lebih kuat di sesi berikutnya.',
              'Fuel up well, sleep deeply, and come back even stronger next session.'
            ),
          },
        ];

      case 'timerActive':
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
              'Tetap stabil — durasi akan otomatis tersimpan saat target waktu tercapai.',
              'Stay steady — duration saves automatically once the target finishes.'
            ),
          },
          {
            headline: t(`Mode durasi berjalan${n}`, `Timed hold in progress${n}`),
            subline: t(
              'Tarik napas pelan lewat hidung, kendalikan ketegangan tubuhmu.',
              'Breathe evenly through your nose and stay in full control.'
            ),
          },
          {
            headline: t(`Fokus penuh di waktu${n}!`, `Locked on the clock${n}!`),
            subline: t(
              'Sedikit lagi selesai — jangan lepaskan posisimu sebelum bunyi selesai.',
              'Hold steady right to the chime — you’re doing great.'
            ),
          },
        ];

      case 'rest':
        return [
          {
            headline: restRemainingFormatted
              ? t(`Timer Istirahat Aktif${n} (${restRemainingFormatted})`, `Rest Timer Active${n} (${restRemainingFormatted})`)
              : t(`Timer Istirahat Aktif${n}`, `Rest Timer Running${n}`),
            subline: t(
              'Biarkan otot pulih sejenak sambil menunggu timer istirahat selesai.',
              'Let your muscles recover briefly while the rest timer counts down.'
            ),
          },
          {
            headline: restRemainingFormatted
              ? t(`Isi ulang tenaga · ${restRemainingFormatted}`, `Recharging energy · ${restRemainingFormatted}`)
              : t('Isi ulang tenaga antar set', 'Recharging between sets'),
            subline: t(
              'Tarik napas perlahan dan siapkan fokus untuk set berikutnya.',
              'Take slow breaths and reset your focus for the next working set.'
            ),
          },
          {
            headline: restRemainingFormatted
              ? t(`Pemulihan otot${n} (${restRemainingFormatted})`, `Muscle recovery${n} (${restRemainingFormatted})`)
              : t(`Pemulihan otot${n}`, `Muscle recovery${n}`),
            subline: t(
              'Istirahat yang terukur bikin angkatan set berikutnya jauh lebih bertenaga.',
              'Disciplined rest periods make your next set noticeably stronger.'
            ),
          },
          {
            headline: restRemainingFormatted
              ? t(`Sebentar lagi lanjut · ${restRemainingFormatted}`, `Almost back in · ${restRemainingFormatted}`)
              : t('Siap lanjut sebentar lagi', 'Almost ready to lift again'),
            subline: t(
              'Lemaskan bahu dan minum seteguk air sebelum timer berbunyi.',
              'Shake out your shoulders and grab a sip of water before the chime.'
            ),
          },
        ];

      case 'restday':
        return [
          {
            headline: `${greetingByPhase}${n}! ${t('Hari Istirahat', 'Rest Day')}`,
            subline: t(
              'Waktunya pemulihan, tidur cukup, dan hidrasi yang baik.',
              'Focus on recovery, quality sleep, and staying hydrated.'
            ),
          },
          {
            headline: t(`Hari santai di ${dayLabel}${n}`, `Recovery mode on ${dayLabel}${n}`),
            subline: t(
              'Ototmu tumbuh justru saat beristirahat. Nikmati waktu recharge hari ini!',
              'Muscles rebuild while you rest. Enjoy a clean recharge day!'
            ),
          },
          {
            headline: t(`Pemulihan aktif${n}`, `Active recovery${n}`),
            subline: t(
              'Jalan santai atau peregangan ringan bagus untuk menjaga tubuh tetap segar.',
              'A light walk or gentle mobility session keeps you feeling fresh.'
            ),
          },
          {
            headline: t(`Simpan energi untuk besok${n}`, `Save fuel for next session${n}`),
            subline: t(
              'Jika ingin latihan hari ini, kamu bisa mengaktifkannya lewat tab Jadwal.',
              'Want to train today anyway? Toggle today active in the Schedule tab.'
            ),
          },
        ];

      case 'starting':
        return [
          {
            headline: `${greetingByPhase}${n}! ${t('Ritme Terjaga', 'In the Groove')}`,
            subline: t(
              `Sudah ${completedSets}/${totalSets} set selesai (${progressPct}%). Terus lanjutkan!`,
              `${completedSets}/${totalSets} sets done (${progressPct}%). Keep pushing!`
            ),
          },
          {
            headline: t(`Lanjut terus${n}!`, `Keep rolling${n}!`),
            subline: t(
              'Pemanasan selesai, sekarang waktunya eksekusi setiap set dengan presisi.',
              'Warm-up is done — execute every working set with crisp form.'
            ),
          },
          {
            headline: t(`Fokus terkunci${n} (${progressPct}%)`, `Locked in${n} (${progressPct}%)`),
            subline: t(
              'Catat beban, repetisi, atau durasi aktual agar riwayat progres makin akurat.',
              'Log actual weight, reps, or duration for accurate progress charts.'
            ),
          },
          {
            headline: t(`Alur latihan mantap${n}`, `Solid training flow${n}`),
            subline: t(
              'Jaga tempo gerakan tetap rapi dari awal sampai akhir set.',
              'Keep your movement tempo controlled from first rep to last.'
            ),
          },
        ];

      case 'welcome':
        if (dayJustChanged) {
          return [
            {
              headline: t(`Hari Baru${n}! Selamat ${dayLabel}!`, `New Day${n}! Happy ${dayLabel}!`),
              subline: t(
                `Jadwal ${dayLabel} sudah siap. Mulai hari dengan energi terbaikmu!`,
                `${dayLabel}’s plan is loaded. Start the day with your best energy!`
              ),
            },
            {
              headline: t(`Lembaran baru di ${dayLabel}${n}`, `Fresh slate on ${dayLabel}${n}`),
              subline: t(
                'Target baru menanti — siap buka set pertama hari ini?',
                'New targets await — ready to unlock today’s first set?'
              ),
            },
            {
              headline: t(`Selamat datang di ${dayLabel}${n}!`, `Welcome to ${dayLabel}${n}!`),
              subline: t(
                'Cek daftar gerakan di bawah dan mulai saat tubuhmu sudah siap.',
                'Check today’s movement list below and start when ready.'
              ),
            },
            {
              headline: t(`Saatnya aksi baru${n}!`, `Time for fresh action${n}!`),
              subline: t(
                'Konsistensi hari ini bakal terasa hasilnya di riwayat progres nanti.',
                'Today’s consistency pays off across your progress history.'
              ),
            },
          ];
        }
        return [
          {
            headline:
              isOpeningGreeting && cleanName
                ? t(`Halo ${cleanName}! ${greetingByPhase}!`, `Hi ${cleanName}! ${greetingByPhase}!`)
                : `${greetingByPhase}${n}! ${t('Ayo Mulai!', "Let's Go!")}`,
            subline: t(
              `${nLead}Selamat datang di jadwal ${dayLabel}. Siap angkat set pertama?`,
              `${nLead}Welcome to ${dayLabel}’s session. Ready for your first set?`
            ),
          },
          {
            headline: `${greetingByPhase}${n}! ${t('Siap Beraksi?', 'Ready to Train?')}`,
            subline: t(
              'Lakukan pemanasan singkat sebelum masuk ke beban kerja utama.',
              'Take a brief warm-up before hitting your main working sets.'
            ),
          },
          {
            headline: t(`Waktunya latihan ${dayLabel}${n}!`, `Time for ${dayLabel}’s work${n}!`),
            subline: t(
              'Set pertama selalu jadi pemicu semangat untuk seluruh sesi hari ini.',
              'The very first set always sparks momentum for the full session.'
            ),
          },
          {
            headline: t(`Halo${n}! Fokus & Bersenang-senang!`, `Hey${n}! Focus & Enjoy!`),
            subline: t(
              'Pilih gerakan pertamamu di bawah — aku siap mengawal progresmu.',
              'Start with your first exercise below — I’m tracking along with you.'
            ),
          },
        ];

      case 'ready':
      default:
        return [
          {
            headline: `${greetingByPhase}${n}! ${t('Tetap Fokus', 'Stay Locked In')}`,
            subline: t(
              'Isi beban, repetisi, atau durasi lalu centang setiap set yang selesai.',
              'Enter weight, reps, or duration, then check off each completed set.'
            ),
          },
          {
            headline: t(`Kendali penuh di sesi ini${n}`, `Full control today${n}`),
            subline: t(
              'Sesuaikan target set dan waktu istirahat dengan kondisi tubuhmu hari ini.',
              'Adjust sets and rest intervals to match how you feel today.'
            ),
          },
          {
            headline: t(`Aku siap menemanimu${n}!`, `Right here with you${n}!`),
            subline: t(
              'Ketuk orb bulat kapan saja untuk reaksi cepat, atau biarkan aku menyapa.',
              'Tap the orb anytime for a quick boost, or let me cheer you on.'
            ),
          },
          {
            headline: t(`Kualitas gerakan nomor satu${n}`, `Clean reps matter most${n}`),
            subline: t(
              'Setiap repetisi rapi dan detik yang stabil membawa hasil nyata.',
              'Every controlled rep and steady second adds up to real progress.'
            ),
          },
        ];
    }
  }, [
    tapActive,
    autoPose,
    mood,
    greetingByPhase,
    n,
    cleanName,
    nLead,
    dayLabel,
    completedSets,
    totalSets,
    progressPct,
    activeTimerExerciseName,
    restRemainingFormatted,
    dayJustChanged,
    isOpeningGreeting,
    t,
  ]);

  const activeLine = speechPool[quoteIdx % speechPool.length] || speechPool[0];

  // Resolve visual pose: manual tap > autonomous micro-pose > workout mood
  const visualPose = tapActive
    ? tapPoseIdx === 0
      ? 'wink'
      : tapPoseIdx === 1
        ? 'perk'
        : 'cheer'
    : autoPose ?? mood;

  const isHappyArcEyes =
    visualPose === 'clap' || visualPose === 'celebrate' || visualPose === 'cheer';
  const isWinkPose = visualPose === 'wink';
  const isCalmEyes = visualPose === 'rest' || visualPose === 'restday';
  const isFocusedEyes =
    visualPose === 'timerActive' || visualPose === 'milestone' || visualPose === 'starting';
  const isCuriousPose = visualPose === 'curious';

  // Fluid GPU-composited orb body animation
  const orbAnimation =
    visualPose === 'clap' || visualPose === 'celebrate' || visualPose === 'cheer'
      ? { scale: [1, 1.13, 0.95, 1.09, 1], y: [0, -3, 0] }
      : visualPose === 'wink' || visualPose === 'perk'
        ? { scale: [1, 1.1, 0.97, 1.03, 1], y: [0, -4, 0] }
        : visualPose === 'curious'
          ? { rotate: [0, -7, 4, 0], y: [0, -1.5, 0] }
          : visualPose === 'welcome'
            ? { y: [0, -3.5, 0], scale: [1, 1.02, 1] }
            : visualPose === 'timerActive'
              ? { scale: [1, 1.045, 1] }
              : visualPose === 'rest' || visualPose === 'restday'
                ? { scale: [1, 1.035, 1] }
                : { scale: [1, 1.025, 1] };

  const orbTransition =
    visualPose === 'clap' ||
    visualPose === 'celebrate' ||
    visualPose === 'cheer' ||
    visualPose === 'wink' ||
    visualPose === 'perk'
      ? { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const }
      : visualPose === 'curious'
        ? { duration: 1.4, ease: 'easeInOut' as const }
        : {
            duration: visualPose === 'rest' || visualPose === 'restday' ? 3.2 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          };

  const speechKey = `${visualPose}-${quoteIdx}-${lang}`;

  return (
    <div
      className={`glass-surface-subtle flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition-colors duration-300 ${phaseToken.subtleBorder}`}
    >
      {/* Original Circular Orb Mascot with Rich Living Expressions */}
      <motion.button
        type="button"
        onClick={handleTapOrb}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        aria-label={
          lang === 'en'
            ? 'IronPulse circular companion orb. Tap to trigger a reaction.'
            : 'Orb pendamping bulat IronPulse. Ketuk untuk memicu reaksi.'
        }
        className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF2E]"
      >
        {/* Outer Breathing Pulse Ring */}
        <motion.span
          aria-hidden="true"
          animate={
            visualPose === 'clap' ||
            visualPose === 'celebrate' ||
            visualPose === 'cheer' ||
            visualPose === 'perk'
              ? { scale: [0.95, 1.32], opacity: [0.7, 0] }
              : { scale: [0.98, 1.18, 0.98], opacity: [0.38, 0.1, 0.38] }
          }
          transition={{
            duration:
              visualPose === 'clap' || visualPose === 'celebrate' || visualPose === 'cheer'
                ? 0.85
                : 2.7,
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
          {/* Rich Minimalist SVG Face inside Original Circular Orb */}
          <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" aria-hidden="true">
            {/* Subtle Eyebrows */}
            {isFocusedEyes ? (
              <>
                <path
                  d="M17.5 21.5L25.5 23.8"
                  stroke="#D1D5DB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M46.5 21.5L38.5 23.8"
                  stroke="#D1D5DB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </>
            ) : isCuriousPose ? (
              <>
                <path
                  d="M18 22.5C20 20.5 23 20.5 25 22.5"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M39 20C41 17.8 44 17.8 46 20"
                  stroke="#D1D5DB"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
              </>
            ) : null}

            {/* Animated Glancing Eye Group */}
            <motion.g
              animate={{ x: glance.x, y: glance.y }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {isHappyArcEyes ? (
                <>
                  {/* Happy "^ ^" Eyes */}
                  <path
                    d="M18 28C19.8 24.4 24.2 24.4 26 28"
                    stroke="#F4F5F7"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M38 28C39.8 24.4 44.2 24.4 46 28"
                    stroke="#F4F5F7"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </>
              ) : isWinkPose ? (
                <>
                  {/* Playful Wink: Left bright eye + Right curved wink */}
                  <circle cx="22" cy="27.5" r="3" fill="#F4F5F7" />
                  <circle cx="21" cy="26.4" r="1" fill={phaseColor} />
                  <path
                    d="M38 28C40 25 44 25 46 28"
                    stroke="#F4F5F7"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </>
              ) : isCalmEyes || isBlinking ? (
                <>
                  {/* Calm / Blinking Curved Eyes */}
                  <path
                    d="M18 28.2C20 30.8 24 30.8 26 28.2"
                    stroke="#D1D5DB"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M38 28.2C40 30.8 44 30.8 46 28.2"
                    stroke="#D1D5DB"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  {/* Bright Living Eyes with Specular Glint */}
                  <circle cx="22" cy="27.5" r={visualPose === 'perk' ? 3.3 : 2.9} fill="#F4F5F7" />
                  <circle cx="42" cy="27.5" r={visualPose === 'perk' ? 3.3 : 2.9} fill="#F4F5F7" />
                  <circle cx="21" cy="26.3" r="0.95" fill={phaseColor} />
                  <circle cx="41" cy="26.3" r="0.95" fill={phaseColor} />
                </>
              )}
            </motion.g>

            {/* Subtle Cheek Warmth on Happy/Wink/Milestone States */}
            {(isHappyArcEyes || isWinkPose || visualPose === 'welcome' || visualPose === 'perk') && (
              <>
                <circle cx="16.5" cy="34" r="2.6" fill={phaseColor} fillOpacity="0.22" />
                <circle cx="47.5" cy="34" r="2.6" fill={phaseColor} fillOpacity="0.22" />
              </>
            )}

            {/* Dynamic Mouth Expressions */}
            {isHappyArcEyes || visualPose === 'milestone' ? (
              <path
                d="M22.5 36.5C25.5 42.5 38.5 42.5 41.5 36.5Z"
                fill={phaseColor}
                fillOpacity="0.2"
                stroke={phaseColor}
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : isCuriousPose ? (
              <circle cx="32" cy="38.5" r="2.5" stroke={phaseColor} strokeWidth="2.4" />
            ) : visualPose === 'timerActive' ? (
              <path
                d="M25.5 38.5H38.5"
                stroke={phaseColor}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            ) : isCalmEyes ? (
              <path
                d="M26.5 37.5C29 39.8 35 39.8 37.5 37.5"
                stroke={phaseColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : visualPose === 'welcome' || visualPose === 'wink' || visualPose === 'perk' ? (
              <path
                d="M23.5 36.5C27 40.8 37 40.8 40.5 36.5"
                stroke={phaseColor}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            ) : (
              /* Signature Pulse Line Smile */
              <path
                d="M22 37.5H27.5L30.5 33.5L33.5 41L36 37.5H42"
                stroke={phaseColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Contextual Rim Accents */}
            {(isHappyArcEyes || visualPose === 'milestone') && (
              <motion.path
                d="M11 18L15.5 20.5M53 18L48.5 20.5M32 9V14"
                stroke={phaseColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.65, repeat: Infinity }}
              />
            )}

            {visualPose === 'welcome' && (
              <motion.path
                d="M49 14C52.5 16.5 54 20 53.5 23.5"
                stroke={phaseColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                animate={{ rotate: [0, 14, -8, 0] }}
                transition={{ duration: 1.25, repeat: Infinity }}
                style={{ originX: '49px', originY: '19px' }}
              />
            )}

            {visualPose === 'timerActive' && (
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
