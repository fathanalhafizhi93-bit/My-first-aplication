package com.fathan.ironpulse.data

import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.MuscleGroup
import com.fathan.ironpulse.model.TimerDirection

data class PresetExerciseTemplate(
    val name: String,
    val muscleGroup: MuscleGroup,
    val equipment: String,
    val targetSets: Int,
    val targetReps: String,
    val targetWeightKg: Double,
    val restSeconds: Int,
    val notes: String,
    val trackingMode: ExerciseTrackingMode = ExerciseTrackingMode.REPS,
    val usesWeight: Boolean = true,
    val timerDirection: TimerDirection = TimerDirection.COUNTDOWN,
    val targetDurationSeconds: Int = 60
) {
    fun toExerciseItem(id: String): ExerciseItem = ExerciseItem(
        id = id,
        name = name,
        muscleGroup = muscleGroup,
        equipment = equipment,
        targetSets = targetSets,
        targetReps = targetReps,
        targetWeightKg = if (usesWeight) targetWeightKg else 0.0,
        restSeconds = restSeconds,
        notes = notes,
        trackingMode = trackingMode,
        usesWeight = usesWeight,
        timerDirection = timerDirection,
        targetDurationSeconds = targetDurationSeconds
    )
}

object GymPresets {

    val EXERCISE_LIBRARY: List<PresetExerciseTemplate> = listOf(
        // Dada (12)
        PresetExerciseTemplate(
            name = "Barbell Bench Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "8-10",
            targetWeightKg = 60.0,
            restSeconds = 120,
            notes = "Turunkan barbel terkontrol ke garis tengah dada, dorong eksplosif."
        ),
        PresetExerciseTemplate(
            name = "Incline Dumbbell Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 22.0,
            restSeconds = 90,
            notes = "Sudut bangku 30 derajat untuk fokus dada atas."
        ),
        PresetExerciseTemplate(
            name = "Incline Barbell Bench Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "8-10",
            targetWeightKg = 50.0,
            restSeconds = 120,
            notes = "Turunkan barbel ke dada bagian atas dengan siku sedikit masuk."
        ),
        PresetExerciseTemplate(
            name = "Flat Dumbbell Bench Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "8-12",
            targetWeightKg = 24.0,
            restSeconds = 90,
            notes = "Rentang gerak lebih dalam dibanding barbel, rapatkan sedikit di atas."
        ),
        PresetExerciseTemplate(
            name = "Decline Barbell Bench Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Barbel",
            targetSets = 3,
            targetReps = "8-10",
            targetWeightKg = 55.0,
            restSeconds = 120,
            notes = "Bangku menurun 15-30 derajat untuk penekanan dada bagian bawah."
        ),
        PresetExerciseTemplate(
            name = "Seated Chest Press Machine",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Mesin Chest Press",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 45.0,
            restSeconds = 90,
            notes = "Jaga punggung rapat ke sandaran dan dorong sejajar garis tengah dada."
        ),
        PresetExerciseTemplate(
            name = "Incline Machine Chest Press",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Mesin Chest Press",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 40.0,
            restSeconds = 90,
            notes = "Dorong stabil tanpa mengangkat bahu ke arah telinga."
        ),
        PresetExerciseTemplate(
            name = "Pec Deck Fly Machine",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Mesin Pec Deck",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 35.0,
            restSeconds = 60,
            notes = "Tahan kontraksi penuh 1 detik saat bantalan lengan bertemu di depan dada."
        ),
        PresetExerciseTemplate(
            name = "Cable Chest Fly",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Kabel",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 15.0,
            restSeconds = 60,
            notes = "Tahan kontraksi 1 detik di titik tengah dada."
        ),
        PresetExerciseTemplate(
            name = "Low-to-High Cable Fly",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Kabel",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 12.5,
            restSeconds = 60,
            notes = "Tarik dari katrol bawah menyilang ke depan dada atas."
        ),
        PresetExerciseTemplate(
            name = "Push-Up",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Tanpa Alat",
            targetSets = 3,
            targetReps = "12-20",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Jaga garis tubuh lurus dari bahu ke tumit, turunkan dada mendekati lantai.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Weighted Dips",
            muscleGroup = MuscleGroup.DADA,
            equipment = "Dip Bar",
            targetSets = 3,
            targetReps = "8-12",
            targetWeightKg = 10.0,
            restSeconds = 90,
            notes = "Condongkan tubuh sedikit ke depan untuk aktivasi dada bawah."
        ),

        // Punggung (12)
        PresetExerciseTemplate(
            name = "Lat Pulldown",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin Kabel",
            targetSets = 4,
            targetReps = "10-12",
            targetWeightKg = 55.0,
            restSeconds = 90,
            notes = "Tarik siku ke arah pinggul, hindari mengayun punggung."
        ),
        PresetExerciseTemplate(
            name = "Close-Grip Neutral Lat Pulldown",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 50.0,
            restSeconds = 90,
            notes = "Pegangan V-bar netral untuk regangan lats maksimal di posisi atas."
        ),
        PresetExerciseTemplate(
            name = "Barbell Bent-Over Row",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "8-10",
            targetWeightKg = 55.0,
            restSeconds = 120,
            notes = "Jaga tulang belakang netral, tarik barbel ke perut bawah."
        ),
        PresetExerciseTemplate(
            name = "Single-Arm Dumbbell Row",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12/sisi",
            targetWeightKg = 22.0,
            restSeconds = 75,
            notes = "Tarik dumbbell ke arah pinggul bukan ke dada untuk fokus otot lats."
        ),
        PresetExerciseTemplate(
            name = "Chest-Supported T-Bar Row",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin Row",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 45.0,
            restSeconds = 90,
            notes = "Sandarkan dada di bantalan untuk mengisolasi punggung tengah."
        ),
        PresetExerciseTemplate(
            name = "Seated Cable Row",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 50.0,
            restSeconds = 90,
            notes = "Rapatkan tulang belikat di puncak tarikan."
        ),
        PresetExerciseTemplate(
            name = "Straight-Arm Cable Pulldown",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 22.5,
            restSeconds = 60,
            notes = "Kunci siku hampir lurus dan tekan batang kabel hingga ke paha depan."
        ),
        PresetExerciseTemplate(
            name = "Pull-Up",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Pull-Up Bar",
            targetSets = 3,
            targetReps = "6-10",
            targetWeightKg = 0.0,
            restSeconds = 120,
            notes = "Rentang gerak penuh dari gantung lurus hingga dagu melewati palang.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Chin-Up",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Pull-Up Bar",
            targetSets = 3,
            targetReps = "6-10",
            targetWeightKg = 0.0,
            restSeconds = 120,
            notes = "Telapak tangan menghadap ke tubuh untuk kombinasi lats bawah dan bisep.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Conventional Barbell Deadlift",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "5",
            targetWeightKg = 100.0,
            restSeconds = 180,
            notes = "Kencangkan lats dan core sebelum tarikan, dorong lantai dengan kaki."
        ),
        PresetExerciseTemplate(
            name = "Rack Pull",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Barbel & Rack",
            targetSets = 3,
            targetReps = "6-8",
            targetWeightKg = 110.0,
            restSeconds = 150,
            notes = "Mulai dari pin setinggi lutut untuk ketebalan punggung atas & traps."
        ),
        PresetExerciseTemplate(
            name = "Back Extension (Hyperextension)",
            muscleGroup = MuscleGroup.PUNGGUNG,
            equipment = "Mesin / Bench",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Naik hingga tubuh sejajar lurus tanpa melengkungkan pinggang berlebihan.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),

        // Bahu (10)
        PresetExerciseTemplate(
            name = "Overhead Barbell Press",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "6-8",
            targetWeightKg = 40.0,
            restSeconds = 120,
            notes = "Kencangkan core dan glutes agar pinggang tidak melengkung."
        ),
        PresetExerciseTemplate(
            name = "Seated Dumbbell Shoulder Press",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "8-12",
            targetWeightKg = 18.0,
            restSeconds = 90,
            notes = "Turunkan dumbbell hingga sejajar telinga lalu dorong lurus ke atas."
        ),
        PresetExerciseTemplate(
            name = "Arnold Press",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 14.0,
            restSeconds = 90,
            notes = "Putar telapak tangan dari menghadap wajah ke depan saat mendorong naik."
        ),
        PresetExerciseTemplate(
            name = "Machine Shoulder Press",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Mesin Bahu",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 35.0,
            restSeconds = 90,
            notes = "Fokus mendorong bahu depan secara stabil hingga mendekati puncak."
        ),
        PresetExerciseTemplate(
            name = "Dumbbell Lateral Raise",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Dumbbell",
            targetSets = 4,
            targetReps = "12-15",
            targetWeightKg = 10.0,
            restSeconds = 60,
            notes = "Angkat lengan ke samping sejajar bahu dengan siku sedikit menekuk."
        ),
        PresetExerciseTemplate(
            name = "Cable Lateral Raise",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Kabel",
            targetSets = 3,
            targetReps = "12-15/sisi",
            targetWeightKg = 7.5,
            restSeconds = 60,
            notes = "Ketegangan konstan di bahu samping dari posisi bawah hingga sejajar."
        ),
        PresetExerciseTemplate(
            name = "Bent-Over Rear Delt Fly",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 8.0,
            restSeconds = 60,
            notes = "Condongkan badan hampir sejajar lantai dan rentangkan tangan ke samping."
        ),
        PresetExerciseTemplate(
            name = "Face Pull",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Kabel Tali",
            targetSets = 3,
            targetReps = "15",
            targetWeightKg = 20.0,
            restSeconds = 60,
            notes = "Tarik tali ke arah dahi untuk kesehatan bahu belakang dan postur."
        ),
        PresetExerciseTemplate(
            name = "Barbell Upright Row",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Barbel",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 30.0,
            restSeconds = 75,
            notes = "Pegangan sedikit lebih lebar dari bahu, angkat siku setinggi bahu."
        ),
        PresetExerciseTemplate(
            name = "Dumbbell Shrugs",
            muscleGroup = MuscleGroup.BAHU,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 26.0,
            restSeconds = 60,
            notes = "Angkat bahu lurus ke atas telinga, tahan 1 detik di puncak untuk traps."
        ),

        // Kaki (15)
        PresetExerciseTemplate(
            name = "Barbell Back Squat",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Barbel & Rack",
            targetSets = 4,
            targetReps = "6-8",
            targetWeightKg = 80.0,
            restSeconds = 150,
            notes = "Turun hingga paha sejajar lantai, dorong tumit saat naik."
        ),
        PresetExerciseTemplate(
            name = "Barbell Front Squat",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Barbel & Rack",
            targetSets = 3,
            targetReps = "6-8",
            targetWeightKg = 60.0,
            restSeconds = 150,
            notes = "Jaga torso tetap tegak dengan siku terangkat ke depan untuk paha depan."
        ),
        PresetExerciseTemplate(
            name = "Goblet Squat",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Kettlebell",
            targetSets = 3,
            targetReps = "12",
            targetWeightKg = 20.0,
            restSeconds = 90,
            notes = "Pegang beban rapat di depan dada, duduk dalam di antara kedua kaki."
        ),
        PresetExerciseTemplate(
            name = "Hack Squat Machine",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Hack Squat",
            targetSets = 3,
            targetReps = "8-12",
            targetWeightKg = 80.0,
            restSeconds = 120,
            notes = "Punggung rapat ke bantalan, turunkan lutut dalam untuk isolasi quadriceps."
        ),
        PresetExerciseTemplate(
            name = "Leg Press",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Leg Press",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 120.0,
            restSeconds = 90,
            notes = "Jangan mengunci lutut penuh di posisi teratas."
        ),
        PresetExerciseTemplate(
            name = "Bulgarian Split Squat",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10/kaki",
            targetWeightKg = 14.0,
            restSeconds = 90,
            notes = "Satu punggung kaki di bangku belakang, tekuk lutut depan terkontrol."
        ),
        PresetExerciseTemplate(
            name = "Walking Lunges",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "12/kaki",
            targetWeightKg = 16.0,
            restSeconds = 90,
            notes = "Jaga langkah stabil dengan lutut depan sejajar arah jari kaki."
        ),
        PresetExerciseTemplate(
            name = "Romanian Deadlift (RDL)",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "8-10",
            targetWeightKg = 70.0,
            restSeconds = 120,
            notes = "Dorong pinggul ke belakang dan rasakan regangan di hamstring."
        ),
        PresetExerciseTemplate(
            name = "Barbell Hip Thrust",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Barbel",
            targetSets = 4,
            targetReps = "8-12",
            targetWeightKg = 80.0,
            restSeconds = 120,
            notes = "Sandarkan tulang belikat di bangku, kencangkan glutes penuh di atas."
        ),
        PresetExerciseTemplate(
            name = "Leg Extension Machine",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Leg Extension",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 45.0,
            restSeconds = 60,
            notes = "Luruskan tungkai penuh dan tahan kontraksi 1 detik di puncak."
        ),
        PresetExerciseTemplate(
            name = "Lying Leg Curl Machine",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Leg Curl",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 35.0,
            restSeconds = 60,
            notes = "Jaga pinggul tetap menempel di bantalan saat menekuk tumit ke arah glutes."
        ),
        PresetExerciseTemplate(
            name = "Seated Leg Curl Machine",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Leg Curl",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 40.0,
            restSeconds = 60,
            notes = "Tarik tumit ke bawah bangku secara terkontrol untuk hamstring maksimal."
        ),
        PresetExerciseTemplate(
            name = "Standing Calf Raise",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin / Smith",
            targetSets = 4,
            targetReps = "15-20",
            targetWeightKg = 45.0,
            restSeconds = 45,
            notes = "Jeda 1 detik di posisi bawah dan puncak kontraksi betis."
        ),
        PresetExerciseTemplate(
            name = "Seated Calf Raise",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Mesin Calf Raise",
            targetSets = 3,
            targetReps = "15-20",
            targetWeightKg = 35.0,
            restSeconds = 45,
            notes = "Targetkan otot soleus dengan rentang gerak penuh dari tumit bawah ke jinjit."
        ),
        PresetExerciseTemplate(
            name = "Wall Sit",
            muscleGroup = MuscleGroup.KAKI,
            equipment = "Tanpa Alat",
            targetSets = 3,
            targetReps = "45 detik",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Sandarkan punggung rata ke dinding dengan lutut membentuk sudut 90 derajat.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 45
        ),

        // Lengan (12)
        PresetExerciseTemplate(
            name = "EZ-Bar Bicep Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "EZ-Bar",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 25.0,
            restSeconds = 60,
            notes = "Kunci siku di sisi tubuh agar fokus penuh pada bisep."
        ),
        PresetExerciseTemplate(
            name = "Alternating Dumbbell Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12/sisi",
            targetWeightKg = 12.0,
            restSeconds = 60,
            notes = "Putar pergelangan tangan ke atas (supinasi) saat mengangkat dumbbell."
        ),
        PresetExerciseTemplate(
            name = "Hammer Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 14.0,
            restSeconds = 60,
            notes = "Pegangan netral untuk melatih brachialis dan lengan bawah."
        ),
        PresetExerciseTemplate(
            name = "Incline Dumbbell Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 10.0,
            restSeconds = 60,
            notes = "Bangku miring 45 derajat memberi regangan ekstra pada kepala panjang bisep."
        ),
        PresetExerciseTemplate(
            name = "Preacher Curl Machine",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Mesin Preacher Curl",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 25.0,
            restSeconds = 60,
            notes = "Hindari mengangkat siku dari bantalan agar bisep tidak dibantu bahu."
        ),
        PresetExerciseTemplate(
            name = "Cable Bicep Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Kabel",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 20.0,
            restSeconds = 60,
            notes = "Ketegangan kabel menjaga beban tetap konstan dari awal hingga puncak."
        ),
        PresetExerciseTemplate(
            name = "Concentration Curl",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "12/sisi",
            targetWeightKg = 10.0,
            restSeconds = 45,
            notes = "Sandarkan siku pada paha dalam untuk isolasi bisep tanpa momentum."
        ),
        PresetExerciseTemplate(
            name = "Tricep Rope Pushdown",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Kabel Tali",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 25.0,
            restSeconds = 60,
            notes = "Buka ujung tali ke samping di posisi terbawah."
        ),
        PresetExerciseTemplate(
            name = "Tricep Straight-Bar Pushdown",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 30.0,
            restSeconds = 60,
            notes = "Siku rapat ke rusuk, tekan palang lurus ke bawah sampai trisep terkunci."
        ),
        PresetExerciseTemplate(
            name = "Overhead Dumbbell Extension",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Dumbbell",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 20.0,
            restSeconds = 60,
            notes = "Jaga siku tetap rapat mengarah ke atas."
        ),
        PresetExerciseTemplate(
            name = "EZ-Bar Skull Crusher",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "EZ-Bar",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 22.5,
            restSeconds = 75,
            notes = "Turunkan barbel perlahan mendekati dahi lalu luruskan siku."
        ),
        PresetExerciseTemplate(
            name = "Close-Grip Barbell Bench Press",
            muscleGroup = MuscleGroup.LENGAN,
            equipment = "Barbel",
            targetSets = 3,
            targetReps = "8-10",
            targetWeightKg = 50.0,
            restSeconds = 90,
            notes = "Pegangan selebar bahu dengan siku rapat untuk massa trisep."
        ),

        // Core (10)
        PresetExerciseTemplate(
            name = "Hanging Leg Raise",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Pull-Up Bar",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Gulung panggul ke atas saat mengangkat kaki agar perut bawah bekerja.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Knee Raise (Captain's Chair)",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Dip Bar",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 0.0,
            restSeconds = 45,
            notes = "Angkat lutut ke arah dada dengan punggung stabil tidak mengayun.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Cable Rope Crunch",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Kabel Tali",
            targetSets = 3,
            targetReps = "12-15",
            targetWeightKg = 35.0,
            restSeconds = 60,
            notes = "Berlutut dan tekuk tulang rusuk ke arah pinggul menggunakan otot perut."
        ),
        PresetExerciseTemplate(
            name = "Cable Woodchopper",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "12/sisi",
            targetWeightKg = 17.5,
            restSeconds = 45,
            notes = "Putar torso dengan kontrol untuk melatih otot oblique."
        ),
        PresetExerciseTemplate(
            name = "Ab Wheel Rollout",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Tanpa Alat",
            targetSets = 3,
            targetReps = "10-12",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Jaga panggul masuk (posterior tilt) agar punggung bawah tidak turun.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Kettlebell Russian Twist",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Kettlebell",
            targetSets = 3,
            targetReps = "16/total",
            targetWeightKg = 10.0,
            restSeconds = 45,
            notes = "Condongkan badan 45 derajat dan putar bahu kanan-kiri terkontrol."
        ),
        PresetExerciseTemplate(
            name = "Cable Pallof Press",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Mesin Kabel",
            targetSets = 3,
            targetReps = "12/sisi",
            targetWeightKg = 15.0,
            restSeconds = 45,
            notes = "Dorong pegangan ke depan dan tahan agar tubuh tidak tertarik berputar."
        ),
        PresetExerciseTemplate(
            name = "Plank",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Tanpa Alat",
            targetSets = 3,
            targetReps = "60 detik",
            targetWeightKg = 0.0,
            restSeconds = 45,
            notes = "Kencangkan perut dan glutes, jaga garis tubuh lurus dari kepala hingga tumit.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 60
        ),
        PresetExerciseTemplate(
            name = "Weighted Plank",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Pelat Beban",
            targetSets = 3,
            targetReps = "45 detik",
            targetWeightKg = 10.0,
            restSeconds = 45,
            notes = "Jaga garis lurus dari bahu hingga tumit.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = true,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 45
        ),
        PresetExerciseTemplate(
            name = "Side Plank",
            muscleGroup = MuscleGroup.CORE,
            equipment = "Tanpa Alat",
            targetSets = 3,
            targetReps = "40 detik",
            targetWeightKg = 0.0,
            restSeconds = 45,
            notes = "Tumpu satu siku tepat di bawah bahu, angkat pinggul sejajar garis tubuh.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 40
        ),

        // Kardio (9)
        PresetExerciseTemplate(
            name = "Incline Treadmill Walk",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Treadmill",
            targetSets = 1,
            targetReps = "20 menit",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Incline 10%, kecepatan 5.0–5.5 km/jam untuk pembakaran lemak stabil.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 1200
        ),
        PresetExerciseTemplate(
            name = "Jogging / Run",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Tanpa Alat",
            targetSets = 1,
            targetReps = "30 menit",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Jaga ritme napas stabil sepanjang sesi lari atau jogging.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTUP,
            targetDurationSeconds = 1800
        ),
        PresetExerciseTemplate(
            name = "Assault Bike HIIT",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Air Bike",
            targetSets = 8,
            targetReps = "20d sprint",
            targetWeightKg = 0.0,
            restSeconds = 40,
            notes = "Kayuh maksimal 20 detik, istirahat santai 40 detik.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 20
        ),
        PresetExerciseTemplate(
            name = "Stationary Cycling (Zone 2)",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Sepeda Statis",
            targetSets = 1,
            targetReps = "25 menit",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Kayuh tempo stabil Zone 2 pada resistensi sedang.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 1500
        ),
        PresetExerciseTemplate(
            name = "Elliptical Cross Trainer",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Mesin Elliptical",
            targetSets = 1,
            targetReps = "20 menit",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Kardio rendah benturan lutut sambil mendorong dan menarik pegangan.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 1200
        ),
        PresetExerciseTemplate(
            name = "Stair Climber",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Mesin StairMaster",
            targetSets = 1,
            targetReps = "15 menit",
            targetWeightKg = 0.0,
            restSeconds = 60,
            notes = "Jaga postur tegak tanpa bertumpu berat pada pegangan samping.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 900
        ),
        PresetExerciseTemplate(
            name = "Rowing Ergometer",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Mesin Dayung",
            targetSets = 3,
            targetReps = "500m",
            targetWeightKg = 0.0,
            restSeconds = 90,
            notes = "Dorong dengan kaki lebih dulu sebelum menarik pegangan ke dada.",
            trackingMode = ExerciseTrackingMode.REPS,
            usesWeight = false
        ),
        PresetExerciseTemplate(
            name = "Kettlebell Swing",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Kettlebell",
            targetSets = 4,
            targetReps = "15-20",
            targetWeightKg = 16.0,
            restSeconds = 60,
            notes = "Ayunkan kettlebell dengan tenaga dorongan pinggul (hip hinge) eksplosif."
        ),
        PresetExerciseTemplate(
            name = "Jump Rope (Skipping)",
            muscleGroup = MuscleGroup.KARDIO,
            equipment = "Tali Skipping",
            targetSets = 5,
            targetReps = "60 detik",
            targetWeightKg = 0.0,
            restSeconds = 30,
            notes = "Mendarat ringan di ujung depan kaki dengan putaran pergelangan tangan.",
            trackingMode = ExerciseTrackingMode.TIMER,
            usesWeight = false,
            timerDirection = TimerDirection.COUNTDOWN,
            targetDurationSeconds = 60
        )
    )

