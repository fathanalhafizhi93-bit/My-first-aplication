package com.fathan.ironpulse.ui.screens

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.ArrowDownward
import androidx.compose.material.icons.rounded.ArrowUpward
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.LibraryBooks
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.fathan.ironpulse.data.GymPresets
import com.fathan.ironpulse.data.PresetExerciseTemplate
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.MuscleGroup
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    state: IronPulseUiState,
    onUpdateScheduleFields: (DayKey, Boolean?, Boolean?, String?, String?) -> Unit,
    onAddTemplatesToDay: (DayKey, List<PresetExerciseTemplate>) -> Unit,
    onAddCustomExercise: (DayKey, ExerciseItem) -> Unit,
    onRemoveExercise: (DayKey, String) -> Unit,
    onMoveExercise: (DayKey, String, Boolean) -> Unit
) {
    var selectedDay by remember(state.todayDayKey) { mutableStateOf(state.todayDayKey) }
    val schedule = state.schedules[selectedDay]

    var showTimePicker by remember { mutableStateOf(false) }
    var showLibrarySheet by remember { mutableStateOf(false) }
    var showCustomDialog by remember { mutableStateOf(false) }

    var focusDraft by remember(selectedDay, schedule?.focusTitle) {
        mutableStateOf(schedule?.focusTitle ?: "")
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Day selector strip
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DayKey.entries.forEach { day ->
                    val isToday = day == state.todayDayKey
                    FilterChip(
                        selected = selectedDay == day,
                        onClick = { selectedDay = day },
                        label = {
                            Text(
                                text = if (isToday) "${day.shortLabel} •" else day.shortLabel,
                                maxLines = 1
                            )
                        }
                    )
                }
            }
        }

        if (schedule != null) {
            // Day Settings Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text(
                            text = "Pengaturan Hari ${selectedDay.label}",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = focusDraft,
                            onValueChange = { focusDraft = it.take(80) },
                            label = { Text("Fokus Sesi Latihan") },
                            singleLine = true,
                            trailingIcon = {
                                if (focusDraft.trim() != schedule.focusTitle && focusDraft.isNotBlank()) {
                                    IconButton(onClick = {
                                        onUpdateScheduleFields(selectedDay, null, null, null, focusDraft)
                                    }) {
                                        Icon(Icons.Rounded.Check, contentDescription = "Simpan Fokus")
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Hari Latihan Gym", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = "Tandai hari ini sebagai sesi latihan aktif",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = schedule.isGymDay,
                                onCheckedChange = { checked ->
                                    onUpdateScheduleFields(selectedDay, checked, null, null, null)
                                }
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Alarm Pengingat", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = if (schedule.alarmEnabled) "Aktif pukul ${schedule.alarmTime}" else "Alarm nonaktif",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { showTimePicker = true },
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Rounded.Alarm, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(schedule.alarmTime)
                                }
                                Switch(
                                    checked = schedule.alarmEnabled,
                                    onCheckedChange = { checked ->
                                        onUpdateScheduleFields(selectedDay, null, checked, null, null)
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Action buttons to add exercises
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { showLibrarySheet = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) {
                        Icon(Icons.Rounded.LibraryBooks, contentDescription = null, modifier = Modifier.padding(end = 6.dp))
                        Text("Pustaka 70+ Gerakan", maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    OutlinedButton(
                        onClick = { showCustomDialog = true },
                        modifier = Modifier.height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Add, contentDescription = "Gerakan Kustom")
                    }
                }
            }

            item {
                Text(
                    text = "Daftar Gerakan (${schedule.exercises.size}/30)",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            if (schedule.exercises.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
                    ) {
                        Text(
                            text = "Belum ada gerakan di hari ${selectedDay.label}. Ketuk Pustaka 70+ Gerakan untuk memilih beberapa gerakan sekaligus.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(18.dp)
                        )
                    }
                }
            } else {
                itemsIndexed(schedule.exercises, key = { idx, ex -> "${ex.id}_$idx" }) { idx, ex ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = ex.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                val metric = if (ex.trackingMode == ExerciseTrackingMode.TIMER) {
                                    "${ex.targetSets} set × ${GymModelHelpers.formatRestDuration(ex.targetDurationSeconds)}"
                                } else if (ex.usesWeight && ex.targetWeightKg > 0.0) {
                                    "${ex.targetSets}×${ex.targetReps} · ${GymModelHelpers.formatWeight(ex.targetWeightKg)} kg"
                                } else {
                                    "${ex.targetSets}×${ex.targetReps}"
                                }
                                Text(
                                    text = "${ex.muscleGroup.label} · ${ex.equipment} · $metric",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            IconButton(
                                onClick = { onMoveExercise(selectedDay, ex.id, true) },
                                enabled = idx > 0
                            ) {
                                Icon(Icons.Rounded.ArrowUpward, contentDescription = "Naik")
                            }
                            IconButton(
                                onClick = { onMoveExercise(selectedDay, ex.id, false) },
                                enabled = idx < schedule.exercises.lastIndex
                            ) {
                                Icon(Icons.Rounded.ArrowDownward, contentDescription = "Turun")
                            }
                            IconButton(
                                onClick = { onRemoveExercise(selectedDay, ex.id) }
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Hapus Gerakan",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }

    if (showTimePicker && schedule != null) {
        val parts = schedule.alarmTime.split(":")
        val initHour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 6
        val initMin = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 30
        val pickerState = rememberTimePickerState(
            initialHour = initHour,
            initialMinute = initMin,
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            title = { Text("Atur Jam Alarm (${selectedDay.label})") },
            text = { TimePicker(state = pickerState) },
            confirmButton = {
                Button(onClick = {
                    val hhmm = String.format(Locale.US, "%02d:%02d", pickerState.hour, pickerState.minute)
                    onUpdateScheduleFields(selectedDay, null, true, hhmm, null)
                    showTimePicker = false
                }) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) {
                    Text("Batal")
                }
            }
        )
    }

    if (showLibrarySheet) {
        ExerciseLibrarySheet(
            dayLabel = selectedDay.label,
            onDismiss = { showLibrarySheet = false },
            onAddSelected = { selected ->
                onAddTemplatesToDay(selectedDay, selected)
                showLibrarySheet = false
            }
        )
    }

    if (showCustomDialog) {
        CustomExerciseDialog(
            onDismiss = { showCustomDialog = false },
            onAdd = { item ->
                onAddCustomExercise(selectedDay, item)
                showCustomDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExerciseLibrarySheet(
    dayLabel: String,
    onDismiss: () -> Unit,
    onAddSelected: (List<PresetExerciseTemplate>) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var search by remember { mutableStateOf("") }
    var selectedMuscle by remember { mutableStateOf<MuscleGroup?>(null) }
    var selectedEquipment by remember { mutableStateOf<String?>(null) }
    val selectedNames = remember { mutableStateListOf<String>() }

    val allEquipment = remember {
        GymPresets.EXERCISE_LIBRARY.map { it.equipment }.distinct().sorted()
    }

    val filtered = remember(search, selectedMuscle, selectedEquipment) {
        val q = search.trim().lowercase(Locale.ROOT)
        GymPresets.EXERCISE_LIBRARY.filter { item ->
            val matchMuscle = selectedMuscle == null || item.muscleGroup == selectedMuscle
            val matchEquip = selectedEquipment == null || item.equipment == selectedEquipment
            val matchSearch = q.isEmpty() ||
                item.name.lowercase(Locale.ROOT).contains(q) ||
                item.equipment.lowercase(Locale.ROOT).contains(q)
            matchMuscle && matchEquip && matchSearch
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pustaka Gerakan (${filtered.size})",
                    style = MaterialTheme.typography.titleLarge
                )
                if (selectedNames.isNotEmpty()) {
                    Button(
                        onClick = {
                            val items = GymPresets.EXERCISE_LIBRARY.filter { it.name in selectedNames }
                            onAddSelected(items)
                        }
                    ) {
                        Text("Tambah (${selectedNames.size}) ke $dayLabel")
                    }
                }
            }

            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                placeholder = { Text("Cari gerakan atau alat gym...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            // Muscle filter chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = selectedMuscle == null,
                    onClick = { selectedMuscle = null },
                    label = { Text("Semua Otot") }
                )
                MuscleGroup.entries.forEach { mg ->
                    FilterChip(
                        selected = selectedMuscle == mg,
                        onClick = { selectedMuscle = if (selectedMuscle == mg) null else mg },
                        label = { Text(mg.label) }
                    )
                }
            }

            // Equipment filter chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = selectedEquipment == null,
                    onClick = { selectedEquipment = null },
                    label = { Text("Semua Alat") }
                )
                allEquipment.forEach { eq ->
                    FilterChip(
                        selected = selectedEquipment == eq,
                        onClick = { selectedEquipment = if (selectedEquipment == eq) null else eq },
                        label = { Text(eq) }
                    )
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filtered, key = { it.name }) { item ->
                    val checked = item.name in selectedNames
                    Surface(
                        onClick = {
                            if (checked) selectedNames.remove(item.name) else selectedNames.add(item.name)
                        },
                        shape = RoundedCornerShape(14.dp),
                        color = if (checked) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
                        else MaterialTheme.colorScheme.surfaceContainerHigh,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Checkbox(
                                checked = checked,
                                onCheckedChange = {
                                    if (checked) selectedNames.remove(item.name) else selectedNames.add(item.name)
                                }
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${item.muscleGroup.label} · ${item.equipment} · ${item.targetSets}×${item.targetReps}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CustomExerciseDialog(
    onDismiss: () -> Unit,
    onAdd: (ExerciseItem) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var equipment by remember { mutableStateOf("Dumbbell") }
    var muscleGroup by remember { mutableStateOf(MuscleGroup.DADA) }
    var setsText by remember { mutableStateOf("3") }
    var repsText by remember { mutableStateOf("10-12") }
    var weightText by remember { mutableStateOf("20") }
    var restText by remember { mutableStateOf("60") }
    var isTimer by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Tambah Gerakan Kustom") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(60) },
                    label = { Text("Nama Gerakan") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = equipment,
                    onValueChange = { equipment = it.take(40) },
                    label = { Text("Alat Gym") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    MuscleGroup.entries.forEach { mg ->
                        FilterChip(
                            selected = muscleGroup == mg,
                            onClick = { muscleGroup = mg },
                            label = { Text(mg.label) }
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = setsText,
                        onValueChange = { setsText = it.filter { ch -> ch.isDigit() }.take(2) },
                        label = { Text("Set") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = repsText,
                        onValueChange = { repsText = it.take(20) },
                        label = { Text(if (isTimer) "Detik" else "Reps") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = weightText,
                        onValueChange = { weightText = it.take(6) },
                        label = { Text("Beban (kg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = restText,
                        onValueChange = { restText = it.filter { ch -> ch.isDigit() }.take(3) },
                        label = { Text("Rest (d)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Mode Timer Durasi", style = MaterialTheme.typography.bodyMedium)
                    Switch(checked = isTimer, onCheckedChange = { isTimer = it })
                }
            }
        },
        confirmButton = {
            Button(
                enabled = name.isNotBlank(),
                onClick = {
                    val sets = setsText.toIntOrNull()?.coerceIn(1, 12) ?: 3
                    val weight = weightText.replace(',', '.').toDoubleOrNull()?.coerceIn(0.0, 999.0) ?: 0.0
                    val rest = restText.toIntOrNull()?.coerceIn(15, 600) ?: 60
                    val mode = if (isTimer) ExerciseTrackingMode.TIMER else ExerciseTrackingMode.REPS
                    val dur = if (isTimer) (repsText.toIntOrNull()?.coerceIn(5, 10800) ?: 60) else 60
                    onAdd(
                        ExerciseItem(
                            id = "",
                            name = name.trim(),
                            muscleGroup = muscleGroup,
                            equipment = equipment.trim().ifEmpty { "Bebas" },
                            targetSets = sets,
                            targetReps = repsText.trim().ifEmpty { "10" },
                            targetWeightKg = weight,
                            restSeconds = rest,
                            notes = "",
                            trackingMode = mode,
                            usesWeight = weight > 0.0 || mode == ExerciseTrackingMode.REPS,
                            timerDirection = TimerDirection.COUNTDOWN,
                            targetDurationSeconds = dur
                        )
                    )
                }
            ) {
                Text("Simpan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
