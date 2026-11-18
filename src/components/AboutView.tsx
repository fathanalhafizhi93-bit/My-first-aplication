import { useI18n } from '../lib/i18n';

export function AboutView() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          About IronPulse
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          {t(
            'Informasi pengembang, konsep, rilis, dan ringkasan aplikasi.',
            'Developer credits, concept notes, release info, and app overview.'
          )}
        </p>
      </div>

      <section className="glass-surface rounded-2xl border border-[#C8FF2E]/30 p-6 sm:p-8">
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

      <section className="glass-surface rounded-2xl border border-white/12 p-6 space-y-4">
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
