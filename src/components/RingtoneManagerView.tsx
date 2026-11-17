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
import {
  AndroidAlarmDiagnostics,
  getAndroidAlarmDiagnostics,
  isNativeAndroid,
  openAndroidExactAlarmSettings,
  requestAndroidNotificationPermission,
  scheduleAndroidTestNotification,
} from '../lib/nativeAlarmBridge';
import { CustomRingtone, UserProfile } from '../types/gym';

interface RingtoneManagerViewProps {
  profile: UserProfile;
  customRingtones: CustomRingtone[];
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
  onUpdateProfile,
  onUploadRingtone,
  onDeleteRingtone,
}: RingtoneManagerViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [androidDiag, setAndroidDiag] = useState<AndroidAlarmDiagnostics | null>(null);
  const [testNotifStatus, setTestNotifStatus] = useState<string | null>(null);
  const [schedulingTest, setSchedulingTest] = useState(false);

  const runningNativeAndroid = isNativeAndroid();

  const refreshAndroidDiagnostics = useCallback(async () => {
    if (!runningNativeAndroid) return;
    const diag = await getAndroidAlarmDiagnostics();
    setAndroidDiag(diag);
  }, [runningNativeAndroid]);

  useEffect(() => {
    void refreshAndroidDiagnostics();
  }, [refreshAndroidDiagnostics]);

  const notifPermission =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied';

  const handlePreview = async (id: string) => {
    if (playingId === id) {
      audioEngine.stop();
      setPlayingId(null);
      return;
    }
    setPlayingId(id);
    await audioEngine.unlock();
    await audioEngine.play(id, {
      volume: profile.volume,
      loop: false,
      customRingtones,
      onEnded: () => setPlayingId((curr) => (curr === id ? null : curr)),
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
          ? `Ringtone "${created.name}" tersimpan & tersinkron ke Cloud.`
          : `Ringtone "${created.name}" tersimpan lokal di browser ini (ukuran > 450 KB).`
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal mengunggah file audio.'
      );
    } finally {
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
        setTestNotifStatus('Izin notifikasi Android belum diberikan. Aktifkan izin terlebih dahulu.');
      } else {
        setTestNotifStatus(
          res.exact
            ? 'Tes alarm dijadwalkan 5 detik lagi (mode Exact Alarm aktif). Anda bisa keluar aplikasi atau kunci layar sekarang.'
            : 'Tes notifikasi dijadwalkan 5 detik lagi. Aktifkan izin Exact Alarm agar waktu pemicuan selalu tepat saat layar mati.'
        );
      }
      await refreshAndroidDiagnostics();
    } catch (err) {
      setTestNotifStatus(
        err instanceof Error ? err.message : 'Gagal menjadwalkan tes notifikasi Android.'
      );
    } finally {
      setSchedulingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
          Pengaturan Ringtone &amp; Audio Alarm
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Pilih nada alarm bawaan atau unggah file musik/audio Anda sendiri untuk pengingat jadwal
          gym dan penanda selesai istirahat.
        </p>
      </div>

      {/* Android APK Native Background Alarm Diagnostics */}
      {runningNativeAndroid && (
        <section className="rounded-2xl border border-[#C8FF2E]/30 bg-[#13161C] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#C8FF2E]" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
                  Status Alarm Background Android
                </h2>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  Pastikan izin notifikasi dan Exact Alarm aktif agar pengingat gym berbunyi tepat
                  waktu saat aplikasi ditutup atau layar HP terkunci.
                </p>
              </div>
            </div>

            {androidDiag && (
              <span className="font-mono text-xs font-semibold tabular-nums text-[#C8FF2E]">
                {androidDiag.pendingCount} Jadwal Terdaftar
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
                  <p className="text-sm font-semibold text-[#F4F5F7]">Izin Notifikasi</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {androidDiag?.notificationPermission === 'granted'
                      ? 'Aktif & siap tampil'
                      : 'Belum diizinkan'}
                  </p>
                </div>
              </div>
              {androidDiag?.notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="min-h-[40px] shrink-0 rounded-lg bg-[#C8FF2E] px-3 text-xs font-bold text-[#0A0B0E]"
                >
                  Izinkan
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
                      ? 'Presisi tepat waktu'
                      : 'Perlu diaktifkan di sistem'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenExactSettings}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E26] px-3 text-xs font-semibold text-[#F4F5F7] hover:bg-[#252B36]"
              >
                <Settings className="h-3.5 w-3.5" />
                Atur
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#9CA3AF]">
              Channel notifikasi Android menggunakan audio alarm bawaan IronPulse berprioritas tinggi.
            </p>
            <button
              type="button"
              disabled={schedulingTest}
              onClick={handleScheduleTestNotification}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105 disabled:opacity-60"
            >
              <BellRing className="h-4 w-4" />
              {schedulingTest ? 'Menjadwalkan...' : 'Uji Notifikasi 5 Detik'}
            </button>
          </div>

          {testNotifStatus && (
            <p className="text-xs font-medium text-[#C8FF2E]">{testNotifStatus}</p>
          )}
        </section>
      )}

      {/* Master Audio & Behavior Controls */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          Preferensi Suara &amp; Notifikasi
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#D1D5DB]">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-[#C8FF2E]" />
                Volume Alarm &amp; Timer
              </span>
              <span className="font-mono tabular-nums text-[#C8FF2E]">
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
              className="h-2 w-full cursor-pointer accent-[#C8FF2E]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[#D1D5DB]">
              Durasi Tunda Alarm (Snooze)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateProfile({ snoozeMinutes: mins })}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold font-mono tabular-nums transition-colors ${
                    profile.snoozeMinutes === mins
                      ? 'border-[#C8FF2E] bg-[#C8FF2E] text-[#0A0B0E]'
                      : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  {mins} Menit
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">
                Timer Istirahat Otomatis
              </p>
              <p className="text-xs text-[#9CA3AF]">
                Mulai hitung mundur saat set dicentang selesai.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateProfile({ autoStartRestTimer: !profile.autoStartRestTimer })
              }
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
                profile.autoStartRestTimer
                  ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                  : 'border border-white/15 bg-[#1A1E26] text-[#9CA3AF]'
              }`}
            >
              {profile.autoStartRestTimer ? 'Aktif' : 'Manual'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">
                {runningNativeAndroid ? 'Notifikasi Perangkat' : 'Notifikasi Desktop'}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {(runningNativeAndroid
                  ? androidDiag?.notificationPermission === 'granted'
                  : notifPermission === 'granted')
                  ? 'Izin notifikasi sudah aktif.'
                  : 'Tampilkan popup pengingat saat jam tiba.'}
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
                ? 'Diizinkan'
                : 'Izinkan'}
            </button>
          </div>
        </div>
      </section>

      {/* Upload Custom Ringtone */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            Unggah Ringtone Sendiri
          </h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Format didukung: MP3, WAV, OGG, M4A. File ≤ 450 KB otomatis tersinkron ke Cloud; file
            lebih besar tersimpan aman di browser perangkat ini.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            maxLength={80}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Nama ringtone (opsional, misal: Lagu Semangat Pagi)"
            className="h-11 flex-1 rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
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
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-5 py-2.5 text-xs font-bold text-[#0A0B0E] hover:brightness-105 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Memproses Audio...' : 'Pilih File Audio'}
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
                      {rt.durationSeconds > 0 ? `${rt.durationSeconds}d · ` : ''}
                      {rt.storageMode === 'cloud'
                        ? 'Tersinkron ke Cloud'
                        : 'Lokal di Perangkat Ini'}
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
                          <Square className="h-3.5 w-3.5 fill-current text-[#C8FF2E]" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current text-[#C8FF2E]" />
                          Putar
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ defaultRingtoneId: rt.id })}
                      className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                        isMain
                          ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                          : 'border border-white/10 bg-[#13161C] text-[#D1D5DB] hover:border-white/30'
                      }`}
                    >
                      {isMain && <Check className="h-3.5 w-3.5" />}
                      Alarm Gym
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
                      Nada Istirahat
                    </button>

                    <button
                      type="button"
                      aria-label={`Hapus ringtone ${rt.name}`}
                      onClick={() => onDeleteRingtone(rt.id)}
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
          Nada Alarm Bawaan IronPulse
        </h2>

        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#13161C]">
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
                        <Square className="h-3.5 w-3.5 fill-current text-[#C8FF2E]" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current text-[#C8FF2E]" />
                        Putar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateProfile({ defaultRingtoneId: rt.id })}
                    className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                      isMain
                        ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                        : 'border border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/30'
                    }`}
                  >
                    {isMain && <Check className="h-3.5 w-3.5" />}
                    Alarm Gym
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
                    Nada Istirahat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
