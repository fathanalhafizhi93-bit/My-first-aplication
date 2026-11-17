interface UpcomingFeatureItem {
  id: string;
  title: string;
  description: string;
  stage: 'Berikutnya' | 'Dalam Desain' | 'Eksplorasi';
}

const UPCOMING_FEATURES: UpcomingFeatureItem[] = [
  {
    id: 'one-rm-target',
    title: 'Kalkulator 1RM & Target Beban Otomatis',
    description:
      'Estimasi kekuatan maksimal (1-Rep Max) dan rekomendasi kenaikan beban bertahap dari set terakhir Anda.',
    stage: 'Berikutnya',
  },
  {
    id: 'auto-pr',
    title: 'Deteksi Rekor Pribadi (PR) Otomatis',
    description:
      'Penanda pencapaian otomatis dan ringkasan rekor setiap kali beban atau volume latihan menembus rekor baru.',
    stage: 'Berikutnya',
  },
  {
    id: 'templates-export',
    title: 'Template Program & Ekspor Catatan',
    description:
      'Paket jadwal siap pakai (Push/Pull/Legs, Upper/Lower) serta ekspor ringkasan riwayat latihan.',
    stage: 'Dalam Desain',
  },
  {
    id: 'native-custom-sound',
    title: 'Nada Dering Kustom di Notifikasi APK',
    description:
      'Dukungan menyambungkan file audio unggahan pribadi langsung sebagai suara channel alarm background Android.',
    stage: 'Dalam Desain',
  },
  {
    id: 'offline-sync-queue',
    title: 'Mode Latihan Offline Penuh di Gym',
    description:
      'Pencatatan set dan timer tetap berjalan mulus tanpa sinyal di ruang gym, lalu tersinkron otomatis saat terhubung kembali.',
    stage: 'Eksplorasi',
  },
];

export function AboutView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          About IronPulse &amp; Fitur Upcoming
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Informasi pengembang, konsep, rilis, dan rencana pembaruan fitur berikutnya.
        </p>
      </div>

      <section className="rounded-2xl border border-[#C8FF2E]/30 bg-[#13161C] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8FF2E]">
          Kredit &amp; Pembuat
        </p>
        <p
          className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-[#F4F5F7] sm:text-3xl"
          style={{ textWrap: 'balance' }}
        >
          Yah gw di kacangin hiks hiks 😭
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">Pembuat Aplikasi</p>
            <p className="mt-1 text-base font-semibold text-[#F4F5F7]">
              Antigravity (Gemini)
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">Concept, Release &amp; Tester</p>
            <p className="mt-1 text-base font-semibold text-[#F4F5F7]">
              Fathan Alhafizhi
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">Scripter</p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#C8FF2E]">
              fathan (12%), some ai (88%)
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Features Roadmap */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-6">
        <div className="flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
              Daftar Fitur Mendatang (Upcoming)
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Roadmap pengembangan fitur berikutnya untuk IronPulse Web &amp; APK Android.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold tabular-nums text-[#C8FF2E]">
            {UPCOMING_FEATURES.length} Rencana Fitur
          </span>
        </div>

        <ul className="divide-y divide-white/10">
          {UPCOMING_FEATURES.map((item, idx) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 py-4 first:pt-4 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-[#F4F5F7]">
                  <span className="mr-2 font-mono text-xs text-[#9CA3AF] tabular-nums">
                    0{idx + 1}
                  </span>
                  {item.title}
                </p>
                <p className="text-xs leading-relaxed text-[#9CA3AF]">
                  {item.description}
                </p>
              </div>

              <span
                className={`shrink-0 font-mono text-xs font-semibold whitespace-nowrap ${
                  item.stage === 'Berikutnya'
                    ? 'text-[#C8FF2E]'
                    : item.stage === 'Dalam Desain'
                      ? 'text-[#38BDF8]'
                      : 'text-[#9CA3AF]'
                }`}
              >
                {item.stage}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          Tentang Aplikasi
        </h2>
        <p className="text-sm leading-relaxed text-[#D1D5DB]">
          IronPulse dirancang untuk membantu konsistensi jadwal latihan gym Anda setiap minggu,
          lengkap dengan alarm hari aktif, unggahan ringtone kustom, panduan daftar gerakan harian,
          catatan beban/set/repetisi, riwayat progres kalender &amp; grafik, serta timer istirahat
          antar set yang tersinkronisasi ke Cloud.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#9CA3AF]">
          <span>Jadwal Mingguan</span>
          <span aria-hidden="true">·</span>
          <span>Riwayat &amp; Grafik</span>
          <span aria-hidden="true">·</span>
          <span>Ringtone Kustom</span>
          <span aria-hidden="true">·</span>
          <span>Alarm Background Android</span>
        </div>
      </section>
    </div>
  );
}
