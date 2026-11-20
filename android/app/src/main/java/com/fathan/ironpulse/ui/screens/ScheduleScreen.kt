package com.fathan.ironpulse.ui.screens

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowDropDown
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.NotificationsOff
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerDefaults
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.CustomRingtone
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.ui.components.tactilePress
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    state: IronPulseUiState,
    viewModel: GymViewModel,
    contentPadding: PaddingValues,
    onOpenExercisesForDay: (DayKey) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val activeGymDaysCount = remember(state.schedules) {
        DayKey.entries.count { state.schedules[it]?.isGymDay == true }
    }
    val activeAlarmsCount = remember(state.schedules) {
        DayKey.entries.count { state.schedules[it]?.let { s -> s.isGymDay && s.alarmEnabled } == true }
    }

    var timePickerDay by remember { mutableStateOf<DayKey?>(null) }
    var editingFocusDay by remember { mutableStateOf<DayKey?>(null) }

    LazyColumn(
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = contentPadding.calculateTopPadding() + 14.dp,
            bottom = contentPadding.calculateBottomPadding() + 92.dp
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // Header
        item(key = "schedule_header") {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(3.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(tokens.accentColor)
                )
                Text(
                    text = lang.t("Jadwal & Alarm Mingguan", "Weekly Schedule & Alarms"),
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFF4F5F7)
                )
                Text(
                    text = lang.t(
                        "Pilih hari latihan Senin sampai Minggu, atur jam pengingat, dan tentukan fokus otot tiap hari.",
                        "Choose training days Monday through Sunday, set reminder times, and define each day's muscle focus."
                    ),
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = tokens.mutedTextColor
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "$activeGymDaysCount/7 ${lang.t("Hari Gym", "Gym Days")} · $activeAlarmsCount ${lang.t("Alarm Aktif", "Active Alarms")}",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.accentColor
                )
                HorizontalDivider(modifier = Modifier.padding(top = 8.dp), color = Color.White.copy(alpha = 0.1f))
            }
        }

        items(DayKey.entries, key = { it.key }) { day ->
            val sched = state.schedules[day] ?: return@items
            DayScheduleCard(
                day = day,
                sched = sched,
                isToday = day == state.todayDayKey,
                isEditingFocus = editingFocusDay == day,
                defaultRingtoneId = state.profile?.defaultRingtoneId ?: "builtin_athletic_bell",
                customRingtones = state.customRingtones,
                onStartEditingFocus = { editingFocusDay = day },
                onStopEditingFocus = { if (editingFocusDay == day) editingFocusDay = null },
                onToggleGymDay = {
                    val nextGym = !sched.isGymDay
                    if (!nextGym && editingFocusDay == day) editingFocusDay = null
                    viewModel.updateScheduleFields(
                        dayKey = day,
                        isGymDay = nextGym,
                        alarmEnabled = nextGym
                    )
                },
                onOpenExercises = { onOpenExercisesForDay(day) },
                onSaveFocusTitle = { nextTitle ->
                    viewModel.updateScheduleFields(dayKey = day, focusTitle = nextTitle)
                    editingFocusDay = null
                },
                onOpenTimePicker = { timePickerDay = day },
                onToggleAlarmEnabled = {
                    viewModel.updateScheduleFields(dayKey = day, alarmEnabled = !sched.alarmEnabled)
                },
                onSelectRingtone = { nextId ->
                    viewModel.updateScheduleFields(dayKey = day, ringtoneId = nextId)
                },
                modifier = Modifier.animateItem()
            )
        }
    }

    val editingDay = timePickerDay
    val editingSchedule = editingDay?.let { state.schedules[it] }
    if (editingDay != null && editingSchedule != null) {
        val parts = editingSchedule.alarmTime.split(":")
        val initHour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 6
        val initMinute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 30
        val pickerState = rememberTimePickerState(
            initialHour = initHour,
            initialMinute = initMinute,
            is24Hour = tokens.clockFormat == ClockFormat.H24
        )

        AlertDialog(
            onDismissRequest = { timePickerDay = null },
            containerColor = tokens.palette.surfaceContainerHigh,
            title = {
                Text(
                    text = "${lang.t("Jam Alarm", "Alarm Time")} — ${editingDay.label(lang)}",
                    fontWeight = FontWeight.Bold,
                    color = tokens.palette.onSurface
                )
            },
            text = {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    TimePicker(
                        state = pickerState,
                        colors = TimePickerDefaults.colors(
                            selectorColor = tokens.accentColor,
                            clockDialSelectedContentColor = tokens.onAccentColor,
                            clockDialColor = tokens.palette.surfaceContainerLow,
                            periodSelectorSelectedContainerColor = tokens.accentColor,
                            periodSelectorSelectedContentColor = tokens.onAccentColor,
                            timeSelectorSelectedContainerColor = tokens.accentColor.copy(alpha = 0.22f),
                            timeSelectorSelectedContentColor = tokens.accentColor
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val hhmm = String.format(Locale.US, "%02d:%02d", pickerState.hour, pickerState.minute)
                        viewModel.updateScheduleFields(dayKey = editingDay, alarmTime = hhmm)
                        timePickerDay = null
                    },
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    )
                ) {
                    Text(lang.t("Simpan", "Save"), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { timePickerDay = null },
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    border = BorderStroke(1.dp, tokens.surfaceBorderColor)
                ) {
                    Text(lang.t("Batal", "Cancel"), color = tokens.palette.onSurface)
                }
            }
        )
    }
}

