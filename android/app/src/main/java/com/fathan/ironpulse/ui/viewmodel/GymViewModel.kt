package com.fathan.ironpulse.ui.viewmodel

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.fathan.ironpulse.alarm.AlarmScheduler
import com.fathan.ironpulse.data.FirestoreGymRepository
import com.fathan.ironpulse.data.PresetExerciseTemplate
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.model.UserProfile
import com.fathan.ironpulse.model.WorkoutLog
import com.fathan.ironpulse.model.WorkoutLogEntry
import com.fathan.ironpulse.model.WorkoutSetLog
import com.fathan.ironpulse.timer.RestTimerService
import com.fathan.ironpulse.timer.RestTimerState
import com.google.firebase.auth.FirebaseUser
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
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID

data class ExerciseTimerUiState(
    val activeSetNumber: Int = 1,
    val running: Boolean = false,
    val elapsedSeconds: Int = 0,
    val targetSeconds: Int = 60,
    val direction: TimerDirection = TimerDirection.COUNTDOWN,
    val lastStartedEpochMs: Long = 0L
)

data class IronPulseUiState(
    val authReady: Boolean = false,
    val user: FirebaseUser? = null,
    val dataLoading: Boolean = true,
    val historyLoading: Boolean = true,
    val authLoading: Boolean = false,
    val authError: String? = null,
    val syncError: String? = null,
    val isOffline: Boolean = false,
    val profile: UserProfile? = null,
    val schedules: Map<DayKey, DaySchedule> = emptyMap(),
    val todayDayKey: DayKey = GymModelHelpers.getTodayDayKey(),
    val todayDateKey: String = GymModelHelpers.formatLocalDateKey(),
    val todayLog: WorkoutLog? = null,
    val effectiveTodayEntries: List<WorkoutLogEntry> = emptyList(),
    val workoutHistory: List<WorkoutLog> = emptyList(),
    val exerciseTimers: Map<String, ExerciseTimerUiState> = emptyMap(),
    val restTimer: RestTimerState = RestTimerState()
)

class GymViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = FirestoreGymRepository()
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
    private val _todayDayKey = MutableStateFlow(GymModelHelpers.getTodayDayKey())
    private val _todayDateKey = MutableStateFlow(GymModelHelpers.formatLocalDateKey())
    private val _todayLog = MutableStateFlow<WorkoutLog?>(null)
    private val _workoutHistory = MutableStateFlow<List<WorkoutLog>>(emptyList())
    private val _exerciseTimers = MutableStateFlow<Map<String, ExerciseTimerUiState>>(emptyMap())

    private val _snackbarEvents = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val snackbarEvents: SharedFlow<String> = _snackbarEvents.asSharedFlow()

    private var userSyncJob: Job? = null
    private var exerciseTickerJob: Job? = null

    val uiState: StateFlow<IronPulseUiState> = combine(
        combine(_authReady, _user, _dataLoading, _historyLoading, _authLoading) { ready, user, dLoad, hLoad, aLoad ->
            Tuple5(ready, user, dLoad, hLoad, aLoad)
        },
        combine(_authError, _syncError, _isOffline, _profile, _schedules) { aErr, sErr, offline, prof, scheds ->
            Tuple5(aErr, sErr, offline, prof, scheds)
        },
        combine(_todayDayKey, _todayDateKey, _todayLog, _workoutHistory, _exerciseTimers) { dKey, dateKey, tLog, hist, exTimers ->
            Tuple5(dKey, dateKey, tLog, hist, exTimers)
        },
        RestTimerService.state
    ) { g1, g2, g3, rest ->
        val todaySched = g2.fifth[g3.first]
        val entries = if (todaySched != null) {
            GymModelHelpers.buildEntriesFromSchedule(
                exercises = todaySched.exercises,
                existingEntries = g3.third?.entries ?: emptyList()
            )
        } else {
            emptyList()
        }
        IronPulseUiState(
            authReady = g1.first,
            user = g1.second,
            dataLoading = g1.third,
            historyLoading = g1.fourth,
            authLoading = g1.fifth,
            authError = g2.first,
            syncError = g2.second,
            isOffline = g2.third,
            profile = g2.fourth,
            schedules = g2.fifth,
            todayDayKey = g3.first,
            todayDateKey = g3.second,
            todayLog = g3.third,
            effectiveTodayEntries = entries,
            workoutHistory = g3.fourth,
            exerciseTimers = g3.fifth,
            restTimer = rest
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = IronPulseUiState()
    )

    init {
        observeConnectivity()
        observeAuthAndData()
        startDateRolloverMonitor()
        startExerciseTickerLoop()
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
                    _todayLog.value = null
                    _workoutHistory.value = emptyList()
                    _dataLoading.value = false
                    _historyLoading.value = false
                } else {
                    startUserFirestoreSync(firebaseUser)
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
        userSyncJob = viewModelScope.launch {
            val uid = firebaseUser.uid
            try {
                repo.ensureUserInitialized(firebaseUser)
            } catch (e: Exception) {
                _syncError.value = "Sinkronisasi cloud tertunda: ${e.localizedMessage ?: "Periksa koneksi internet."}"
                if (_schedules.value.isEmpty()) {
                    _schedules.value = com.fathan.ironpulse.data.GymPresets.createDefaultSchedules(uid)
                }
                _dataLoading.value = false
            }

            launch {
                repo.observeProfile(uid) { err ->
                    _syncError.value = "Gagal memuat profil: ${err.localizedMessage ?: "Coba lagi."}"
                }.collect { prof ->
                    _profile.value = prof
                    syncNativeAlarmsIfReady()
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
                }
            }
            launch {
                repo.observeWorkoutHistory(uid) { err ->
                    _syncError.value = "Gagal memuat riwayat: ${err.localizedMessage ?: "Coba lagi."}"
                    _historyLoading.value = false
                }.collect { hist ->
                    _workoutHistory.value = hist
                    _historyLoading.value = false
                }
            }
            launch {
                _todayDateKey.collectLatest { dateKey ->
                    repo.observeTodayLog(uid, dateKey).collect { log ->
                        _todayLog.value = log
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
                volume = prof?.volume ?: 0.85
            )
        }
    }

    private fun startDateRolloverMonitor() {
        viewModelScope.launch {
            while (true) {
                delay(30_000L)
                refreshDateClock()
            }
        }
    }

    fun refreshDateClock() {
        val nextDate = GymModelHelpers.formatLocalDateKey()
        val nextDay = GymModelHelpers.getTodayDayKey()
        if (_todayDateKey.value != nextDate) _todayDateKey.value = nextDate
        if (_todayDayKey.value != nextDay) _todayDayKey.value = nextDay
    }

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
        repo.signOut()
        RestTimerService.stop(getApplication())
    }

    private fun startExerciseTickerLoop() {
        exerciseTickerJob?.cancel()
        exerciseTickerJob = viewModelScope.launch {
            while (true) {
                delay(250L)
                val current = _exerciseTimers.value
                val hasRunning = current.values.any { it.running }
                if (!hasRunning) continue

                val now = System.currentTimeMillis()
                val completedQueue = mutableListOf<Triple<String, Int, Int>>()
                val updated = current.mapValues { (exId, st) ->
                    if (!st.running) {
                        st
                    } else {
                        val deltaSec = ((now - st.lastStartedEpochMs) / 1000L).toInt().coerceAtLeast(0)
                        if (deltaSec == 0) {
                            st
                        } else {
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
                _exerciseTimers.value = updated
                for ((exId, setNum, secs) in completedQueue) {
                    completeTimerSet(exId, setNum, secs)
                }
            }
        }
    }

    fun toggleExerciseTimer(entry: WorkoutLogEntry, setNumber: Int) {
        val currentMap = _exerciseTimers.value.toMutableMap()
        val existing = currentMap[entry.exerciseId]
        val now = System.currentTimeMillis()
        if (existing != null && existing.activeSetNumber == setNumber) {
            currentMap[entry.exerciseId] = existing.copy(
                running = !existing.running,
                lastStartedEpochMs = now
            )
        } else {
            currentMap[entry.exerciseId] = ExerciseTimerUiState(
                activeSetNumber = setNumber,
                running = true,
                elapsedSeconds = 0,
                targetSeconds = entry.targetDurationSeconds.coerceIn(5, 10800),
                direction = entry.timerDirection,
                lastStartedEpochMs = now
            )
        }
        _exerciseTimers.value = currentMap
    }

    fun resetExerciseTimer(entry: WorkoutLogEntry) {
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

    fun toggleSetComplete(exerciseId: String, setNumber: Int) {
        viewModelScope.launch {
            var becameCompleted = false
            mutateTodayEntries { entries ->
                entries.map { entry ->
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
            }
            if (becameCompleted) {
                triggerAutoRestIfEnabled(exerciseId)
            }
        }
    }

    fun completeTimerSet(exerciseId: String, setNumber: Int, durationSeconds: Int) {
        val safeDuration = durationSeconds.coerceIn(1, 10800)
        viewModelScope.launch {
            var becameCompleted = false
            mutateTodayEntries { entries ->
                entries.map { entry ->
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
            }
            if (becameCompleted) {
                triggerAutoRestIfEnabled(exerciseId)
            }
        }
    }

    private fun triggerAutoRestIfEnabled(exerciseId: String) {
        val autoStart = _profile.value?.autoStartRestTimer ?: true
        if (!autoStart) return
        val sched = _schedules.value[_todayDayKey.value] ?: return
        val ex = sched.exercises.firstOrNull { it.id == exerciseId } ?: return
        RestTimerService.start(
            context = getApplication(),
            seconds = ex.restSeconds.coerceIn(15, 600),
            exerciseName = ex.name
        )
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

    fun addSetToExercise(exerciseId: String) {
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
        viewModelScope.launch {
            mutateTodayEntries { entries ->
                entries.map { entry ->
                    if (entry.exerciseId != exerciseId || entry.sets.size <= 1) entry
                    else entry.copy(sets = entry.sets.dropLast(1))
                }
            }
        }
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

    fun startManualRestTimer(seconds: Int, exerciseName: String) {
        RestTimerService.start(getApplication(), seconds, exerciseName)
    }

    fun add15SecondsRest() {
        RestTimerService.add15Seconds(getApplication())
    }

    fun stopRestTimer() {
        RestTimerService.stop(getApplication())
    }

    fun updateScheduleFields(
        dayKey: DayKey,
        isGymDay: Boolean? = null,
        alarmEnabled: Boolean? = null,
        alarmTime: String? = null,
        focusTitle: String? = null
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
                    focusTitle = focusTitle
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
                if (remaining == 0) "Jadwal hari ini sudah penuh (maks 30 gerakan)."
                else "Maksimal 30 gerakan per hari. Tersisa $remaining slot."
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
                _snackbarEvents.tryEmit("${newItems.size} gerakan ditambahkan ke ${dayKey.label}.")
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menambah gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun addCustomExerciseToDay(dayKey: DayKey, exercise: ExerciseItem) {
        val uid = _user.value?.uid ?: return
        val current = _schedules.value[dayKey] ?: return
        if (current.exercises.size >= 30) {
            _snackbarEvents.tryEmit("Maksimal 30 gerakan per hari latihan.")
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
                _snackbarEvents.tryEmit("${sanitized.name} ditambahkan.")
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menyimpan gerakan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    fun removeExerciseFromDay(dayKey: DayKey, exerciseId: String) {
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
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal mengurutkan gerakan.")
            }
        }
    }

    fun updateProfileSettings(
        displayName: String? = null,
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
                    volume = volume,
                    notificationsEnabled = notificationsEnabled,
                    snoozeMinutes = snoozeMinutes,
                    autoStartRestTimer = autoStartRestTimer
                )
            } catch (e: Exception) {
                _snackbarEvents.tryEmit("Gagal menyimpan pengaturan: ${e.localizedMessage ?: "Error"}")
            }
        }
    }

    private data class Tuple5<A, B, C, D, E>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D,
        val fifth: E
    )
}
