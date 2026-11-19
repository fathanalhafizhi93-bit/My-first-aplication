import { DayTimePhase } from '../lib/i18n';

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
  // Morning (9 poses)
  | 'tea'
  | 'coffee'
  | 'stretch'
  | 'perk'
  | 'wink'
  | 'sunrise'
  | 'protein'
  | 'salute'
  | 'sparkle'
  // Afternoon (9 poses)
  | 'hydrate'
  | 'shades'
  | 'flex'
  | 'music'
  | 'curious'
  | 'beast'
  | 'sweat'
  | 'smirk'
  | 'whistle'
  // Night (9 poses)
  | 'sleep'
  | 'yawn'
  | 'nightChill'
  | 'stargaze'
  | 'zen'
  | 'cozy'
  | 'dream'
  | 'moonlit'
  | 'recharge';

export interface MascotSpeechLine {
  id: string;
  headline: string;
  subline: string;
}

export interface MascotDialogueContext {
  mood: MascotMood;
  timePhase: DayTimePhase;
  activeTimePose: TimePhasePose;
  n: string;
  completedSets: number;
  totalSets: number;
  progressPct: number;
  dayLabel: string;
  activeTimerExerciseName?: string;
  restRemainingFormatted?: string;
  allCompleted: boolean;
  dayJustChanged: boolean;
  t: (idText: string, enText: string) => string;
}

/**
 * Curated bilingual (ID & EN) dialogue bank with 170+ unique entries covering
 * all 9 workout moods, all 27 time-phase expressions, and witty gym banter.
 */
