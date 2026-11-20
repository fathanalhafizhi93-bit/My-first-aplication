package com.fathan.ironpulse.data

import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.MascotMood
import com.fathan.ironpulse.model.MascotSpeechLine
import com.fathan.ironpulse.model.TimePhasePose

data class MascotDialogueContext(
    val lang: AppLanguage,
    val mood: MascotMood,
    val timePhase: DayTimePhase,
    val activeTimePose: TimePhasePose,
    val n: String,
    val completedSets: Int,
    val totalSets: Int,
    val progressPct: Int,
    val dayLabel: String,
    val activeTimerExerciseName: String? = null,
    val restRemainingFormatted: String? = null,
    val allCompleted: Boolean = false,
    val dayJustChanged: Boolean = false
)

object MascotDialogues {

    fun buildMascotSpeechPool(ctx: MascotDialogueContext): List<MascotSpeechLine> {
        fun t(id: String, en: String) = ctx.lang.t(id, en)
        val n = ctx.n
        val totalSets = ctx.totalSets
        val completedSets = ctx.completedSets
        val progressPct = ctx.progressPct
        val dayLabel = ctx.dayLabel
        val remainingSets = (totalSets - completedSets).coerceAtLeast(0)

        if (ctx.mood == MascotMood.CLAP) {
            return listOf(
                MascotSpeechLine(
                    "clap-1",
                    t("Mantap$n! Set selesai!", "Nice$n! Set done!"),
                    t("$completedSets/${totalSets.coerceAtLeast(1)} set beres. Tepuk tangan buat kerja kerasmu!", "$completedSets/${totalSets.coerceAtLeast(1)} sets done. Quick cheer for that clean effort!")
                ),
                MascotSpeechLine(
                    "clap-2",
                    t("Keren$n! Satu set terkunci!", "Awesome$n! Set banked!"),
                    t("Eksekusi rapi — tarik napas dulu sebelum lanjut ke set berikutnya.", "Clean execution — catch your breath before the next set.")
                ),
                MascotSpeechLine(
                    "clap-3",
                    t("Progres tercatat$n!", "Progress logged$n!"),
                    t("Ritme bagus! Satu langkah lebih dekat menuntaskan target hari ini.", "Great rhythm! One step closer to clearing today’s target.")
                ),
                MascotSpeechLine(
                    "clap-4",
                    t("Solid banget$n!", "Super solid$n!"),
                    t("Kontrol repetisi tadi terasa mantap — jaga postur tetap rapat di set selanjutnya.", "Great rep control — keep that crisp form rolling into the next set.")
                ),
                MascotSpeechLine(
                    "clap-5",
                    t("Terus nyala$n!", "Keeping the spark alive$n!"),
                    t("Sudah $completedSets set terkumpul. Konsistensi kecil seperti ini yang bikin beda.", "$completedSets sets banked already. Small consistent wins add up fast.")
                ),
                MascotSpeechLine(
                    "clap-6",
                    t("Bersih tanpa ragu$n!", "Clean & decisive$n!"),
                    t("Beban tadi lewat mulus — beri otot jeda singkat biar tenaga balik penuh.", "That set went up smooth — give your muscles a quick breather.")
                ),
                MascotSpeechLine(
                    "clap-7",
                    t("Tempo mantap$n!", "Dialed-in tempo$n!"),
                    t("Nggak cuma kuat, tapi juga terkontrol. Otot pasti kerasa maksimal!", "Not just strong, super controlled too. Every fiber felt that one!")
                )
            )
        }

        if (ctx.mood == MascotMood.MILESTONE) {
            return listOf(
                MascotSpeechLine(
                    "mile-1",
                    t("Mantap$n! Sudah $progressPct%!", "Awesome$n! $progressPct% cleared!"),
                    t("$completedSets/$totalSets set beres — lebih dari separuh jalan terlewati!", "$completedSets/$totalSets sets done — over halfway through today’s session!")
                ),
                MascotSpeechLine(
                    "mile-2",
                    t("Dorongan hebat$n! ($progressPct%)", "Strong push$n! ($progressPct%)"),
                    t("Momentum lagi puncak! Nikmati jedamu sebelum menyapu sisa set.", "Peak momentum! Enjoy a brief breather before clearing the remaining sets.")
                ),
                MascotSpeechLine(
                    "mile-3",
                    t("Set selesai dengan rapi$n!", "Clean set logged$n!"),
                    t("Tinggal sedikit lagi menuju 100%. Pertahankan fokusmu!", "Just a bit more to 100%. Keep that focus steady!")
                ),
                MascotSpeechLine(
                    "mile-4",
                    t("Paruh akhir dimulai$n!", "Home stretch unlocked$n!"),
                    t("Sisa $remainingSets set lagi — tutup sesi hari ini dengan kuat!", "$remainingSets sets left — finish today’s session strong!")
                ),
                MascotSpeechLine(
                    "mile-5",
                    t("Mesin sudah panas$n!", "Fully dialed in$n!"),
                    t("Tenaga masih stabil di atas 50%. Pastikan hidrasi tetap terjaga ya!", "Holding steady past halfway. Keep sipping water between sets!")
                ),
                MascotSpeechLine(
                    "mile-6",
                    t("Hampir finis$n! ($progressPct%)", "Almost across the line$n! ($progressPct%)"),
                    t("Bagian tersulit sudah lewat — sekarang tinggal kunci kemenangan hari ini.", "The hardest part is behind you — now lock in today’s finish.")
                ),
                MascotSpeechLine(
                    "mile-7",
                    t("Garis finis sudah kelihatan$n!", "Finish line in sight$n!"),
                    t("Nafas tetap tenang, bahu turun — kamu udah di zona juara!", "Steady breathing, shoulders loose — you’re deep in championship territory!")
                )
            )
        }

        if (ctx.mood == MascotMood.CELEBRATE) {
            return listOf(
                MascotSpeechLine(
                    "cel-1",
                    t("Luar biasa$n! Sesi Tuntas 100%!", "Awesome$n! 100% Complete!"),
                    t("Semua $totalSets set beres dikerjakan! Riwayat latihanmu otomatis tersimpan.", "All $totalSets sets finished! Your workout history is saved automatically.")
                ),
                MascotSpeechLine(
                    "cel-2",
                    t("Sesi $dayLabel tamat$n!", "$dayLabel conquered$n!"),
                    t("Tepuk tangan meriah! Sekarang waktunya pendinginan dan pemulihan.", "Big applause! Time to cool down and enjoy your recovery.")
                ),
                MascotSpeechLine(
                    "cel-3",
                    t("Juara hari ini$n!", "Champion effort$n!"),
                    t("Target latihan hari ini tuntas sempurna. Kamu hebat!", "Today’s workout target is completely cleared. Great job!")
                ),
                MascotSpeechLine(
                    "cel-4",
                    t("Misi selesai 100%$n!", "Mission 100% cleared$n!"),
                    t("Jangan lupa peregangan singkat, minum air, dan isi protein biar pulih optimal.", "Take a quick stretch, hydrate well, and refuel for optimal recovery.")
                ),
                MascotSpeechLine(
                    "cel-5",
                    t("Rekor konsistensi bertambah$n!", "Another win on the board$n!"),
                    t("Hari ini resmi masuk catatan kalender. Bangga sama disiplinmu!", "Today is officially stamped in your calendar. Proud of your discipline!")
                ),
                MascotSpeechLine(
                    "cel-6",
                    t("Besi hari ini takluk$n!", "Iron conquered today$n!"),
                    t("Angkat dagu, nikmati rasa puasnya — kamu baru saja upgrade diri lagi.", "Chin up, soak in that feeling — you just leveled up again.")
                )
            )
        }

        if (ctx.mood == MascotMood.TIMER_ACTIVE) {
            return listOf(
                MascotSpeechLine(
                    "tmr-1",
                    if (!ctx.activeTimerExerciseName.isNullOrBlank())
                        t("Tahan fokus — ${ctx.activeTimerExerciseName}", "Hold strong — ${ctx.activeTimerExerciseName}")
                    else t("Timer gerakan aktif$n!", "Exercise timer running$n!"),
                    t("Jaga napas tetap stabil dan postur terkunci sampai hitungan selesai.", "Keep your breathing steady and posture braced until the timer finishes.")
                ),
                MascotSpeechLine(
                    "tmr-2",
                    t("Setiap detik berharga$n!", "Every second counts$n!"),
                    t("Tetap stabil — durasi otomatis tersimpan begitu hitungan selesai.", "Stay steady — duration saves automatically when the timer finishes.")
                ),
                MascotSpeechLine(
                    "tmr-3",
                    t("Fokus penuh di waktu$n!", "Locked on the clock$n!"),
                    t("Kendalikan napasmu perlahan sampai bunyi selesai berbunyi.", "Breathe evenly and hold strong until the finish chime.")
                ),
                MascotSpeechLine(
                    "tmr-4",
                    t("Kunci core & stabilkan ritme$n!", "Brace your core & hold$n!"),
                    t("Jangan tahan napas — embuskan perlahan biar daya tahan tetap panjang.", "Don’t hold your breath — steady exhales keep your stamina steady.")
                ),
                MascotSpeechLine(
                    "tmr-5",
                    t("Sedikit lagi menuju bel$n!", "Stay locked to the chime$n!"),
                    t("Pikiran tenang, otot bekerja — kamu pegang kendali penuh sekarang.", "Calm mind, steady tension — you’re in complete control right now.")
                ),
                MascotSpeechLine(
                    "tmr-6",
                    t("Tahan terus, jangan goyah$n!", "Hold steady, own the clock$n!"),
                    t("Detik terakhir selalu terasa paling berat — di situlah progres terjadi.", "The final seconds always burn most — that’s where real growth happens.")
                )
            )
        }

        if (ctx.mood == MascotMood.REST) {
            val rem = ctx.restRemainingFormatted
            return listOf(
                MascotSpeechLine(
                    "rest-1",
                    if (!rem.isNullOrBlank()) t("Timer Istirahat Aktif ($rem)", "Rest Timer Active ($rem)")
                    else t("Timer Istirahat Aktif", "Rest Timer Running"),
                    t("Biarkan otot pulih sejenak sambil menunggu timer istirahat selesai.", "Let your muscles recover briefly while the rest timer counts down.")
                ),
                MascotSpeechLine(
                    "rest-2",
                    if (!rem.isNullOrBlank()) t("Isi ulang tenaga · $rem", "Recharging · $rem")
                    else t("Isi ulang tenaga antar set", "Recharging between sets"),
                    t("Tarik napas pelan dan teguk air sebelum masuk ke set berikutnya.", "Breathe slow and grab a sip of water before the next set.")
                ),
                MascotSpeechLine(
                    "rest-3",
                    if (!rem.isNullOrBlank()) t("Pemulihan otot ($rem)", "Muscle recovery ($rem)")
                    else t("Pemulihan otot antar set", "Between-set recovery"),
                    t("Lemaskan bahu — sebentar lagi waktunya lanjut!", "Relax your shoulders — almost time to jump back in!")
                ),
                MascotSpeechLine(
                    "rest-4",
                    if (!rem.isNullOrBlank()) t("Jeda singkat · $rem", "Quick breather · $rem")
                    else t("Jeda singkat antar set", "Short rest between sets"),
                    t("Kibaskan tangan sebentar dan bayangkan eksekusi set berikutnya.", "Shake out your grip and visualize a clean next set.")
                ),
                MascotSpeechLine(
                    "rest-5",
                    if (!rem.isNullOrBlank()) t("Detak napas turun · $rem", "Heart rate settling · $rem")
                    else t("Atur napas sebelum lanjut", "Reset your breath"),
                    t("Istirahat terukur bikin kekuatanmu tetap maksimal di setiap set.", "Timed rest keeps your strength output sharp across every set.")
                ),
                MascotSpeechLine(
                    "rest-6",
                    if (!rem.isNullOrBlank()) t("Tenaga balik penuh · $rem", "Power loading · $rem")
                    else t("Siap-siap buat set berikutnya", "Gearing up for the next set"),
                    t("Simpan fokusmu — begitu bel berbunyi, langsung kunci repetisi bersih.", "Keep your eyes on the prize — once the bell rings, lock in clean reps.")
                )
            )
        }

        val sharedBanter = listOf(
            MascotSpeechLine(
                "banter-1",
                t("Cek postur bahumu bentar$n!", "Quick posture check$n!"),
                t("Tarik bahu ke belakang sedikit, tegakkan dada — langsung kerasa lebih lega kan?", "Roll your shoulders back and open your chest — feels better already, right?")
            ),
            MascotSpeechLine(
                "banter-2",
                t("Progres kecil tetap progres$n", "Small gains are still gains$n"),
                t("Tambah 1 kg atau 1 rep lebih rapi dari pekan lalu sudah bikin tubuhmu adaptasi.", "Adding 1 kg or one cleaner rep over last week still drives real adaptation.")
            ),
            MascotSpeechLine(
                "banter-3",
                t("Nggak perlu sempurna, cukup konsisten$n", "Consistency beats perfection$n"),
                t("Hari yang terasa berat justru paling berharga saat kamu tetap muncul dan gerak.", "The days that feel toughest count double when you still show up.")
            ),
            MascotSpeechLine(
                "banter-4",
                t("Jangan lupa napas pas dorong beban$n", "Remember to exhale on effort$n"),
                t("Tarik napas saat menurunkan beban, embuskan mantap saat mendorong!", "Inhale on the way down, exhale steadily as you push through!")
            ),
            MascotSpeechLine(
                "banter-5",
                t("Suka ketuk-ketuk aku ya$n? Hehe", "Enjoying the taps$n? Hehe"),
                t("Santai, aku punya segudang ekspresi dan obrolan buat nemenin kamu hari ini!", "No worries, I’ve got plenty of faces and gym talk ready for you today!")
            ),
            MascotSpeechLine(
                "banter-6",
                t("Otot butuh sinyal, bukan drama$n", "Train smart, lift clean$n"),
                t("Rentang gerak penuh dan kontrol stabil jauh lebih efektif daripada buru-buru.", "Full range of motion and steady control beat rushed reps every single time.")
            ),
            MascotSpeechLine(
                "banter-7",
                t("Sudah minum air belum hari ini$n?", "Had enough water today$n?"),
                t("Bahkan dehidrasi ringan bisa bikin tenaga drop 10% — yuk teguk dulu!", "Even mild dehydration can dip strength fast — grab a quick sip!")
            ),
            MascotSpeechLine(
                "banter-8",
                t("Catat bebanmu biar gampang naik level$n", "Log your weights to level up$n"),
                t("Angka yang tercatat bikin kamu tahu persis kapan waktunya progressive overload.", "Tracked numbers show you exactly when it’s time for progressive overload.")
            ),
            MascotSpeechLine(
                "banter-9",
                t("Hari ini versi lebih kuat dari kemarin$n", "Stronger than yesterday$n"),
                t("Nggak usah bandingkan sama orang lain — cukup kalahkan rasa malasmu sendiri.", "No need to compare with anyone else — just outlast yesterday’s excuses.")
            ),
            MascotSpeechLine(
                "banter-10",
                t("Rest day bukan berarti mundur$n", "Recovery builds strength$n"),
                t("Latihan memberi rangsangan, tapi nutrisi dan istirahat yang membangun ototnya.", "Training sends the signal, while sleep and nutrition do the rebuilding.")
            ),
            MascotSpeechLine(
                "banter-11",
                t("Pemanasan 5 menit = investasi sendi$n", "5-minute warm-up = happy joints$n"),
                t("Bahu, pinggul, dan lutut bakal berterima kasih tiap kali kamu mulai dengan rapi.", "Your shoulders, hips, and knees will thank you for easing into heavy sets.")
            ),
            MascotSpeechLine(
                "banter-12",
                t("Kalau capek, turunin tempo bukan niat$n", "Adjust pace, keep the habit$n"),
                t("Sesi ringan yang tetap selesai jauh lebih baik daripada bolos seminggu penuh.", "A lighter session completed beats skipping the whole week.")
            )
        )

        if (ctx.timePhase == DayTimePhase.MORNING) {
            return when (ctx.activeTimePose) {
                TimePhasePose.TEA -> listOf(
                    MascotSpeechLine(
                        "m-tea-1",
                        if (ctx.allCompleted) t("Sruput teh hangat dulu$n...", "Sipping warm morning tea$n...") else t("Minum teh pagi dulu$n~", "Morning tea break$n~"),
                        if (ctx.allCompleted) t("Latihan pagi sudah tuntas! Nikmati teh hangatmu buat pemulihan santai.", "Morning workout cleared! Enjoy your warm tea for a calm recovery.")
                        else if (ctx.dayJustChanged) t("Hari baru di $dayLabel! Ngeteh hangat bentar biar badan siap bergerak.", "Fresh $dayLabel! A warm cup of tea helps wake the body up gently.")
                        else t("Pagi yang adem! Ngeteh hangat dulu sambil nyiapin semangat latihan.", "Crisp morning air! Sipping warm tea while getting ready for today.")
                    ),
                    MascotSpeechLine(
                        "m-tea-2",
                        t("Teh hangat & udara pagi$n", "Warm cup & morning breeze$n"),
                        if (ctx.mood == MascotMood.RESTDAY) t("Hari istirahat di pagi hari paling nikmat ditemani teh hangat dan santai.", "Morning rest day feels best with warm tea and unhurried recovery.")
                        else t("Isi energi pelan-pelan di pagi hari sebelum mulai gerak.", "Easing into the morning before getting into your sets.")
                    ),
                    MascotSpeechLine("m-tea-3", t("Selamat Pagi$n! Segelas teh dulu", "Good Morning$n! Tea time"), t("Biar pikiran tenang dan tubuh hangat — siap kalau kamu mau mulai!", "Warming up mind and body — ready whenever you want to begin!")),
                    MascotSpeechLine("m-tea-4", t("Aroma teh pagi bikin rileks$n", "Calm morning tea aroma$n"), t("Awali hari tanpa tergesa — tubuh yang siap menghasilkan sesi terbaik.", "Start unhurried — a calm warm-up sets up the strongest sessions.")),
                    sharedBanter[0]
                )
                TimePhasePose.COFFEE -> listOf(
                    MascotSpeechLine(
                        "m-cof-1",
                        t("Ngopi pagi biar makin melek$n!", "Morning espresso boost$n!"),
                        if (ctx.allCompleted) t("Latihan sudah beres, kopi pagi jadi hadiah paling pas hari ini!", "Workout already done — that morning coffee tastes even better now!")
                        else t("Tegukan kafein tipis bikin fokus tajam pas mulai pemanasan nanti.", "A crisp morning brew sharpens your focus right before warm-up.")
                    ),
                    MascotSpeechLine("m-cof-2", t("Energi pagi siap dinyalakan$n!", "Morning fuel locked in$n!"), t("Jangan lupa imbangi kopi dengan segelas air putih biar hidrasi aman.", "Pair your coffee with a glass of water so hydration stays on track.")),
                    MascotSpeechLine("m-cof-3", t("Aroma kopi di hari $dayLabel$n", "Fresh roast for $dayLabel$n"), t("Mata sudah cerah, otot tinggal dipanaskan pelan-pelan.", "Eyes wide awake — just a quick warm-up and you’re ready to roll.")),
                    MascotSpeechLine("m-cof-4", t("Siap ngebut pagi ini$n?", "Ready to spark the morning$n?"), t("Mulai dari set pemanasan ringan dulu biar sendi ikut bangun.", "Ease in with a light warm-up set so your joints wake up smoothly.")),
                    sharedBanter[6]
                )
                TimePhasePose.STRETCH -> listOf(
                    MascotSpeechLine(
                        "m-str-1",
                        t("Peregangan pagi yuk$n!", "Morning stretch time$n!"),
                        if (ctx.allCompleted) t("Pendinginan ringan di bawah sinar pagi bikin otot makin lega.", "Light morning stretching keeps your muscles loose after finishing.")
                        else t("Rentangkan bahu dan tarik napas segar — cahaya pagi lagi bagus nih!", "Open up your shoulders and breathe deep — morning light feels great!")
                    ),
                    MascotSpeechLine("m-str-2", t("Bangun segar pagi ini$n!", "Fresh morning wake-up$n!"), t("Matahari pagi mulai naik, pas banget buat bangun konsistensi hari ini.", "The morning sun is rising — a great time to build momentum.")),
                    MascotSpeechLine("m-str-3", t("Gerak ringan di pagi hari$n", "Gentle morning mobility$n"), t("Sendi yang lentur bikin setiap gerakan terasa jauh lebih nyaman.", "Warm, mobile joints make every rep feel smoother.")),
                    MascotSpeechLine("m-str-4", t("Putar bahu, tarik napas dalam$n", "Roll your shoulders & breathe$n"), t("Dua menit mobilitas ringan cukup bikin punggung dan leher terasa enteng.", "Two minutes of mobility loosens up your neck and back right away.")),
                    sharedBanter[10]
                )
                TimePhasePose.WINK -> listOf(
                    MascotSpeechLine("m-wnk-1", t("Hari ini bakal keren$n!", "Today’s looking strong$n!"), if (ctx.allCompleted) t("Tuh kan bener, sesi pagi langsung tuntas tanpa drama!", "Called it — morning session cleared smoothly!") else t("Aku yakin kamu bisa ngelewatin target hari ini dengan gaya santai.", "I’ve got a good feeling you’re going to crush today’s plan.")),
                    MascotSpeechLine("m-wnk-2", t("Siap cetak progres baru$n?", "Ready for a small PR$n?"), t("Tambah satu repetisi ekstra atau kontrol tempo lebih rapi sudah terhitung menang!", "Even one extra clean rep or tighter form counts as a win today!")),
                    MascotSpeechLine("m-wnk-3", t("Pagi yang penuh percaya diri$n", "Confident morning vibe$n"), t("Nggak perlu buru-buru — yang penting datang dan mulai bergerak.", "No rush at all — showing up and moving is half the victory.")),
                    MascotSpeechLine("m-wnk-4", t("Yuk bikin $dayLabel berkesan$n", "Let’s make $dayLabel count$n"), t("Jadwal sudah rapi menunggu. Aku standby di sudut kalau kamu butuh!", "Your schedule is lined up. I’ll be chilling in the corner if you need me!")),
                    sharedBanter[4]
                )
                TimePhasePose.SUNRISE -> listOf(
                    MascotSpeechLine("m-sun-1", t("Mentari baru terbit$n!", "Fresh sunrise energy$n!"), t("Cahaya pagi ini tanda bagus buat buka lembaran progres baru hari ini.", "Morning sunlight is the best cue to kick off a fresh chapter of gains.")),
                    MascotSpeechLine("m-sun-2", t("Pagi cerah, pikiran ikut terang$n", "Bright morning, clear headspace$n"), t("Ambil lima menit kena cahaya matahari pagi biar ritme tidurmu makin bagus.", "Catch five minutes of morning light to anchor your energy all day.")),
                    MascotSpeechLine("m-sun-3", t("Selamat datang di pagi $dayLabel$n!", "Welcome to $dayLabel sunrise$n!"), t("Hari masih panjang dan peluang menangmu terbuka lebar sekarang.", "The whole day is ahead and your momentum starts right here.")),
                    MascotSpeechLine("m-sun-4", t("Sinar pagi + semangat baja$n", "Golden morning glow$n"), t("Mulai hari dengan langkah sadar bikin seluruh harimu terasa lebih terkendali.", "Starting with intention sets a strong tone for the next 16 hours.")),
                    sharedBanter[8]
                )
                TimePhasePose.PROTEIN -> listOf(
                    MascotSpeechLine("m-pro-1", t("Shake protein pagi siap$n!", "Morning protein shake ready$n!"), t("Asupan protein cukup di pagi hari bikin otot siap kerja dan pulih cepat.", "Hitting morning protein keeps your muscles fueled and recovery humming.")),
                    MascotSpeechLine("m-pro-2", t("Jangan skip bahan bakar tubuh$n!", "Fuel the engine first$n!"), t("Karbohidrat ringan + protein bikin tenaga stabil tanpa lemas di tengah set.", "Light carbs plus solid protein keep your power steady through every set.")),
                    MascotSpeechLine("m-pro-3", t("Sarapan pintar buat hasil besar$n", "Smart fuel for strong lifts$n"), t("Telur, oat, atau shake favoritmu — pilih yang paling nyaman di perutmu!", "Eggs, oats, or your favorite shake — pick what sits light and fuels right!")),
                    MascotSpeechLine("m-pro-4", t("Kocok shaker, siap gerak$n!", "Shake it up & roll$n!"), t("Nutrisi pagi yang rapi adalah setengah dari rahasia progres konsisten.", "Dialed-in morning nutrition is half the secret to steady progress.")),
                    sharedBanter[1]
                )
                TimePhasePose.SALUTE -> listOf(
                    MascotSpeechLine("m-sal-1", t("Siap komandan$n! Mode disiplin!", "Reporting for duty$n!"), t("Target $dayLabel sudah di depan mata — ayo kita selesaikan dengan rapi!", "${dayLabel}’s mission is right ahead — let’s execute it cleanly!")),
                    MascotSpeechLine("m-sal-2", t("Hormat buat yang bangun tepat waktu$n!", "Salute to showing up early$n!"), t("Bangun pagi dan pegang komitmen sendiri itu level disiplin kelas atas.", "Waking up on cue and honoring your plan is top-tier discipline.")),
                    MascotSpeechLine("m-sal-3", t("Checklist pagi aman terkendali$n", "Morning checklist locked$n"), t("Alarm aman, jadwal jelas, mental siap — tinggal eksekusi satu per satu!", "Alarm cleared, plan set, mind sharp — now knock them out one by one!")),
                    MascotSpeechLine("m-sal-4", t("Fokus misi hari ini$n!", "Locked onto today’s mission$n!"), t("Nggak usah lihat total beratnya — fokus aja ke set pertama dulu.", "Don’t overthink the whole list — just win set number one first.")),
                    sharedBanter[2]
                )
                TimePhasePose.SPARKLE -> listOf(
                    MascotSpeechLine("m-spk-1", t("Wah, aura pagi ini bersinar banget$n!", "Whoa, sparkling morning energy$n!"), t("Mood lagi cerah begini paling enak dipakai buat cetak sesi terbaikmu!", "Bright energy like this is pure gold for a standout training session!")),
                    MascotSpeechLine("m-spk-2", t("Kagum sama semangat pagimu$n!", "Starry-eyed for your drive$n!"), t("Setiap kali kamu buka aplikasi di pagi hari, semangatku ikut naik 200%!", "Every time you check in early, my energy jumps 200% too!")),
                    MascotSpeechLine("m-spk-3", t("Hari ini terasa penuh peluang$n!", "Feeling magic in today’s plan$n!"), t("Siapa tahu hari ini kamu pecahin rekor repetisi baru tanpa sadar!", "Today might just be the day you surprise yourself with a new PR!")),
                    MascotSpeechLine("m-spk-4", t("Kilau konsistensi pagi$n", "Shining with morning momentum$n"), t("Langkah kecil berkilau setiap pagi lama-lama jadi kebiasaan tak tergoyahkan.", "Bright little habits each morning soon become unstoppable momentum.")),
                    sharedBanter[7]
                )
                else -> listOf(
                    MascotSpeechLine(
                        "m-prk-1",
                        t("Selamat Pagi$n! Energi baru!", "Good Morning$n! Fresh energy!"),
                        when {
                            ctx.mood == MascotMood.RESTDAY -> t("Hari ini jatah istirahat — nikmati pagi santai tanpa beban berat.", "Today is a rest day — enjoy a calm morning recharge.")
                            ctx.allCompleted -> t("Pagi-pagi semua $totalSets set sudah beres! Hari $dayLabel terasa ringan.", "All $totalSets sets done early! Your $dayLabel is wide open now.")
                            else -> t("Jadwal $dayLabel siap di bawah. Mulai kapan saja kamu siap!", "${dayLabel}’s plan is lined up below. Start whenever you’re ready!")
                        }
                    ),
                    MascotSpeechLine("m-prk-2", t("Pagi cerah di $dayLabel$n", "Bright $dayLabel morning$n"), t("Awali pagi dengan mood baik — langkah kecil hari ini berarti besar.", "Start the morning in good spirits — every small step counts today.")),
                    MascotSpeechLine("m-prk-3", t("Semangat pagi$n!", "Morning boost$n!"), t("Aku temani dari pagi sampai sesi hari ini beres.", "Right beside you from the morning warm-up to the finish.")),
                    MascotSpeechLine("m-prk-4", t("Fokus segar di awal hari$n", "Sharp focus early on$n"), t("Cek dulu urutan gerakan hari ini biar transisi antar alat makin mulus.", "Glance over today’s lineup so transitions between sets stay effortless.")),
                    sharedBanter[11]
                )
            }
        }

        if (ctx.timePhase == DayTimePhase.AFTERNOON) {
            return when (ctx.activeTimePose) {
                TimePhasePose.HYDRATE -> listOf(
                    MascotSpeechLine("a-hyd-1", t("Minum air dulu siang ini$n!", "Midday hydration check$n!"), if (ctx.allCompleted) t("Sesi siang sudah tuntas! Jangan lupa ganti cairan tubuh biar tetap segar.", "Afternoon workout cleared! Replenish fluids so you stay refreshed.") else t("Siang hari bikin cepat haus — teguk air dingin biar tenaga tetap penuh!", "Midday heat drains focus fast — take a cool sip to stay energized!")),
                    MascotSpeechLine("a-hyd-2", t("Jaga hidrasi siang$n", "Stay hydrated this afternoon$n"), t("Air putih cukup bikin otot dan fokus tetap tajam sepanjang siang.", "Steady water intake keeps your muscles and focus sharp all afternoon.")),
                    MascotSpeechLine("a-hyd-3", t("Segarkan diri sejenak$n", "Quick midday refresh$n"), t("Istirahat sebentar, minum air, lalu lanjutkan aktivitasmu.", "Take a brief pause, sip some water, and keep rolling.")),
                    MascotSpeechLine("a-hyd-4", t("Botol minum aman di dekatmu$n?", "Water bottle nearby$n?"), t("Tegukan kecil tapi rutin jauh lebih efektif buat stamina otot.", "Small regular sips keep your energy way steadier than gulping later.")),
                    sharedBanter[6]
                )
                TimePhasePose.SHADES -> listOf(
                    MascotSpeechLine("a-shd-1", t("Siang terik? Tetap santai$n!", "Bright sun? Stay cool$n!"), if (ctx.allCompleted) t("Semua $totalSets set beres di tengah hari! Mode santai aktif.", "All $totalSets sets knocked out! Afternoon chill mode unlocked.") else t("Matahari lagi tinggi-tingginya — pakai kacamata keren biar tetap adem!", "Sun’s high outside — keeping cool and composed all afternoon!")),
                    MascotSpeechLine("a-shd-2", t("Selamat Siang$n! Tetap kalem", "Good Afternoon$n! Looking sharp"), if (ctx.mood == MascotMood.RESTDAY) t("Siang santai di hari istirahat — nikmati waktumu tanpa buru-buru.", "Easy afternoon on a rest day — enjoy your pace with zero rush.") else t("Atur tempo latihanmu di siang hari agar napas tetap nyaman.", "Pace your afternoon sets calmly so your breathing stays smooth.")),
                    MascotSpeechLine("a-shd-3", t("Vibe siang lagi oke nih$n", "Afternoon vibe is on point$n"), t("Tenaga siang hari lagi stabil — mantap buat gerak atau sekadar santai.", "Midday energy feels steady — great for training or unwinding.")),
                    MascotSpeechLine("a-shd-4", t("Kalem tapi tetap konsisten$n", "Cool, calm & consistent$n"), t("Gaya santai nggak berarti kendor — tiap set rapi tetap bawa hasil besar.", "Staying chill never slows progress — clean reps always deliver.")),
                    sharedBanter[5]
                )
                TimePhasePose.FLEX -> listOf(
                    MascotSpeechLine("a-flx-1", t("Mode kuat aktif siang ini$n!", "Strength mode activated$n!"), if (ctx.allCompleted) t("Otot sudah kerja maksimal hari ini — mantap banget performamu!", "Muscles put in serious work today — rock-solid performance!") else t("Suhu tubuh siang hari biasanya paling pas buat angkat beban optimal.", "Afternoon body temperature is often prime time for peak strength!")),
                    MascotSpeechLine("a-flx-2", t("Fokus ke kualitas repetisi$n!", "Quality over speed$n!"), t("Turunkan beban terkontrol, dorong penuh — otot kerasa jauh lebih kena.", "Controlled eccentric, crisp drive — your muscles feel every rep.")),
                    MascotSpeechLine("a-flx-3", t("Tunjukkan tenaga terbaikmu$n!", "Bring your best power$n!"), t("Set demi set bikin tubuh makin kuat dari minggu lalu.", "Set by set you’re building stronger than last week.")),
                    MascotSpeechLine("a-flx-4", t("Siap hajar target $dayLabel$n!", "Ready to crush $dayLabel$n!"), t("Kunci postur, atur napas, dan biarkan konsistensimu bicara.", "Lock your posture, set your breath, and let consistency speak.")),
                    sharedBanter[1]
                )
                TimePhasePose.MUSIC -> listOf(
                    MascotSpeechLine("a-mus-1", t("Pasang playlist favoritmu$n!", "Cue up your hype track$n!"), t("Irama yang pas bikin jeda istirahat dan tempo latihan terasa jauh lebih asyik.", "The right beat makes every set and transition flow effortlessly.")),
                    MascotSpeechLine("a-mus-2", t("Masuk ke zona ritme$n~", "Dropping into the groove$n~"), if (ctx.allCompleted) t("Putar lagu santai buat pendinginan setelah menuntaskan semua set!", "Switch to a chill track for your post-workout cool-down!") else t("Nikmati alur latihanmu tanpa tekanan — satu lagu, satu set mantap.", "Enjoy your flow with zero pressure — one track, one clean set.")),
                    MascotSpeechLine("a-mus-3", t("Vibe latihan lagi enak nih$n", "Workout vibe feels dialed$n"), t("Mood bagus bikin beban terasa lebih ringan dan fokus tetap terjaga.", "A good vibe makes heavy sets feel smoother and keeps focus locked.")),
                    MascotSpeechLine("a-mus-4", t("Ikuti temponya pelan-pelan$n", "Ride the rhythm steady$n"), t("Kombinasi ritme napas dan musik bikin sesi sore cepat terasa selesai.", "Syncing your breath with your pace makes the whole session fly by.")),
                    sharedBanter[3]
                )
                TimePhasePose.BEAST -> listOf(
                    MascotSpeechLine("a-bst-1", t("Mode Beast nyala penuh$n!", "Beast mode ignited$n!"), t("Beban berat bukan musuh — itu cuma undangan buat tubuhmu jadi lebih kuat!", "Heavy weight isn’t the enemy — it’s an invitation to grow stronger!")),
                    MascotSpeechLine("a-bst-2", t("Ayo bakar kalori & keraguan$n!", "Burn through the doubt$n!"), t("Pasang mindset fokus, kunci grip, dan dorong repetisi terbaikmu hari ini.", "Lock your grip, dial in your gaze, and drive your cleanest reps today.")),
                    MascotSpeechLine("a-bst-3", t("Energi puncak sore ini$n!", "Peak afternoon fire$n!"), t("Otot sudah hangat maksimal — saat yang tepat buat tantangan set utama!", "Body’s fully warmed up — prime window to crush your top working sets!")),
                    MascotSpeechLine("a-bst-4", t("Nggak ada kata mundur$n!", "Zero backing down$n!"), t("Tetap jaga teknik rapi meski semangat lagi membara ya!", "Keep that technique razor-sharp even when the fire is cranked high!")),
                    sharedBanter[8]
                )
                TimePhasePose.SWEAT -> listOf(
                    MascotSpeechLine("a-swt-1", t("Keringat = bukti kerja nyata$n!", "Sweat is proof of work$n!"), t("Capek sedikit di siang hari tanda tubuhmu benar-benar sedang berkembang.", "Feeling that afternoon heat means your body is putting in real work.")),
                    MascotSpeechLine("a-swt-2", t("Lap keringat, lanjut pelan$n!", "Wipe the brow, keep moving$n!"), t("Atur napas lewat hidung — jangan lupa isi cairan dan elektrolit juga.", "Reset with steady nasal breaths — keep fluids and electrolytes topped up.")),
                    MascotSpeechLine("a-swt-3", t("Mantap, mesin badan lagi panas$n!", "Engine’s running hot today$n!"), t("Sesi yang bikin berkeringat selalu bikin mandi sore terasa dua kali lebih segar!", "A sweaty session makes that post-workout shower feel twice as good!")),
                    MascotSpeechLine("a-swt-4", t("Kerja kerasmu kerasa banget$n", "Serious hustle today$n"), t("Ambil jeda 10 detik kalau perlu — kualitas selalu menang dari terburu-buru.", "Take an extra ten seconds if needed — clean form always wins.")),
                    sharedBanter[11]
                )
                TimePhasePose.SMIRK -> listOf(
                    MascotSpeechLine("a-smk-1", t("Gampang kan set hari ini$n?", "Making it look easy$n?"), t("Gaya santai tapi angkanya naik terus — itu baru definisi progres elegan!", "Calm face, climbing numbers — that’s what smooth progress looks like!")),
                    MascotSpeechLine("a-smk-2", t("Aku tahu kamu bakal muncul$n", "Knew you’d show up$n"), t("Rasa malas siang hari nggak mempan kalau jadwalmu udah rapi di IronPulse.", "Afternoon sluggishness doesn’t stand a chance once your plan is locked in.")),
                    MascotSpeechLine("a-smk-3", t("Boleh juga konsistensimu$n~", "Impressive streak energy$n~"), t("Kalau lanjut begini terus, bulan depan pasti beda jauh performanya!", "Keep stacking days like this and next month’s numbers will fly!")),
                    MascotSpeechLine("a-smk-4", t("Siap bikin rekor kecil lagi$n?", "Ready to sneak in a PR$n?"), t("Pelan tapi pasti — diam-diam beban naik, badan makin bugar.", "Quiet work, steady climbs — let the results speak for themselves.")),
                    sharedBanter[4]
                )
                TimePhasePose.WHISTLE -> listOf(
                    MascotSpeechLine("a-whl-1", t("Siul santai sambil jaga tempo$n~", "Whistling through the pace$n~"), t("Latihan nggak harus tegang terus — nikmati prosesnya biar awet bertahun-tahun!", "Training doesn’t have to feel stiff — enjoy the rhythm for the long haul!")),
                    MascotSpeechLine("a-whl-2", t("Ringan langkah, mantap hasil$n", "Light mood, solid output$n"), t("Hati senang bikin hormon stres turun dan pemulihan otot jadi lebih cepat.", "A relaxed mood lowers stress and helps your muscles bounce back faster.")),
                    MascotSpeechLine("a-whl-3", t("Sore santai di $dayLabel$n~", "Breezy $dayLabel afternoon$n~"), t("Satu set selesai, senyum dulu, lanjut lagi — gampang banget ritmenya!", "Finish a set, smile, reset, repeat — keeping the flow effortless!")),
                    MascotSpeechLine("a-whl-4", t("Nggak usah terlalu serius, gerak aja$n", "Keep it light, keep moving$n"), t("Kadang sesi paling asyik justru datang saat kamu nggak kebanyakan mikir.", "Sometimes the best sessions happen when you stop overthinking and move.")),
                    sharedBanter[0]
                )
                else -> listOf(
                    MascotSpeechLine("a-cur-1", t("Lagi ngapain siang ini$n?", "How’s your afternoon going$n?"), if (ctx.allCompleted) t("Target $dayLabel sudah selesai 100%! Selamat menikmati sisa siangmu.", "$dayLabel target is 100% cleared! Enjoy the rest of your afternoon.") else t("Kalau sudah sempat istirahat makan siang, yuk cek daftar set di bawah!", "Once lunch settles, check out your afternoon sets whenever you’re ready!")),
                    MascotSpeechLine("a-cur-2", t("Cek ritme siang$n", "Midday rhythm check$n"), t("Aku lagi lihat-lihat progresmu hari ini — tetap santai tapi konsisten.", "Checking in on today’s rhythm — calm, steady, and consistent.")),
                    MascotSpeechLine("a-cur-3", t("Siang produktif di $dayLabel$n", "Productive ${dayLabel} afternoon$n"), t("Satu dua set sore atau siang tetap jauh lebih baik daripada diam saja.", "Even a couple clean afternoon sets beat skipping the day.")),
                    MascotSpeechLine("a-cur-4", t("Penasaran sama gerakan berikutnya$n?", "Checking the next move$n?"), t("Semua catatan beban terakhir tersimpan rapi biar kamu gampang naik progres.", "Your previous weights stay logged so progressive overload is effortless.")),
                    sharedBanter[7]
                )
            }
        }

        // NIGHT POSES
        return when (ctx.activeTimePose) {
            TimePhasePose.SLEEP -> listOf(
                MascotSpeechLine("n-slp-1", t("Zzz... waktunya tidur malam$n", "Zzz... sleepy night mode$n"), if (ctx.allCompleted) t("Sesi hari ini sudah tamat! Malam adalah waktu terbaik ototmu pulih dan tumbuh.", "Today’s session is wrapped! Night sleep is when your muscles rebuild best.") else t("Malam makin larut... kalau selesai gerak, jangan begadang biar besok segar!", "Getting late tonight... wrap up well and get deep sleep for tomorrow!")),
                MascotSpeechLine("n-slp-2", t("Mode ngantuk malam · Zzz$n", "Cozy night snooze · Zzz$n"), t("Hening malam hari cocok buat menurunkan detak jantung dan istirahat.", "Quiet night hours are perfect for winding down and resting deeply.")),
                MascotSpeechLine("n-slp-3", t("Istirahat nyenyak malam ini$n", "Rest well tonight$n"), t("Tidur cukup bantu hormon pemulihan bekerja maksimal semalaman.", "Quality sleep lets your body recover at full strength overnight.")),
                MascotSpeechLine("n-slp-4", t("Otot tumbuh saat tidur$n... Zzz", "Muscles grow while you sleep$n... Zzz"), t("Simpan tenagamu malam ini supaya besok bangun dengan badan lebih kuat.", "Bank deep rest tonight so you wake up stronger tomorrow.")),
                sharedBanter[9]
            )
            TimePhasePose.YAWN -> listOf(
                MascotSpeechLine("n-ywn-1", t("Hoamm... kebangun di malam hari$n", "Yawn... waking up a bit$n"), if (ctx.allCompleted) t("Baru melek bentar buat ngecek — semua setmu sudah aman selesai semua!", "Just peeking awake — all your sets for today are safely checked off!") else t("Mata agak berat nih, tapi kalau kamu masih mau latihan malam, aku tetap nemenin!", "Feeling a little sleepy, but if you’re training tonight I’m right with you!")),
                MascotSpeechLine("n-ywn-2", t("Ngantuk dikit, tapi tetap sigap$n", "Half-awake night watch$n"), t("Kalau latihan malam, utamakan gerakan terkontrol dan pendinginan setelahnya.", "If lifting late, keep reps controlled and take time to cool down after.")),
                MascotSpeechLine("n-ywn-3", t("Kebangun bentar ngecek kamu$n", "Waking up to check on you$n"), t("Jangan lupa matikan layar lebih awal kalau sudah selesai malam ini.", "Remember to wind down away from bright screens once you’re done tonight.")),
                MascotSpeechLine("n-ywn-4", t("Masih melek di jam segini$n?", "Still up this late$n?"), t("Bereskan yang penting saja lalu istirahat — pemulihan juga bagian dari latihan.", "Wrap up what matters and get some sleep — recovery is part of training.")),
                sharedBanter[2]
            )
            TimePhasePose.STARGAZE -> listOf(
                MascotSpeechLine("n-stg-1", t("Menatap langit malam yang tenang$n", "Stargazing through the night$n"), if (ctx.allCompleted) t("Hari ini sudah kamu lewati dengan hebat. Nikmati tenangnya malam!", "You handled today brilliantly. Soak in the quiet night sky!") else t("Malam yang hening pas banget buat evaluasi pelan dan siapkan rencana besok.", "Quiet night hours are perfect for reflecting and prepping tomorrow’s plan.")),
                MascotSpeechLine("n-stg-2", t("Malam berbintang di $dayLabel$n", "Starry $dayLabel evening$n"), t("Setiap sesi kecil yang kamu selesaikan perlahan membentuk versi terkuatmu.", "Every quiet session you complete steadily builds your strongest self.")),
                MascotSpeechLine("n-stg-3", t("Suasana malam begitu damai$n", "Peaceful late-night glow$n"), t("Lepaskan lelah seharian — besok kita mulai babak baru lagi.", "Let go of the day’s tension — tomorrow brings a fresh chapter.")),
                MascotSpeechLine("n-stg-4", t("Refleksi singkat sebelum tidur$n", "Quiet night reflection$n"), t("Cek jadwal alarm besok biar bangun pagi sudah siap tanpa panik.", "Double-check tomorrow’s alarm so your morning starts smooth and stress-free.")),
                sharedBanter[8]
            )
            TimePhasePose.ZEN -> listOf(
                MascotSpeechLine("n-zen-1", t("Mode relaksasi & pemulihan$n", "Calm recovery & zen mode$n"), t("Tarik napas 4 detik, tahan sebentar, embuskan 6 detik — otot langsung rileks.", "Inhale 4 seconds, pause, exhale 6 — feel your shoulders drop right away.")),
                MascotSpeechLine("n-zen-2", t("Tenangkan ritme malam ini$n", "Unwinding for the night$n"), if (ctx.allCompleted) t("Tubuh sudah bekerja keras hari ini, sekarang beri ruang buat pulih total.", "Your body worked hard today — give it calm space to recover fully.") else t("Peregangan ringan lima menit malam ini bikin tidur jauh lebih nyenyak.", "Five minutes of gentle stretching tonight makes sleep noticeably deeper.")),
                MascotSpeechLine("n-zen-3", t("Napas tenang, pikiran jernih$n", "Steady breath, clear mind$n"), t("Keseimbangan antara kerja keras dan istirahat tenang adalah kunci jangka panjang.", "Balancing hard effort with calm recovery is the secret to long-term gains.")),
                MascotSpeechLine("n-zen-4", t("Waktunya isi ulang penuh$n", "Full-battery night recharge$n"), t("Aku tetap tenang di sini menemani penutup harimu.", "Resting quietly right here as you wrap up your evening.")),
                sharedBanter[9]
            )
            TimePhasePose.COZY -> listOf(
                MascotSpeechLine("n-czy-1", t("Mode selimut nyaman aktif$n~", "Cozy wind-down mode$n~"), t("Udara malam mulai dingin — saatnya bikin badan hangat dan nyaman sebelum tidur.", "Night air is cooling down — time to get warm and cozy before bed.")),
                MascotSpeechLine("n-czy-2", t("Nyaman banget malam ini$n", "Extra cozy vibes tonight$n"), t("Tutup hari tanpa beban pikiran — besok kamu bangun dengan energi baru.", "Close the day with a light mind — tomorrow brings fresh energy.")),
                MascotSpeechLine("n-czy-3", t("Waktunya rebahan berkualitas$n", "Quality rest unlocked$n"), t("Setelah gerak seharian, bantal empuk adalah hadiah terbaik malam ini.", "After putting in the hours today, a good pillow is well earned.")),
                MascotSpeechLine("n-czy-4", t("Hangat, tenang, dan lega$n", "Warm, calm, and settled$n"), t("Jangan lupa minum sedikit air sebelum tidur biar bangun pagi nggak kering.", "Take a small sip of water before bed so you wake up feeling fresh.")),
                sharedBanter[0]
            )
            TimePhasePose.DREAM -> listOf(
                MascotSpeechLine("n-drm-1", t("Mimpi cetak PR baru besok$n...", "Dreaming of new PRs$n..."), t("Sambil tidur, otak juga memperkuat memori gerakan yang baru kamu latih hari ini!", "While you sleep, your brain actually consolidates today’s movement patterns!")),
                MascotSpeechLine("n-drm-2", t("Lagi membayangkan target bulan depan$n", "Visualizing next month’s gains$n"), t("Semua pencapaian besar selalu dimulai dari rutinitas malam yang terjaga.", "Every big milestone starts with steady daily habits and good sleep.")),
                MascotSpeechLine("n-drm-3", t("Selamat beristirahat dalam mimpi indah$n", "Sweet dreams & strong recovery$n"), t("Biarkan ototmu memperbaiki diri pelan-pelan sepanjang malam.", "Let your muscles repair and grow quietly through the night.")),
                MascotSpeechLine("n-drm-4", t("Awan malam penuh ketenangan$n", "Floating into peaceful sleep$n"), t("Besok alarm IronPulse siap bangunkan kamu di waktu paling pas!", "Tomorrow your IronPulse alarm will be ready right on schedule!")),
                sharedBanter[1]
            )
            TimePhasePose.MOONLIT -> listOf(
                MascotSpeechLine("n-mnl-1", t("Di bawah cahaya bulan yang teduh$n", "Under a calm moonlit glow$n"), t("Malam yang tenang bikin kamu bisa melihat seberapa jauh kamu sudah berkembang.", "Quiet moonlight is a nice reminder of how far your consistency has come.")),
                MascotSpeechLine("n-mnl-2", t("Bulan sudah tinggi di $dayLabel$n", "Moon’s high over $dayLabel$n"), t("Kalau masih latihan malam, jaga intensitas terukur supaya tidur tetap pulas.", "If training late, keep intensity steady so you still sleep like a rock.")),
                MascotSpeechLine("n-mnl-3", t("Cahaya malam yang menenangkan$n", "Serene moonlit stillness$n"), t("Tarik napas pelan — hari ini kamu sudah berusaha sebaik mungkin.", "Breathe easy — you gave today an honest effort.")),
                MascotSpeechLine("n-mnl-4", t("Penjaga malammu tetap standby$n", "Your night companion is here$n"), t("Tenang aja, jadwal besok sudah tersimpan aman rapi di aplikasi.", "Rest easy knowing tomorrow’s schedule is saved and ready to go.")),
                sharedBanter[4]
            )
            TimePhasePose.RECHARGE -> listOf(
                MascotSpeechLine("n-rch-1", t("Baterai tubuh sedang diisi ulang$n", "Body battery recharging$n"), t("Tidur 7–8 jam itu seperti charger cepat alami buat kekuatan dan fokusmu.", "Seven to eight hours of sleep is nature’s fastest strength charger.")),
                MascotSpeechLine("n-rch-2", t("Mode hemat energi aktif malam ini$n", "Overnight recovery charging$n"), t("Simpan energi di malam hari biar besok set pertamamu langsung meledak!", "Bank your energy tonight so tomorrow’s first set feels effortless!")),
                MascotSpeechLine("n-rch-3", t("Isi penuh 100% buat besok$n!", "Charging to 100% for tomorrow$n!"), t("Serat otot lagi dibangun ulang sekarang — kasih waktu istirahat yang layak.", "Muscle fibers are rebuilding right now — give them the rest they earned.")),
                MascotSpeechLine("n-rch-4", t("Recovery cerdas = progres cepat$n", "Smart recovery = faster gains$n"), t("Atlet terbaik tahu kapan harus dorong keras dan kapan harus charge penuh.", "The best athletes know when to push hard and when to recharge fully.")),
                sharedBanter[9]
            )
            else -> listOf(
                MascotSpeechLine(
                    "n-chl-1",
                    t("Malam tenang di $dayLabel$n", "Peaceful $dayLabel night$n"),
                    when {
                        ctx.mood == MascotMood.RESTDAY -> t("Malam hari istirahat yang damai — isi ulang energi penuh untuk esok hari.", "Calm rest-day evening — recharge your batteries completely for tomorrow.")
                        ctx.allCompleted -> t("Semua $totalSets set hari ini sudah tuntas! Malam yang tenang buatmu.", "All $totalSets sets done today! Enjoy a well-earned peaceful night.")
                        else -> t("Suasana malam lagi kalem — cocok buat latihan santai tanpa terburu-buru.", "Calm night atmosphere — great for an unhurried evening session.")
                    }
                ),
                MascotSpeechLine("n-chl-2", t("Selamat Malam$n! Suasana adem", "Good Evening$n! Calm night"), t("Langit sudah gelap, tetap jaga napas rileks di penghujung hari.", "Night has settled in — keep your breathing relaxed at the end of the day.")),
                MascotSpeechLine("n-chl-3", t("Penutup hari yang nyaman$n", "Cozy end to the day$n"), t("Minum air hangat atau peregangan ringan sebelum tidur terasa sangat pas.", "Warm water or gentle stretching feels great right before sleep.")),
                MascotSpeechLine("n-chl-4", t("Malam santai penuh syukur$n", "Easy evening unwind$n"), t("Apapun progres hari ini, kamu sudah melangkah maju. Istirahat yang baik ya!", "Whatever you achieved today, you moved forward. Have a restful night!")),
                sharedBanter[11]
            )
        }
    }
}