    private fun makeEx(name: String, prefix: String, idx: Int): ExerciseItem {
        val tmpl = EXERCISE_LIBRARY.firstOrNull { it.name == name } ?: EXERCISE_LIBRARY.first()
        return tmpl.toExerciseItem("${prefix}_$idx")
    }

    fun createDefaultSchedules(userId: String): Map<DayKey, DaySchedule> = mapOf(
        DayKey.MON to DaySchedule(
            userId = userId,
            dayKey = DayKey.MON,
            isGymDay = true,
            alarmEnabled = true,
            alarmTime = "06:30",
            focusTitle = "Push — Dada, Bahu & Trisep",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Barbell Bench Press", "mon", 0),
                makeEx("Incline Dumbbell Press", "mon", 1),
                makeEx("Overhead Barbell Press", "mon", 2),
                makeEx("Dumbbell Lateral Raise", "mon", 3),
                makeEx("Tricep Rope Pushdown", "mon", 4)
            )
        ),
        DayKey.TUE to DaySchedule(
            userId = userId,
            dayKey = DayKey.TUE,
            isGymDay = true,
            alarmEnabled = true,
            alarmTime = "06:30",
            focusTitle = "Pull — Punggung & Bisep",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Lat Pulldown", "tue", 0),
                makeEx("Barbell Bent-Over Row", "tue", 1),
                makeEx("Seated Cable Row", "tue", 2),
                makeEx("Face Pull", "tue", 3),
                makeEx("EZ-Bar Bicep Curl", "tue", 4)
            )
        ),
        DayKey.WED to DaySchedule(
            userId = userId,
            dayKey = DayKey.WED,
            isGymDay = false,
            alarmEnabled = false,
            alarmTime = "07:00",
            focusTitle = "Rest Day & Pemulihan Aktif",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Plank", "wed", 0),
                makeEx("Incline Treadmill Walk", "wed", 1)
            )
        ),
        DayKey.THU to DaySchedule(
            userId = userId,
            dayKey = DayKey.THU,
            isGymDay = true,
            alarmEnabled = true,
            alarmTime = "06:30",
            focusTitle = "Legs — Kaki & Glutes",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Barbell Back Squat", "thu", 0),
                makeEx("Romanian Deadlift (RDL)", "thu", 1),
                makeEx("Leg Press", "thu", 2),
                makeEx("Walking Lunges", "thu", 3),
                makeEx("Standing Calf Raise", "thu", 4)
            )
        ),
        DayKey.FRI to DaySchedule(
            userId = userId,
            dayKey = DayKey.FRI,
            isGymDay = true,
            alarmEnabled = true,
            alarmTime = "17:30",
            focusTitle = "Upper Body & Core",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Cable Chest Fly", "fri", 0),
                makeEx("Pull-Up", "fri", 1),
                makeEx("Dumbbell Lateral Raise", "fri", 2),
                makeEx("Hammer Curl", "fri", 3),
                makeEx("Hanging Leg Raise", "fri", 4)
            )
        ),
        DayKey.SAT to DaySchedule(
            userId = userId,
            dayKey = DayKey.SAT,
            isGymDay = true,
            alarmEnabled = true,
            alarmTime = "08:00",
            focusTitle = "Conditioning & Kardio HIIT",
            ringtoneId = "default",
            exercises = listOf(
                makeEx("Assault Bike HIIT", "sat", 0),
                makeEx("Rowing Ergometer", "sat", 1),
                makeEx("Cable Woodchopper", "sat", 2),
                makeEx("Weighted Plank", "sat", 3)
            )
        ),
        DayKey.SUN to DaySchedule(
            userId = userId,
            dayKey = DayKey.SUN,
            isGymDay = false,
            alarmEnabled = false,
            alarmTime = "08:00",
            focusTitle = "Rest Day — Istirahat Total",
            ringtoneId = "default",
            exercises = emptyList()
        )
    )
}
