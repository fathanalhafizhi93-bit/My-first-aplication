package com.fathan.ironpulse.ui.viewmodel

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import androidx.compose.runtime.Immutable
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.fathan.ironpulse.alarm.AlarmScheduler
import com.fathan.ironpulse.audio.MascotTtsSpeaker
import com.fathan.ironpulse.audio.NativeAudioEngine
import com.fathan.ironpulse.data.AppPreferences
import com.fathan.ironpulse.data.FirestoreGymRepository
import com.fathan.ironpulse.data.GymPresets
import com.fathan.ironpulse.data.MascotDialogueContext
import com.fathan.ironpulse.data.MascotDialogues
import com.fathan.ironpulse.data.PreferencesStore
import com.fathan.ironpulse.data.PresetExerciseTemplate
import com.fathan.ironpulse.lib.HapticFeedbackHelper
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.CustomRingtone
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.DayTimeMode
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.MascotMood
import com.fathan.ironpulse.model.MascotSpeechLine
import com.fathan.ironpulse.model.PerformancePresetId
import com.fathan.ironpulse.model.TimePhasePose
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.model.UiTheme
import com.fathan.ironpulse.model.UserProfile
import com.fathan.ironpulse.model.WorkoutLog
import com.fathan.ironpulse.model.WorkoutLogEntry
import com.fathan.ironpulse.model.WorkoutSetLog
import com.fathan.ironpulse.timer.RestTimerService
import com.fathan.ironpulse.timer.RestTimerState
import com.fathan.ironpulse.ui.theme.resolvePhaseThemeTokens
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.Date
import java.util.UUID
import kotlin.math.abs

enum class AppTab {
    TODAY,
    WORKOUT,
    SCHEDULE,
    HISTORY,
    EXERCISES,
    SETTINGS
}

@Immutable
data class ExerciseTimerUiState(
    val activeSetNumber: Int = 1,
    val running: Boolean = false,
    val elapsedSeconds: Int = 0,
    val targetSeconds: Int = 60,
    val direction: TimerDirection = TimerDirection.COUNTDOWN,
    val lastStartedEpochMs: Long = 0L
)

@Immutable
data class RestTimerDisplayState(
    val isActive: Boolean = false,
    val remainingSeconds: Int = 60,
    val totalSeconds: Int = 60,
    val exerciseName: String = ""
)

@Immutable
data class CooldownTarget(
    val exerciseId: String,
    val exerciseName: String,
    val setNumber: Int
)

@Immutable
data class ActiveTestAlarmState(
    val timeLabel: String,
    val focusTitle: String,
    val ringtoneId: String,
    val ringtoneName: String
)

@Immutable
data class MascotEyeState(
    val isBlinking: Boolean = false,
    val glanceX: Float = 0f,
    val glanceY: Float = 0f,
    val tapBounce: Boolean = false
)

@Immutable
data class MascotUiState(
    val mood: MascotMood = MascotMood.READY,
    val timePhase: DayTimePhase = DayTimePhase.MORNING,
    val urgentMood: MascotMood? = null,
    val activeTimePose: TimePhasePose = TimePhasePose.PERK,
    val phaseColorHex: String = "#FBBF24",
    val activeLine: MascotSpeechLine = MascotSpeechLine("init", "Siap Latihan!", "Ayo bangun momentum hari ini."),
    val speechEventId: Int = 0,
    val isDialogueLocked: Boolean = false
)

@Immutable
data class ThemeUiSpec(
    val prefs: AppPreferences = AppPreferences(),
    val timePhase: DayTimePhase = DayTimePhase.MORNING
)

@Immutable
data class IronPulseUiState(
    val authReady: Boolean = false,
    val userUid: String? = null,
    val userEmail: String? = null,
    val userDisplayName: String? = null,
    val dataLoading: Boolean = true,
    val historyLoading: Boolean = true,
    val authLoading: Boolean = false,
    val authError: String? = null,
    val syncError: String? = null,
    val isOffline: Boolean = false,
    val profile: UserProfile? = null,
    val schedules: Map<DayKey, DaySchedule> = emptyMap(),
    val customRingtones: List<CustomRingtone> = emptyList(),
    val todayDayKey: DayKey = GymModelHelpers.getTodayDayKey(),
    val todayDateKey: String = GymModelHelpers.formatLocalDateKey(),
    val timePhase: DayTimePhase = DayTimePhase.MORNING,
    val todayLog: WorkoutLog? = null,
    val effectiveTodayEntries: List<WorkoutLogEntry> = emptyList(),
    val workoutHistory: List<WorkoutLog> = emptyList(),
    val weeklyStreak: Int = 0,
    val appPrefs: AppPreferences = AppPreferences(),
    val activeTab: AppTab = AppTab.TODAY,
    val focusedWorkoutExerciseId: String? = null,
    val selectedExerciseDayKey: DayKey = GymModelHelpers.getTodayDayKey(),
    val showLaunchIntro: Boolean = true,
    val showNamePrompt: Boolean = false,
    val tutorialOpen: Boolean = false,
    val tutorialStartWithLang: Boolean = true,
    val showAboutDialog: Boolean = false,
    val activeTestAlarm: ActiveTestAlarmState? = null,
    val cooldownAlertTarget: CooldownTarget? = null,
    val previewingRingtoneId: String? = null,
    val uploadingRingtone: Boolean = false,
    val hasNotificationPermission: Boolean = true,
    val canScheduleExactAlarms: Boolean = true,
    val mascot: MascotUiState = MascotUiState()
) {
    val isSignedIn: Boolean get() = userUid != null
}

class GymViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = FirestoreGymRepository()
    private val prefsStore = PreferencesStore(application)
    private val audioEngine = NativeAudioEngine(application)
    private val ttsSpeaker = MascotTtsSpeaker(application)
    val haptics = HapticFeedbackHelper(application)
    private val writeMutex = Mutex()

    private val _authReady = MutableStateFlow(false)
    private val _user = MutableStateFlow<FirebaseUser?>(null)
    private val _dataLoading = MutableStateFlow(true)
    private val _historyLoading = MutableStateFlow(true)
    private val _authLoading = MutableStateFlow(false)
    private val _authError = MutableStateFlow<String?>(null)
    private val _syncError = MutableStateFlow<String?>(null)
    private val _isOffline = MutableStateFlow(false)

    private val _profile = MutableStateFlow<UserProfile?>(null)
    private val _schedules = MutableStateFlow<Map<DayKey, DaySchedule>>(emptyMap())
    private val _customRingtones = MutableStateFlow<List<CustomRingtone>>(emptyList())
    private val _todayDayKey = MutableStateFlow(GymModelHelpers.getTodayDayKey())
    private val _todayDateKey = MutableStateFlow(GymModelHelpers.formatLocalDateKey())
    private val _timePhase = MutableStateFlow(
        GymModelHelpers.resolveDayTimePhase(prefsStore.state.value.todayThemeMode, Calendar.getInstance())
    )
    private val _clockSeconds = MutableStateFlow(System.currentTimeMillis() / 1000L)
    private val _todayLog = MutableStateFlow<WorkoutLog?>(null)
    private val _workoutHistory = MutableStateFlow<List<WorkoutLog>>(emptyList())
    private val _weeklyStreak = MutableStateFlow(0)
    private val _exerciseTimers = MutableStateFlow<Map<String, ExerciseTimerUiState>>(emptyMap())

    private val _restIdleRemaining = MutableStateFlow(60)
    private val _restIdleTotal = MutableStateFlow(60)
    private val _restIdleExercise = MutableStateFlow("")

    private val _activeTab = MutableStateFlow(AppTab.TODAY)
    private val _focusedWorkoutExerciseId = MutableStateFlow<String?>(null)
    private val _selectedExerciseDayKey = MutableStateFlow(GymModelHelpers.getTodayDayKey())
    private val _showLaunchIntro = MutableStateFlow(!prefsStore.state.value.performance.noAnimations)
    private val _showNamePrompt = MutableStateFlow(false)
    private val _tutorialOpen = MutableStateFlow(false)
    private val _tutorialStartWithLang = MutableStateFlow(true)
    private val _showAboutDialog = MutableStateFlow(false)
    private val _activeTestAlarm = MutableStateFlow<ActiveTestAlarmState?>(null)
    private val _cooldownUntilMs = MutableStateFlow(0L)
    private val _cooldownSeconds = MutableStateFlow(0)
    private val _cooldownAlertTarget = MutableStateFlow<CooldownTarget?>(null)
    private val _previewingRingtoneId = MutableStateFlow<String?>(null)
    private val _uploadingRingtone = MutableStateFlow(false)
    private val _hasNotifPerm = MutableStateFlow(true)
    private val _canExactAlarm = MutableStateFlow(true)

    private val _mascotState = MutableStateFlow(MascotUiState())
    private val _mascotEyeState = MutableStateFlow(MascotEyeState())

    val clockSecondsFlow: StateFlow<Long> = _clockSeconds.asStateFlow()
    val exerciseTimersFlow: StateFlow<Map<String, ExerciseTimerUiState>> = _exerciseTimers.asStateFlow()
    val cooldownSecondsFlow: StateFlow<Int> = _cooldownSeconds.asStateFlow()
    val mascotEyeFlow: StateFlow<MascotEyeState> = _mascotEyeState.asStateFlow()

    val themeUiFlow: StateFlow<ThemeUiSpec> = combine(prefsStore.state, _timePhase) { prefs, phase ->
        ThemeUiSpec(prefs = prefs, timePhase = phase)
    }.distinctUntilChanged().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = ThemeUiSpec(prefs = prefsStore.state.value, timePhase = _timePhase.value)
    )

    val restTimerDisplayFlow: StateFlow<RestTimerDisplayState> = combine(
        RestTimerService.state,
        _restIdleRemaining,
        _restIdleTotal,
        _restIdleExercise
    ) { rest, idleRem, idleTotal, idleLabel ->
        if (rest.isActive) {
            RestTimerDisplayState(
                isActive = true,
                remainingSeconds = rest.remainingSeconds,
                totalSeconds = rest.totalSeconds.coerceAtLeast(1),
                exerciseName = rest.exerciseName
            )
        } else {
            RestTimerDisplayState(
                isActive = false,
                remainingSeconds = idleRem,
                totalSeconds = idleTotal.coerceAtLeast(1),
                exerciseName = idleLabel
            )
        }
    }.distinctUntilChanged().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = RestTimerDisplayState()
    )

    private val _snackbarEvents = MutableSharedFlow<String>(extraBufferCapacity = 10)
    val snackbarEvents: SharedFlow<String> = _snackbarEvents.asSharedFlow()

    private var userSyncJob: Job? = null
    private var lastRestCompletionTick: Long = 0L

    // Mascot internal timers & pools
    private var mascotPhasePoseIdx: Int = 0
    private var mascotQuoteRoll: Int = (0..96).random()
    private val recentPoseIndices = ArrayDeque<Int>()
    private val recentLineIds = ArrayDeque<String>()
    private var dialogueLockedUntilMs: Long = 0L
    private var lastAutoChatAtMs: Long = 0L
    private var lastSilentPoseAtMs: Long = 0L
    private var nightWakeReturnJob: Job? = null
    private var lastObservedTimePhase: DayTimePhase? = null
    private var initialGreetingFired = false

    private data class CoreCloudState(
        val authReady: Boolean,
        val user: FirebaseUser?,
        val dataLoading: Boolean,
        val historyLoading: Boolean,
        val authLoading: Boolean,
        val authError: String?,
        val syncError: String?,
        val isOffline: Boolean,
        val profile: UserProfile?,
        val schedules: Map<DayKey, DaySchedule>,
        val customRingtones: List<CustomRingtone>
    )

    private data class WorkoutRuntimeState(
        val todayDayKey: DayKey,
        val todayDateKey: String,
        val timePhase: DayTimePhase,
        val todayLog: WorkoutLog?,
        val workoutHistory: List<WorkoutLog>,
        val weeklyStreak: Int
    )

    private data class ShellUiState(
        val appPrefs: AppPreferences,
        val activeTab: AppTab,
        val focusedExerciseId: String?,
        val selectedExerciseDayKey: DayKey,
        val showLaunchIntro: Boolean,
        val showNamePrompt: Boolean,
        val tutorialOpen: Boolean,
        val tutorialStartWithLang: Boolean,
        val showAboutDialog: Boolean,
        val activeTestAlarm: ActiveTestAlarmState?,
        val cooldownAlertTarget: CooldownTarget?,
        val previewingRingtoneId: String?,
        val uploadingRingtone: Boolean,
        val hasNotifPerm: Boolean,
        val canExactAlarm: Boolean,
        val mascot: MascotUiState
    )

    private val cloudFlow = combine(
        combine(_authReady, _user, _dataLoading, _historyLoading, _authLoading) { r, u, d, h, a ->
            listOf(r, u, d, h, a)
        },
        combine(_authError, _syncError, _isOffline, _profile, _schedules) { ae, se, off, p, s ->
            listOf(ae, se, off, p, s)
        },
        _customRingtones
    ) { g1, g2, tones ->
        @Suppress("UNCHECKED_CAST")
        CoreCloudState(
            authReady = g1[0] as Boolean,
            user = g1[1] as FirebaseUser?,
            dataLoading = g1[2] as Boolean,
            historyLoading = g1[3] as Boolean,
            authLoading = g1[4] as Boolean,
            authError = g2[0] as String?,
            syncError = g2[1] as String?,
            isOffline = g2[2] as Boolean,
            profile = g2[3] as UserProfile?,
            schedules = g2[4] as Map<DayKey, DaySchedule>,
            customRingtones = tones
        )
    }

    private val runtimeFlow = combine(
        _todayDayKey,
        _todayDateKey,
        _timePhase,
        _todayLog,
        _workoutHistory
    ) { d, dt, phase, tl, wh ->
        arrayOf(d, dt, phase, tl, wh)
    }.combine(_weeklyStreak) { arr, streak ->
        @Suppress("UNCHECKED_CAST")
        WorkoutRuntimeState(
            todayDayKey = arr[0] as DayKey,
            todayDateKey = arr[1] as String,
            timePhase = arr[2] as DayTimePhase,
            todayLog = arr[3] as WorkoutLog?,
            workoutHistory = arr[4] as List<WorkoutLog>,
            weeklyStreak = streak
        )
    }

    private val shellFlow = combine(
        combine(prefsStore.state, _activeTab, _focusedWorkoutExerciseId, _selectedExerciseDayKey, _showLaunchIntro) { pr, tab, foc, eday, intro ->
            listOf(pr, tab, foc, eday, intro)
        },
        combine(_showNamePrompt, _tutorialOpen, _tutorialStartWithLang, _showAboutDialog, _activeTestAlarm) { np, to, tl, ab, ta ->
            listOf(np, to, tl, ab, ta)
        },
        combine(_cooldownAlertTarget, _previewingRingtoneId, _uploadingRingtone) { ca, pr, up ->
            Triple(ca, pr, up)
        },
        combine(_hasNotifPerm, _canExactAlarm, _mascotState) { hn, ce, ms ->
            Triple(hn, ce, ms)
        }
    ) { g1, g2, g3, g4 ->
        @Suppress("UNCHECKED_CAST")
        ShellUiState(
            appPrefs = g1[0] as AppPreferences,
            activeTab = g1[1] as AppTab,
            focusedExerciseId = g1[2] as String?,
            selectedExerciseDayKey = g1[3] as DayKey,
            showLaunchIntro = g1[4] as Boolean,
            showNamePrompt = g2[0] as Boolean,
            tutorialOpen = g2[1] as Boolean,
            tutorialStartWithLang = g2[2] as Boolean,
            showAboutDialog = g2[3] as Boolean,
            activeTestAlarm = g2[4] as ActiveTestAlarmState?,
            cooldownAlertTarget = g3.first,
            previewingRingtoneId = g3.second,
            uploadingRingtone = g3.third,
            hasNotifPerm = g4.first,
            canExactAlarm = g4.second,
            mascot = g4.third
        )
    }

    val uiState: StateFlow<IronPulseUiState> = combine(cloudFlow, runtimeFlow, shellFlow) { cloud, run, shell ->
        haptics.enabled = shell.appPrefs.hapticsEnabled
        val todaySched = cloud.schedules[run.todayDayKey]
        val entries = if (todaySched != null) {
            GymModelHelpers.buildEntriesFromSchedule(
                exercises = todaySched.exercises,
                existingEntries = run.todayLog?.entries ?: emptyList()
            )
        } else {
            emptyList()
        }

        IronPulseUiState(
            authReady = cloud.authReady,
            userUid = cloud.user?.uid,
            userEmail = cloud.user?.email,
            userDisplayName = cloud.user?.displayName,
            dataLoading = cloud.dataLoading,
            historyLoading = cloud.historyLoading,
            authLoading = cloud.authLoading,
            authError = cloud.authError,
            syncError = cloud.syncError,
            isOffline = cloud.isOffline,
            profile = cloud.profile,
            schedules = cloud.schedules,
            customRingtones = cloud.customRingtones,
            todayDayKey = run.todayDayKey,
            todayDateKey = run.todayDateKey,
            timePhase = run.timePhase,
            todayLog = run.todayLog,
            effectiveTodayEntries = entries,
            workoutHistory = run.workoutHistory,
            weeklyStreak = run.weeklyStreak,
            appPrefs = shell.appPrefs,
            activeTab = shell.activeTab,
            focusedWorkoutExerciseId = shell.focusedExerciseId,
            selectedExerciseDayKey = shell.selectedExerciseDayKey,
            showLaunchIntro = shell.showLaunchIntro,
            showNamePrompt = shell.showNamePrompt,
            tutorialOpen = shell.tutorialOpen,
            tutorialStartWithLang = shell.tutorialStartWithLang,
            showAboutDialog = shell.showAboutDialog,
            activeTestAlarm = shell.activeTestAlarm,
            cooldownAlertTarget = shell.cooldownAlertTarget,
            previewingRingtoneId = shell.previewingRingtoneId,
            uploadingRingtone = shell.uploadingRingtone,
            hasNotificationPermission = shell.hasNotifPerm,
            canScheduleExactAlarms = shell.canExactAlarm,
            mascot = shell.mascot
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = IronPulseUiState(
            appPrefs = prefsStore.state.value,
            timePhase = _timePhase.value,
            showLaunchIntro = !prefsStore.state.value.performance.noAnimations
        )
    )

    init {
        haptics.enabled = prefsStore.state.value.hapticsEnabled
        initializeInitialPose()
        observeConnectivity()
        observeAuthAndData()
        observeRestCompletionHaptics()
        startClockAndExerciseLoop()
        startMascotLifeLoops()
        scheduleLaunchIntroAutoDismiss()
    }

    private fun scheduleLaunchIntroAutoDismiss() {
        if (!_showLaunchIntro.value) return
        viewModelScope.launch {
            delay(1450L)
            dismissLaunchIntro()
        }
    }

    private fun observeConnectivity() {
        runCatching {
            val cm = getApplication<Application>().getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return
            val activeCaps = cm.getNetworkCapabilities(cm.activeNetwork)
            _isOffline.value = activeCaps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) != true

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            cm.registerNetworkCallback(request, object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    _isOffline.value = false
                }

                override fun onLost(network: Network) {
                    runCatching {
                        val currentCaps = cm.getNetworkCapabilities(cm.activeNetwork)
                        _isOffline.value = currentCaps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) != true
                    }
                }
            })
        }
    }

    private fun observeAuthAndData() {
        viewModelScope.launch {
            repo.observeAuthUser().collect { firebaseUser ->
                _user.value = firebaseUser
                _authReady.value = true
                userSyncJob?.cancel()
                if (firebaseUser == null) {
                    _profile.value = null
                    _schedules.value = emptyMap()
                    _customRingtones.value = emptyList()
                    _todayLog.value = null
                    _workoutHistory.value = emptyList()
                    _weeklyStreak.value = 0
                    _dataLoading.value = false
                    _historyLoading.value = false
                    _showNamePrompt.value = false
                    _tutorialOpen.value = false
                    initialGreetingFired = false
                } else {
                    startUserFirestoreSync(firebaseUser)
                }
            }
        }
    }

    private fun observeRestCompletionHaptics() {
        viewModelScope.launch {
            RestTimerService.state.collect { rest ->
                if (rest.completedEventTick > lastRestCompletionTick) {
                    lastRestCompletionTick = rest.completedEventTick
                    _restIdleRemaining.value = _restIdleTotal.value
                    updateMascotSpeech(forceMood = null, playChirp = false)
                }
            }
        }
    }

    fun retrySync() {
        val current = _user.value ?: return
        userSyncJob?.cancel()
        startUserFirestoreSync(current)
    }

    private fun startUserFirestoreSync(firebaseUser: FirebaseUser) {
        _dataLoading.value = true
        _historyLoading.value = true
        _syncError.value = null
        val uid = firebaseUser.uid

        // Onboarding check (after splash settles)
        val nameConfirmed = prefsStore.isNameConfirmed(uid)
        val tutorialSeen = prefsStore.isTutorialSeen(uid)
        _showNamePrompt.value = !nameConfirmed
        if (nameConfirmed && !tutorialSeen) {
            _tutorialStartWithLang.value = true
            _tutorialOpen.value = true
        }

        userSyncJob = viewModelScope.launch {
            try {
                repo.ensureUserInitialized(firebaseUser)
            } catch (e: Exception) {
                _syncError.value = "Sinkronisasi cloud tertunda: ${e.localizedMessage ?: "Periksa koneksi internet."}"
                if (_schedules.value.isEmpty()) {
                    _schedules.value = GymPresets.createDefaultSchedules(uid)
                }
                _dataLoading.value = false
            }

            launch {
                repo.observeProfile(uid) { err ->
                    _syncError.value = "Gagal memuat profil: ${err.localizedMessage ?: "Coba lagi."}"
                }.collect { prof ->
                    _profile.value = prof
                    syncNativeAlarmsIfReady()
                    if (!initialGreetingFired && prof != null && !_showLaunchIntro.value && !_showNamePrompt.value && !_tutorialOpen.value) {
                        initialGreetingFired = true
                        updateMascotSpeech(playChirp = true, speakTts = true)
                    }
                }
            }
            launch {
                repo.observeSchedules(uid) { err ->
                    _syncError.value = "Gagal memuat jadwal: ${err.localizedMessage ?: "Coba lagi."}"
                    _dataLoading.value = false
                }.collect { scheds ->
                    _schedules.value = scheds
                    _dataLoading.value = false
                    syncNativeAlarmsIfReady()
                    refreshMascotDialogueOnly()
                }
            }
            launch {
                repo.observeRingtones(uid) { err ->
                    _syncError.value = "Gagal memuat ringtone: ${err.localizedMessage ?: "Coba lagi."}"
                }.collect { tones ->
                    _customRingtones.value = tones
                }
            }
            launch {
                repo.observeWorkoutHistory(uid) { err ->
                    _syncError.value = "Gagal memuat riwayat: ${err.localizedMessage ?: "Coba lagi."}"
                    _historyLoading.value = false
                }.collect { hist ->
                    _workoutHistory.value = hist
                    _weeklyStreak.value = withContext(Dispatchers.Default) {
                        GymModelHelpers.computeWeeklyStreak(hist)
                    }
                    _historyLoading.value = false
                }
            }
            launch {
                _todayDateKey.collectLatest { dateKey ->
                    repo.observeTodayLog(uid, dateKey).collect { log ->
                        _todayLog.value = log
                        refreshMascotDialogueOnly()
                    }
                }
            }
        }
    }

    private fun syncNativeAlarmsIfReady() {
        val scheds = _schedules.value
        if (scheds.isEmpty()) return
        val prof = _profile.value
        runCatching {
            AlarmScheduler.syncWeeklyAlarms(
                context = getApplication(),
                schedules = scheds,
                masterEnabled = prof?.notificationsEnabled ?: true,
                snoozeMinutes = prof?.snoozeMinutes ?: 5,
                volume = prof?.volume ?: 0.85,
                defaultRingtoneId = prof?.defaultRingtoneId ?: "builtin_athletic_bell",
                restRingtoneId = prof?.restRingtoneId ?: "builtin_kettlebell_chime"
            )
        }
    }

    private fun startClockAndExerciseLoop() {
        viewModelScope.launch {
            var rolloverTicks = 0
            val cal = Calendar.getInstance()
            while (true) {
                val nowBeforeDelay = System.currentTimeMillis()
                val sleepMs = (1000L - (nowBeforeDelay % 1000L)).coerceIn(120L, 1000L)
                delay(sleepMs)
                val now = System.currentTimeMillis()
                _clockSeconds.value = now / 1000L

                // Update timePhase ONLY when resolved phase transitions (morning/afternoon/night)
                cal.timeInMillis = now
                val phase = GymModelHelpers.resolveDayTimePhase(prefsStore.state.value.todayThemeMode, cal)
                if (_timePhase.value != phase) {
                    _timePhase.value = phase
                }
                if (lastObservedTimePhase != phase) {
                    lastObservedTimePhase = phase
                    recentPoseIndices.clear()
                    val hour = cal.get(Calendar.HOUR_OF_DAY)
                    mascotPhasePoseIdx = initialPhasePoseIndex(phase, hour)
                    pushRecentPose(mascotPhasePoseIdx)
                    updateMascotSpeech(playChirp = !_showLaunchIntro.value, speakTts = false)
                }

                // Cooldown countdown updates ONLY its isolated StateFlow while active
                val untilMs = _cooldownUntilMs.value
                val nextCooldownSec = if (untilMs > now) {
                    ((untilMs - now + 999L) / 1000L).toInt().coerceAtLeast(0)
                } else {
                    0
                }
                if (_cooldownSeconds.value != nextCooldownSec) {
                    _cooldownSeconds.value = nextCooldownSec
                }

                // Exercise timer ticker (1Hz while at least one timer is running)
                val currentTimers = _exerciseTimers.value
                if (currentTimers.values.any { it.running }) {
                    val completedQueue = mutableListOf<Triple<String, Int, Int>>()
                    var anyChanged = false
                    val updated = currentTimers.mapValues { (exId, st) ->
                        if (!st.running) {
                            st
                        } else {
                            val deltaSec = ((now - st.lastStartedEpochMs) / 1000L).toInt().coerceAtLeast(0)
                            if (deltaSec == 0) {
                                st
                            } else {
                                anyChanged = true
                                val newElapsed = st.elapsedSeconds + deltaSec
                                if (st.direction == TimerDirection.COUNTDOWN && newElapsed >= st.targetSeconds) {
                                    completedQueue += Triple(exId, st.activeSetNumber, st.targetSeconds)
                                    st.copy(running = false, elapsedSeconds = 0, lastStartedEpochMs = now)
                                } else {
                                    st.copy(elapsedSeconds = newElapsed, lastStartedEpochMs = now)
                                }
                            }
                        }
                    }
                    if (anyChanged) {
                        _exerciseTimers.value = updated
                    }
                    for ((exId, setNum, secs) in completedQueue) {
                        haptics.timerFinished()
                        val restTone = _profile.value?.restRingtoneId ?: "builtin_kettlebell_chime"
                        val vol = (_profile.value?.volume ?: 0.85).toFloat()
                        audioEngine.play(restTone, vol, loop = false, customRingtones = _customRingtones.value)
                        completeTimerSet(exId, setNum, secs)
                    }
                }

                rolloverTicks++
                if (rolloverTicks >= 20) {
                    rolloverTicks = 0
                    refreshDateClock()
                }
            }
        }
    }

    fun refreshDateClock() {
        val now = System.currentTimeMillis()
        _clockSeconds.value = now / 1000L
        val nextDate = GymModelHelpers.formatLocalDateKey()
        val nextDay = GymModelHelpers.getTodayDayKey()
        val changed = _todayDayKey.value != nextDay
        if (_todayDateKey.value != nextDate) _todayDateKey.value = nextDate
        if (changed) {
            _todayDayKey.value = nextDay
            updateMascotSpeech(dayJustChanged = true, playChirp = false, speakTts = false)
        }
    }

    fun refreshDiagnostics(hasNotificationPermission: Boolean, canScheduleExactAlarms: Boolean) {
        _hasNotifPerm.value = hasNotificationPermission
        _canExactAlarm.value = canScheduleExactAlarms
    }

    // --- Navigation & Modals ---

    fun selectTab(tab: AppTab) {
        if (_activeTab.value != tab) {
            haptics.tabSwitch()
        }
        _activeTab.value = tab
    }

    fun openWorkout(focusExerciseId: String? = null) {
        haptics.buttonTap()
        _focusedWorkoutExerciseId.value = focusExerciseId
        _activeTab.value = AppTab.WORKOUT
    }

    fun openExercisesForDay(dayKey: DayKey) {
        haptics.buttonTap()
        _selectedExerciseDayKey.value = dayKey
        _activeTab.value = AppTab.EXERCISES
    }

    fun setSelectedExerciseDay(dayKey: DayKey) {
        haptics.tabSwitch()
        _selectedExerciseDayKey.value = dayKey
    }

    fun openAboutDialog() {
        haptics.buttonTap()
        _showAboutDialog.value = true
    }

    fun closeAboutDialog() {
        _showAboutDialog.value = false
    }

    fun openTutorial(startWithLang: Boolean = false) {
        haptics.buttonTap()
        _tutorialStartWithLang.value = startWithLang
        _tutorialOpen.value = true
    }

    fun closeTutorial() {
        _tutorialOpen.value = false
        _user.value?.uid?.let { uid -> prefsStore.setTutorialSeen(uid, true) }
        if (!initialGreetingFired && _profile.value != null && !_showLaunchIntro.value && !_showNamePrompt.value) {
            initialGreetingFired = true
            updateMascotSpeech(playChirp = true, speakTts = true)
        }
    }

    fun dismissLaunchIntro() {
        if (!_showLaunchIntro.value) return
        _showLaunchIntro.value = false
        if (!initialGreetingFired && _profile.value != null && !_showNamePrompt.value && !_tutorialOpen.value) {
            initialGreetingFired = true
            updateMascotSpeech(playChirp = true, speakTts = true)
        }
    }

    fun confirmDisplayNameOnboarding(name: String) {
        val cleaned = name.trim().take(100)
        val uid = _user.value?.uid ?: return
        if (cleaned.isEmpty()) return
        viewModelScope.launch {
            try {
                repo.updateProfile(uid = uid, displayName = cleaned)
                prefsStore.setNameConfirmed(uid, true)
                _showNamePrompt.value = false
                if (!prefsStore.isTutorialSeen(uid)) {
                    _tutorialStartWithLang.value = true
                    _tutorialOpen.value = true
                } else if (!initialGreetingFired) {
                    initialGreetingFired = true
                    updateMascotSpeech(playChirp = true, speakTts = true)
                }
            } catch (e: Exception) {
                _snackbarEvents.tryEmit(
                    prefsStore.state.value.lang.t(
                        "Gagal menyimpan nama: ${e.localizedMessage ?: "Coba lagi"}",
                        "Failed to save name: ${e.localizedMessage ?: "Retry"}"
                    )
                )
            }
        }
    }

    // --- Preferences & Theme Controls ---

    fun setLang(lang: AppLanguage) {
        haptics.toggle()
        prefsStore.setLang(lang)
        refreshMascotDialogueOnly()
    }

    fun setClockFormat(format: ClockFormat) {
        haptics.toggle()
        prefsStore.setClockFormat(format)
    }

    fun setTodayThemeMode(mode: DayTimeMode) {
        haptics.toggle()
        prefsStore.setTodayThemeMode(mode)
        val cal = Calendar.getInstance()
        val nextPhase = GymModelHelpers.resolveDayTimePhase(mode, cal)
        _timePhase.value = nextPhase
        lastObservedTimePhase = nextPhase
        mascotPhasePoseIdx = initialPhasePoseIndex(nextPhase, cal.get(Calendar.HOUR_OF_DAY))
        updateMascotSpeech(playChirp = true, speakTts = false)
    }

    fun setUiTheme(theme: UiTheme) {
        haptics.toggle()
        prefsStore.setUiTheme(theme)
    }

    fun setAccentColor(hex: String) {
        haptics.buttonTap()
        prefsStore.setAccentColor(hex)
    }

    fun setMaterialTintColor(hex: String?) {
        haptics.buttonTap()
        prefsStore.setMaterialTintColor(hex)
    }

    fun resetThemeCustomization() {
        haptics.timerReset()
        prefsStore.resetThemeCustomization()
    }

    fun setPerformance(
        noBlur: Boolean? = null,
        noAnimations: Boolean? = null,
        noAmbientGlow: Boolean? = null,
        staticMascot: Boolean? = null
    ) {
        haptics.toggle()
        prefsStore.setPerformance(noBlur, noAnimations, noAmbientGlow, staticMascot)
    }

    fun applyPerformancePreset(preset: PerformancePresetId) {
        haptics.toggle()
        prefsStore.applyPerformancePreset(preset)
    }

    fun setHapticsEnabled(enabled: Boolean) {
        prefsStore.setHapticsEnabled(enabled)
        haptics.enabled = enabled
        if (enabled) haptics.toggle()
    }

    fun testHapticPattern() {
        haptics.testPattern()
    }

    fun setMascotVoiceEnabled(enabled: Boolean) {
        haptics.toggle()
        prefsStore.setMascotVoiceEnabled(enabled)
        if (!enabled) ttsSpeaker.stop()
    }

    fun setFloatingOrbAnchor(sideRight: Boolean, yRatio: Float) {
        haptics.orbSnap()
        prefsStore.setFloatingOrbAnchor(sideRight, yRatio)
    }

    // --- Auth ---

    fun signInWithGoogleToken(idToken: String) {
        viewModelScope.launch {
            _authLoading.value = true
            _authError.value = null
            try {
                repo.signInWithGoogleIdToken(idToken)
            } catch (e: Exception) {
                _authError.value = e.localizedMessage ?: "Gagal masuk dengan akun Google."
            } finally {
                _authLoading.value = false
            }
        }
    }

    fun setAuthLoading(loading: Boolean) {
        _authLoading.value = loading
    }

    fun setAuthError(message: String?) {
        _authError.value = message
    }

    fun signOut() {
        haptics.destructive()
        audioEngine.stop()
        ttsSpeaker.stop()
        RestTimerService.stop(getApplication())
        repo.signOut()
    }

    // --- Workout & Exercise Timers + 30s Cooldown Guard ---

    fun requestToggleSetComplete(exerciseId: String, setNumber: Int) {
        val entries = currentTodayEntriesSnapshot()
        val entry = entries.firstOrNull { it.exerciseId == exerciseId } ?: return
        val targetSet = entry.sets.firstOrNull { it.setNumber == setNumber } ?: return

        if (targetSet.completed) {
            // Unchecking does not require cooldown
            haptics.setUncheck()
            performToggleSetComplete(exerciseId, setNumber, enforceCooldown = false)
            return
        }

        val now = System.currentTimeMillis()
        if (now < _cooldownUntilMs.value) {
            haptics.cooldownBlocked()
            _cooldownAlertTarget.value = CooldownTarget(
                exerciseId = exerciseId,
                exerciseName = entry.name,
                setNumber = setNumber
            )
            return
        }

        performToggleSetComplete(exerciseId, setNumber, enforceCooldown = true)
    }

    fun dismissCooldownAlert() {
        _cooldownAlertTarget.value = null
    }

    fun bypassCooldownAndComplete() {
        val target = _cooldownAlertTarget.value ?: return
        _cooldownAlertTarget.value = null
        performToggleSetComplete(target.exerciseId, target.setNumber, enforceCooldown = true)
    }

    private fun performToggleSetComplete(
        exerciseId: String,
        setNumber: Int,
        enforceCooldown: Boolean
    ) {
        viewModelScope.launch {
            var becameCompleted = false
            var nextCompletedCount = 0
            var nextTotalCount = 0
            mutateTodayEntries { entries ->
                val mapped = entries.map { entry ->
                    if (entry.exerciseId != exerciseId) entry
                    else entry.copy(
                        sets = entry.sets.map { s ->
                            if (s.setNumber != setNumber) s
                            else {
                                val nextDone = !s.completed
                                if (nextDone) becameCompleted = true
                                s.copy(completed = nextDone)
                            }
                        }
                    )
                }
                nextTotalCount = mapped.sumOf { it.sets.size }
                nextCompletedCount = mapped.sumOf { e -> e.sets.count { it.completed } }
                mapped
            }

            if (becameCompleted) {
                if (enforceCooldown) {
                    _cooldownUntilMs.value = System.currentTimeMillis() + 30_000L
                    _cooldownSeconds.value = 30
                }
                val pct = if (nextTotalCount > 0) (nextCompletedCount * 100) / nextTotalCount else 0
                val isAllDone = nextTotalCount > 0 && nextCompletedCount == nextTotalCount
                val mood = when {
                    isAllDone -> {
                        haptics.workoutComplete()
                        MascotMood.CELEBRATE
                    }
                    pct >= 50 -> {
                        haptics.setComplete()
                        MascotMood.MILESTONE
                    }
                    else -> {
                        haptics.setComplete()
                        MascotMood.CLAP
                    }
                }
                triggerAutoRestIfEnabled(exerciseId)
                updateMascotSpeech(forceMood = mood, playChirp = true, speakTts = true, bypassLock = isAllDone)
            } else {
                refreshMascotDialogueOnly()
            }
        }
    }

    fun completeTimerSet(exerciseId: String, setNumber: Int, durationSeconds: Int) {
        val safeDuration = durationSeconds.coerceIn(1, 10800)
        viewModelScope.launch {
            var becameCompleted = false
            var nextCompletedCount = 0
            var nextTotalCount = 0
            mutateTodayEntries { entries ->
                val mapped = entries.map { entry ->
                    if (entry.exerciseId != exerciseId) entry
                    else entry.copy(
                        sets = entry.sets.map { s ->
                            if (s.setNumber != setNumber) s
                            else {
                                if (!s.completed) becameCompleted = true
                                s.copy(durationSeconds = safeDuration, completed = true)
                            }
                        }
                    )
                }
                nextTotalCount = mapped.sumOf { it.sets.size }
                nextCompletedCount = mapped.sumOf { e -> e.sets.count { it.completed } }
                mapped
            }
            if (becameCompleted) {
                _cooldownUntilMs.value = System.currentTimeMillis() + 30_000L
                _cooldownSeconds.value = 30
                val isAllDone = nextTotalCount > 0 && nextCompletedCount == nextTotalCount
                val mood = if (isAllDone) MascotMood.CELEBRATE else MascotMood.CLAP
                triggerAutoRestIfEnabled(exerciseId)
                updateMascotSpeech(forceMood = mood, playChirp = true, speakTts = true, bypassLock = isAllDone)
            }
        }
    }

    private fun triggerAutoRestIfEnabled(exerciseId: String) {
        val autoStart = _profile.value?.autoStartRestTimer ?: true
        if (!autoStart) return
        val sched = _schedules.value[_todayDayKey.value] ?: return
        val ex = sched.exercises.firstOrNull { it.id == exerciseId } ?: return
        val secs = ex.restSeconds.coerceIn(15, 600)
        _restIdleTotal.value = secs
        _restIdleRemaining.value = secs
        _restIdleExercise.value = ex.name
        RestTimerService.start(
            context = getApplication(),
            seconds = secs,
            exerciseName = ex.name
        )
    }

    fun toggleExerciseTimer(entry: WorkoutLogEntry, setNumber: Int) {
        val currentMap = _exerciseTimers.value.toMutableMap()
        val existing = currentMap[entry.exerciseId]
        val now = System.currentTimeMillis()
        val nextRunning: Boolean
        if (existing != null && existing.activeSetNumber == setNumber) {
            nextRunning = !existing.running
            currentMap[entry.exerciseId] = existing.copy(
                running = nextRunning,
                lastStartedEpochMs = now
            )
        } else {
            nextRunning = true
            currentMap[entry.exerciseId] = ExerciseTimerUiState(
                activeSetNumber = setNumber,
                running = true,
                elapsedSeconds = 0,
                targetSeconds = entry.targetDurationSeconds.coerceIn(5, 10800),
                direction = entry.timerDirection,
                lastStartedEpochMs = now
            )
        }
        if (nextRunning) haptics.timerStart() else haptics.timerPause()
        _exerciseTimers.value = currentMap
        updateMascotSpeech(
            forceMood = if (nextRunning) MascotMood.TIMER_ACTIVE else null,
            activeTimerExerciseName = if (nextRunning) entry.name else null,
            playChirp = nextRunning,
            speakTts = false
        )
    }

    fun resetExerciseTimer(entry: WorkoutLogEntry) {
        haptics.timerReset()
        val currentMap = _exerciseTimers.value.toMutableMap()
        val existing = currentMap[entry.exerciseId]
        currentMap[entry.exerciseId] = ExerciseTimerUiState(
            activeSetNumber = existing?.activeSetNumber ?: 1,
            running = false,
            elapsedSeconds = 0,
            targetSeconds = entry.targetDurationSeconds,
            direction = entry.timerDirection,
            lastStartedEpochMs = System.currentTimeMillis()
        )
        _exerciseTimers.value = currentMap
    }

    fun selectExerciseTimerSet(entry: WorkoutLogEntry, setNumber: Int) {
        haptics.buttonTap()
        val currentMap = _exerciseTimers.value.toMutableMap()
        currentMap[entry.exerciseId] = ExerciseTimerUiState(
            activeSetNumber = setNumber,
            running = false,
            elapsedSeconds = 0,
            targetSeconds = entry.targetDurationSeconds,
            direction = entry.timerDirection,
            lastStartedEpochMs = System.currentTimeMillis()
        )
        _exerciseTimers.value = currentMap
    }

    fun changeExerciseTimerDirection(entry: WorkoutLogEntry, direction: TimerDirection) {
        haptics.toggle()
        val currentMap = _exerciseTimers.value.toMutableMap()
        val existing = currentMap[entry.exerciseId]
        currentMap[entry.exerciseId] = (existing ?: ExerciseTimerUiState(
            targetSeconds = entry.targetDurationSeconds
        )).copy(
            running = false,
            elapsedSeconds = 0,
            direction = direction,
            lastStartedEpochMs = System.currentTimeMillis()
        )
        _exerciseTimers.value = currentMap
    }

    fun finishAndSaveExerciseTimer(entry: WorkoutLogEntry) {
        val st = _exerciseTimers.value[entry.exerciseId] ?: return
        val secs = st.elapsedSeconds.coerceAtLeast(1)
        val currentMap = _exerciseTimers.value.toMutableMap()
        currentMap[entry.exerciseId] = st.copy(running = false, elapsedSeconds = 0)
        _exerciseTimers.value = currentMap
        haptics.setComplete()
        completeTimerSet(entry.exerciseId, st.activeSetNumber, secs)
    }

    fun updateSetMetrics(exerciseId: String, setNumber: Int, weightKg: Double, reps: Int) {
        val safeWeight = weightKg.coerceIn(0.0, 999.0)
        val safeReps = reps.coerceIn(0, 999)
        viewModelScope.launch {
            mutateTodayEntries { entries ->
                entries.map { entry ->
                    if (entry.exerciseId != exerciseId) entry
                    else entry.copy(
                        sets = entry.sets.map { s ->
                            if (s.setNumber == setNumber) s.copy(weightKg = safeWeight, reps = safeReps) else s
                        }
                    )
                }
            }
        }
    }

    fun updateSetDuration(exerciseId: String, setNumber: Int, durationSeconds: Int) {
        val safeDuration = durationSeconds.coerceIn(5, 10800)
        viewModelScope.launch {
            mutateTodayEntries { entries ->
                entries.map { entry ->
                    if (entry.exerciseId != exerciseId) entry
                    else entry.copy(
                        sets = entry.sets.map { s ->
                            if (s.setNumber == setNumber) s.copy(durationSeconds = safeDuration) else s
                        }
                    )
                }
            }
        }
    }

    fun addSetToExercise(exerciseId: String) {
        haptics.buttonTap()
        viewModelScope.launch {
            mutateTodayEntries { entries ->
                entries.map { entry ->
                    if (entry.exerciseId != exerciseId || entry.sets.size >= 12) entry
                    else {
                        val last = entry.sets.lastOrNull()
                        val fallbackDuration =
                            if (entry.trackingMode == ExerciseTrackingMode.TIMER) entry.targetDurationSeconds else 0
                        entry.copy(
                            sets = entry.sets + WorkoutSetLog(
                                setNumber = entry.sets.size + 1,
                                weightKg = if (!entry.usesWeight) 0.0 else (last?.weightKg ?: 0.0),
                                reps = last?.reps ?: 10,
                                durationSeconds = last?.durationSeconds ?: fallbackDuration,
                                completed = false
                            )
                        )
                    }
                }
            }
        }
    }

    fun removeSetFromExercise(exerciseId: String) {
        haptics.buttonTap()
        viewModelScope.launch {
            mutateTodayEntries { entries ->
                entries.map { entry ->
                    if (entry.exerciseId != exerciseId || entry.sets.size <= 1) entry
                    else entry.copy(sets = entry.sets.dropLast(1))
                }
            }
        }
    }

    private fun currentTodayEntriesSnapshot(): List<WorkoutLogEntry> {
        val sched = _schedules.value[_todayDayKey.value] ?: return emptyList()
        return GymModelHelpers.buildEntriesFromSchedule(sched.exercises, _todayLog.value?.entries ?: emptyList())
    }

    private suspend fun mutateTodayEntries(
        mutator: (List<WorkoutLogEntry>) -> List<WorkoutLogEntry>
    ) {
        val uid = _user.value?.uid ?: return
        writeMutex.withLock {
            val curDay = _todayDayKey.value
            val curDate = _todayDateKey.value
            val curLog = _todayLog.value
            val sched = _schedules.value[curDay]
            val baseEntries = if (sched != null) {
                GymModelHelpers.buildEntriesFromSchedule(sched.exercises, curLog?.entries ?: emptyList())
            } else {
                emptyList()
            }
            val nextEntries = mutator(baseEntries).take(30)
            val allSets = nextEntries.flatMap { it.sets }
            val allDone = allSets.isNotEmpty() && allSets.all { it.completed }
            val focusTitle = (sched?.focusTitle ?: curLog?.focusTitle ?: "Latihan Hari Ini").trim().take(80)
                .ifEmpty { "Latihan Hari Ini" }
            val existedBefore = curLog != null && curLog.dateKey == curDate

            val optimistic = WorkoutLog(
                userId = uid,
                dateKey = curDate,
                dayKey = curDay,
                focusTitle = focusTitle,
                entries = nextEntries,
                completed = allDone
            )
            _todayLog.value = optimistic
            try {
                repo.saveWorkoutLog(uid, optimistic, existedBefore)
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menyimpan log: ${e.localizedMessage ?: "Coba lagi."}")
            }
        }
    }

    // --- Rest Timer Controls ---

    fun startManualRestTimer(seconds: Int, exerciseName: String = "") {
        haptics.timerStart()
        val safeSec = seconds.coerceIn(5, 600)
        _restIdleTotal.value = safeSec
        _restIdleRemaining.value = safeSec
        _restIdleExercise.value = exerciseName
        RestTimerService.start(getApplication(), safeSec, exerciseName)
        updateMascotSpeech(forceMood = MascotMood.REST, playChirp = true, speakTts = false)
    }

    fun toggleRestPauseOrStart() {
        val rest = RestTimerService.state.value
        if (rest.isActive) {
            haptics.timerPause()
            _restIdleRemaining.value = rest.remainingSeconds.coerceAtLeast(1)
            _restIdleTotal.value = rest.totalSeconds.coerceAtLeast(1)
            _restIdleExercise.value = rest.exerciseName
            RestTimerService.stop(getApplication())
        } else {
            val sec = if (_restIdleRemaining.value > 0) _restIdleRemaining.value else _restIdleTotal.value.coerceAtLeast(45)
            haptics.timerStart()
            _restIdleRemaining.value = sec
            RestTimerService.start(getApplication(), sec, _restIdleExercise.value)
            updateMascotSpeech(forceMood = MascotMood.REST, playChirp = true, speakTts = false)
        }
    }

    fun adjustRestTimer(deltaSeconds: Int) {
        haptics.timerAdjust()
        val rest = RestTimerService.state.value
        if (rest.isActive) {
            if (deltaSeconds > 0) {
                RestTimerService.add15Seconds(getApplication())
            } else {
                val next = (rest.remainingSeconds + deltaSeconds).coerceAtLeast(5)
                RestTimerService.start(getApplication(), next, rest.exerciseName)
            }
        } else {
            val base = if (_restIdleRemaining.value > 0) _restIdleRemaining.value else _restIdleTotal.value
            val next = (base + deltaSeconds).coerceIn(5, 600)
            _restIdleRemaining.value = next
            _restIdleTotal.value = next.coerceAtLeast(_restIdleTotal.value)
        }
    }

    fun resetRestTimer() {
        haptics.timerReset()
        RestTimerService.stop(getApplication())
        _restIdleRemaining.value = _restIdleTotal.value.coerceIn(15, 600)
    }

    fun add15SecondsRest() {
        adjustRestTimer(15)
    }

    fun stopRestTimer() {
        haptics.timerPause()
        RestTimerService.stop(getApplication())
        _restIdleRemaining.value = _restIdleTotal.value
    }

    // --- Schedules & Exercise CRUD ---

    fun updateScheduleFields(
        dayKey: DayKey,
        isGymDay: Boolean? = null,
        alarmEnabled: Boolean? = null,
        alarmTime: String? = null,
        focusTitle: String? = null,
        ringtoneId: String? = null
    ) {
        val uid = _user.value?.uid ?: return
        viewModelScope.launch {
            try {
                repo.updateSchedule(
                    uid = uid,
                    dayKey = dayKey,
                    isGymDay = isGymDay,
                    alarmEnabled = alarmEnabled,
                    alarmTime = alarmTime,
                    focusTitle = focusTitle,
                    ringtoneId = ringtoneId
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal memperbarui jadwal: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun addTemplatesToDay(dayKey: DayKey, templates: List<PresetExerciseTemplate>) {
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        if (templates.isEmpty()) return
        if (current.exercises.size + templates.size > 30) {
            val remaining = (30 - current.exercises.size).coerceAtLeast(0)
            _snackbarEvents.tryEmit(
                prefsStore.state.value.lang.t(
                    if (remaining == 0) "Jadwal hari ini sudah penuh (maks 30 gerakan)." else "Maksimal 30 gerakan per hari. Tersisa $remaining slot.",
                    if (remaining == 0) "Today's list is full (max 30 exercises)." else "Max 30 exercises per day. $remaining slots remaining."
                )
            )
            return
        }
        val newItems = templates.mapIndexed { idx, tmpl ->
            GymModelHelpers.sanitizeExerciseItem(
                tmpl.toExerciseItem("ex_${System.currentTimeMillis()}_${idx}_${UUID.randomUUID().toString().take(4)}")
            )
        }
        viewModelScope.launch {
            try {
                repo.updateSchedule(
                    uid = uid,
                    dayKey = dayKey,
                    exercises = current.exercises + newItems
                )
                val lang = prefsStore.state.value.lang
                _snackbarEvents.tryEmit(
                    lang.t(
                        "${newItems.size} gerakan ditambahkan ke ${dayKey.label(lang)}.",
                        "Added ${newItems.size} exercises to ${dayKey.label(lang)}."
                    )
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menambah gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun addCustomExerciseToDay(dayKey: DayKey, exercise: ExerciseItem) {
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        if (current.exercises.size >= 30) {
            _snackbarEvents.tryEmit(
                prefsStore.state.value.lang.t(
                    "Maksimal 30 gerakan per hari latihan.",
                    "Maximum 30 exercises per workout day."
                )
            )
            return
        }
        val sanitized = GymModelHelpers.sanitizeExerciseItem(
            exercise.copy(id = "ex_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(4)}")
        )
        viewModelScope.launch {
            try {
                repo.updateSchedule(
                    uid = uid,
                    dayKey = dayKey,
                    exercises = current.exercises + sanitized
                )
                _snackbarEvents.tryEmit(
                    prefsStore.state.value.lang.t(
                        "${sanitized.name} ditambahkan.",
                        "${sanitized.name} added."
                    )
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menyimpan gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun updateExerciseInDay(dayKey: DayKey, updated: ExerciseItem) {
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        val sanitized = GymModelHelpers.sanitizeExerciseItem(updated)
        viewModelScope.launch {
            try {
                repo.updateSchedule(
                    uid = uid,
                    dayKey = dayKey,
                    exercises = current.exercises.map { if (it.id == sanitized.id) sanitized else it }
                )
                _snackbarEvents.tryEmit(
                    prefsStore.state.value.lang.t(
                        "${sanitized.name} diperbarui.",
                        "${sanitized.name} updated."
                    )
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal memperbarui gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun removeExerciseFromDay(dayKey: DayKey, exerciseId: String) {
        haptics.destructive()
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        viewModelScope.launch {
            try {
                repo.updateSchedule(
                    uid = uid,
                    dayKey = dayKey,
                    exercises = current.exercises.filterNot { it.id == exerciseId }
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menghapus gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun moveExerciseInDay(dayKey: DayKey, exerciseId: String, moveUp: Boolean) {
        haptics.buttonTap()
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        val list = current.exercises.toMutableList()
        val idx = list.indexOfFirst { it.id == exerciseId }
        if (idx == -1) return
        val target = if (moveUp) idx - 1 else idx + 1
        if (target !in list.indices) return
        val item = list.removeAt(idx)
        list.add(target, item)
        viewModelScope.launch {
            try {
                repo.updateSchedule(uid = uid, dayKey = dayKey, exercises = list)
            } catch (_: Exception) {
                _snackbarEvents.tryEmit("Gagal mengurutkan gerakan.")
            }
        }
    }

    // --- Profile & Ringtone Settings ---

    fun updateProfile(
        displayName: String? = null,
        defaultRingtoneId: String? = null,
        restRingtoneId: String? = null,
        volume: Double? = null,
        notificationsEnabled: Boolean? = null,
        snoozeMinutes: Int? = null,
        autoStartRestTimer: Boolean? = null
    ) {
        val uid = _user.value?.uid ?: return
        viewModelScope.launch {
            try {
                repo.updateProfile(
                    uid = uid,
                    displayName = displayName,
                    defaultRingtoneId = defaultRingtoneId,
                    restRingtoneId = restRingtoneId,
                    volume = volume,
                    notificationsEnabled = notificationsEnabled,
                    snoozeMinutes = snoozeMinutes,
                    autoStartRestTimer = autoStartRestTimer
                )
                refreshMascotDialogueOnly()
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menyimpan pengaturan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun previewRingtone(ringtoneId: String) {
        if (_previewingRingtoneId.value == ringtoneId) {
            stopRingtonePreview()
            return
        }
        haptics.buttonTap()
        _previewingRingtoneId.value = ringtoneId
        val vol = (_profile.value?.volume ?: 0.85).toFloat()
        audioEngine.play(
            ringtoneId = ringtoneId,
            volume = vol,
            loop = false,
            useAlarmStream = false,
            customRingtones = _customRingtones.value
        ) {
            if (_previewingRingtoneId.value == ringtoneId) {
                _previewingRingtoneId.value = null
            }
        }
    }

    fun stopRingtonePreview() {
        audioEngine.stop()
        _previewingRingtoneId.value = null
    }

    fun importCustomRingtone(uri: Uri) {
        val uid = _user.value?.uid ?: return
        viewModelScope.launch {
            _uploadingRingtone.value = true
            val id = "tone_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(4)}"
            val res = NativeAudioEngine.importAudioFromUri(
                context = getApplication(),
                uri = uri,
                userId = uid,
                ringtoneId = id
            )
            res.fold(
                onSuccess = { tone ->
                    try {
                        repo.addCustomRingtone(uid, tone)
                        haptics.setComplete()
                        val lang = prefsStore.state.value.lang
                        _snackbarEvents.tryEmit(
                            lang.t(
                                "Ringtone \"${tone.name}\" siap dipakai!",
                                "Ringtone \"${tone.name}\" is ready!"
                            )
                        )
                    } catch (e: Exception) {
                        _snackbarEvents.tryEmit("Gagal menyimpan ringtone ke Cloud: ${e.localizedMessage ?: "Error"}")
                    }
                },
                onFailure = { err ->
                    _snackbarEvents.tryEmit(err.localizedMessage ?: "Gagal mengimpor file audio.")
                }
            )
            _uploadingRingtone.value = false
        }
    }

    fun deleteCustomRingtone(ringtoneId: String) {
        val uid = _user.value?.uid ?: return
        haptics.destructive()
        if (_previewingRingtoneId.value == ringtoneId) {
            stopRingtonePreview()
        }
        viewModelScope.launch {
            try {
                repo.deleteCustomRingtone(uid, ringtoneId)
                NativeAudioEngine.deleteLocalRingtoneFile(getApplication(), ringtoneId)

                val prof = _profile.value
                if (prof?.defaultRingtoneId == ringtoneId) {
                    repo.updateProfile(uid, defaultRingtoneId = "builtin_athletic_bell")
                }
                if (prof?.restRingtoneId == ringtoneId) {
                    repo.updateProfile(uid, restRingtoneId = "builtin_kettlebell_chime")
                }
                _schedules.value.values
                    .filter { it.ringtoneId == ringtoneId }
                    .forEach { sched ->
                        repo.updateSchedule(uid, sched.dayKey, ringtoneId = "default")
                    }
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menghapus ringtone: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    // --- Test Alarms (In-App + Native 5s) ---

    fun triggerInAppTestAlarm() {
        haptics.alarmAlert()
        val lang = prefsStore.state.value.lang
        val todaySched = _schedules.value[_todayDayKey.value]
        val prof = _profile.value
        val (resolvedId, resolvedName) = GymModelHelpers.resolveRingtoneName(
            ringtoneId = todaySched?.ringtoneId,
            defaultRingtoneId = prof?.defaultRingtoneId ?: "builtin_athletic_bell",
            customRingtones = _customRingtones.value
        )
        val vol = (prof?.volume ?: 0.85).toFloat()
        audioEngine.play(
            ringtoneId = resolvedId,
            volume = vol,
            loop = true,
            useAlarmStream = true,
            customRingtones = _customRingtones.value
        )
        _activeTestAlarm.value = ActiveTestAlarmState(
            timeLabel = GymModelHelpers.formatAlarmTime(
                GymModelHelpers.formatHHMM(Date()),
                prefsStore.state.value.clockFormat,
                lang
            ),
            focusTitle = todaySched?.focusTitle ?: lang.t("Simulasi Alarm Latihan", "Workout Alarm Test"),
            ringtoneId = resolvedId,
            ringtoneName = resolvedName
        )
    }

    fun dismissInAppTestAlarm(openWorkoutAfter: Boolean = false) {
        audioEngine.stop()
        _activeTestAlarm.value = null
        if (openWorkoutAfter) {
            selectTab(AppTab.WORKOUT)
        }
    }

    fun snoozeInAppTestAlarm() {
        val current = _activeTestAlarm.value
        val snoozeMin = _profile.value?.snoozeMinutes ?: 5
        val vol = (_profile.value?.volume ?: 0.85).toFloat()
        audioEngine.stop()
        _activeTestAlarm.value = null
        if (current != null) {
            AlarmScheduler.scheduleSnooze(
                context = getApplication(),
                dayKey = _todayDayKey.value.key,
                focusTitle = current.focusTitle,
                snoozeMinutes = snoozeMin,
                volume = vol,
                ringtoneId = current.ringtoneId
            )
            val lang = prefsStore.state.value.lang
            _snackbarEvents.tryEmit(
                lang.t(
                    "Alarm ditunda $snoozeMin menit di latar belakang Android.",
                    "Alarm snoozed for $snoozeMin min in Android background."
                )
            )
        }
    }

    fun schedule5SecondNativeTestAlarm() {
        haptics.buttonTap()
        val lang = prefsStore.state.value.lang
        val todaySched = _schedules.value[_todayDayKey.value]
        val prof = _profile.value
        val (resolvedId, _) = GymModelHelpers.resolveRingtoneName(
            ringtoneId = todaySched?.ringtoneId,
            defaultRingtoneId = prof?.defaultRingtoneId ?: "builtin_athletic_bell",
            customRingtones = _customRingtones.value
        )
        val exact = AlarmScheduler.scheduleTestAlarm5Seconds(
            context = getApplication(),
            focusTitle = todaySched?.focusTitle ?: "Tes Alarm IronPulse",
            ringtoneId = resolvedId,
            volume = (prof?.volume ?: 0.85).toFloat()
        )
        _snackbarEvents.tryEmit(
            if (exact) {
                lang.t(
                    "Alarm uji Android dijadwalkan 5 detik lagi (Exact Alarm aktif).",
                    "Android test alarm scheduled in 5 seconds (Exact Alarm active)."
                )
            } else {
                lang.t(
                    "Notifikasi uji dijadwalkan 5 detik lagi. Izinkan Exact Alarm agar presisi.",
                    "Test notification scheduled in 5 seconds. Enable Exact Alarm for precision."
                )
            }
        )
    }

    // --- Mascot Companion State Machine ---

    private fun initializeInitialPose() {
        val cal = Calendar.getInstance()
        val phase = GymModelHelpers.resolveDayTimePhase(prefsStore.state.value.todayThemeMode, cal)
        lastObservedTimePhase = phase
        mascotPhasePoseIdx = initialPhasePoseIndex(phase, cal.get(Calendar.HOUR_OF_DAY))
        pushRecentPose(mascotPhasePoseIdx)
    }

    private fun startMascotLifeLoops() {
        // 1. Eye Blinking loop (~3.6s) — isolated to _mascotEyeState so root UI never recomposes
        viewModelScope.launch {
            while (true) {
                delay(3600L)
                val staticMode = prefsStore.state.value.performance.staticMascot ||
                    prefsStore.state.value.performance.noAnimations
                val current = _mascotState.value
                val closedCalm = current.urgentMood == null &&
                    current.activeTimePose in CLOSED_NIGHT_POSES
                if (!staticMode && !closedCalm) {
                    _mascotEyeState.value = _mascotEyeState.value.copy(isBlinking = true)
                    delay(135L)
                    _mascotEyeState.value = _mascotEyeState.value.copy(isBlinking = false)
                }
            }
        }

        // 2. Eye Glancing + Dialogue Lock Check loop (~2.9s)
        viewModelScope.launch {
            while (true) {
                delay(2900L)
                val now = System.currentTimeMillis()
                val staticMode = prefsStore.state.value.performance.staticMascot ||
                    prefsStore.state.value.performance.noAnimations
                val current = _mascotState.value
                val lockActive = now < dialogueLockedUntilMs
                val closedCalm = current.urgentMood == null &&
                    current.activeTimePose in CLOSED_NIGHT_POSES

                val (gx, gy) = if (staticMode || current.urgentMood != null || closedCalm) {
                    0f to 0f
                } else {
                    GLANCE_TARGETS.random()
                }
                if (_mascotEyeState.value.glanceX != gx || _mascotEyeState.value.glanceY != gy) {
                    _mascotEyeState.value = _mascotEyeState.value.copy(glanceX = gx, glanceY = gy)
                }
                if (current.isDialogueLocked != lockActive) {
                    _mascotState.value = current.copy(isDialogueLocked = lockActive)
                }

                // Silent ambient expression shifts every ~26s during daytime
                if (!staticMode && current.urgentMood == null && current.timePhase != DayTimePhase.NIGHT &&
                    now - lastSilentPoseAtMs >= 26_000L
                ) {
                    lastSilentPoseAtMs = now
                    rotateTimePoseOnly()
                }

                // Autonomous calm chat (~68s day, ~120s night) when dialogue lock is free
                val chatGap = if (current.timePhase == DayTimePhase.NIGHT) 120_000L else 68_000L
                if (!lockActive && initialGreetingFired && !_showLaunchIntro.value &&
                    now - lastAutoChatAtMs >= chatGap
                ) {
                    lastAutoChatAtMs = now
                    val pool = posesForPhase(current.timePhase)
                    if (current.timePhase == DayTimePhase.NIGHT) {
                        val awake = (1 until pool.size).filter { it !in recentPoseIndices }
                        val chosen = awake.ifEmpty { (1 until pool.size).toList() }.random()
                        mascotPhasePoseIdx = chosen
                        pushRecentPose(chosen)
                        updateMascotSpeech(playChirp = true, speakTts = false)
                        scheduleNightReturnToSleep(7000L)
                    } else {
                        mascotPhasePoseIdx = pickFreshPoseIndex(pool.size, mascotPhasePoseIdx)
                        pushRecentPose(mascotPhasePoseIdx)
                        updateMascotSpeech(playChirp = true, speakTts = false)
                    }
                }
            }
        }
    }

    private fun scheduleNightReturnToSleep(delayMs: Long) {
        nightWakeReturnJob?.cancel()
        nightWakeReturnJob = viewModelScope.launch {
            delay(delayMs)
            val current = _mascotState.value
            if (current.timePhase == DayTimePhase.NIGHT && current.urgentMood == null) {
                mascotPhasePoseIdx = 0
                refreshMascotDialogueOnly()
            }
        }
    }

    fun tapMascot() {
        haptics.buttonTap()
        viewModelScope.launch {
            _mascotEyeState.value = _mascotEyeState.value.copy(tapBounce = true)
            delay(720L)
            _mascotEyeState.value = _mascotEyeState.value.copy(tapBounce = false)
        }

        val now = System.currentTimeMillis()
        if (now < dialogueLockedUntilMs) {
            return
        }

        val cal = Calendar.getInstance()
        val phase = GymModelHelpers.resolveDayTimePhase(prefsStore.state.value.todayThemeMode, cal)
        val pool = posesForPhase(phase)
        if (_mascotState.value.urgentMood == null) {
            mascotPhasePoseIdx = pickFreshPoseIndex(pool.size, mascotPhasePoseIdx)
            pushRecentPose(mascotPhasePoseIdx)
            if (phase == DayTimePhase.NIGHT && mascotPhasePoseIdx != 0) {
                scheduleNightReturnToSleep(9500L)
            }
        }
        mascotQuoteRoll = (mascotQuoteRoll + 1 + (0..12).random()) % 97
        updateMascotSpeech(playChirp = true, speakTts = true)
    }

    fun replayMascotVoice() {
        haptics.buttonTap()
        val prefs = prefsStore.state.value
        val line = _mascotState.value.activeLine
        val text = "${line.headline}. ${line.subline}"
        ttsSpeaker.speak(text, prefs.lang, enabled = true)
    }

    private fun rotateTimePoseOnly() {
        val phase = GymModelHelpers.resolveDayTimePhase(prefsStore.state.value.todayThemeMode)
        val pool = posesForPhase(phase)
        mascotPhasePoseIdx = pickFreshPoseIndex(pool.size, mascotPhasePoseIdx)
        pushRecentPose(mascotPhasePoseIdx)
        val activePose = pool[mascotPhasePoseIdx % pool.size]
        _mascotState.value = _mascotState.value.copy(activeTimePose = activePose)
    }

    private fun refreshMascotDialogueOnly() {
        val prefs = prefsStore.state.value
        val cal = Calendar.getInstance()
        val phase = GymModelHelpers.resolveDayTimePhase(prefs.todayThemeMode, cal)
        val pool = posesForPhase(phase)
        val activePose = pool[mascotPhasePoseIdx % pool.size]
        val contextInfo = buildMascotContext(phase, activePose, forceMood = null)
        val lines = MascotDialogues.buildMascotSpeechPool(contextInfo)
        val chosen = lines.firstOrNull { it.id == _mascotState.value.activeLine.id }
            ?: pickLineFromPool(lines, mascotQuoteRoll)
        val colorHex = resolveMascotColorHex(contextInfo.mood, phase, prefs)
        _mascotState.value = _mascotState.value.copy(
            mood = contextInfo.mood,
            timePhase = phase,
            activeTimePose = activePose,
            phaseColorHex = colorHex,
            activeLine = chosen
        )
    }

    private fun updateMascotSpeech(
        forceMood: MascotMood? = null,
        activeTimerExerciseName: String? = null,
        dayJustChanged: Boolean = false,
        playChirp: Boolean = true,
        speakTts: Boolean = false,
        bypassLock: Boolean = false
    ) {
        val now = System.currentTimeMillis()
        if (!bypassLock && now < dialogueLockedUntilMs && forceMood == null) {
            return
        }
        val prefs = prefsStore.state.value
        val cal = Calendar.getInstance()
        val phase = GymModelHelpers.resolveDayTimePhase(prefs.todayThemeMode, cal)
        val pool = posesForPhase(phase)
        val activePose = pool[mascotPhasePoseIdx % pool.size]
        val ctx = buildMascotContext(
            phase = phase,
            activePose = activePose,
            forceMood = forceMood,
            activeTimerExerciseName = activeTimerExerciseName,
            dayJustChanged = dayJustChanged
        )
        val lines = MascotDialogues.buildMascotSpeechPool(ctx)
        mascotQuoteRoll = (mascotQuoteRoll + 1 + (0..7).random()) % 97
        val picked = pickLineFromPool(lines, mascotQuoteRoll)

        if (recentLineIds.lastOrNull() != picked.id) {
            recentLineIds.remove(picked.id)
            recentLineIds.addLast(picked.id)
            while (recentLineIds.size > 18) recentLineIds.removeFirst()
        }

        val urgent = if (ctx.mood in URGENT_MOODS) ctx.mood else null
        val colorHex = resolveMascotColorHex(ctx.mood, phase, prefs)

        dialogueLockedUntilMs = now + 14_000L
        lastAutoChatAtMs = now

        _mascotState.value = _mascotState.value.copy(
            mood = ctx.mood,
            timePhase = phase,
            urgentMood = urgent,
            activeTimePose = activePose,
            phaseColorHex = colorHex,
            activeLine = picked,
            speechEventId = _mascotState.value.speechEventId + 1,
            isDialogueLocked = true
        )

        if (playChirp) {
            val vol = (_profile.value?.volume ?: 0.85).toFloat()
            val variant = if (phase == DayTimePhase.NIGHT && urgent == null) "night" else ctx.mood.wireValue
            audioEngine.playMascotChirp(variant, vol)
        }
        if (speakTts && prefs.mascotVoiceEnabled && !_showLaunchIntro.value) {
            ttsSpeaker.speak("${picked.headline}. ${picked.subline}", prefs.lang, true)
        }
    }

    private fun buildMascotContext(
        phase: DayTimePhase,
        activePose: TimePhasePose,
        forceMood: MascotMood?,
        activeTimerExerciseName: String? = null,
        dayJustChanged: Boolean = false
    ): MascotDialogueContext {
        val prefs = prefsStore.state.value
        val today = _todayDayKey.value
        val sched = _schedules.value[today]
        val entries = currentTodayEntriesSnapshot()
        val totalSets = entries.sumOf { it.sets.size }
        val completedSets = entries.sumOf { e -> e.sets.count { it.completed } }
        val pct = if (totalSets > 0) (completedSets * 100) / totalSets else 0
        val allDone = totalSets > 0 && completedSets == totalSets

        val rest = RestTimerService.state.value
        val runningExTimer = _exerciseTimers.value.entries.firstOrNull { it.value.running }
        val runningExName = activeTimerExerciseName
            ?: runningExTimer?.key?.let { id -> entries.firstOrNull { it.exerciseId == id }?.name }

        val derivedMood = forceMood ?: when {
            allDone -> MascotMood.CELEBRATE
            runningExTimer != null -> MascotMood.TIMER_ACTIVE
            rest.isActive -> MascotMood.REST
            sched != null && !sched.isGymDay -> MascotMood.RESTDAY
            else -> MascotMood.READY
        }

        val cleanName = (_profile.value?.displayName ?: "").trim()
        val n = if (cleanName.isNotEmpty()) ", $cleanName" else ""

        return MascotDialogueContext(
            lang = prefs.lang,
            mood = derivedMood,
            timePhase = phase,
            activeTimePose = activePose,
            n = n,
            completedSets = completedSets,
            totalSets = totalSets,
            progressPct = pct,
            dayLabel = today.label(prefs.lang),
            activeTimerExerciseName = runningExName,
            restRemainingFormatted = if (rest.isActive) GymModelHelpers.formatRestDuration(rest.remainingSeconds) else null,
            allCompleted = allDone,
            dayJustChanged = dayJustChanged
        )
    }

    private fun resolveMascotColorHex(mood: MascotMood, phase: DayTimePhase, prefs: AppPreferences): String {
        return when (mood) {
            MascotMood.CELEBRATE, MascotMood.CLAP, MascotMood.MILESTONE -> prefs.accentColorHex
            MascotMood.TIMER_ACTIVE, MascotMood.REST -> "#38BDF8"
            else -> resolvePhaseThemeTokens(phase).accentBrightHex
        }
    }

    private fun pushRecentPose(idx: Int) {
        recentPoseIndices.remove(idx)
        recentPoseIndices.addLast(idx)
        while (recentPoseIndices.size > 5) recentPoseIndices.removeFirst()
    }

    private fun pickFreshPoseIndex(poolSize: Int, prevIdx: Int): Int {
        if (poolSize <= 1) return 0
        val fresh = (0 until poolSize).filter { it != prevIdx && it !in recentPoseIndices }
        if (fresh.isNotEmpty()) return fresh.random()
        val alt = (0 until poolSize).filter { it != prevIdx }
        return alt.ifEmpty { listOf(0) }.random()
    }

    private fun pickLineFromPool(pool: List<MascotSpeechLine>, roll: Int): MascotSpeechLine {
        if (pool.isEmpty()) return MascotSpeechLine("fallback", "IronPulse", "")
        val unseen = pool.filter { it.id !in recentLineIds }
        val candidates = unseen.ifEmpty { pool }
        return candidates[abs(roll) % candidates.size]
    }

    private fun initialPhasePoseIndex(phase: DayTimePhase, hour: Int): Int = when (phase) {
        DayTimePhase.MORNING -> when {
            hour < 6 -> 5 // SUNRISE
            hour < 7 -> 0 // TEA
            hour < 9 -> 1 // COFFEE
            hour < 10 -> 6 // PROTEIN
            else -> 2 // STRETCH
        }
        DayTimePhase.AFTERNOON -> when {
            hour < 13 -> 0 // HYDRATE
            hour < 15 -> 1 // SHADES
            hour < 17 -> 2 // FLEX
            else -> 3 // MUSIC
        }
        DayTimePhase.NIGHT -> when {
            hour >= 22 || hour < 4 -> 0 // SLEEP
            hour >= 20 -> 7 // MOONLIT
            else -> 3 // STARGAZE
        }
    }

    private fun posesForPhase(phase: DayTimePhase): List<TimePhasePose> = when (phase) {
        DayTimePhase.MORNING -> MORNING_POSES
        DayTimePhase.AFTERNOON -> AFTERNOON_POSES
        DayTimePhase.NIGHT -> NIGHT_POSES
    }

    override fun onCleared() {
        audioEngine.stop()
        ttsSpeaker.shutdown()
        super.onCleared()
    }

    companion object {
        private val MORNING_POSES = listOf(
            TimePhasePose.TEA,
            TimePhasePose.COFFEE,
            TimePhasePose.STRETCH,
            TimePhasePose.PERK,
            TimePhasePose.WINK,
            TimePhasePose.SUNRISE,
            TimePhasePose.PROTEIN,
            TimePhasePose.SALUTE,
            TimePhasePose.SPARKLE
        )
        private val AFTERNOON_POSES = listOf(
            TimePhasePose.HYDRATE,
            TimePhasePose.SHADES,
            TimePhasePose.FLEX,
            TimePhasePose.MUSIC,
            TimePhasePose.CURIOUS,
            TimePhasePose.BEAST,
            TimePhasePose.SWEAT,
            TimePhasePose.SMIRK,
            TimePhasePose.WHISTLE
        )
        private val NIGHT_POSES = listOf(
            TimePhasePose.SLEEP,
            TimePhasePose.YAWN,
            TimePhasePose.NIGHT_CHILL,
            TimePhasePose.STARGAZE,
            TimePhasePose.ZEN,
            TimePhasePose.COZY,
            TimePhasePose.DREAM,
            TimePhasePose.MOONLIT,
            TimePhasePose.RECHARGE
        )
        private val CLOSED_NIGHT_POSES = setOf(
            TimePhasePose.SLEEP,
            TimePhasePose.ZEN,
            TimePhasePose.COZY,
            TimePhasePose.DREAM
        )
        private val URGENT_MOODS = setOf(
            MascotMood.CLAP,
            MascotMood.MILESTONE,
            MascotMood.CELEBRATE,
            MascotMood.TIMER_ACTIVE,
            MascotMood.REST
        )
        private val GLANCE_TARGETS = listOf(
            0f to 0f,
            -2.4f to -0.5f,
            2.4f to -0.5f,
            1.6f to 1.1f,
            -1.6f to 0.9f,
            0f to -1.3f,
            2.0f to -1.0f,
            -2.0f to -1.0f
        )
    }
}
