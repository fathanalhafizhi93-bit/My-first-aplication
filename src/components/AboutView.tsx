import { useI18n } from '../lib/i18n';

interface UpcomingFeatureItem {
  id: string;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  stageId: 'Berikutnya' | 'Dalam Desain' | 'Eksplorasi';
  stageEn: 'Up Next' | 'In Design' | 'Exploring';
}

const UPCOMING_FEATURES: UpcomingFeatureItem[] = [
  {
    id: 'progress-charts',
    titleId: 'Grafik Progres Beban & Rekor Pribadi (PR)',
    titleEn: 'Load Progression Charts & Automatic PRs',
    descId:
      'Visualisasi kenaikan beban maksimal per gerakan serta penanda otomatis saat menembus rekor pribadi baru.',
    descEn:
      'Interactive weight progression curves per exercise and automatic badges whenever you hit a new Personal Record.',
    stageId: 'Berikutnya',
    stageEn: 'Up Next',
  },
  {
    id: 'one-rm-target',
    titleId: 'Kalkulator 1RM & Target Beban Otomatis',
    titleEn: '1RM Calculator & Smart Weight Targets',
    descId:
      'Estimasi kekuatan maksimal (1-Rep Max) dan rekomendasi kenaikan beban bertahap dari set terakhir Anda.',
    descEn:
      'Estimate 1-Rep Max strength and get gradual progressive overload suggestions from your last logged set.',
    stageId: 'Berikutnya',
    stageEn: 'Up Next',
  },
  {
    id: 'templates-export',
    titleId: 'Template Program & Ekspor Catatan',
    titleEn: 'Program Templates & Log Export',
    descId:
      'Paket jadwal siap pakai (Push/Pull/Legs, Upper/Lower) serta ekspor ringkasan riwayat latihan.',
    descEn:
      'Ready-to-use training splits (Push/Pull/Legs, Upper/Lower) plus workout log summary exports.',
    stageId: 'Dalam Desain',
    stageEn: 'In Design',
  },
  {
    id: 'native-custom-sound',
    titleId: 'Nada Dering Kustom di Notifikasi APK',
    titleEn: 'Custom Ringtones for Android Notifications',
    descId:
      'Dukungan menyambungkan file audio unggahan pribadi langsung sebagai suara channel alarm background Android.',
    descEn:
      'Route your personally uploaded audio files directly into the Android background alarm notification channel.',
    stageId: 'Dalam Desain',
    stageEn: 'In Design',
  },
  {
    id: 'offline-sync-queue',
    titleId: 'Mode Latihan Offline Penuh di Gym',
    titleEn: 'Full Offline Gym Mode & Sync Queue',
    descId:
      'Pencatatan set dan timer tetap berjalan mulus tanpa sinyal di ruang gym, lalu tersinkron otomatis saat terhubung kembali.',
    descEn:
      'Log sets and run timers seamlessly without signal in basement gyms, with automatic cloud sync once reconnected.',
    stageId: 'Eksplorasi',
    stageEn: 'Exploring',
  },
];

export function AboutView() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          {t('About IronPulse & Fitur Upcoming', 'About IronPulse & Upcoming')}
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          {t(
            'Informasi pengembang, konsep, rilis, dan rencana pembaruan fitur berikutnya.',
            'Developer credits, concept notes, release info, and upcoming feature roadmap.'
          )}
        </p>
      </div>

      <section className="rounded-2xl border border-[#C8FF2E]/30 bg-[#13161C] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8FF2E]">
          {t('Kredit & Pembuat', 'Credits & Creators')}
        </p>
        <p
          className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-[#F4F5F7] sm:text-3xl"
          style={{ textWrap: 'balance' }}
        >
          Yah gw di kacangin hiks hiks 😭
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">
              {t('Pembuat Aplikasi', 'App Builder')}
            </p>
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
              {t('Daftar Fitur Mendatang (Upcoming)', 'Upcoming Features Roadmap')}
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {t(
                'Roadmap pengembangan fitur berikutnya untuk IronPulse Web & APK Android.',
                'Planned features on the roadmap for IronPulse Web & Android APK.'
              )}
            </p>
          </div>
          <span className="font-mono text-xs font-semibold tabular-nums text-[#C8FF2E]">
            {UPCOMING_FEATURES.length} {t('Rencana Fitur', 'Planned Items')}
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
                  {t(item.titleId, item.titleEn)}
                </p>
                <p className="text-xs leading-relaxed text-[#9CA3AF]">
                  {t(item.descId, item.descEn)}
                </p>
              </div>

              <span
                className={`shrink-0 font-mono text-xs font-semibold whitespace-nowrap ${
                  item.stageId === 'Berikutnya'
                    ? 'text-[#C8FF2E]'
                    : item.stageId === 'Dalam Desain'
                      ? 'text-[#38BDF8]'
                      : 'text-[#9CA3AF]'
                }`}
              >
                {t(item.stageId, item.stageEn)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          {t('Tentang Aplikasi', 'About the App')}
        </h2>
        <p className="text-sm leading-relaxed text-[#D1D5DB]">
          {t(
            'IronPulse dirancang untuk membantu konsistensi jadwal latihan gym Anda setiap minggu, lengkap dengan alarm hari aktif, unggahan ringtone kustom, panduan daftar gerakan harian, catatan beban/set/repetisi, riwayat kalender sesi, serta timer istirahat antar set yang tersinkronisasi ke Cloud.',
            'IronPulse is built to keep your weekly gym schedule consistent—featuring daily workout alarms, custom ringtones, daily movement plans, weight/set/rep logging, a workout history calendar, and cloud-synced rest timers.'
          )}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#9CA3AF]">
          <span>{t('Jadwal Mingguan', 'Weekly Schedule')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('Kalender Riwayat', 'History Calendar')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('Ringtone Kustom', 'Custom Ringtones')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('Alarm Background Android', 'Android Background Alarms')}</span>
        </div>
      </section>
    </div>
  );
}
