package com.fathan.ironpulse.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.KeyboardArrowUp
import androidx.compose.material.icons.rounded.LibraryAdd
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.fathan.ironpulse.data.GymPresets
import com.fathan.ironpulse.data.PresetExerciseTemplate
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.EquipmentBucket
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.MuscleGroup
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.ui.components.ConfirmDeleteDialog
import com.fathan.ironpulse.ui.components.tactilePress
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExercisesScreen(
    state: IronPulseUiState,
    viewModel: GymViewModel,
    contentPadding: PaddingValues
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val selectedDay = state.selectedExerciseDayKey
    val schedule = state.schedules[selectedDay]
    val exercises = schedule?.exercises ?: emptyList()

    var showLibraryModal by remember { mutableStateOf(false) }
    var editingExercise by remember { mutableStateOf<ExerciseItem?>(null) }
    var showCreateCustomModal by remember { mutableStateOf(false) }
    var pendingDeleteExercise by remember { mutableStateOf<ExerciseItem?>(null) }

    LazyColumn(
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = contentPadding.calculateTopPadding() + 12.dp,
            bottom = contentPadding.calculateBottomPadding() + 92.dp
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // Header Card
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens)
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column {
                    Text(
                        text = lang.t("DAFTAR & PUSTAKA GERAKAN", "EXERCISES & LIBRARY"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.4.sp,
                        color = tokens.accentColor
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = lang.t("Program Latihan Harian", "Daily Exercise Planner"),
                        fontSize = 23.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = tokens.palette.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = lang.t(
                            "Susun hingga 30 gerakan per hari dari pustaka 80+ gerakan atau buat gerakan kustom.",
                            "Build up to 30 movements per day from the 80+ library or create custom exercises."
                        ),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = tokens.palette.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { showLibraryModal = true },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .tactilePress(disabledByPerf = noAnim),
                        contentPadding = PaddingValues(horizontal = 12.dp)
                    ) {
                        Icon(Icons.Rounded.LibraryAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = lang.t("Pustaka", "Library"),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            maxLines = 1
                        )
                    }
                    OutlinedButton(
                        onClick = { showCreateCustomModal = true },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .tactilePress(disabledByPerf = noAnim),
                        contentPadding = PaddingValues(horizontal = 12.dp)
                    ) {
                        Icon(Icons.Rounded.Add, contentDescription = null, tint = tokens.accentColor, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = lang.t("Buat Baru", "Custom"),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = tokens.palette.onSurface,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        // 7-Day Selector Rail
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(DayKey.entries) { day ->
                    val daySched = state.schedules[day]
                    val count = daySched?.exercises?.size ?: 0
                    val isSelected = day == selectedDay
                    val isToday = day == state.todayDayKey
                    Surface(
                        onClick = { viewModel.setSelectedExerciseDay(day) },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        color = if (isSelected) tokens.accentColor else tokens.controlBg,
                        border = BorderStroke(
                            1.dp,
                            when {
                                isSelected -> tokens.accentColor
                                isToday -> tokens.accentColor.copy(alpha = 0.45f)
                                else -> tokens.surfaceBorderColor
                            }
                        ),
                        modifier = Modifier.tactilePress(pressedScale = 0.94f, disabledByPerf = noAnim)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = day.label(lang),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) tokens.onAccentColor else tokens.palette.onSurface
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        if (isSelected) tokens.onAccentColor.copy(alpha = 0.18f)
                                        else tokens.subtleChipBg
                                    )
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "$count",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) tokens.onAccentColor else tokens.mutedTextColor
                                )
                            }
                        }
                    }
                }
            }
        }

        // Selected Day Summary Strip
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens, subtle = true)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = schedule?.focusTitle?.ifBlank { selectedDay.label(lang) } ?: selectedDay.label(lang),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.palette.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = if (schedule?.isGymDay == true) {
                            lang.t("Hari Gym Aktif · ${exercises.size}/30 gerakan", "Active Gym Day · ${exercises.size}/30 movements")
                        } else {
                            lang.t("Rest Day / Pemulihan · ${exercises.size}/30 gerakan", "Rest Day · ${exercises.size}/30 movements")
                        },
                        fontSize = 12.sp,
                        color = tokens.palette.onSurfaceVariant
                    )
                }
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = if (exercises.size >= 30) Color(0x2EF59E0B) else tokens.accentColor.copy(alpha = 0.14f),
                    border = BorderStroke(
                        1.dp,
                        if (exercises.size >= 30) Color(0x80F59E0B) else tokens.accentColor.copy(alpha = 0.35f)
                    )
                ) {
                    Text(
                        text = "${exercises.size}/30",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (exercises.size >= 30) Color(0xFFFBBF24) else tokens.accentColor,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Empty State or Exercise Items
        if (exercises.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(tokens.accentColor.copy(alpha = 0.12f))
                            .border(1.dp, tokens.accentColor.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.FitnessCenter,
                            contentDescription = null,
                            tint = tokens.accentColor,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                    Text(
                        text = lang.t(
                            "Belum Ada Gerakan di ${selectedDay.label(lang)}",
                            "No Movements on ${selectedDay.label(lang)}"
                        ),
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.palette.onSurface
                    )
                    Text(
                        text = lang.t(
                            "Tambahkan gerakan dari Pustaka Gerakan siap pakai atau buat gerakan kustom sesuai programmu.",
                            "Add exercises from the built-in Library or create a custom movement for this day."
                        ),
                        fontSize = 13.sp,
                        color = tokens.palette.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = { showLibraryModal = true },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        )
                    ) {
                        Icon(Icons.Rounded.LibraryAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(lang.t("Buka Pustaka Gerakan", "Open Exercise Library"), fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            itemsIndexed(exercises, key = { _, item -> item.id }) { idx, ex ->
                ScheduledExerciseManageCard(
                    index = idx,
                    total = exercises.size,
                    exercise = ex,
                    lang = lang,
                    onMoveUp = { viewModel.moveExerciseInDay(selectedDay, ex.id, moveUp = true) },
                    onMoveDown = { viewModel.moveExerciseInDay(selectedDay, ex.id, moveUp = false) },
                    onEdit = { editingExercise = ex },
                    onDelete = { pendingDeleteExercise = ex },
                    modifier = Modifier.animateItem()
                )
            }
        }
    }

    if (showLibraryModal) {
        ExerciseLibraryModal(
            lang = lang,
            existingNames = exercises.map { it.name.lowercase(Locale.ROOT) }.toSet(),
            remainingSlots = (30 - exercises.size).coerceAtLeast(0),
            onAddSingle = { tmpl ->
                viewModel.addTemplatesToDay(selectedDay, listOf(tmpl))
            },
            onAddBatch = { tmpls ->
                viewModel.addTemplatesToDay(selectedDay, tmpls)
                showLibraryModal = false
            },
            onDismiss = { showLibraryModal = false }
        )
    }

    if (showCreateCustomModal || editingExercise != null) {
        ExerciseFormModal(
            lang = lang,
            initial = editingExercise,
            onSave = { item ->
                if (editingExercise != null) {
                    viewModel.updateExerciseInDay(selectedDay, item)
                } else {
                    viewModel.addCustomExerciseToDay(selectedDay, item)
                }
                editingExercise = null
                showCreateCustomModal = false
            },
            onDismiss = {
                editingExercise = null
                showCreateCustomModal = false
            }
        )
    }

    val toDelete = pendingDeleteExercise
    if (toDelete != null) {
        ConfirmDeleteDialog(
            title = lang.t("Hapus Gerakan?", "Delete Movement?"),
            message = lang.t(
                "Hapus \"${toDelete.name}\" dari jadwal ${selectedDay.label(lang)}?",
                "Remove \"${toDelete.name}\" from ${selectedDay.label(lang)}'s schedule?"
            ),
            confirmLabel = lang.t("Hapus", "Delete"),
            cancelLabel = lang.t("Batal", "Cancel"),
            onConfirm = {
                viewModel.removeExerciseFromDay(selectedDay, toDelete.id)
                pendingDeleteExercise = null
            },
            onDismiss = { pendingDeleteExercise = null }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ScheduledExerciseManageCard(
    index: Int,
    total: Int,
    exercise: ExerciseItem,
    lang: AppLanguage,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val isTimer = exercise.trackingMode == ExerciseTrackingMode.TIMER

    Column(
        modifier = modifier
            .fillMaxWidth()
            .ironGlassSurface(tokens)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Top
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(tokens.accentColor.copy(alpha = 0.14f))
                        .border(1.dp, tokens.accentColor.copy(alpha = 0.35f), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${index + 1}",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = tokens.accentColor
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = exercise.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.palette.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SmallMetaBadge(
                            text = exercise.muscleGroup.label(lang),
                            color = tokens.accentColor,
                            fill = tokens.accentColor.copy(alpha = 0.12f)
                        )
                        SmallMetaBadge(
                            text = exercise.equipment,
                            color = tokens.palette.onSurfaceVariant,
                            fill = Color.White.copy(alpha = 0.06f)
                        )
                        if (isTimer) {
                            SmallMetaBadge(
                                text = if (exercise.timerDirection == TimerDirection.COUNTUP) "COUNT-UP" else "COUNTDOWN",
                                color = Color(0xFF38BDF8),
                                fill = Color(0x1E38BDF8)
                            )
                        }
                        if (!exercise.usesWeight) {
                            SmallMetaBadge(
                                text = lang.t("Tanpa Beban", "Bodyweight"),
                                color = Color(0xFF34D399),
                                fill = Color(0x1E34D399)
                            )
                        }
                    }
                }
            }

            // Reorder, Edit, Delete Controls
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onMoveUp,
                    enabled = index > 0,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.KeyboardArrowUp,
                        contentDescription = lang.t("Naik", "Move up"),
                        tint = if (index > 0) tokens.palette.onSurface else tokens.palette.onSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(
                    onClick = onMoveDown,
                    enabled = index < total - 1,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.KeyboardArrowDown,
                        contentDescription = lang.t("Turun", "Move down"),
                        tint = if (index < total - 1) tokens.palette.onSurface else tokens.palette.onSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.Edit,
                        contentDescription = lang.t("Ubah", "Edit"),
                        tint = tokens.accentColor,
                        modifier = Modifier.size(17.dp)
                    )
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.DeleteOutline,
                        contentDescription = lang.t("Hapus", "Delete"),
                        tint = Color(0xFFF87171),
                        modifier = Modifier.size(17.dp)
                    )
                }
            }
        }

        // Metrics Strip
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MetricMiniBox(
                label = "SET",
                value = "${exercise.targetSets}",
                modifier = Modifier.weight(1f)
            )
            MetricMiniBox(
                label = if (isTimer) lang.t("DURASI", "TIME") else "REP",
                value = if (isTimer) {
                    GymModelHelpers.formatCompactDuration(exercise.targetDurationSeconds, lang)
                } else {
                    exercise.targetReps
                },
                modifier = Modifier.weight(1.2f)
            )
            if (exercise.usesWeight) {
                MetricMiniBox(
                    label = lang.t("BEBAN", "LOAD"),
                    value = "${GymModelHelpers.formatWeight(exercise.targetWeightKg)} kg",
                    modifier = Modifier.weight(1.1f)
                )
            }
            MetricMiniBox(
                label = lang.t("ISTIRAHAT", "REST"),
                value = "${exercise.restSeconds}${lang.t("d", "s")}",
                modifier = Modifier.weight(1f)
            )
        }

        if (exercise.notes.isNotBlank()) {
            Text(
                text = exercise.notes,
                fontSize = 12.sp,
                lineHeight = 17.sp,
                color = tokens.palette.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SmallMetaBadge(
    text: String,
    color: Color,
    fill: Color
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(fill)
            .padding(horizontal = 7.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
private fun MetricMiniBox(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(tokens.wellBg)
            .border(1.dp, tokens.subtleBorderColor, RoundedCornerShape(10.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        Text(
            text = label,
            fontSize = 9.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp,
            color = tokens.mutedTextColor
        )
        Text(
            text = value,
            fontFamily = FontFamily.Monospace,
            fontSize = 12.5.sp,
            fontWeight = FontWeight.Bold,
            color = tokens.palette.onSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ExerciseLibraryModal(
    lang: AppLanguage,
    existingNames: Set<String>,
    remainingSlots: Int,
    onAddSingle: (PresetExerciseTemplate) -> Unit,
    onAddBatch: (List<PresetExerciseTemplate>) -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    var query by remember { mutableStateOf("") }
    var selectedMuscle by remember { mutableStateOf<MuscleGroup?>(null) }
    var selectedBucket by remember { mutableStateOf(EquipmentBucket.ALL) }
    var multiSelectMode by remember { mutableStateOf(true) }
    val selectedNames = remember { mutableStateListOf<String>() }

    val filtered by remember(lang) {
        derivedStateOf {
            val q = query.trim().lowercase(Locale.ROOT)
            GymPresets.EXERCISE_LIBRARY.filter { item ->
                val matchMuscle = selectedMuscle == null || item.muscleGroup == selectedMuscle
                val matchBucket = selectedBucket.matches(item.equipment)
                val matchQuery = q.isEmpty() ||
                    item.name.lowercase(Locale.ROOT).contains(q) ||
                    item.equipment.lowercase(Locale.ROOT).contains(q) ||
                    item.muscleGroup.label(lang).lowercase(Locale.ROOT).contains(q) ||
                    item.notes.lowercase(Locale.ROOT).contains(q)
                matchMuscle && matchBucket && matchQuery
            }
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 14.dp, vertical = 20.dp)
                .fillMaxWidth()
                .heightIn(max = 720.dp)
                .ironGlassSurface(tokens)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = lang.t("Pustaka Gerakan (${GymPresets.EXERCISE_LIBRARY.size})", "Exercise Library (${GymPresets.EXERCISE_LIBRARY.size})"),
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = tokens.palette.onSurface
                    )
                    Text(
                        text = lang.t("Sisa slot hari ini: $remainingSlots", "Remaining slots today: $remainingSlots"),
                        fontSize = 12.sp,
                        color = tokens.palette.onSurfaceVariant
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Rounded.Close, contentDescription = "Close", tint = tokens.palette.onSurfaceVariant)
                }
            }

            // Search Input
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text(lang.t("Cari nama gerakan, otot, atau alat...", "Search movement, muscle, or gear...")) },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = tokens.accentColor) },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(onClick = { query = "" }) {
                            Icon(Icons.Rounded.Close, contentDescription = "Clear", modifier = Modifier.size(18.dp))
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(tokens.inputRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = tokens.accentColor,
                    unfocusedBorderColor = tokens.surfaceBorderColor,
                    focusedTextColor = tokens.palette.onSurface,
                    unfocusedTextColor = tokens.palette.onSurface
                ),
                modifier = Modifier.fillMaxWidth()
            )

            // Muscle Filters
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                item {
                    FilterPill(
                        label = lang.t("Semua Otot", "All Muscles"),
                        selected = selectedMuscle == null,
                        onClick = { selectedMuscle = null }
                    )
                }
                items(MuscleGroup.entries) { mg ->
                    FilterPill(
                        label = mg.label(lang),
                        selected = selectedMuscle == mg,
                        onClick = { selectedMuscle = if (selectedMuscle == mg) null else mg }
                    )
                }
            }

            // Equipment Filters
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(EquipmentBucket.entries) { bucket ->
                    FilterPill(
                        label = bucket.label(lang),
                        selected = selectedBucket == bucket,
                        onClick = { selectedBucket = bucket }
                    )
                }
            }

            // Multi-select Toggle Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(tokens.wellBg)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = lang.t("Mode Pilih Banyak", "Multi-select mode"),
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = tokens.palette.onSurface
                )
                Switch(
                    checked = multiSelectMode,
                    onCheckedChange = {
                        multiSelectMode = it
                        if (!it) selectedNames.clear()
                    },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = tokens.onAccentColor,
                        checkedTrackColor = tokens.accentColor
                    )
                )
            }

            // Bounded Scrollable List (non-nested!)
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (filtered.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 28.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = lang.t("Tidak ada gerakan yang cocok.", "No matching exercises found."),
                                fontSize = 13.sp,
                                color = tokens.palette.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(filtered, key = { it.name }) { tmpl ->
                        val isAlreadyInDay = existingNames.contains(tmpl.name.lowercase(Locale.ROOT))
                        val isChecked = selectedNames.contains(tmpl.name)

                        Surface(
                            onClick = {
                                if (multiSelectMode) {
                                    if (isChecked) selectedNames.remove(tmpl.name)
                                    else if (selectedNames.size < remainingSlots) selectedNames.add(tmpl.name)
                                } else {
                                    onAddSingle(tmpl)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = if (isChecked) tokens.accentColor.copy(alpha = 0.14f) else tokens.palette.surfaceContainerLow,
                            border = BorderStroke(
                                1.dp,
                                if (isChecked) tokens.accentColor else tokens.surfaceBorderColor
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                if (multiSelectMode) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isChecked) tokens.accentColor else Color.Transparent)
                                            .border(
                                                1.5.dp,
                                                if (isChecked) tokens.accentColor else tokens.palette.onSurfaceVariant,
                                                RoundedCornerShape(6.dp)
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (isChecked) {
                                            Icon(
                                                imageVector = Icons.Rounded.Check,
                                                contentDescription = null,
                                                tint = tokens.onAccentColor,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = tmpl.name,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = tokens.palette.onSurface,
                                            modifier = Modifier.weight(1f, fill = false)
                                        )
                                        if (isAlreadyInDay) {
                                            SmallMetaBadge(
                                                text = lang.t("Terpasang", "Added"),
                                                color = Color(0xFF34D399),
                                                fill = Color(0x1E34D399)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Text(
                                        text = buildString {
                                            append(tmpl.muscleGroup.label(lang))
                                            append(" · ")
                                            append(tmpl.equipment)
                                            append(" · ")
                                            append("${tmpl.targetSets}×${tmpl.targetReps}")
                                            if (tmpl.usesWeight) {
                                                append(" · ${GymModelHelpers.formatWeight(tmpl.targetWeightKg)}kg")
                                            }
                                        },
                                        fontSize = 11.5.sp,
                                        color = tokens.palette.onSurfaceVariant
                                    )
                                }

                                if (!multiSelectMode) {
                                    IconButton(
                                        onClick = { onAddSingle(tmpl) },
                                        enabled = remainingSlots > 0,
                                        modifier = Modifier.size(34.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Rounded.Add,
                                            contentDescription = lang.t("Tambah", "Add"),
                                            tint = if (remainingSlots > 0) tokens.accentColor else tokens.palette.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (multiSelectMode) {
                Button(
                    onClick = {
                        val chosen = GymPresets.EXERCISE_LIBRARY.filter { selectedNames.contains(it.name) }
                        onAddBatch(chosen)
                    },
                    enabled = selectedNames.isNotEmpty() && remainingSlots > 0,
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    ),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = lang.t(
                            "Tambahkan Terpilih (${selectedNames.size})",
                            "Add Selected (${selectedNames.size})"
                        ),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun FilterPill(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        color = if (selected) tokens.accentColor.copy(alpha = 0.18f) else tokens.controlBg,
        border = BorderStroke(1.dp, if (selected) tokens.accentColor else tokens.surfaceBorderColor),
        modifier = Modifier.tactilePress(pressedScale = 0.94f, disabledByPerf = tokens.performance.noAnimations)
    ) {
        Text(
            text = label,
            fontSize = 11.5.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = if (selected) tokens.accentColor else tokens.mutedTextColor,
            modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ExerciseFormModal(
    lang: AppLanguage,
    initial: ExerciseItem?,
    onSave: (ExerciseItem) -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    var name by remember(initial) { mutableStateOf(initial?.name ?: "") }
    var muscleGroup by remember(initial) { mutableStateOf(initial?.muscleGroup ?: MuscleGroup.DADA) }
    var trackingMode by remember(initial) { mutableStateOf(initial?.trackingMode ?: ExerciseTrackingMode.REPS) }
    var usesWeight by remember(initial) { mutableStateOf(initial?.usesWeight ?: true) }
    var equipment by remember(initial) { mutableStateOf(initial?.equipment ?: "Barbel / Dumbbell") }
    var setsText by remember(initial) { mutableStateOf((initial?.targetSets ?: 3).toString()) }
    var repsText by remember(initial) { mutableStateOf(initial?.targetReps ?: "10-12") }
    var durationMinText by remember(initial) {
        val secs = initial?.targetDurationSeconds ?: 60
        mutableStateOf((secs / 60).toString())
    }
    var durationSecText by remember(initial) {
        val secs = initial?.targetDurationSeconds ?: 60
        mutableStateOf((secs % 60).toString())
    }
    var timerDirection by remember(initial) { mutableStateOf(initial?.timerDirection ?: TimerDirection.COUNTDOWN) }
    var weightText by remember(initial) {
        mutableStateOf(GymModelHelpers.formatWeight(initial?.targetWeightKg ?: 20.0))
    }
    var restText by remember(initial) { mutableStateOf((initial?.restSeconds ?: 90).toString()) }
    var notes by remember(initial) { mutableStateOf(initial?.notes ?: "") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 20.dp)
                .fillMaxWidth()
                .heightIn(max = 720.dp)
                .ironGlassSurface(tokens)
                .verticalScroll(rememberScrollState())
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (initial == null) {
                        lang.t("Buat Gerakan Kustom", "Create Custom Movement")
                    } else {
                        lang.t("Ubah Gerakan", "Edit Movement")
                    },
                    fontSize = 19.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = tokens.palette.onSurface
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Rounded.Close, contentDescription = "Close", tint = tokens.palette.onSurfaceVariant)
                }
            }

            // Tracking Mode Selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    Triple(ExerciseTrackingMode.REPS, lang.t("Repetisi & Set", "Reps & Sets"), Icons.Rounded.FitnessCenter),
                    Triple(ExerciseTrackingMode.TIMER, lang.t("Timer / Durasi", "Timer / Duration"), Icons.Rounded.Timer)
                ).forEach { (mode, label, icon) ->
                    val active = trackingMode == mode
                    Surface(
                        onClick = {
                            trackingMode = mode
                            if (mode == ExerciseTrackingMode.TIMER && initial == null) {
                                usesWeight = false
                                equipment = lang.t("Tanpa Alat", "Bodyweight")
                            }
                        },
                        shape = RoundedCornerShape(12.dp),
                        color = if (active) tokens.accentColor.copy(alpha = 0.16f) else tokens.palette.surfaceContainerLow,
                        border = BorderStroke(1.dp, if (active) tokens.accentColor else tokens.surfaceBorderColor),
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = if (active) tokens.accentColor else tokens.palette.onSurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = label,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (active) tokens.accentColor else tokens.palette.onSurface
                            )
                        }
                    }
                }
            }

            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it.take(60)
                    errorMsg = null
                },
                label = { Text(lang.t("Nama Gerakan", "Movement Name")) },
                placeholder = { Text(lang.t("Contoh: Incline Bench Press", "e.g. Incline Bench Press")) },
                singleLine = true,
                shape = RoundedCornerShape(tokens.inputRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = tokens.accentColor,
                    unfocusedBorderColor = tokens.surfaceBorderColor,
                    focusedTextColor = tokens.palette.onSurface,
                    unfocusedTextColor = tokens.palette.onSurface
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                text = lang.t("Kelompok Otot", "Muscle Group"),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = tokens.palette.onSurfaceVariant
            )
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                MuscleGroup.entries.forEach { mg ->
                    FilterPill(
                        label = mg.label(lang),
                        selected = muscleGroup == mg,
                        onClick = { muscleGroup = mg }
                    )
                }
            }

            // Bodyweight Switch
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens, subtle = true)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = lang.t("Tanpa Beban (Bodyweight)", "Bodyweight (No Load)"),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = tokens.palette.onSurface
                    )
                    Text(
                        text = lang.t("Sembunyikan input kilogram saat mencatat set.", "Hide kg load input during set logging."),
                        fontSize = 11.5.sp,
                        color = tokens.palette.onSurfaceVariant
                    )
                }
                Switch(
                    checked = !usesWeight,
                    onCheckedChange = { bodyweight ->
                        usesWeight = !bodyweight
                        if (bodyweight && (equipment.isBlank() || equipment.contains("Barbel"))) {
                            equipment = lang.t("Tanpa Alat", "Bodyweight")
                        }
                    },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = tokens.onAccentColor,
                        checkedTrackColor = tokens.accentColor
                    )
                )
            }

            OutlinedTextField(
                value = equipment,
                onValueChange = { equipment = it.take(40) },
                label = { Text(lang.t("Alat / Equipment", "Equipment")) },
                singleLine = true,
                shape = RoundedCornerShape(tokens.inputRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = tokens.accentColor,
                    unfocusedBorderColor = tokens.surfaceBorderColor,
                    focusedTextColor = tokens.palette.onSurface,
                    unfocusedTextColor = tokens.palette.onSurface
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = setsText,
                    onValueChange = { setsText = it.filter { ch -> ch.isDigit() }.take(2) },
                    label = { Text(lang.t("Target Set", "Target Sets")) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(tokens.inputRadius),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = tokens.accentColor,
                        unfocusedBorderColor = tokens.surfaceBorderColor,
                        focusedTextColor = tokens.palette.onSurface,
                        unfocusedTextColor = tokens.palette.onSurface
                    ),
                    modifier = Modifier.weight(1f)
                )

                if (trackingMode == ExerciseTrackingMode.REPS) {
                    OutlinedTextField(
                        value = repsText,
                        onValueChange = { repsText = it.take(20) },
                        label = { Text(lang.t("Target Repetisi", "Target Reps")) },
                        singleLine = true,
                        shape = RoundedCornerShape(tokens.inputRadius),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = tokens.accentColor,
                            unfocusedBorderColor = tokens.surfaceBorderColor,
                            focusedTextColor = tokens.palette.onSurface,
                            unfocusedTextColor = tokens.palette.onSurface
                        ),
                        modifier = Modifier.weight(1.3f)
                    )
                } else {
                    OutlinedTextField(
                        value = durationMinText,
                        onValueChange = { durationMinText = it.filter { ch -> ch.isDigit() }.take(3) },
                        label = { Text(lang.t("Menit", "Min")) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(tokens.inputRadius),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = tokens.accentColor,
                            unfocusedBorderColor = tokens.surfaceBorderColor,
                            focusedTextColor = tokens.palette.onSurface,
                            unfocusedTextColor = tokens.palette.onSurface
                        ),
                        modifier = Modifier.weight(0.75f)
                    )
                    OutlinedTextField(
                        value = durationSecText,
                        onValueChange = { durationSecText = it.filter { ch -> ch.isDigit() }.take(2) },
                        label = { Text(lang.t("Detik", "Sec")) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(tokens.inputRadius),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = tokens.accentColor,
                            unfocusedBorderColor = tokens.surfaceBorderColor,
                            focusedTextColor = tokens.palette.onSurface,
                            unfocusedTextColor = tokens.palette.onSurface
                        ),
                        modifier = Modifier.weight(0.75f)
                    )
                }
            }

            if (trackingMode == ExerciseTrackingMode.TIMER) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterPill(
                        label = lang.t("Hitung Mundur (Countdown)", "Countdown"),
                        selected = timerDirection == TimerDirection.COUNTDOWN,
                        onClick = { timerDirection = TimerDirection.COUNTDOWN }
                    )
                    FilterPill(
                        label = lang.t("Stopwatch (Count-up)", "Count-up"),
                        selected = timerDirection == TimerDirection.COUNTUP,
                        onClick = { timerDirection = TimerDirection.COUNTUP }
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (usesWeight) {
                    OutlinedTextField(
                        value = weightText,
                        onValueChange = { weightText = it.take(6) },
                        label = { Text(lang.t("Beban Awal (kg)", "Start Load (kg)")) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        shape = RoundedCornerShape(tokens.inputRadius),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = tokens.accentColor,
                            unfocusedBorderColor = tokens.surfaceBorderColor,
                            focusedTextColor = tokens.palette.onSurface,
                            unfocusedTextColor = tokens.palette.onSurface
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = restText,
                    onValueChange = { restText = it.filter { ch -> ch.isDigit() }.take(3) },
                    label = { Text(lang.t("Istirahat (detik)", "Rest (sec)")) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(tokens.inputRadius),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = tokens.accentColor,
                        unfocusedBorderColor = tokens.surfaceBorderColor,
                        focusedTextColor = tokens.palette.onSurface,
                        unfocusedTextColor = tokens.palette.onSurface
                    ),
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it.take(200) },
                label = { Text(lang.t("Catatan Teknik / Form", "Technique / Form Notes")) },
                minLines = 2,
                maxLines = 3,
                shape = RoundedCornerShape(tokens.inputRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = tokens.accentColor,
                    unfocusedBorderColor = tokens.surfaceBorderColor,
                    focusedTextColor = tokens.palette.onSurface,
                    unfocusedTextColor = tokens.palette.onSurface
                ),
                modifier = Modifier.fillMaxWidth()
            )

            if (errorMsg != null) {
                Text(text = errorMsg ?: "", fontSize = 12.sp, color = Color(0xFFFCA5A5))
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text(lang.t("Batal", "Cancel"), color = tokens.palette.onSurfaceVariant)
                }
                Button(
                    onClick = {
                        val cleanedName = name.trim()
                        if (cleanedName.isEmpty()) {
                            errorMsg = lang.t("Nama gerakan tidak boleh kosong.", "Movement name is required.")
                            return@Button
                        }
                        val sets = (setsText.toIntOrNull() ?: 3).coerceIn(1, 12)
                        val rest = (restText.toIntOrNull() ?: 90).coerceIn(15, 600)
                        val weight = if (usesWeight) {
                            (weightText.replace(",", ".").toDoubleOrNull() ?: 0.0).coerceIn(0.0, 999.0)
                        } else {
                            0.0
                        }
                        val mins = (durationMinText.toIntOrNull() ?: 0).coerceIn(0, 180)
                        val secs = (durationSecText.toIntOrNull() ?: 0).coerceIn(0, 59)
                        val totalDuration = (mins * 60 + secs).coerceIn(5, 10800)
                        val resolvedTargetReps = if (trackingMode == ExerciseTrackingMode.TIMER) {
                            GymModelHelpers.formatCompactDuration(totalDuration, lang)
                        } else {
                            repsText.trim().ifEmpty { "10" }
                        }

                        onSave(
                            ExerciseItem(
                                id = initial?.id ?: "custom_${System.currentTimeMillis()}",
                                name = cleanedName,
                                muscleGroup = muscleGroup,
                                equipment = equipment.trim().ifEmpty {
                                    if (usesWeight) "Bebas" else lang.t("Tanpa Alat", "Bodyweight")
                                },
                                targetSets = sets,
                                targetReps = resolvedTargetReps,
                                targetWeightKg = weight,
                                restSeconds = rest,
                                notes = notes.trim(),
                                trackingMode = trackingMode,
                                usesWeight = usesWeight,
                                timerDirection = timerDirection,
                                targetDurationSeconds = totalDuration
                            )
                        )
                    },
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    ),
                    modifier = Modifier.weight(1.4f).height(46.dp)
                ) {
                    Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(lang.t("Simpan Gerakan", "Save Movement"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