export function buildMascotSpeechPool(ctx: MascotDialogueContext): MascotSpeechLine[] {
  const {
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
  } = ctx;

  const remainingSets = Math.max(0, totalSets - completedSets);

  // ═══════════════════════════════════════════════════════════
  // 1. URGENT WORKOUT MOODS (30+ contextual lines)
  // ═══════════════════════════════════════════════════════════
  if (mood === 'clap') {
    return [
      {
        id: 'clap-1',
        headline: t(`Mantap${n}! Set selesai!`, `Nice${n}! Set done!`),
        subline: t(
          `${completedSets}/${totalSets || 1} set beres. Tepuk tangan buat kerja kerasmu!`,
          `${completedSets}/${totalSets || 1} sets done. Quick cheer for that clean effort!`
        ),
      },
      {
        id: 'clap-2',
        headline: t(`Keren${n}! Satu set terkunci!`, `Awesome${n}! Set banked!`),
        subline: t(
          'Eksekusi rapi — tarik napas dulu sebelum lanjut ke set berikutnya.',
          'Clean execution — catch your breath before the next set.'
        ),
      },
      {
        id: 'clap-3',
        headline: t(`Progres tercatat${n}!`, `Progress logged${n}!`),
        subline: t(
          'Ritme bagus! Satu langkah lebih dekat menuntaskan target hari ini.',
          'Great rhythm! One step closer to clearing today’s target.'
        ),
      },
      {
        id: 'clap-4',
        headline: t(`Solid banget${n}!`, `Super solid${n}!`),
        subline: t(
          'Kontrol repetisi tadi terasa mantap — jaga postur tetap rapat di set selanjutnya.',
          'Great rep control — keep that crisp form rolling into the next set.'
        ),
      },
      {
        id: 'clap-5',
        headline: t(`Terus nyala${n}!`, `Keeping the spark alive${n}!`),
        subline: t(
          `Sudah ${completedSets} set terkumpul. Konsistensi kecil seperti ini yang bikin beda.`,
          `${completedSets} sets banked already. Small consistent wins add up fast.`
        ),
      },
      {
        id: 'clap-6',
        headline: t(`Bersih tanpa ragu${n}!`, `Clean & decisive${n}!`),
        subline: t(
          'Beban tadi lewat mulus — beri otot jeda singkat biar tenaga balik penuh.',
          'That set went up smooth — give your muscles a quick breather.'
        ),
      },
      {
        id: 'clap-7',
        headline: t(`Tempo mantap${n}!`, `Dialed-in tempo${n}!`),
        subline: t(
          'Nggak cuma kuat, tapi juga terkontrol. Otot pasti kerasa maksimal!',
          'Not just strong, super controlled too. Every fiber felt that one!'
        ),
      },
    ];
  }

  if (mood === 'milestone') {
    return [
      {
        id: 'mile-1',
        headline: t(`Mantap${n}! Sudah ${progressPct}%!`, `Awesome${n}! ${progressPct}% cleared!`),
        subline: t(
          `${completedSets}/${totalSets} set beres — lebih dari separuh jalan terlewati!`,
          `${completedSets}/${totalSets} sets done — over halfway through today’s session!`
        ),
      },
      {
        id: 'mile-2',
        headline: t(`Dorongan hebat${n}! (${progressPct}%)`, `Strong push${n}! (${progressPct}%)`),
        subline: t(
          'Momentum lagi puncak! Nikmati jedamu sebelum menyapu sisa set.',
          'Peak momentum! Enjoy a brief breather before clearing the remaining sets.'
        ),
      },
      {
        id: 'mile-3',
        headline: t(`Set selesai dengan rapi${n}!`, `Clean set logged${n}!`),
        subline: t(
          'Tinggal sedikit lagi menuju 100%. Pertahankan fokusmu!',
          'Just a bit more to 100%. Keep that focus steady!'
        ),
      },
      {
        id: 'mile-4',
        headline: t(`Paruh akhir dimulai${n}!`, `Home stretch unlocked${n}!`),
        subline: t(
          `Sisa ${remainingSets} set lagi — tutup sesi hari ini dengan kuat!`,
          `${remainingSets} sets left — finish today’s session strong!`
        ),
      },
      {
        id: 'mile-5',
        headline: t(`Mesin sudah panas${n}!`, `Fully dialed in${n}!`),
        subline: t(
          'Tenaga masih stabil di atas 50%. Pastikan hidrasi tetap terjaga ya!',
          'Holding steady past halfway. Keep sipping water between sets!'
        ),
      },
      {
        id: 'mile-6',
        headline: t(`Hampir finis${n}! (${progressPct}%)`, `Almost across the line${n}! (${progressPct}%)`),
        subline: t(
          'Bagian tersulit sudah lewat — sekarang tinggal kunci kemenangan hari ini.',
          'The hardest part is behind you — now lock in today’s finish.'
        ),
      },
      {
        id: 'mile-7',
        headline: t(`Garis finis sudah kelihatan${n}!`, `Finish line in sight${n}!`),
        subline: t(
          'Nafas tetap tenang, bahu turun — kamu udah di zona juara!',
          'Steady breathing, shoulders loose — you’re deep in championship territory!'
        ),
      },
    ];
  }

  if (mood === 'celebrate') {
    return [
      {
        id: 'cel-1',
        headline: t(`Luar biasa${n}! Sesi Tuntas 100%!`, `Awesome${n}! 100% Complete!`),
        subline: t(
          `Semua ${totalSets} set beres dikerjakan! Riwayat latihanmu otomatis tersimpan.`,
          `All ${totalSets} sets finished! Your workout history is saved automatically.`
        ),
      },
      {
        id: 'cel-2',
        headline: t(`Sesi ${dayLabel} tamat${n}!`, `${dayLabel} conquered${n}!`),
        subline: t(
          'Tepuk tangan meriah! Sekarang waktunya pendinginan dan pemulihan.',
          'Big applause! Time to cool down and enjoy your recovery.'
        ),
      },
      {
        id: 'cel-3',
        headline: t(`Juara hari ini${n}!`, `Champion effort${n}!`),
        subline: t(
          'Target latihan hari ini tuntas sempurna. Kamu hebat!',
          'Today’s workout target is completely cleared. Great job!'
        ),
      },
      {
        id: 'cel-4',
        headline: t(`Misi selesai 100%${n}!`, `Mission 100% cleared${n}!`),
        subline: t(
          'Jangan lupa peregangan singkat, minum air, dan isi protein biar pulih optimal.',
          'Take a quick stretch, hydrate well, and refuel for optimal recovery.'
        ),
      },
      {
        id: 'cel-5',
        headline: t(`Rekor konsistensi bertambah${n}!`, `Another win on the board${n}!`),
        subline: t(
          'Hari ini resmi masuk catatan kalender. Bangga sama disiplinmu!',
          'Today is officially stamped in your calendar. Proud of your discipline!'
        ),
      },
      {
        id: 'cel-6',
        headline: t(`Besi hari ini takluk${n}!`, `Iron conquered today${n}!`),
        subline: t(
          'Angkat dagu, nikmati rasa puasnya — kamu baru saja upgrade diri lagi.',
          'Chin up, soak in that feeling — you just leveled up again.'
        ),
      },
    ];
  }

  if (mood === 'timerActive') {
    return [
      {
        id: 'tmr-1',
        headline: activeTimerExerciseName
          ? t(`Tahan fokus — ${activeTimerExerciseName}`, `Hold strong — ${activeTimerExerciseName}`)
          : t(`Timer gerakan aktif${n}!`, `Exercise timer running${n}!`),
        subline: t(
          'Jaga napas tetap stabil dan postur terkunci sampai hitungan selesai.',
          'Keep your breathing steady and posture braced until the timer finishes.'
        ),
      },
      {
        id: 'tmr-2',
        headline: t(`Setiap detik berharga${n}!`, `Every second counts${n}!`),
        subline: t(
          'Tetap stabil — durasi otomatis tersimpan begitu hitungan selesai.',
          'Stay steady — duration saves automatically when the timer finishes.'
        ),
      },
      {
        id: 'tmr-3',
        headline: t(`Fokus penuh di waktu${n}!`, `Locked on the clock${n}!`),
        subline: t(
          'Kendalikan napasmu perlahan sampai bunyi selesai berbunyi.',
          'Breathe evenly and hold strong until the finish chime.'
        ),
      },
      {
        id: 'tmr-4',
        headline: t(`Kunci core & stabilkan ritme${n}!`, `Brace your core & hold${n}!`),
        subline: t(
          'Jangan tahan napas — embuskan perlahan biar daya tahan tetap panjang.',
          'Don’t hold your breath — steady exhales keep your stamina steady.'
        ),
      },
      {
        id: 'tmr-5',
        headline: t(`Sedikit lagi menuju bel${n}!`, `Stay locked to the chime${n}!`),
        subline: t(
          'Pikiran tenang, otot bekerja — kamu pegang kendali penuh sekarang.',
          'Calm mind, steady tension — you’re in complete control right now.'
        ),
      },
      {
        id: 'tmr-6',
        headline: t(`Tahan terus, jangan goyah${n}!`, `Hold steady, own the clock${n}!`),
        subline: t(
          'Detik terakhir selalu terasa paling berat — di situlah progres terjadi.',
          'The final seconds always burn most — that’s where real growth happens.'
        ),
      },
    ];
  }

  if (mood === 'rest') {
    return [
      {
        id: 'rest-1',
        headline: restRemainingFormatted
          ? t(`Timer Istirahat Aktif (${restRemainingFormatted})`, `Rest Timer Active (${restRemainingFormatted})`)
          : t('Timer Istirahat Aktif', 'Rest Timer Running'),
        subline: t(
          'Biarkan otot pulih sejenak sambil menunggu timer istirahat selesai.',
          'Let your muscles recover briefly while the rest timer counts down.'
        ),
      },
      {
        id: 'rest-2',
        headline: restRemainingFormatted
          ? t(`Isi ulang tenaga · ${restRemainingFormatted}`, `Recharging · ${restRemainingFormatted}`)
          : t('Isi ulang tenaga antar set', 'Recharging between sets'),
        subline: t(
          'Tarik napas pelan dan teguk air sebelum masuk ke set berikutnya.',
          'Breathe slow and grab a sip of water before the next set.'
        ),
      },
      {
        id: 'rest-3',
        headline: restRemainingFormatted
          ? t(`Pemulihan otot (${restRemainingFormatted})`, `Muscle recovery (${restRemainingFormatted})`)
          : t('Pemulihan otot antar set', 'Between-set recovery'),
        subline: t(
          'Lemaskan bahu — sebentar lagi waktunya lanjut!',
          'Relax your shoulders — almost time to jump back in!'
        ),
      },
      {
        id: 'rest-4',
        headline: restRemainingFormatted
          ? t(`Jeda singkat · ${restRemainingFormatted}`, `Quick breather · ${restRemainingFormatted}`)
          : t('Jeda singkat antar set', 'Short rest between sets'),
        subline: t(
          'Kibaskan tangan sebentar dan bayangkan eksekusi set berikutnya.',
          'Shake out your grip and visualize a clean next set.'
        ),
      },
      {
        id: 'rest-5',
        headline: restRemainingFormatted
          ? t(`Detak napas turun · ${restRemainingFormatted}`, `Heart rate settling · ${restRemainingFormatted}`)
          : t('Atur napas sebelum lanjut', 'Reset your breath'),
        subline: t(
          'Istirahat terukur bikin kekuatanmu tetap maksimal di setiap set.',
          'Timed rest keeps your strength output sharp across every set.'
        ),
      },
      {
        id: 'rest-6',
        headline: restRemainingFormatted
          ? t(`Tenaga balik penuh · ${restRemainingFormatted}`, `Power loading · ${restRemainingFormatted}`)
          : t('Siap-siap buat set berikutnya', 'Gearing up for the next set'),
        subline: t(
          'Simpan fokusmu — begitu bel berbunyi, langsung kunci repetisi bersih.',
          'Keep your eyes on the prize — once the bell rings, lock in clean reps.'
        ),
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // 2. GENERAL GYM & COMPANION BANTER (18 witty/encouraging extras
  //    blended lightly into non-urgent pools for rich variety)
  // ═══════════════════════════════════════════════════════════
  const sharedBanter: MascotSpeechLine[] = [
    {
      id: 'banter-1',
      headline: t(`Cek postur bahumu bentar${n}!`, `Quick posture check${n}!`),
      subline: t(
        'Tarik bahu ke belakang sedikit, tegakkan dada — langsung kerasa lebih lega kan?',
        'Roll your shoulders back and open your chest — feels better already, right?'
      ),
    },
    {
      id: 'banter-2',
      headline: t(`Progres kecil tetap progres${n}`, `Small gains are still gains${n}`),
      subline: t(
        'Tambah 1 kg atau 1 rep lebih rapi dari pekan lalu sudah bikin tubuhmu adaptasi.',
        'Adding 1 kg or one cleaner rep over last week still drives real adaptation.'
      ),
    },
    {
      id: 'banter-3',
      headline: t(`Nggak perlu sempurna, cukup konsisten${n}`, `Consistency beats perfection${n}`),
      subline: t(
        'Hari yang terasa berat justru paling berharga saat kamu tetap muncul dan gerak.',
        'The days that feel toughest count double when you still show up.'
      ),
    },
    {
      id: 'banter-4',
      headline: t(`Jangan lupa napas pas dorong beban${n}`, `Remember to exhale on effort${n}`),
      subline: t(
        'Tarik napas saat menurunkan beban, embuskan mantap saat mendorong!',
        'Inhale on the way down, exhale steadily as you push through!'
      ),
    },
    {
      id: 'banter-5',
      headline: t(`Suka ketuk-ketuk aku ya${n}? Hehe`, `Enjoying the taps${n}? Hehe`),
      subline: t(
        'Santai, aku punya segudang ekspresi dan obrolan buat nemenin kamu hari ini!',
        'No worries, I’ve got plenty of faces and gym talk ready for you today!'
      ),
    },
    {
      id: 'banter-6',
      headline: t(`Otot butuh sinyal, bukan drama${n}`, `Train smart, lift clean${n}`),
      subline: t(
        'Rentang gerak penuh dan kontrol stabil jauh lebih efektif daripada buru-buru.',
        'Full range of motion and steady control beat rushed reps every single time.'
      ),
    },
    {
      id: 'banter-7',
      headline: t(`Sudah minum air belum hari ini${n}?`, `Had enough water today${n}?`),
      subline: t(
        'Bahkan dehidrasi ringan bisa bikin tenaga drop 10% — yuk teguk dulu!',
        'Even mild dehydration can dip strength fast — grab a quick sip!'
      ),
    },
    {
      id: 'banter-8',
      headline: t(`Catat bebanmu biar gampang naik level${n}`, `Log your weights to level up${n}`),
      subline: t(
        'Angka yang tercatat bikin kamu tahu persis kapan waktunya progressive overload.',
        'Tracked numbers show you exactly when it’s time for progressive overload.'
      ),
    },
    {
      id: 'banter-9',
      headline: t(`Hari ini versi lebih kuat dari kemarin${n}`, `Stronger than yesterday${n}`),
      subline: t(
        'Nggak usah bandingkan sama orang lain — cukup kalahkan rasa malasmu sendiri.',
        'No need to compare with anyone else — just outlast yesterday’s excuses.'
      ),
    },
    {
      id: 'banter-10',
      headline: t(`Rest day bukan berarti mundur${n}`, `Recovery builds strength${n}`),
      subline: t(
        'Latihan memberi rangsangan, tapi nutrisi dan istirahat yang membangun ototnya.',
        'Training sends the signal, while sleep and nutrition do the rebuilding.'
      ),
    },
    {
      id: 'banter-11',
      headline: t(`Pemanasan 5 menit = investasi sendi${n}`, `5-minute warm-up = happy joints${n}`),
      subline: t(
        'Bahu, pinggul, dan lutut bakal berterima kasih tiap kali kamu mulai dengan rapi.',
        'Your shoulders, hips, and knees will thank you for easing into heavy sets.'
      ),
    },
    {
      id: 'banter-12',
      headline: t(`Kalau capek, turunin tempo bukan niat${n}`, `Adjust pace, keep the habit${n}`),
      subline: t(
        'Sesi ringan yang tetap selesai jauh lebih baik daripada bolos seminggu penuh.',
        'A lighter session completed beats skipping the whole week.'
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // 3. MORNING POSES (9 distinct poses × 4–5 lines = 40 lines)
  // ═══════════════════════════════════════════════════════════
  if (timePhase === 'morning') {
    if (activeTimePose === 'tea') {
      return [
        {
          id: 'm-tea-1',
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
          id: 'm-tea-2',
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
          id: 'm-tea-3',
          headline: t(`Selamat Pagi${n}! Segelas teh dulu`, `Good Morning${n}! Tea time`),
          subline: t(
            'Biar pikiran tenang dan tubuh hangat — siap kalau kamu mau mulai!',
            'Warming up mind and body — ready whenever you want to begin!'
          ),
        },
        {
          id: 'm-tea-4',
          headline: t(`Aroma teh pagi bikin rileks${n}`, `Calm morning tea aroma${n}`),
          subline: t(
            'Awali hari tanpa tergesa — tubuh yang siap menghasilkan sesi terbaik.',
            'Start unhurried — a calm warm-up sets up the strongest sessions.'
          ),
        },
        sharedBanter[0],
      ];
    }

    if (activeTimePose === 'coffee') {
      return [
        {
          id: 'm-cof-1',
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
          id: 'm-cof-2',
          headline: t(`Energi pagi siap dinyalakan${n}!`, `Morning fuel locked in${n}!`),
          subline: t(
            'Jangan lupa imbangi kopi dengan segelas air putih biar hidrasi aman.',
            'Pair your coffee with a glass of water so hydration stays on track.'
          ),
        },
        {
          id: 'm-cof-3',
          headline: t(`Aroma kopi di hari ${dayLabel}${n}`, `Fresh roast for ${dayLabel}${n}`),
          subline: t(
            'Mata sudah cerah, otot tinggal dipanaskan pelan-pelan.',
            'Eyes wide awake — just a quick warm-up and you’re ready to roll.'
          ),
        },
        {
          id: 'm-cof-4',
          headline: t(`Siap ngebut pagi ini${n}?`, `Ready to spark the morning${n}?`),
          subline: t(
            'Mulai dari set pemanasan ringan dulu biar sendi ikut bangun.',
            'Ease in with a light warm-up set so your joints wake up smoothly.'
          ),
        },
        sharedBanter[6],
      ];
    }

    if (activeTimePose === 'stretch') {
      return [
        {
          id: 'm-str-1',
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
          id: 'm-str-2',
          headline: t(`Bangun segar pagi ini${n}!`, `Fresh morning wake-up${n}!`),
          subline: t(
            'Matahari pagi mulai naik, pas banget buat bangun konsistensi hari ini.',
            'The morning sun is rising — a great time to build momentum.'
          ),
        },
        {
          id: 'm-str-3',
          headline: t(`Gerak ringan di pagi hari${n}`, `Gentle morning mobility${n}`),
          subline: t(
            'Sendi yang lentur bikin setiap gerakan terasa jauh lebih nyaman.',
            'Warm, mobile joints make every rep feel smoother.'
          ),
        },
        {
          id: 'm-str-4',
          headline: t(`Putar bahu, tarik napas dalam${n}`, `Roll your shoulders & breathe${n}`),
          subline: t(
            'Dua menit mobilitas ringan cukup bikin punggung dan leher terasa enteng.',
            'Two minutes of mobility loosens up your neck and back right away.'
          ),
        },
        sharedBanter[10],
      ];
    }

    if (activeTimePose === 'wink') {
      return [
        {
          id: 'm-wnk-1',
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
          id: 'm-wnk-2',
          headline: t(`Siap cetak progres baru${n}?`, `Ready for a small PR${n}?`),
          subline: t(
            'Tambah satu repetisi ekstra atau kontrol tempo lebih rapi sudah terhitung menang!',
            'Even one extra clean rep or tighter form counts as a win today!'
          ),
        },
        {
          id: 'm-wnk-3',
          headline: t(`Pagi yang penuh percaya diri${n}`, `Confident morning vibe${n}`),
          subline: t(
            'Nggak perlu buru-buru — yang penting datang dan mulai bergerak.',
            'No rush at all — showing up and moving is half the victory.'
          ),
        },
        {
          id: 'm-wnk-4',
          headline: t(`Yuk bikin ${dayLabel} berkesan${n}`, `Let’s make ${dayLabel} count${n}`),
          subline: t(
            'Jadwal sudah rapi menunggu. Aku standby di sudut kalau kamu butuh!',
            'Your schedule is lined up. I’ll be chilling in the corner if you need me!'
          ),
        },
        sharedBanter[4],
      ];
    }

    if (activeTimePose === 'sunrise') {
      return [
        {
          id: 'm-sun-1',
          headline: t(`Mentari baru terbit${n}!`, `Fresh sunrise energy${n}!`),
          subline: t(
            'Cahaya pagi ini tanda bagus buat buka lembaran progres baru hari ini.',
            'Morning sunlight is the best cue to kick off a fresh chapter of gains.'
          ),
        },
        {
          id: 'm-sun-2',
          headline: t(`Pagi cerah, pikiran ikut terang${n}`, `Bright morning, clear headspace${n}`),
          subline: t(
            'Ambil lima menit kena cahaya matahari pagi biar ritme tidurmu makin bagus.',
            'Catch five minutes of morning light to anchor your energy all day.'
          ),
        },
        {
          id: 'm-sun-3',
          headline: t(`Selamat datang di pagi ${dayLabel}${n}!`, `Welcome to ${dayLabel} sunrise${n}!`),
          subline: t(
            'Hari masih panjang dan peluang menangmu terbuka lebar sekarang.',
            'The whole day is ahead and your momentum starts right here.'
          ),
        },
        {
          id: 'm-sun-4',
          headline: t(`Sinar pagi + semangat baja${n}`, `Golden morning glow${n}`),
          subline: t(
            'Mulai hari dengan langkah sadar bikin seluruh harimu terasa lebih terkendali.',
            'Starting with intention sets a strong tone for the next 16 hours.'
          ),
        },
        sharedBanter[8],
      ];
    }

    if (activeTimePose === 'protein') {
      return [
        {
          id: 'm-pro-1',
          headline: t(`Shake protein pagi siap${n}!`, `Morning protein shake ready${n}!`),
          subline: t(
            'Asupan protein cukup di pagi hari bikin otot siap kerja dan pulih cepat.',
            'Hitting morning protein keeps your muscles fueled and recovery humming.'
          ),
        },
        {
          id: 'm-pro-2',
          headline: t(`Jangan skip bahan bakar tubuh${n}!`, `Fuel the engine first${n}!`),
          subline: t(
            'Karbohidrat ringan + protein bikin tenaga stabil tanpa lemas di tengah set.',
            'Light carbs plus solid protein keep your power steady through every set.'
          ),
        },
        {
          id: 'm-pro-3',
          headline: t(`Sarapan pintar buat hasil besar${n}`, `Smart fuel for strong lifts${n}`),
          subline: t(
            'Telur, oat, atau shake favoritmu — pilih yang paling nyaman di perutmu!',
            'Eggs, oats, or your favorite shake — pick what sits light and fuels right!'
          ),
        },
        {
          id: 'm-pro-4',
          headline: t(`Kocok shaker, siap gerak${n}!`, `Shake it up & roll${n}!`),
          subline: t(
            'Nutrisi pagi yang rapi adalah setengah dari rahasia progres konsisten.',
            'Dialed-in morning nutrition is half the secret to steady progress.'
          ),
        },
        sharedBanter[1],
      ];
    }

    if (activeTimePose === 'salute') {
      return [
        {
          id: 'm-sal-1',
          headline: t(`Siap komandan${n}! Mode disiplin!`, `Reporting for duty${n}!`),
          subline: t(
            `Target ${dayLabel} sudah di depan mata — ayo kita selesaikan dengan rapi!`,
            `${dayLabel}’s mission is right ahead — let’s execute it cleanly!`
          ),
        },
        {
          id: 'm-sal-2',
          headline: t(`Hormat buat yang bangun tepat waktu${n}!`, `Salute to showing up early${n}!`),
          subline: t(
            'Bangun pagi dan pegang komitmen sendiri itu level disiplin kelas atas.',
            'Waking up on cue and honoring your plan is top-tier discipline.'
          ),
        },
        {
          id: 'm-sal-3',
          headline: t(`Checklist pagi aman terkendali${n}`, `Morning checklist locked${n}`),
          subline: t(
            'Alarm aman, jadwal jelas, mental siap — tinggal eksekusi satu per satu!',
            'Alarm cleared, plan set, mind sharp — now knock them out one by one!'
          ),
        },
        {
          id: 'm-sal-4',
          headline: t(`Fokus misi hari ini${n}!`, `Locked onto today’s mission${n}!`),
          subline: t(
            'Nggak usah lihat total beratnya — fokus aja ke set pertama dulu.',
            'Don’t overthink the whole list — just win set number one first.'
          ),
        },
        sharedBanter[2],
      ];
    }

    if (activeTimePose === 'sparkle') {
      return [
        {
          id: 'm-spk-1',
          headline: t(`Wah, aura pagi ini bersinar banget${n}!`, `Whoa, sparkling morning energy${n}!`),
          subline: t(
            'Mood lagi cerah begini paling enak dipakai buat cetak sesi terbaikmu!',
            'Bright energy like this is pure gold for a standout training session!'
          ),
        },
        {
          id: 'm-spk-2',
          headline: t(`Kagum sama semangat pagimu${n}!`, `Starry-eyed for your drive${n}!`),
          subline: t(
            'Setiap kali kamu buka aplikasi di pagi hari, semangatku ikut naik 200%!',
            'Every time you check in early, my energy jumps 200% too!'
          ),
        },
        {
          id: 'm-spk-3',
          headline: t(`Hari ini terasa penuh peluang${n}!`, `Feeling magic in today’s plan${n}!`),
          subline: t(
            'Siapa tahu hari ini kamu pecahin rekor repetisi baru tanpa sadar!',
            'Today might just be the day you surprise yourself with a new PR!'
          ),
        },
        {
          id: 'm-spk-4',
          headline: t(`Kilau konsistensi pagi${n}`, `Shining with morning momentum${n}`),
          subline: t(
            'Langkah kecil berkilau setiap pagi lama-lama jadi kebiasaan tak tergoyahkan.',
            'Bright little habits each morning soon become unstoppable momentum.'
          ),
        },
        sharedBanter[7],
      ];
    }

    // Default morning pose: 'perk'
    return [
      {
        id: 'm-prk-1',
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
        id: 'm-prk-2',
        headline: t(`Pagi cerah di ${dayLabel}${n}`, `Bright ${dayLabel} morning${n}`),
        subline: t(
          'Awali pagi dengan mood baik — langkah kecil hari ini berarti besar.',
          'Start the morning in good spirits — every small step counts today.'
        ),
      },
      {
        id: 'm-prk-3',
        headline: t(`Semangat pagi${n}!`, `Morning boost${n}!`),
        subline: t(
          'Aku temani dari pagi sampai sesi hari ini beres.',
          'Right beside you from the morning warm-up to the finish.'
        ),
      },
      {
        id: 'm-prk-4',
        headline: t(`Fokus segar di awal hari${n}`, `Sharp focus early on${n}`),
        subline: t(
          'Cek dulu urutan gerakan hari ini biar transisi antar alat makin mulus.',
          'Glance over today’s lineup so transitions between sets stay effortless.'
        ),
      },
      sharedBanter[11],
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // 4. AFTERNOON POSES (9 distinct poses × 4–5 lines = 40 lines)
  // ═══════════════════════════════════════════════════════════
  if (timePhase === 'afternoon') {
    if (activeTimePose === 'hydrate') {
      return [
        {
          id: 'a-hyd-1',
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
          id: 'a-hyd-2',
          headline: t(`Jaga hidrasi siang${n}`, `Stay hydrated this afternoon${n}`),
          subline: t(
            'Air putih cukup bikin otot dan fokus tetap tajam sepanjang siang.',
            'Steady water intake keeps your muscles and focus sharp all afternoon.'
          ),
        },
        {
          id: 'a-hyd-3',
          headline: t(`Segarkan diri sejenak${n}`, `Quick midday refresh${n}`),
          subline: t(
            'Istirahat sebentar, minum air, lalu lanjutkan aktivitasmu.',
            'Take a brief pause, sip some water, and keep rolling.'
          ),
        },
        {
          id: 'a-hyd-4',
          headline: t(`Botol minum aman di dekatmu${n}?`, `Water bottle nearby${n}?`),
          subline: t(
            'Tegukan kecil tapi rutin jauh lebih efektif buat stamina otot.',
            'Small regular sips keep your energy way steadier than gulping later.'
          ),
        },
        sharedBanter[6],
      ];
    }

    if (activeTimePose === 'shades') {
      return [
        {
          id: 'a-shd-1',
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
          id: 'a-shd-2',
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
          id: 'a-shd-3',
          headline: t(`Vibe siang lagi oke nih${n}`, `Afternoon vibe is on point${n}`),
          subline: t(
            'Tenaga siang hari lagi stabil — mantap buat gerak atau sekadar santai.',
            'Midday energy feels steady — great for training or unwinding.'
          ),
        },
        {
          id: 'a-shd-4',
          headline: t(`Kalem tapi tetap konsisten${n}`, `Cool, calm & consistent${n}`),
          subline: t(
            'Gaya santai nggak berarti kendor — tiap set rapi tetap bawa hasil besar.',
            'Staying chill never slows progress — clean reps always deliver.'
          ),
        },
        sharedBanter[5],
      ];
    }

    if (activeTimePose === 'flex') {
      return [
        {
          id: 'a-flx-1',
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
          id: 'a-flx-2',
          headline: t(`Fokus ke kualitas repetisi${n}!`, `Quality over speed${n}!`),
          subline: t(
            'Turunkan beban terkontrol, dorong penuh — otot kerasa jauh lebih kena.',
            'Controlled eccentric, crisp drive — your muscles feel every rep.'
          ),
        },
        {
          id: 'a-flx-3',
          headline: t(`Tunjukkan tenaga terbaikmu${n}!`, `Bring your best power${n}!`),
          subline: t(
            'Set demi set bikin tubuh makin kuat dari minggu lalu.',
            'Set by set you’re building stronger than last week.'
          ),
        },
        {
          id: 'a-flx-4',
          headline: t(`Siap hajar target ${dayLabel}${n}!`, `Ready to crush ${dayLabel}${n}!`),
          subline: t(
            'Kunci postur, atur napas, dan biarkan konsistensimu bicara.',
            'Lock your posture, set your breath, and let consistency speak.'
          ),
        },
        sharedBanter[1],
      ];
    }

    if (activeTimePose === 'music') {
      return [
        {
          id: 'a-mus-1',
          headline: t(`Pasang playlist favoritmu${n}!`, `Cue up your hype track${n}!`),
          subline: t(
            'Irama yang pas bikin jeda istirahat dan tempo latihan terasa jauh lebih asyik.',
            'The right beat makes every set and transition flow effortlessly.'
          ),
        },
        {
          id: 'a-mus-2',
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
          id: 'a-mus-3',
          headline: t(`Vibe latihan lagi enak nih${n}`, `Workout vibe feels dialed${n}`),
          subline: t(
            'Mood bagus bikin beban terasa lebih ringan dan fokus tetap terjaga.',
            'A good vibe makes heavy sets feel smoother and keeps focus locked.'
          ),
        },
        {
          id: 'a-mus-4',
          headline: t(`Ikuti temponya pelan-pelan${n}`, `Ride the rhythm steady${n}`),
          subline: t(
            'Kombinasi ritme napas dan musik bikin sesi sore cepat terasa selesai.',
            'Syncing your breath with your pace makes the whole session fly by.'
          ),
        },
        sharedBanter[3],
      ];
    }

    if (activeTimePose === 'beast') {
      return [
        {
          id: 'a-bst-1',
          headline: t(`Mode Beast nyala penuh${n}!`, `Beast mode ignited${n}!`),
          subline: t(
            'Beban berat bukan musuh — itu cuma undangan buat tubuhmu jadi lebih kuat!',
            'Heavy weight isn’t the enemy — it’s an invitation to grow stronger!'
          ),
        },
        {
          id: 'a-bst-2',
          headline: t(`Ayo bakar kalori & keraguan${n}!`, `Burn through the doubt${n}!`),
          subline: t(
            'Pasang mindset fokus, kunci grip, dan dorong repetisi terbaikmu hari ini.',
            'Lock your grip, dial in your gaze, and drive your cleanest reps today.'
          ),
        },
        {
          id: 'a-bst-3',
          headline: t(`Energi puncak sore ini${n}!`, `Peak afternoon fire${n}!`),
          subline: t(
            'Otot sudah hangat maksimal — saat yang tepat buat tantangan set utama!',
            'Body’s fully warmed up — prime window to crush your top working sets!'
          ),
        },
        {
          id: 'a-bst-4',
          headline: t(`Nggak ada kata mundur${n}!`, `Zero backing down${n}!`),
          subline: t(
            'Tetap jaga teknik rapi meski semangat lagi membara ya!',
            'Keep that technique razor-sharp even when the fire is cranked high!'
          ),
        },
        sharedBanter[8],
      ];
    }

    if (activeTimePose === 'sweat') {
      return [
        {
          id: 'a-swt-1',
          headline: t(`Keringat = bukti kerja nyata${n}!`, `Sweat is proof of work${n}!`),
          subline: t(
            'Capek sedikit di siang hari tanda tubuhmu benar-benar sedang berkembang.',
            'Feeling that afternoon heat means your body is putting in real work.'
          ),
        },
        {
          id: 'a-swt-2',
          headline: t(`Lap keringat, lanjut pelan${n}!`, `Wipe the brow, keep moving${n}!`),
          subline: t(
            'Atur napas lewat hidung — jangan lupa isi cairan dan elektrolit juga.',
            'Reset with steady nasal breaths — keep fluids and electrolytes topped up.'
          ),
        },
        {
          id: 'a-swt-3',
          headline: t(`Mantap, mesin badan lagi panas${n}!`, `Engine’s running hot today${n}!`),
          subline: t(
            'Sesi yang bikin berkeringat selalu bikin mandi sore terasa dua kali lebih segar!',
            'A sweaty session makes that post-workout shower feel twice as good!'
          ),
        },
        {
          id: 'a-swt-4',
          headline: t(`Kerja kerasmu kerasa banget${n}`, `Serious hustle today${n}`),
          subline: t(
            'Ambil jeda 10 detik kalau perlu — kualitas selalu menang dari terburu-buru.',
            'Take an extra ten seconds if needed — clean form always wins.'
          ),
        },
        sharedBanter[11],
      ];
    }

    if (activeTimePose === 'smirk') {
      return [
        {
          id: 'a-smk-1',
          headline: t(`Gampang kan set hari ini${n}?`, `Making it look easy${n}?`),
          subline: t(
            'Gaya santai tapi angkanya naik terus — itu baru definisi progres elegan!',
            'Calm face, climbing numbers — that’s what smooth progress looks like!'
          ),
        },
        {
          id: 'a-smk-2',
          headline: t(`Aku tahu kamu bakal muncul${n}`, `Knew you’d show up${n}`),
          subline: t(
            'Rasa malas siang hari nggak mempan kalau jadwalmu udah rapi di IronPulse.',
            'Afternoon sluggishness doesn’t stand a chance once your plan is locked in.'
          ),
        },
        {
          id: 'a-smk-3',
          headline: t(`Boleh juga konsistensimu${n}~`, `Impressive streak energy${n}~`),
          subline: t(
            'Kalau lanjut begini terus, bulan depan pasti beda jauh performanya!',
            'Keep stacking days like this and next month’s numbers will fly!'
          ),
        },
        {
          id: 'a-smk-4',
          headline: t(`Siap bikin rekor kecil lagi${n}?`, `Ready to sneak in a PR${n}?`),
          subline: t(
            'Pelan tapi pasti — diam-diam beban naik, badan makin bugar.',
            'Quiet work, steady climbs — let the results speak for themselves.'
          ),
        },
        sharedBanter[4],
      ];
    }

    if (activeTimePose === 'whistle') {
      return [
        {
          id: 'a-whl-1',
          headline: t(`Siul santai sambil jaga tempo${n}~`, `Whistling through the pace${n}~`),
          subline: t(
            'Latihan nggak harus tegang terus — nikmati prosesnya biar awet bertahun-tahun!',
            'Training doesn’t have to feel stiff — enjoy the rhythm for the long haul!'
          ),
        },
        {
          id: 'a-whl-2',
          headline: t(`Ringan langkah, mantap hasil${n}`, `Light mood, solid output${n}`),
          subline: t(
            'Hati senang bikin hormon stres turun dan pemulihan otot jadi lebih cepat.',
            'A relaxed mood lowers stress and helps your muscles bounce back faster.'
          ),
        },
        {
          id: 'a-whl-3',
          headline: t(`Sore santai di ${dayLabel}${n}~`, `Breezy ${dayLabel} afternoon${n}~`),
          subline: t(
            'Satu set selesai, senyum dulu, lanjut lagi — gampang banget ritmenya!',
            'Finish a set, smile, reset, repeat — keeping the flow effortless!'
          ),
        },
        {
          id: 'a-whl-4',
          headline: t(`Nggak usah terlalu serius, gerak aja${n}`, `Keep it light, keep moving${n}`),
          subline: t(
            'Kadang sesi paling asyik justru datang saat kamu nggak kebanyakan mikir.',
            'Sometimes the best sessions happen when you stop overthinking and move.'
          ),
        },
        sharedBanter[0],
      ];
    }

    // Default afternoon pose: 'curious'
    return [
      {
        id: 'a-cur-1',
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
        id: 'a-cur-2',
        headline: t(`Cek ritme siang${n}`, `Midday rhythm check${n}`),
        subline: t(
          'Aku lagi lihat-lihat progresmu hari ini — tetap santai tapi konsisten.',
          'Checking in on today’s rhythm — calm, steady, and consistent.'
        ),
      },
      {
        id: 'a-cur-3',
        headline: t(`Siang produktif di ${dayLabel}${n}`, `Productive ${dayLabel} afternoon${n}`),
        subline: t(
          'Satu dua set sore atau siang tetap jauh lebih baik daripada diam saja.',
          'Even a couple clean afternoon sets beat skipping the day.'
        ),
      },
      {
        id: 'a-cur-4',
        headline: t(`Penasaran sama gerakan berikutnya${n}?`, `Checking the next move${n}?`),
        subline: t(
          'Semua catatan beban terakhir tersimpan rapi biar kamu gampang naik progres.',
          'Your previous weights stay logged so progressive overload is effortless.'
        ),
      },
      sharedBanter[7],
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // 5. NIGHT POSES (9 distinct poses × 4–5 lines = 40 lines)
  // ═══════════════════════════════════════════════════════════
  if (activeTimePose === 'sleep') {
    return [
      {
        id: 'n-slp-1',
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
        id: 'n-slp-2',
        headline: t(`Mode ngantuk malam · Zzz${n}`, `Cozy night snooze · Zzz${n}`),
        subline: t(
          'Hening malam hari cocok buat menurunkan detak jantung dan istirahat.',
          'Quiet night hours are perfect for winding down and resting deeply.'
        ),
      },
      {
        id: 'n-slp-3',
        headline: t(`Istirahat nyenyak malam ini${n}`, `Rest well tonight${n}`),
        subline: t(
          'Tidur cukup bantu hormon pemulihan bekerja maksimal semalaman.',
          'Quality sleep lets your body recover at full strength overnight.'
        ),
      },
      {
        id: 'n-slp-4',
        headline: t(`Otot tumbuh saat tidur${n}... Zzz`, `Muscles grow while you sleep${n}... Zzz`),
        subline: t(
          'Simpan tenagamu malam ini supaya besok bangun dengan badan lebih kuat.',
          'Bank deep rest tonight so you wake up stronger tomorrow.'
        ),
      },
      sharedBanter[9],
    ];
  }

  if (activeTimePose === 'yawn') {
    return [
      {
        id: 'n-ywn-1',
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
        id: 'n-ywn-2',
        headline: t(`Ngantuk dikit, tapi tetap sigap${n}`, `Half-awake night watch${n}`),
        subline: t(
          'Kalau latihan malam, utamakan gerakan terkontrol dan pendinginan setelahnya.',
          'If lifting late, keep reps controlled and take time to cool down after.'
        ),
      },
      {
        id: 'n-ywn-3',
        headline: t(`Kebangun bentar ngecek kamu${n}`, `Waking up to check on you${n}`),
        subline: t(
          'Jangan lupa matikan layar lebih awal kalau sudah selesai malam ini.',
          'Remember to wind down away from bright screens once you’re done tonight.'
        ),
      },
      {
        id: 'n-ywn-4',
        headline: t(`Masih melek di jam segini${n}?`, `Still up this late${n}?`),
        subline: t(
          'Bereskan yang penting saja lalu istirahat — pemulihan juga bagian dari latihan.',
          'Wrap up what matters and get some sleep — recovery is part of training.'
        ),
      },
      sharedBanter[2],
    ];
  }

  if (activeTimePose === 'stargaze') {
    return [
      {
        id: 'n-stg-1',
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
        id: 'n-stg-2',
        headline: t(`Malam berbintang di ${dayLabel}${n}`, `Starry ${dayLabel} evening${n}`),
        subline: t(
          'Setiap sesi kecil yang kamu selesaikan perlahan membentuk versi terkuatmu.',
          'Every quiet session you complete steadily builds your strongest self.'
        ),
      },
      {
        id: 'n-stg-3',
        headline: t(`Suasana malam begitu damai${n}`, `Peaceful late-night glow${n}`),
        subline: t(
          'Lepaskan lelah seharian — besok kita mulai babak baru lagi.',
          'Let go of the day’s tension — tomorrow brings a fresh chapter.'
        ),
      },
      {
        id: 'n-stg-4',
        headline: t(`Refleksi singkat sebelum tidur${n}`, `Quiet night reflection${n}`),
        subline: t(
          'Cek jadwal alarm besok biar bangun pagi sudah siap tanpa panik.',
          'Double-check tomorrow’s alarm so your morning starts smooth and stress-free.'
        ),
      },
      sharedBanter[8],
    ];
  }

  if (activeTimePose === 'zen') {
    return [
      {
        id: 'n-zen-1',
        headline: t(`Mode relaksasi & pemulihan${n}`, `Calm recovery & zen mode${n}`),
        subline: t(
          'Tarik napas 4 detik, tahan sebentar, embuskan 6 detik — otot langsung rileks.',
          'Inhale 4 seconds, pause, exhale 6 — feel your shoulders drop right away.'
        ),
      },
      {
        id: 'n-zen-2',
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
        id: 'n-zen-3',
        headline: t(`Napas tenang, pikiran jernih${n}`, `Steady breath, clear mind${n}`),
        subline: t(
          'Keseimbangan antara kerja keras dan istirahat tenang adalah kunci jangka panjang.',
          'Balancing hard effort with calm recovery is the secret to long-term gains.'
        ),
      },
      {
        id: 'n-zen-4',
        headline: t(`Waktunya isi ulang penuh${n}`, `Full-battery night recharge${n}`),
        subline: t(
          'Aku tetap tenang di sini menemani penutup harimu.',
          'Resting quietly right here as you wrap up your evening.'
        ),
      },
      sharedBanter[9],
    ];
  }

  if (activeTimePose === 'cozy') {
    return [
      {
        id: 'n-czy-1',
        headline: t(`Mode selimut nyaman aktif${n}~`, `Cozy wind-down mode${n}~`),
        subline: t(
          'Udara malam mulai dingin — saatnya bikin badan hangat dan nyaman sebelum tidur.',
          'Night air is cooling down — time to get warm and cozy before bed.'
        ),
      },
      {
        id: 'n-czy-2',
        headline: t(`Nyaman banget malam ini${n}`, `Extra cozy vibes tonight${n}`),
        subline: t(
          'Tutup hari tanpa beban pikiran — besok kamu bangun dengan energi baru.',
          'Close the day with a light mind — tomorrow brings fresh energy.'
        ),
      },
      {
        id: 'n-czy-3',
        headline: t(`Waktunya rebahan berkualitas${n}`, `Quality rest unlocked${n}`),
        subline: t(
          'Setelah gerak seharian, bantal empuk adalah hadiah terbaik malam ini.',
          'After putting in the hours today, a good pillow is well earned.'
        ),
      },
      {
        id: 'n-czy-4',
        headline: t(`Hangat, tenang, dan lega${n}`, `Warm, calm, and settled${n}`),
        subline: t(
          'Jangan lupa minum sedikit air sebelum tidur biar bangun pagi nggak kering.',
          'Take a small sip of water before bed so you wake up feeling fresh.'
        ),
      },
      sharedBanter[0],
    ];
  }

  if (activeTimePose === 'dream') {
    return [
      {
        id: 'n-drm-1',
        headline: t(`Mimpi cetak PR baru besok${n}...`, `Dreaming of new PRs${n}...`),
        subline: t(
          'Sambil tidur, otak juga memperkuat memori gerakan yang baru kamu latih hari ini!',
          'While you sleep, your brain actually consolidates today’s movement patterns!'
        ),
      },
      {
        id: 'n-drm-2',
        headline: t(`Lagi membayangkan target bulan depan${n}`, `Visualizing next month’s gains${n}`),
        subline: t(
          'Semua pencapaian besar selalu dimulai dari rutinitas malam yang terjaga.',
          'Every big milestone starts with steady daily habits and good sleep.'
        ),
      },
      {
        id: 'n-drm-3',
        headline: t(`Selamat beristirahat dalam mimpi indah${n}`, `Sweet dreams & strong recovery${n}`),
        subline: t(
          'Biarkan ototmu memperbaiki diri pelan-pelan sepanjang malam.',
          'Let your muscles repair and grow quietly through the night.'
        ),
      },
      {
        id: 'n-drm-4',
        headline: t(`Awan malam penuh ketenangan${n}`, `Floating into peaceful sleep${n}`),
        subline: t(
          'Besok alarm IronPulse siap bangunkan kamu di waktu paling pas!',
          'Tomorrow your IronPulse alarm will be ready right on schedule!'
        ),
      },
      sharedBanter[1],
    ];
  }

  if (activeTimePose === 'moonlit') {
    return [
      {
        id: 'n-mnl-1',
        headline: t(`Di bawah cahaya bulan yang teduh${n}`, `Under a calm moonlit glow${n}`),
        subline: t(
          'Malam yang tenang bikin kamu bisa melihat seberapa jauh kamu sudah berkembang.',
          'Quiet moonlight is a nice reminder of how far your consistency has come.'
        ),
      },
      {
        id: 'n-mnl-2',
        headline: t(`Bulan sudah tinggi di ${dayLabel}${n}`, `Moon’s high over ${dayLabel}${n}`),
        subline: t(
          'Kalau masih latihan malam, jaga intensitas terukur supaya tidur tetap pulas.',
          'If training late, keep intensity steady so you still sleep like a rock.'
        ),
      },
      {
        id: 'n-mnl-3',
        headline: t(`Cahaya malam yang menenangkan${n}`, `Serene moonlit stillness${n}`),
        subline: t(
          'Tarik napas pelan — hari ini kamu sudah berusaha sebaik mungkin.',
          'Breathe easy — you gave today an honest effort.'
        ),
      },
      {
        id: 'n-mnl-4',
        headline: t(`Penjaga malammu tetap standby${n}`, `Your night companion is here${n}`),
        subline: t(
          'Tenang aja, jadwal besok sudah tersimpan aman rapi di aplikasi.',
          'Rest easy knowing tomorrow’s schedule is saved and ready to go.'
        ),
      },
      sharedBanter[4],
    ];
  }

  if (activeTimePose === 'recharge') {
    return [
      {
        id: 'n-rch-1',
        headline: t(`Baterai tubuh sedang diisi ulang${n}`, `Body battery recharging${n}`),
        subline: t(
          'Tidur 7–8 jam itu seperti charger cepat alami buat kekuatan dan fokusmu.',
          'Seven to eight hours of sleep is nature’s fastest strength charger.'
        ),
      },
      {
        id: 'n-rch-2',
        headline: t(`Mode hemat energi aktif malam ini${n}`, `Overnight recovery charging${n}`),
        subline: t(
          'Simpan energi di malam hari biar besok set pertamamu langsung meledak!',
          'Bank your energy tonight so tomorrow’s first set feels effortless!'
        ),
      },
      {
        id: 'n-rch-3',
        headline: t(`Isi penuh 100% buat besok${n}!`, `Charging to 100% for tomorrow${n}!`),
        subline: t(
          'Serat otot lagi dibangun ulang sekarang — kasih waktu istirahat yang layak.',
          'Muscle fibers are rebuilding right now — give them the rest they earned.'
        ),
      },
      {
        id: 'n-rch-4',
        headline: t(`Recovery cerdas = progres cepat${n}`, `Smart recovery = faster gains${n}`),
        subline: t(
          'Atlet terbaik tahu kapan harus dorong keras dan kapan harus charge penuh.',
          'The best athletes know when to push hard and when to recharge fully.'
        ),
      },
      sharedBanter[9],
    ];
  }

  // Default night pose: 'nightChill'
  return [
    {
      id: 'n-chl-1',
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
      id: 'n-chl-2',
      headline: t(`Selamat Malam${n}! Suasana adem`, `Good Evening${n}! Calm night`),
      subline: t(
        'Langit sudah gelap, tetap jaga napas rileks di penghujung hari.',
        'Night has settled in — keep your breathing relaxed at the end of the day.'
      ),
    },
    {
      id: 'n-chl-3',
      headline: t(`Penutup hari yang nyaman${n}`, `Cozy end to the day${n}`),
      subline: t(
        'Minum air hangat atau peregangan ringan sebelum tidur terasa sangat pas.',
        'Warm water or gentle stretching feels great right before sleep.'
      ),
    },
    {
      id: 'n-chl-4',
      headline: t(`Malam santai penuh syukur${n}`, `Easy evening unwind${n}`),
      subline: t(
        'Apapun progres hari ini, kamu sudah melangkah maju. Istirahat yang baik ya!',
        'Whatever you achieved today, you moved forward. Have a restful night!'
      ),
    },
    sharedBanter[11],
  ];
}