@Composable
private fun DayScheduleCard(
    day: DayKey,
    sched: DaySchedule,
    isToday: Boolean,
    isEditingFocus: Boolean,
    defaultRingtoneId: String,
    customRingtones: List<CustomRingtone>,
    onStartEditingFocus: () -> Unit,
    onStopEditingFocus: () -> Unit,
    onToggleGymDay: () -> Unit,
    onOpenExercises: () -> Unit,
    onSaveFocusTitle: (String) -> Unit,
    onOpenTimePicker: () -> Unit,
    onToggleAlarmEnabled: () -> Unit,
    onSelectRingtone: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    var focusDraft by remember(sched.focusTitle, isEditingFocus) { mutableStateOf(sched.focusTitle) }
    var ringtoneMenuOpen by remember { mutableStateOf(false) }

    val toneDisplayName = remember(sched.ringtoneId, defaultRingtoneId, customRingtones, lang) {
        if (sched.ringtoneId == "default" || sched.ringtoneId.isBlank()) {
            lang.t("Ikuti Ringtone Utama", "Use Default Ringtone")
        } else {
            GymModelHelpers.resolveRingtoneName(sched.ringtoneId, defaultRingtoneId, customRingtones).second
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .alpha(if (sched.isGymDay) 1f else 0.8f)
            .ironGlassSurface(tokens, subtle = !sched.isGymDay)
            .then(if (noAnim) Modifier else Modifier.animateContentSize(tween(200)))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Row 1: Day Title + Today tag + Gym Day Toggle + Exercises link
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = day.label(lang),
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF4F5F7)
                    )
                    if (isToday) {
                        Text(
                            text = "· ${lang.t("Hari Ini", "Today")}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = tokens.accentColor
                        )
                    }
                }
                Text(
                    text = if (sched.isGymDay) {
                        "${sched.exercises.size} ${lang.t("gerakan terjadwal", "scheduled exercises")}"
                    } else {
                        lang.t("Hari istirahat · alarm nonaktif", "Rest day · alarm off")
                    },
                    fontSize = 12.sp,
                    color = tokens.mutedTextColor
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    onClick = onToggleGymDay,
                    shape = RoundedCornerShape(10.dp),
                    color = if (sched.isGymDay) tokens.accentColor else tokens.controlBg,
                    border = if (sched.isGymDay) null else BorderStroke(1.dp, tokens.subtleBorderColor),
                    modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                ) {
                    Text(
                        text = if (sched.isGymDay) lang.t("Hari Gym", "Gym Day") else "Rest Day",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (sched.isGymDay) tokens.onAccentColor else tokens.mutedTextColor,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp)
                    )
                }

                if (sched.isGymDay) {
                    Surface(
                        onClick = onOpenExercises,
                        shape = RoundedCornerShape(10.dp),
                        color = tokens.controlBg,
                        border = BorderStroke(1.dp, tokens.subtleBorderColor),
                        modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                    ) {
                        Row(
                            modifier = Modifier.padding(start = 10.dp, end = 6.dp, top = 8.dp, bottom = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = lang.t("Gerakan", "Exercises"),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFF4F5F7)
                            )
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = null,
                                tint = tokens.mutedTextColor,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }

        // Row 2: Active Gym Day Details
        if (sched.isGymDay) {
            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

            // Lightweight Tap-to-Edit Focus Title (only mounts OutlinedTextField when editing)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = lang.t("Fokus Latihan", "Workout Focus"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = tokens.mutedTextColor
                )
                if (isEditingFocus) {
                    OutlinedTextField(
                        value = focusDraft,
                        onValueChange = { focusDraft = it.take(80) },
                        singleLine = true,
                        placeholder = {
                            Text(lang.t("Misal: Push — Dada & Bahu", "e.g. Push — Chest & Shoulders"))
                        },
                        trailingIcon = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val trimmed = focusDraft.trim()
                                if (trimmed.isNotEmpty()) {
                                    IconButton(onClick = { onSaveFocusTitle(trimmed) }) {
                                        Icon(Icons.Rounded.Check, contentDescription = null, tint = tokens.accentColor)
                                    }
                                }
                                IconButton(onClick = onStopEditingFocus) {
                                    Icon(Icons.Rounded.Close, contentDescription = null, tint = tokens.mutedTextColor, modifier = Modifier.size(18.dp))
                                }
                            }
                        },
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = {
                            val trimmed = focusDraft.trim()
                            if (trimmed.isNotEmpty() && trimmed != sched.focusTitle) {
                                onSaveFocusTitle(trimmed)
                            } else {
                                onStopEditingFocus()
                            }
                        }),
                        shape = RoundedCornerShape(tokens.inputRadius),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = tokens.accentColor,
                            unfocusedBorderColor = tokens.subtleBorderColor,
                            focusedTextColor = Color(0xFFF4F5F7),
                            unfocusedTextColor = Color(0xFFF4F5F7),
                            focusedContainerColor = tokens.wellBg,
                            unfocusedContainerColor = tokens.wellBg
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Surface(
                        onClick = onStartEditingFocus,
                        shape = RoundedCornerShape(tokens.inputRadius),
                        color = tokens.wellBg,
                        border = BorderStroke(1.dp, tokens.subtleBorderColor),
                        modifier = Modifier
                            .fillMaxWidth()
                            .tactilePress(pressedScale = 0.985f, disabledByPerf = noAnim)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = sched.focusTitle.ifBlank {
                                    lang.t("Ketuk untuk atur fokus latihan...", "Tap to set workout focus...")
                                },
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (sched.focusTitle.isBlank()) tokens.mutedTextColor else Color(0xFFF4F5F7),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = Icons.Rounded.Edit,
                                contentDescription = null,
                                tint = tokens.accentColor,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Alarm Time + Bell Toggle & Ringtone Dropdown
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Bottom
            ) {
                // Time + Bell
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = lang.t("Jam Alarm", "Alarm Time"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = tokens.mutedTextColor
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            onClick = onOpenTimePicker,
                            shape = RoundedCornerShape(tokens.inputRadius),
                            color = tokens.wellBg,
                            border = BorderStroke(1.dp, tokens.subtleBorderColor),
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .tactilePress(disabledByPerf = noAnim)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Schedule,
                                    contentDescription = null,
                                    tint = tokens.accentColor,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = GymModelHelpers.formatAlarmTime(sched.alarmTime, tokens.clockFormat, lang),
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFF4F5F7),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Surface(
                            onClick = onToggleAlarmEnabled,
                            shape = RoundedCornerShape(tokens.inputRadius),
                            color = if (sched.alarmEnabled) tokens.accentColor.copy(alpha = 0.16f) else tokens.controlBg,
                            border = BorderStroke(
                                1.dp,
                                if (sched.alarmEnabled) tokens.accentColor.copy(alpha = 0.5f) else tokens.subtleBorderColor
                            ),
                            modifier = Modifier
                                .size(46.dp)
                                .tactilePress(disabledByPerf = noAnim)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = if (sched.alarmEnabled) {
                                        Icons.Rounded.NotificationsActive
                                    } else {
                                        Icons.Rounded.NotificationsOff
                                    },
                                    contentDescription = null,
                                    tint = if (sched.alarmEnabled) tokens.accentColor else tokens.mutedTextColor,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                // Per-Day Ringtone Picker
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = lang.t("Nada Alarm", "Alarm Tone"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = tokens.mutedTextColor
                    )
                    Box {
                        Surface(
                            onClick = { ringtoneMenuOpen = true },
                            shape = RoundedCornerShape(tokens.inputRadius),
                            color = tokens.wellBg,
                            border = BorderStroke(1.dp, tokens.subtleBorderColor),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .tactilePress(disabledByPerf = noAnim)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = toneDisplayName,
                                    fontSize = 12.5.sp,
                                    color = Color(0xFFF4F5F7),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = Icons.Rounded.ArrowDropDown,
                                    contentDescription = null,
                                    tint = tokens.mutedTextColor
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = ringtoneMenuOpen,
                            onDismissRequest = { ringtoneMenuOpen = false },
                            containerColor = tokens.palette.surfaceContainerHigh
                        ) {
                            DropdownMenuItem(
                                text = { Text(lang.t("Ikuti Ringtone Utama", "Use Default Ringtone")) },
                                onClick = {
                                    onSelectRingtone("default")
                                    ringtoneMenuOpen = false
                                }
                            )
                            HorizontalDivider()
                            GymModelHelpers.BUILTIN_RINGTONES.forEach { rt ->
                                DropdownMenuItem(
                                    text = { Text(rt.name) },
                                    onClick = {
                                        onSelectRingtone(rt.id)
                                        ringtoneMenuOpen = false
                                    }
                                )
                            }
                            if (customRingtones.isNotEmpty()) {
                                HorizontalDivider()
                                customRingtones.forEach { rt ->
                                    DropdownMenuItem(
                                        text = { Text(rt.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                        onClick = {
                                            onSelectRingtone(rt.id)
                                            ringtoneMenuOpen = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
