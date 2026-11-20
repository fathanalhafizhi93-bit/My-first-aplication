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
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.LocalFireDepartment
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.WorkoutLog
import com.fathan.ironpulse.ui.components.tactilePress
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

private data class CalendarDayCell(
    val dayOfMonth: Int,
    val dateKey: String
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HistoryScreen(
    state: IronPulseUiState,
    contentPadding: PaddingValues,
    onStartTodayWorkout: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val todayCal = remember(state.todayDateKey) { Calendar.getInstance() }
    val currentYear = todayCal.get(Calendar.YEAR)
    val currentMonth = todayCal.get(Calendar.MONTH)

    var viewYear by remember { mutableIntStateOf(currentYear) }
    var viewMonth by remember { mutableIntStateOf(currentMonth) }
    var selectedDateKey by remember { mutableStateOf(state.todayDateKey) }

    val logsByDate = remember(state.workoutHistory) {
        state.workoutHistory.associateBy { it.dateKey }
    }

    val monthPrefix = remember(viewYear, viewMonth) {
        String.format(Locale.US, "%04d-%02d", viewYear, viewMonth + 1)
    }

    val completedSessions = remember(state.workoutHistory) {
        state.workoutHistory.count { log ->
            log.completed || log.entries.any { entry -> entry.sets.any { it.completed } }
        }
    }
    val weeklyStreak = state.weeklyStreak
    val monthlyVolumeKg = remember(state.workoutHistory, monthPrefix) {
        state.workoutHistory
            .filter { it.dateKey.startsWith(monthPrefix) }
            .sumOf { log ->
                log.entries.filter { it.usesWeight && it.trackingMode == ExerciseTrackingMode.REPS }
                    .sumOf { entry ->
                        entry.sets.filter { it.completed }.sumOf { it.weightKg * it.reps }
                    }
            }
    }
    val formattedMonthlyVolume = remember(monthlyVolumeKg) {
        when {
            monthlyVolumeKg >= 1000.0 -> String.format(Locale.US, "%.1ft", monthlyVolumeKg / 1000.0)
            else -> "${NumberFormat.getNumberInstance(Locale.US).format(monthlyVolumeKg.toInt())} kg"
        }
    }

    val monthTitle = remember(viewYear, viewMonth, lang) {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, viewYear)
            set(Calendar.MONTH, viewMonth)
            set(Calendar.DAY_OF_MONTH, 1)
        }
        val loc = if (lang == AppLanguage.EN) Locale.US else Locale.forLanguageTag("id-ID")
        SimpleDateFormat("MMMM yyyy", loc).format(cal.time)
    }

    val calendarCells = remember(viewYear, viewMonth) {
        buildMonthGrid(viewYear, viewMonth)
    }

    val selectedLog: WorkoutLog? = logsByDate[selectedDateKey]
    val isViewingCurrentMonth = viewYear == currentYear && viewMonth == currentMonth

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
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = lang.t("PELACAK KONSISTENSI", "CONSISTENCY TRACKER"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.4.sp,
                    color = tokens.accentColor
                )
                Text(
                    text = lang.t("Riwayat & Kalender Latihan", "History & Workout Calendar"),
                    fontSize = 23.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = tokens.palette.onSurface
                )
                Text(
                    text = lang.t(
                        "Ketuk tanggal di kalender untuk memeriksa detail set, beban, dan durasi.",
                        "Tap any calendar date to inspect logged sets, load, and durations."
                    ),
                    fontSize = 13.sp,
                    color = tokens.palette.onSurfaceVariant
                )
            }
        }

        // Loading skeleton vs KPI & Calendar
        if (state.historyLoading && state.workoutHistory.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    repeat(3) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.06f))
                        )
                    }
                }
            }
        } else {
            // 3 KPI Summary Cards
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HistoryKpiCard(
                        icon = Icons.Rounded.CheckCircle,
                        label = lang.t("Sesi Selesai", "Sessions"),
                        value = "$completedSessions",
                        accent = tokens.accentColor,
                        modifier = Modifier.weight(1f)
                    )
                    HistoryKpiCard(
                        icon = Icons.Rounded.LocalFireDepartment,
                        label = lang.t("Streak Mgg", "Wk Streak"),
                        value = "$weeklyStreak${lang.t("m", "w")}",
                        accent = Color(0xFFFBBF24),
                        modifier = Modifier.weight(1f)
                    )
                    HistoryKpiCard(
                        icon = Icons.Rounded.FitnessCenter,
                        label = lang.t("Vol. Bulan", "Mo. Vol"),
                        value = formattedMonthlyVolume,
                        accent = Color(0xFF38BDF8),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Interactive Month Calendar Card
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                if (viewMonth == 0) {
                                    viewMonth = 11
                                    viewYear -= 1
                                } else {
                                    viewMonth -= 1
                                }
                            },
                            modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                        ) {
                            Icon(Icons.Rounded.ChevronLeft, contentDescription = "Prev", tint = tokens.palette.onSurface)
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = monthTitle,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = tokens.palette.onSurface
                            )
                            if (!isViewingCurrentMonth) {
                                Text(
                                    text = lang.t("Kembali ke Bulan Ini", "Back to This Month"),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = tokens.accentColor,
                                    modifier = Modifier
                                        .tactilePress(disabledByPerf = noAnim)
                                        .clip(RoundedCornerShape(999.dp))
                                        .clickable {
                                            viewYear = currentYear
                                            viewMonth = currentMonth
                                            selectedDateKey = state.todayDateKey
                                        }
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = {
                                if (viewMonth == 11) {
                                    viewMonth = 0
                                    viewYear += 1
                                } else {
                                    viewMonth += 1
                                }
                            },
                            modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                        ) {
                            Icon(Icons.Rounded.ChevronRight, contentDescription = "Next", tint = tokens.palette.onSurface)
                        }
                    }

                    // Weekday Headers (Mon..Sun)
                    Row(modifier = Modifier.fillMaxWidth()) {
                        DayKey.entries.forEach { dk ->
                            Text(
                                text = dk.shortLabel(lang),
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = tokens.palette.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Calendar Grid (Chunked in rows of 7)
                    val rows = calendarCells.chunked(7)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        rows.forEach { week ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                week.forEach { cell ->
                                    if (cell == null) {
                                        Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                                    } else {
                                        val log = logsByDate[cell.dateKey]
                                        val totalSets = log?.entries?.sumOf { it.sets.size } ?: 0
                                        val doneSets = log?.entries?.sumOf { e -> e.sets.count { it.completed } } ?: 0
                                        val isFull = log != null && (log.completed || (totalSets > 0 && doneSets == totalSets))
                                        val isPartial = log != null && !isFull && doneSets > 0
                                        val isToday = cell.dateKey == state.todayDateKey
                                        val isSelected = cell.dateKey == selectedDateKey

                                        val bg = when {
                                            isFull -> tokens.accentColor.copy(alpha = 0.20f)
                                            isPartial -> Color(0x2838BDF8)
                                            isToday -> tokens.subtleChipBg
                                            else -> tokens.wellBg
                                        }
                                        val border = when {
                                            isSelected -> tokens.accentColor
                                            isToday -> Color.White.copy(alpha = 0.45f)
                                            isFull -> tokens.accentColor.copy(alpha = 0.45f)
                                            isPartial -> Color(0x6638BDF8)
                                            else -> tokens.subtleBorderColor
                                        }

                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .aspectRatio(1f)
                                                .tactilePress(pressedScale = 0.90f, disabledByPerf = noAnim)
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(bg)
                                                .border(if (isSelected) 2.dp else 1.dp, border, RoundedCornerShape(10.dp))
                                                .clickable { selectedDateKey = cell.dateKey },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text(
                                                    text = "${cell.dayOfMonth}",
                                                    fontFamily = FontFamily.Monospace,
                                                    fontSize = 13.sp,
                                                    fontWeight = if (isSelected || isToday || isFull) FontWeight.ExtraBold else FontWeight.Medium,
                                                    color = when {
                                                        isFull -> tokens.accentColor
                                                        isPartial -> Color(0xFF7DD3FC)
                                                        else -> tokens.palette.onSurface
                                                    }
                                                )
                                                if (isFull || isPartial) {
                                                    Spacer(modifier = Modifier.height(2.dp))
                                                    Box(
                                                        modifier = Modifier
                                                            .size(5.dp)
                                                            .clip(CircleShape)
                                                            .background(if (isFull) tokens.accentColor else Color(0xFF38BDF8))
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Legend Row
                    HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CalendarLegendItem(tokens.accentColor, lang.t("Selesai Penuh", "Completed"))
                        CalendarLegendItem(Color(0xFF38BDF8), lang.t("Sebagian", "Partial"))
                        CalendarLegendItem(Color.White.copy(alpha = 0.55f), lang.t("Hari Ini", "Today"))
                    }
                }
            }

            // Selected Date Session Detail
            item {
                val readableDate = remember(selectedDateKey, lang) {
                    GymModelHelpers.formatReadableDate(selectedDateKey, lang)
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CalendarMonth,
                                contentDescription = null,
                                tint = tokens.accentColor,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = readableDate,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = tokens.palette.onSurface
                            )
                        }

                        if (selectedLog != null) {
                            val totalSets = selectedLog.entries.sumOf { it.sets.size }
                            val doneSets = selectedLog.entries.sumOf { e -> e.sets.count { it.completed } }
                            val full = selectedLog.completed || (totalSets > 0 && doneSets == totalSets)
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = if (full) tokens.accentColor.copy(alpha = 0.16f) else Color(0x2838BDF8),
                                border = BorderStroke(
                                    1.dp,
                                    if (full) tokens.accentColor.copy(alpha = 0.45f) else Color(0x6638BDF8)
                                )
                            ) {
                                Text(
                                    text = if (full) lang.t("Selesai Penuh", "Completed") else "$doneSets/$totalSets set",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (full) tokens.accentColor else Color(0xFF7DD3FC),
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    if (selectedLog == null) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .ironGlassSurface(tokens, subtle = true)
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = lang.t(
                                    "Tidak ada catatan latihan pada tanggal ini.",
                                    "No workout session recorded for this date."
                                ),
                                fontSize = 13.sp,
                                color = tokens.palette.onSurfaceVariant
                            )
                            if (selectedDateKey == state.todayDateKey) {
                                Button(
                                    onClick = onStartTodayWorkout,
                                    shape = RoundedCornerShape(tokens.buttonRadius),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = tokens.accentColor,
                                        contentColor = tokens.onAccentColor
                                    )
                                ) {
                                    Icon(Icons.Rounded.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = lang.t("Mulai Catat Latihan Hari Ini", "Start Logging Today"),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    } else {
                        val totalVolume = selectedLog.entries
                            .filter { it.usesWeight && it.trackingMode == ExerciseTrackingMode.REPS }
                            .sumOf { entry -> entry.sets.filter { it.completed }.sumOf { it.weightKg * it.reps } }
                        val totalTimedSeconds = selectedLog.entries
                            .filter { it.trackingMode == ExerciseTrackingMode.TIMER }
                            .sumOf { entry -> entry.sets.filter { it.completed }.sumOf { it.durationSeconds } }
                        val doneSets = selectedLog.entries.sumOf { e -> e.sets.count { it.completed } }
                        val totalSets = selectedLog.entries.sumOf { it.sets.size }

                        Text(
                            text = selectedLog.focusTitle,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tokens.palette.onSurface
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            SessionStatPill(
                                icon = Icons.Rounded.CheckCircle,
                                text = "$doneSets/$totalSets set",
                                modifier = Modifier.weight(1f)
                            )
                            if (totalVolume > 0) {
                                SessionStatPill(
                                    icon = Icons.Rounded.FitnessCenter,
                                    text = "${NumberFormat.getNumberInstance(Locale.US).format(totalVolume.toInt())} kg",
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            if (totalTimedSeconds > 0) {
                                SessionStatPill(
                                    icon = Icons.Rounded.Schedule,
                                    text = GymModelHelpers.formatCompactDuration(totalTimedSeconds, lang),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            selectedLog.entries.forEach { entry ->
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .ironGlassSurface(tokens, subtle = true)
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = entry.name,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = tokens.palette.onSurface,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Text(
                                            text = entry.muscleGroup.label(lang),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = tokens.accentColor
                                        )
                                    }

                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        entry.sets.forEach { s ->
                                            val label = when {
                                                !s.completed -> "S${s.setNumber}: ${lang.t("Belum", "Pending")}"
                                                entry.trackingMode == ExerciseTrackingMode.TIMER ->
                                                    "S${s.setNumber}: ${GymModelHelpers.formatCompactDuration(s.durationSeconds, lang)}"
                                                entry.usesWeight ->
                                                    "S${s.setNumber}: ${GymModelHelpers.formatWeight(s.weightKg)}kg × ${s.reps}"
                                                else ->
                                                    "S${s.setNumber}: ${s.reps} rep"
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(
                                                        if (s.completed) tokens.accentColor.copy(alpha = 0.14f)
                                                        else Color.White.copy(alpha = 0.04f)
                                                    )
                                                    .border(
                                                        1.dp,
                                                        if (s.completed) tokens.accentColor.copy(alpha = 0.45f)
                                                        else Color.White.copy(alpha = 0.08f),
                                                        RoundedCornerShape(8.dp)
                                                    )
                                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = label,
                                                    fontFamily = FontFamily.Monospace,
                                                    fontSize = 11.sp,
                                                    fontWeight = if (s.completed) FontWeight.Bold else FontWeight.Normal,
                                                    color = if (s.completed) tokens.accentColor else tokens.palette.onSurfaceVariant
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
        }
    }
}

@Composable
private fun HistoryKpiCard(
    icon: ImageVector,
    label: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    Column(
        modifier = modifier
            .ironGlassSurface(tokens)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = accent, modifier = Modifier.size(18.dp))
        Text(
            text = value,
            fontFamily = FontFamily.Monospace,
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = tokens.palette.onSurface
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = tokens.palette.onSurfaceVariant,
            maxLines = 1
        )
    }
}

@Composable
private fun CalendarLegendItem(
    color: Color,
    label: String
) {
    val tokens = LocalIronPulseTokens.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(text = label, fontSize = 11.sp, color = tokens.palette.onSurfaceVariant)
    }
}

@Composable
private fun SessionStatPill(
    icon: ImageVector,
    text: String,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(tokens.wellBg)
            .border(1.dp, tokens.subtleBorderColor, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = tokens.accentColor, modifier = Modifier.size(14.dp))
        Text(
            text = text,
            fontFamily = FontFamily.Monospace,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = tokens.palette.onSurface
        )
    }
}

private fun buildMonthGrid(year: Int, month: Int): List<CalendarDayCell?> {
    val cal = Calendar.getInstance().apply {
        set(Calendar.YEAR, year)
        set(Calendar.MONTH, month)
        set(Calendar.DAY_OF_MONTH, 1)
    }
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val firstDow = cal.get(Calendar.DAY_OF_WEEK) // Sun=1, Mon=2 .. Sat=7
    val leadingBlanks = if (firstDow == Calendar.SUNDAY) 6 else firstDow - Calendar.MONDAY

    val cells = mutableListOf<CalendarDayCell?>()
    repeat(leadingBlanks) { cells.add(null) }
    for (day in 1..daysInMonth) {
        val dateKey = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
        cells.add(CalendarDayCell(day, dateKey))
    }
    while (cells.size % 7 != 0) {
        cells.add(null)
    }
    return cells
}
