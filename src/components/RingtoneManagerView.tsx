import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Play,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Square,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { audioEngine, BUILTIN_RINGTONES } from '../lib/audioEngine';
import { useI18n } from '../lib/i18n';
import {
  AndroidAlarmDiagnostics,
  getAndroidAlarmDiagnostics,
  isNativeAndroid,
  openAndroidExactAlarmSettings,
  requestAndroidNotificationPermission,
  scheduleAndroidTestNotification,
} from '../lib/nativeAlarmBridge';
import { CustomRingtone, UserProfile } from '../types/gym';
import { ConfirmDeleteModal } from './GlassModal';

interface RingtoneManagerViewProps {
  profile: UserProfile;
  customRingtones: CustomRingtone[];
  embeddedInSettings?: boolean;
  onUpdateProfile: (
    patch: Partial<
      Pick<
        UserProfile,
        | 'defaultRingtoneId'
        | 'restRingtoneId'
        | 'volume'
        | 'notificationsEnabled'
        | 'snoozeMinutes'
        | 'autoStartRestTimer'
      >
    >
  ) => Promise<void>;
  onUploadRingtone: (file: File, customName?: string) => Promise<CustomRingtone>;
  onDeleteRingtone: (id: string) => Promise<void>;
}

export function RingtoneManagerView({
  profile,
  customRingtones,
  embeddedInSettings = false,
  onUpdateProfile,
  onUploadRingtone,
  onDeleteRingtone,
}: RingtoneManagerViewProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomRingtone | null>(null);

  const [androidDiag, setAndroidDiag] = useState<AndroidAlarmDiagnostics | null>(null);
  const [testNotifStatus, setTestNotifStatus] = useState<string | null>(null);
  const [schedulingTest, setSchedulingTest] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );
  const isPreviewingRef = useRef(false);

  const runningNativeAndroid = isNativeAndroid();
  const secUnit = t('d', 's');

  const refreshAndroidDiagnostics = useCallback(async () => {
    if (!runningNativeAndroid) return;
    const diag = await getAndroidAlarmDiagnostics();
    setAndroidDiag(diag);
  }, [runningNativeAndroid]);

  useEffect(() => {
    void refreshAndroidDiagnostics();
  }, [refreshAndroidDiagnostics]);

  useEffect(() => {
    return () => {
      if (isPreviewingRef.current) {
        audioEngine.stop();
        isPreviewingRef.current = false;
      }
    };
  }, []);

  const handlePreview = async (id: string) => {
    if (playingId === id) {
      audioEngine.stop();
      isPreviewingRef.current = false;
      setPlayingId(null);
      return;
    }
    isPreviewingRef.current = true;
    setPlayingId(id);
    await audioEngine.unlock();
    await audioEngine.play(id, {
      volume: profile.volume,
      loop: false,
      customRingtones,
      onEnded: () => {
        isPreviewingRef.current = false;
        setPlayingId((curr) => (curr === id ? null : curr));
      },
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);
    try {
      const created = await onUploadRingtone(file, customTitle);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadSuccess(
        created.storageMode === 'cloud'
          ? t(
              `Ringtone "${created.name}" tersimpan & tersinkron ke Cloud.`,
              `Ringtone "${created.name}" saved & synced to Cloud.`
            )
          : t(
              `Ringtone "${created.name}" tersimpan lokal di browser ini (ukuran > 450 KB).`,
              `Ringtone "${created.name}" saved locally on this device (> 450 KB).`
            )
      );
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : t('Gagal mengunggah file audio.', 'Failed to upload audio file.')
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  const handleRequestNotifications = async () => {
    if (runningNativeAndroid) {
      const res = await requestAndroidNotificationPermission();
      await onUpdateProfile({ notificationsEnabled: res === 'granted' });
      await refreshAndroidDiagnostics();
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    await onUpdateProfile({ notificationsEnabled: perm === 'granted' });
  };

  const handleOpenExactSettings = async () => {
    await openAndroidExactAlarmSettings();
    await refreshAndroidDiagnostics();
  };

  const handleScheduleTestNotification = async () => {
    setSchedulingTest(true);
    setTestNotifStatus(null);
    try {
      const res = await scheduleAndroidTestNotification(5);
      if (!res.granted) {
        setTestNotifStatus(
          t(
            'Izin notifikasi Android belum diberikan. Aktifkan izin terlebih dahulu.',
            'Android notification permission has not been granted yet. Please allow it first.'
          )
        );
      } else {
        setTestNotifStatus(
          res.exact
            ? t(
                'Tes alarm dijadwalkan 5 detik lagi (mode Exact Alarm aktif). Anda bisa keluar aplikasi atau kunci layar sekarang.',
                'Test alarm scheduled in 5 seconds (Exact Alarm active). You can exit the app or lock your screen now.'
              )
            : t(
                'Tes notifikasi dijadwalkan 5 detik lagi. Aktifkan izin Exact Alarm agar waktu pemicuan selalu tepat saat layar mati.',
                'Test notification scheduled in 5 seconds. Enable Exact Alarm permission for reliable timing when screen is off.'
              )
        );
      }
      await refreshAndroidDiagnostics();
    } catch (err) {
      setTestNotifStatus(
        err instanceof Error
          ? err.message
          : t('Gagal menjadwalkan tes notifikasi Android.', 'Failed to schedule Android test notification.')
      );
    } finally {
      setSchedulingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {!embeddedInSettings && (
        <div className="border-b border-white/10 pb-5">
          <span
            aria-hidden="true"
            className="mb-2 block h-[3px] w-10 rounded-full bg-pulse"
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            {t('Pengaturan Ringtone & Audio Alarm', 'Ringtones & Alarm Audio Settings')}
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {t(
              'Pilih nada alarm bawaan atau unggah file musik/audio Anda sendiri untuk pengingat jadwal gym dan penanda selesai istirahat.',
              'Choose built-in alarm tones or upload your own audio files for workout reminders and rest completion.'
            )}
          </p>
        </div>
      )}

      {/* Android APK Native Background Alarm Diagnostics */}
      {!embeddedInSettings && runningNativeAndroid && (
        <section className="glass-surface rounded-2xl border border-pulse/30 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-pulse" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
                  {t('Status Alarm Background Android', 'Android Background Alarm Status')}
                </h2>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  {t(
                    'Pastikan izin notifikasi dan Exact Alarm aktif agar pengingat gym berbunyi tepat waktu saat aplikasi ditutup atau layar HP terkunci.',
                    'Ensure Notification & Exact Alarm permissions are active so reminders fire accurately even when closed or locked.'
                  )}
                </p>
              </div>
            </div>

            {androidDiag && (
              <span className="font-mono text-xs font-semibold tabular-nums text-pulse">
                {androidDiag.pendingCount} {t('Jadwal Terdaftar', 'Pending Alarms')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Notification Permission */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {androidDiag?.notificationPermission === 'granted' ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#FBBF24]" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F4F5F7]">
                    {t('Izin Notifikasi', 'Notification Permission')}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {androidDiag?.notificationPermission === 'granted'
                      ? t('Aktif & siap tampil', 'Granted & ready')
                      : t('Belum diizinkan', 'Not granted yet')}
                  </p>
                </div>
              </div>
              {androidDiag?.notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="min-h-[40px] shrink-0 rounded-lg bg-pulse px-3 text-xs font-bold text-pulse-fg"
                >
                  {t('Izinkan', 'Allow')}
                </button>
              )}
            </div>

            {/* Exact Alarm Permission */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {androidDiag?.exactAlarmPermission === 'granted' ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#FBBF24]" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F4F5F7]">Exact Alarm</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {androidDiag?.exactAlarmPermission === 'granted'
                      ? t('Presisi tepat waktu', 'Exact timing active')
                      : t('Perlu diaktifkan di sistem', 'Enable in system settings')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenExactSettings}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E26] px-3 text-xs font-semibold text-[#F4F5F7] hover:bg-[#252B36]"
              >
                <Settings className="h-3.5 w-3.5" />
                {t('Atur', 'Settings')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#9CA3AF]">
              {t(
                'Channel notifikasi Android menggunakan audio alarm bawaan IronPulse berprioritas tinggi.',
                'Android notification channel uses high-priority native IronPulse alarm audio.'
              )}
            </p>
            <button
              type="button"
              disabled={schedulingTest}
              onClick={handleScheduleTestNotification}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-pulse px-4 py-2 text-xs font-bold text-pulse-fg hover:brightness-105 disabled:opacity-60"
            >
              <BellRing className="h-4 w-4" />
              {schedulingTest
                ? t('Menjadwalkan...', 'Scheduling...')
                : t('Uji Notifikasi 5 Detik', '5s Notification Test')}
            </button>
          </div>

          {testNotifStatus && (
            <p className="text-xs font-medium text-pulse">{testNotifStatus}</p>
          )}
        </section>
      )}

      {/* Master Audio & Behavior Controls */}
      {!embeddedInSettings && (
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          {t('Preferensi Suara & Notifikasi', 'Sound & Notification Preferences')}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#D1D5DB]">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-pulse" />
                {t('Volume Alarm & Timer', 'Alarm & Timer Volume')}
              </span>
              <span className="font-mono tabular-nums text-pulse">
                {Math.round(profile.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={profile.volume}
              onChange={(e) =>
                onUpdateProfile({ volume: parseFloat(e.target.value) })
              }
              className="h-2 w-full cursor-pointer accent-pulse"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[#D1D5DB]">
              {t('Durasi Tunda Alarm (Snooze)', 'Snooze Duration')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateProfile({ snoozeMinutes: mins })}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold font-mono tabular-nums transition-colors ${
                    profile.snoozeMinutes === mins
                      ? 'border-pulse bg-pulse text-pulse-fg'
                      : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  {mins} {t('Menit', 'Min')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F4F5F7]">
                {t('Timer Istirahat Otomatis', 'Auto-Start Rest Timer')}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {t(
                  'Mulai hitung mundur saat set dicentang selesai.',
                  'Start rest countdown whenever a set is checked off.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateProfile({ autoStartRestTimer: !profile.autoStartRestTimer })
              }
              className={`min-h-[38px] shrink-0 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
                profile.autoStartRestTimer
                  ? 'bg-pulse text-pulse-fg'
                  : 'border border-white/15 bg-[#1A1E26] text-[#9CA3AF]'
              }`}
            >
              {profile.autoStartRestTimer ? t('Aktif', 'Active') : 'Manual'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F4F5F7]">
                {runningNativeAndroid
                  ? t('Notifikasi Perangkat', 'Device Notifications')
                  : t('Notifikasi Desktop', 'Desktop Notifications')}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {(runningNativeAndroid
                  ? androidDiag?.notificationPermission === 'granted'
                  : notifPermission === 'granted')
                  ? t('Izin notifikasi sudah aktif.', 'Notifications are allowed.')
                  : t(
                      'Tampilkan popup pengingat saat jam tiba.',
                      'Show reminder alert popup when alarm triggers.'
                    )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestNotifications}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
                (runningNativeAndroid
                  ? androidDiag?.notificationPermission === 'granted'
                  : notifPermission === 'granted')
                  ? 'border border-[#16A34A]/50 bg-[#16A34A]/20 text-[#4ADE80]'
                  : 'bg-[#1A1E26] border border-white/15 text-[#F4F5F7] hover:bg-[#252C38]'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              {(runningNativeAndroid
                ? androidDiag?.notificationPermission === 'granted'
                : notifPermission === 'granted')
                ? t('Diizinkan', 'Allowed')
                : t('Izinkan', 'Allow')}
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Upload Custom Ringtone */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            {t('Unggah Ringtone Sendiri', 'Upload Custom Ringtone')}
          </h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {t(
              'Format didukung: MP3, WAV, OGG, M4A. File ≤ 450 KB otomatis tersinkron ke Cloud; file lebih besar tersimpan aman di browser perangkat ini.',
              'Supported: MP3, WAV, OGG, M4A. Files ≤ 450 KB sync to Cloud automatically; larger files stay stored locally on this device.'
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            maxLength={80}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={t(
              'Nama ringtone (opsional, misal: Lagu Semangat Pagi)',
              'Ringtone name (optional, e.g. Morning Pump)'
            )}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/*"
            onChange={handleFileSelected}
            className="hidden"
            id="ringtone-upload-input"
          />
          <label
            htmlFor="ringtone-upload-input"
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg hover:brightness-105 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            {uploading
              ? t('Memproses Audio...', 'Processing Audio...')
              : t('Pilih File Audio', 'Choose Audio File')}
          </label>
        </div>

        {uploadError && (
          <p className="text-xs font-medium text-[#FCA5A5]">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-xs font-medium text-[#86EFAC]">{uploadSuccess}</p>
        )}

        {/* Uploaded Ringtones List */}
        {customRingtones.length > 0 && (
          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#0A0B0E]">
            {customRingtones.map((rt) => {
              const isPlaying = playingId === rt.id;
              const isMain = profile.defaultRingtoneId === rt.id;
              const isRest = profile.restRingtoneId === rt.id;

              return (
                <div
                  key={rt.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#F4F5F7]">{rt.name}</p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">
                      {Math.round(rt.sizeBytes / 1024)} KB ·{' '}
                      {rt.durationSeconds > 0 ? `${rt.durationSeconds}${secUnit} · ` : ''}
                      {rt.storageMode === 'cloud'
                        ? t('Tersinkron ke Cloud', 'Synced to Cloud')
                        : t('Lokal di Perangkat Ini', 'Local on This Device')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreview(rt.id)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E26] px-3 py-1.5 text-xs font-semibold text-[#F4F5F7] hover:bg-[#252B36]"
                    >
                      {isPlaying ? (
                        <>
                          <Square className="h-3.5 w-3.5 fill-current text-pulse" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current text-pulse" />
                          {t('Putar', 'Play')}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ defaultRingtoneId: rt.id })}
                      className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                        isMain
                          ? 'bg-pulse text-pulse-fg'
                          : 'border border-white/10 bg-[#13161C] text-[#D1D5DB] hover:border-white/30'
                      }`}
                    >
                      {isMain && <Check className="h-3.5 w-3.5" />}
                      {t('Alarm Gym', 'Gym Alarm')}
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ restRingtoneId: rt.id })}
                      className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                        isRest
                          ? 'bg-[#16A34A] text-white'
                          : 'border border-white/10 bg-[#13161C] text-[#D1D5DB] hover:border-white/30'
                      }`}
                    >
                      {isRest && <Check className="h-3.5 w-3.5" />}
                      {t('Nada Istirahat', 'Rest Tone')}
                    </button>

                    <button
                      type="button"
                      aria-label={`${t('Hapus ringtone', 'Delete ringtone')} ${rt.name}`}
                      onClick={() => setDeleteTarget(rt)}
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-white/10 bg-[#13161C] text-[#9CA3AF] hover:border-[#DC2626]/60 hover:text-[#FCA5A5]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Built-in Synthesized Ringtones */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          {t('Nada Alarm Bawaan IronPulse', 'Built-in IronPulse Alarm Tones')}
        </h2>

        <div className="glass-surface divide-y divide-white/10 rounded-2xl border border-white/12">
          {BUILTIN_RINGTONES.map((rt) => {
            const isPlaying = playingId === rt.id;
            const isMain = profile.defaultRingtoneId === rt.id;
            const isRest = profile.restRingtoneId === rt.id;

            return (
              <div
                key={rt.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#F4F5F7]">{rt.name}</p>
                  <p className="mt-0.5 text-xs text-[#9CA3AF]">
                    {rt.patternLabel} · {rt.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePreview(rt.id)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E26] px-3 py-1.5 text-xs font-semibold text-[#F4F5F7] hover:bg-[#252B36]"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current text-pulse" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current text-pulse" />
                        {t('Putar', 'Play')}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateProfile({ defaultRingtoneId: rt.id })}
                    className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                      isMain
                        ? 'bg-pulse text-pulse-fg'
                        : 'border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/30'
                    }`}
                  >
                    {isMain && <Check className="h-3.5 w-3.5" />}
                    {t('Alarm Gym', 'Gym Alarm')}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateProfile({ restRingtoneId: rt.id })}
                    className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                      isRest
                        ? 'bg-[#16A34A] text-white'
                        : 'border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/30'
                    }`}
                  >
                    {isRest && <Check className="h-3.5 w-3.5" />}
                    {t('Nada Istirahat', 'Rest Tone')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={t('Hapus Ringtone?', 'Delete Ringtone?')}
        itemName={deleteTarget?.name || ''}
        description={t(
          'File audio ringtone kustom ini akan dihapus dari daftar Anda.',
          'This custom audio ringtone will be removed from your list.'
        )}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (playingId === deleteTarget.id) {
            audioEngine.stop();
            isPreviewingRef.current = false;
            setPlayingId(null);
          }
          await onDeleteRingtone(deleteTarget.id);
        }}
      />
    </div>
  );
}
