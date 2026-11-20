package com.fathan.ironpulse.data

import android.util.Log
import com.fathan.ironpulse.model.CustomRingtone
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.MuscleGroup
import com.fathan.ironpulse.model.RingtoneStorageMode
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.model.UserProfile
import com.fathan.ironpulse.model.WorkoutLog
import com.fathan.ironpulse.model.WorkoutLogEntry
import com.fathan.ironpulse.model.WorkoutSetLog
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.util.concurrent.atomic.AtomicLong

class FirestoreGymRepository {

    val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }

    val db: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance(FirebaseApp.getInstance(), FIRESTORE_DATABASE_ID)
    }

    fun observeAuthUser(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        trySend(auth.currentUser)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInWithGoogleIdToken(idToken: String): FirebaseUser {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = auth.signInWithCredential(credential).await()
        return result.user ?: throw IllegalStateException("Autentikasi Google berhasil tetapi user tidak tersedia.")
    }

    fun signOut() {
        auth.signOut()
    }

    suspend fun ensureUserInitialized(user: FirebaseUser) {
        val uid = user.uid
        val userRef = db.collection("users").document(uid)
        val schedulesCol = userRef.collection("schedules")

        val userSnap = userRef.get().await()
        val schedSnap = schedulesCol.whereEqualTo("userId", uid).get().await()

        val batch = db.batch()
        var hasWrites = false

        if (!userSnap.exists()) {
            val displayName = (user.displayName?.trim()?.takeIf { it.isNotEmpty() } ?: "Atlet IronPulse").take(100)
            val email = (user.email ?: "").take(200)
            val initialProfile = mapOf(
                "userId" to uid,
                "displayName" to displayName,
                "email" to email,
                "defaultRingtoneId" to "builtin_athletic_bell",
                "restRingtoneId" to "builtin_kettlebell_chime",
                "volume" to 0.85,
                "notificationsEnabled" to false,
                "snoozeMinutes" to 5,
                "autoStartRestTimer" to true,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            batch.set(userRef, initialProfile)
            hasWrites = true
        }

        val existingIds = schedSnap.documents.map { it.id }.toSet()
        val defaults = GymPresets.createDefaultSchedules(uid)
        val missingDays = DayKey.entries.filter { it.key !in existingIds }

        if (missingDays.isNotEmpty()) {
            for (day in missingDays) {
                val sched = defaults[day] ?: continue
                val docRef = schedulesCol.document(day.key)
                batch.set(
                    docRef,
                    mapOf(
                        "userId" to uid,
                        "dayKey" to day.key,
                        "isGymDay" to sched.isGymDay,
                        "alarmEnabled" to sched.alarmEnabled,
                        "alarmTime" to sched.alarmTime,
                        "focusTitle" to sched.focusTitle.take(80),
                        "ringtoneId" to sched.ringtoneId.take(128),
                        "exercises" to sched.exercises.take(30).map(::exerciseToMap),
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            }
            hasWrites = true
        }

        if (hasWrites) {
            batch.commit().await()
        }
    }

    fun observeProfile(
        uid: String,
        onError: (Exception) -> Unit = {}
    ): Flow<UserProfile?> = callbackFlow {
        val reg: ListenerRegistration = db.collection("users").document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Profile listener error for users/$uid: ${error.message}", error)
                    onError(error)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    trySend(parseUserProfile(snapshot, uid))
                }
            }
        awaitClose { reg.remove() }
    }

    fun observeSchedules(
        uid: String,
        onError: (Exception) -> Unit = {}
    ): Flow<Map<DayKey, DaySchedule>> = callbackFlow {
        val parseSeq = AtomicLong(0L)
        var parseJob: Job? = null
        val reg: ListenerRegistration = db.collection("users").document(uid)
            .collection("schedules")
            .whereEqualTo("userId", uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Schedules listener error for users/$uid/schedules: ${error.message}", error)
                    onError(error)
                    trySend(GymPresets.createDefaultSchedules(uid))
                    return@addSnapshotListener
                }
                val docs = snapshot?.documents
                val ticket = parseSeq.incrementAndGet()
                parseJob?.cancel()
                parseJob = launch(Dispatchers.Default) {
                    val defaults = GymPresets.createDefaultSchedules(uid).toMutableMap()
                    docs?.forEach { doc ->
                        val parsed = parseDaySchedule(doc, uid)
                        if (parsed != null) {
                            defaults[parsed.dayKey] = parsed
                        }
                    }
                    if (parseSeq.get() == ticket) {
                        trySend(defaults.toMap())
                    }
                }
            }
        awaitClose {
            parseJob?.cancel()
            reg.remove()
        }
    }

    fun observeRingtones(
        uid: String,
        onError: (Exception) -> Unit = {}
    ): Flow<List<CustomRingtone>> = callbackFlow {
        val parseSeq = AtomicLong(0L)
        var parseJob: Job? = null
        val reg: ListenerRegistration = db.collection("users").document(uid)
            .collection("ringtones")
            .whereEqualTo("userId", uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Ringtones listener error for users/$uid/ringtones: ${error.message}", error)
                    onError(error)
                    return@addSnapshotListener
                }
                val docs = snapshot?.documents
                val ticket = parseSeq.incrementAndGet()
                parseJob?.cancel()
                parseJob = launch(Dispatchers.Default) {
                    val list = docs
                        ?.mapNotNull { parseCustomRingtone(it, uid) }
                        ?.sortedBy { it.name.lowercase() }
                        ?: emptyList()
                    if (parseSeq.get() == ticket) {
                        trySend(list)
                    }
                }
            }
        awaitClose {
            parseJob?.cancel()
            reg.remove()
        }
    }

    suspend fun addCustomRingtone(uid: String, ringtone: CustomRingtone) {
        val safeId = ringtone.id.replace(Regex("[^a-zA-Z0-9_-]"), "_").take(128)
        db.collection("users").document(uid)
            .collection("ringtones").document(safeId)
            .set(
                mapOf(
                    "userId" to uid,
                    "name" to ringtone.name.trim().take(80).ifEmpty { "Ringtone Kustom" },
                    "mimeType" to ringtone.mimeType.trim().take(60).ifEmpty { "audio/mpeg" },
                    "sizeBytes" to ringtone.sizeBytes.coerceIn(0L, 20_000_000L),
                    "durationSeconds" to ringtone.durationSeconds.coerceIn(0, 3600),
                    "storageMode" to ringtone.storageMode.wireValue,
                    "audioDataUrl" to ringtone.audioDataUrl.take(650_000),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .await()
    }

    suspend fun deleteCustomRingtone(uid: String, ringtoneId: String) {
        db.collection("users").document(uid)
            .collection("ringtones").document(ringtoneId)
            .delete()
            .await()
    }

    fun observeTodayLog(uid: String, dateKey: String): Flow<WorkoutLog?> = callbackFlow {
        val parseSeq = AtomicLong(0L)
        var parseJob: Job? = null
        val reg: ListenerRegistration = db.collection("users").document(uid)
            .collection("workoutLogs")
            .document(dateKey)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Today log listener error for users/$uid/workoutLogs/$dateKey: ${error.message}", error)
                    return@addSnapshotListener
                }
                val ticket = parseSeq.incrementAndGet()
                parseJob?.cancel()
                parseJob = launch(Dispatchers.Default) {
                    val parsed = if (snapshot != null && snapshot.exists()) {
                        parseWorkoutLog(snapshot, uid)
                    } else {
                        null
                    }
                    if (parseSeq.get() == ticket) {
                        trySend(parsed)
                    }
                }
            }
        awaitClose {
            parseJob?.cancel()
            reg.remove()
        }
    }

    fun observeWorkoutHistory(
        uid: String,
        onError: (Exception) -> Unit = {}
    ): Flow<List<WorkoutLog>> = callbackFlow {
        val parseSeq = AtomicLong(0L)
        var parseJob: Job? = null
        val reg: ListenerRegistration = db.collection("users").document(uid)
            .collection("workoutLogs")
            .whereEqualTo("userId", uid)
            .limit(400)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "History listener error for users/$uid/workoutLogs: ${error.message}", error)
                    onError(error)
                    return@addSnapshotListener
                }
                val docs = snapshot?.documents
                val ticket = parseSeq.incrementAndGet()
                parseJob?.cancel()
                parseJob = launch(Dispatchers.Default) {
                    val logs = docs
                        ?.mapNotNull { parseWorkoutLog(it, uid) }
                        ?.sortedByDescending { it.dateKey }
                        ?: emptyList()
                    if (parseSeq.get() == ticket) {
                        trySend(logs)
                    }
                }
            }
        awaitClose {
            parseJob?.cancel()
            reg.remove()
        }
    }

    suspend fun updateProfile(
        uid: String,
        displayName: String? = null,
        defaultRingtoneId: String? = null,
        restRingtoneId: String? = null,
        volume: Double? = null,
        notificationsEnabled: Boolean? = null,
        snoozeMinutes: Int? = null,
        autoStartRestTimer: Boolean? = null
    ) {
        val updates = mutableMapOf<String, Any>(
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (displayName != null) {
            val cleaned = displayName.trim().take(100)
            if (cleaned.isNotEmpty()) updates["displayName"] = cleaned
        }
        if (!defaultRingtoneId.isNullOrBlank()) {
            updates["defaultRingtoneId"] = defaultRingtoneId.trim().take(128)
        }
        if (!restRingtoneId.isNullOrBlank()) {
            updates["restRingtoneId"] = restRingtoneId.trim().take(128)
        }
        if (volume != null) {
            updates["volume"] = volume.coerceIn(0.0, 1.0)
        }
        if (notificationsEnabled != null) {
            updates["notificationsEnabled"] = notificationsEnabled
        }
        if (snoozeMinutes != null) {
            updates["snoozeMinutes"] = snoozeMinutes.coerceIn(1, 60)
        }
        if (autoStartRestTimer != null) {
            updates["autoStartRestTimer"] = autoStartRestTimer
        }
        db.collection("users").document(uid).update(updates).await()
    }

    suspend fun updateSchedule(
        uid: String,
        dayKey: DayKey,
        isGymDay: Boolean? = null,
        alarmEnabled: Boolean? = null,
        alarmTime: String? = null,
        focusTitle: String? = null,
        ringtoneId: String? = null,
        exercises: List<ExerciseItem>? = null
    ) {
        val updates = mutableMapOf<String, Any>(
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (isGymDay != null) updates["isGymDay"] = isGymDay
        if (alarmEnabled != null) updates["alarmEnabled"] = alarmEnabled
        if (alarmTime != null && Regex("^([01]\\d|2[0-3]):([0-5]\\d)$").matches(alarmTime)) {
            updates["alarmTime"] = alarmTime
        }
        if (focusTitle != null) {
            updates["focusTitle"] = focusTitle.trim().take(80).ifEmpty { "Sesi Latihan" }
        }
        if (ringtoneId != null) {
            updates["ringtoneId"] = ringtoneId.trim().take(128).ifEmpty { "default" }
        }
        if (exercises != null) {
            updates["exercises"] = exercises.take(30).map {
                exerciseToMap(GymModelHelpers.sanitizeExerciseItem(it))
            }
        }
        db.collection("users").document(uid)
            .collection("schedules").document(dayKey.key)
            .update(updates)
            .await()
    }

    suspend fun saveWorkoutLog(
        uid: String,
        log: WorkoutLog,
        existedBefore: Boolean
    ) {
        val docRef = db.collection("users").document(uid)
            .collection("workoutLogs").document(log.dateKey)
        val safeFocus = log.focusTitle.trim().take(80).ifEmpty { "Latihan Hari Ini" }
        val entriesPayload = log.entries.take(30).map(::entryToMap)

        if (!existedBefore) {
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "dateKey" to log.dateKey,
                    "dayKey" to log.dayKey.key,
                    "focusTitle" to safeFocus,
                    "entries" to entriesPayload,
                    "completed" to log.completed,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } else {
            docRef.update(
                mapOf(
                    "focusTitle" to safeFocus,
                    "entries" to entriesPayload,
                    "completed" to log.completed,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        }
    }

    private fun parseUserProfile(doc: DocumentSnapshot, uid: String): UserProfile {
        return UserProfile(
            userId = doc.getString("userId") ?: uid,
            displayName = doc.getString("displayName") ?: "Atlet IronPulse",
            email = doc.getString("email") ?: "",
            defaultRingtoneId = doc.getString("defaultRingtoneId") ?: "builtin_athletic_bell",
            restRingtoneId = doc.getString("restRingtoneId") ?: "builtin_kettlebell_chime",
            volume = (doc.getDouble("volume") ?: 0.85).coerceIn(0.0, 1.0),
            notificationsEnabled = doc.getBoolean("notificationsEnabled") ?: false,
            snoozeMinutes = (doc.getLong("snoozeMinutes")?.toInt() ?: 5).coerceIn(1, 60),
            autoStartRestTimer = doc.getBoolean("autoStartRestTimer") ?: true
        )
    }

    private fun parseCustomRingtone(doc: DocumentSnapshot, uid: String): CustomRingtone {
        return CustomRingtone(
            id = doc.id,
            userId = doc.getString("userId") ?: uid,
            name = doc.getString("name") ?: "Ringtone Kustom",
            mimeType = doc.getString("mimeType") ?: "audio/mpeg",
            sizeBytes = (doc.getLong("sizeBytes") ?: 0L).coerceAtLeast(0L),
            durationSeconds = (doc.getLong("durationSeconds")?.toInt() ?: 0).coerceIn(0, 3600),
            storageMode = RingtoneStorageMode.fromWire(doc.getString("storageMode")),
            audioDataUrl = doc.getString("audioDataUrl") ?: ""
        )
    }

    private fun parseDaySchedule(doc: DocumentSnapshot, uid: String): DaySchedule? {
        val dayKeyStr = doc.getString("dayKey") ?: doc.id
        if (dayKeyStr !in DayKey.entries.map { it.key }) return null
        val rawList = doc.get("exercises") as? List<*> ?: emptyList<Any>()
        val exercises = rawList.mapIndexedNotNull { idx, item ->
            val map = item as? Map<*, *> ?: return@mapIndexedNotNull null
            parseExerciseItem(map, idx)
        }
        return DaySchedule(
            userId = doc.getString("userId") ?: uid,
            dayKey = DayKey.fromKey(dayKeyStr),
            isGymDay = doc.getBoolean("isGymDay") ?: false,
            alarmEnabled = doc.getBoolean("alarmEnabled") ?: false,
            alarmTime = doc.getString("alarmTime") ?: "06:30",
            focusTitle = doc.getString("focusTitle") ?: "Sesi Latihan",
            ringtoneId = doc.getString("ringtoneId") ?: "default",
            exercises = exercises
        )
    }

    private fun parseExerciseItem(map: Map<*, *>, idx: Int): ExerciseItem {
        val trackingMode = ExerciseTrackingMode.fromWire(map["trackingMode"] as? String)
        val equipment = (map["equipment"] as? String) ?: "Bebas"
        val targetWeightKg = ((map["targetWeightKg"] as? Number)?.toDouble() ?: 0.0)
        val explicitUsesWeight = map["usesWeight"] as? Boolean
        val usesWeight = GymModelHelpers.resolveUsesWeight(
            usesWeight = explicitUsesWeight,
            trackingMode = trackingMode,
            targetWeightKg = targetWeightKg,
            equipment = equipment
        )
        val targetReps = (map["targetReps"] as? String) ?: "10"
        val targetDuration = GymModelHelpers.resolveTargetDurationSeconds(
            targetDurationSeconds = (map["targetDurationSeconds"] as? Number)?.toInt(),
            targetReps = targetReps
        )
        return ExerciseItem(
            id = (map["id"] as? String)?.takeIf { it.isNotEmpty() } ?: "ex_$idx",
            name = (map["name"] as? String) ?: "Gerakan",
            muscleGroup = MuscleGroup.fromLabel(map["muscleGroup"] as? String),
            equipment = equipment,
            targetSets = ((map["targetSets"] as? Number)?.toInt() ?: 3).coerceIn(1, 12),
            targetReps = targetReps,
            targetWeightKg = if (usesWeight) targetWeightKg else 0.0,
            restSeconds = ((map["restSeconds"] as? Number)?.toInt() ?: 60).coerceIn(15, 600),
            notes = (map["notes"] as? String) ?: "",
            trackingMode = trackingMode,
            usesWeight = usesWeight,
            timerDirection = TimerDirection.fromWire(map["timerDirection"] as? String),
            targetDurationSeconds = targetDuration
        )
    }

    private fun parseWorkoutLog(doc: DocumentSnapshot, uid: String): WorkoutLog? {
        val dateKey = doc.getString("dateKey") ?: doc.id
        if (!Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(dateKey)) return null
        val rawEntries = doc.get("entries") as? List<*> ?: emptyList<Any>()
        val entries = rawEntries.mapIndexedNotNull { idx, item ->
            val map = item as? Map<*, *> ?: return@mapIndexedNotNull null
            val rawSets = map["sets"] as? List<*> ?: emptyList<Any>()
            val sets = rawSets.mapIndexedNotNull { sIdx, sItem ->
                val sMap = sItem as? Map<*, *> ?: return@mapIndexedNotNull null
                WorkoutSetLog(
                    setNumber = (sMap["setNumber"] as? Number)?.toInt() ?: (sIdx + 1),
                    weightKg = (sMap["weightKg"] as? Number)?.toDouble() ?: 0.0,
                    reps = (sMap["reps"] as? Number)?.toInt() ?: 0,
                    durationSeconds = (sMap["durationSeconds"] as? Number)?.toInt() ?: 0,
                    completed = (sMap["completed"] as? Boolean) ?: false
                )
            }
            val trackingMode = ExerciseTrackingMode.fromWire(map["trackingMode"] as? String)
            val usesWeight = (map["usesWeight"] as? Boolean) ?: (trackingMode != ExerciseTrackingMode.TIMER)
            WorkoutLogEntry(
                exerciseId = (map["exerciseId"] as? String) ?: "ex_$idx",
                name = (map["name"] as? String) ?: "Gerakan",
                muscleGroup = MuscleGroup.fromLabel(map["muscleGroup"] as? String),
                trackingMode = trackingMode,
                usesWeight = usesWeight,
                timerDirection = TimerDirection.fromWire(map["timerDirection"] as? String),
                targetDurationSeconds = ((map["targetDurationSeconds"] as? Number)?.toInt() ?: 60).coerceIn(5, 10800),
                sets = sets
            )
        }
        return WorkoutLog(
            userId = doc.getString("userId") ?: uid,
            dateKey = dateKey,
            dayKey = DayKey.fromKey(doc.getString("dayKey")),
            focusTitle = doc.getString("focusTitle") ?: "Latihan",
            entries = entries,
            completed = doc.getBoolean("completed") ?: false
        )
    }

    private fun exerciseToMap(ex: ExerciseItem): Map<String, Any> = mapOf(
        "id" to ex.id,
        "name" to ex.name,
        "muscleGroup" to ex.muscleGroup.label,
        "equipment" to ex.equipment,
        "targetSets" to ex.targetSets,
        "targetReps" to ex.targetReps,
        "targetWeightKg" to ex.targetWeightKg,
        "restSeconds" to ex.restSeconds,
        "notes" to ex.notes,
        "trackingMode" to ex.trackingMode.wireValue,
        "usesWeight" to ex.usesWeight,
        "timerDirection" to ex.timerDirection.wireValue,
        "targetDurationSeconds" to ex.targetDurationSeconds
    )

    private fun entryToMap(entry: WorkoutLogEntry): Map<String, Any> = mapOf(
        "exerciseId" to entry.exerciseId,
        "name" to entry.name,
        "muscleGroup" to entry.muscleGroup.label,
        "trackingMode" to entry.trackingMode.wireValue,
        "usesWeight" to entry.usesWeight,
        "timerDirection" to entry.timerDirection.wireValue,
        "targetDurationSeconds" to entry.targetDurationSeconds,
        "sets" to entry.sets.map { s ->
            mapOf(
                "setNumber" to s.setNumber,
                "weightKg" to s.weightKg,
                "reps" to s.reps,
                "durationSeconds" to s.durationSeconds,
                "completed" to s.completed
            )
        }
    )

    companion object {
        private const val TAG = "IronPulseFirestore"
        const val FIRESTORE_DATABASE_ID = "ai-studio-4ce81821-203e-4829-9310-489567156824"
    }
}
