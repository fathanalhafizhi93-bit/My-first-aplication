package com.fathan.ironpulse.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.UiTheme
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassBar
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.AppTab
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AmbientPhaseBackdrop(modifier: Modifier = Modifier) {
    val tokens = LocalIronPulseTokens.current
    val suppressGlow = tokens.performance.noAmbientGlow ||
        tokens.uiTheme == UiTheme.CARBON_FORGE ||
        tokens.uiTheme == UiTheme.UBUNTU_YARU ||
        tokens.uiTheme == UiTheme.MATERIAL_YOU

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(tokens.canvasBg)
    ) {
        if (!suppressGlow) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                if (tokens.uiTheme == UiTheme.AEROGLASS) Color(0x2E38BDF8) else tokens.phaseTokens.glowPrimary,
                                Color.Transparent
                            ),
                            center = Offset(780f, 120f),
                            radius = 780f
                        )
                    )
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                if (tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED) {
                                    tokens.accentColor.copy(alpha = 0.12f)
                                } else {
                                    tokens.phaseTokens.glowSecondary
                                },
                                Color.Transparent
                            ),
                            center = Offset(120f, 1100f),
                            radius = 760f
                        )
                    )
            )
        }
    }
}

@Composable
fun IronPulseTopBar(
    activeTab: AppTab,
    aboutOpen: Boolean,
    onLogoClick: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenAbout: () -> Unit,
    onTestAlarm: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val isFrosted = tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED
    val isAero = tokens.uiTheme == UiTheme.AEROGLASS
    val isCarbon = tokens.uiTheme == UiTheme.CARBON_FORGE
    val iconShape = RoundedCornerShape(
        when {
            isFrosted || isMaterialYou -> 999.dp
            isAero || tokens.uiTheme == UiTheme.OBSIDIAN || tokens.uiTheme == UiTheme.UBUNTU_YARU -> 10.dp
            else -> 8.dp
        }
    )
    val headerBorder = when (tokens.uiTheme) {
        UiTheme.AEROGLASS -> Color(0x4D7DD3FC)
        UiTheme.MATERIAL_YOU -> tokens.palette.outlineVariant
        UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.16f)
        UiTheme.CARBON_FORGE, UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.11f)
        UiTheme.OBSIDIAN -> tokens.phaseTokens.headerBorder
    }

    val settingsActive = activeTab == AppTab.SETTINGS && !aboutOpen

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens)
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(62.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Dual-tone brand wordmark
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = Color(0xFFF4F5F7), fontWeight = FontWeight.ExtraBold)) {
                        append("Iron")
                    }
                    withStyle(SpanStyle(color = tokens.accentColor, fontWeight = FontWeight.ExtraBold)) {
                        append("Pulse")
                    }
                },
                fontSize = 23.sp,
                letterSpacing = (-0.6).sp,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onLogoClick)
                    .padding(vertical = 4.dp, horizontal = 2.dp)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TopBarIconButton(
                    icon = Icons.Rounded.Settings,
                    contentDescription = lang.t("Buka pengaturan", "Open settings"),
                    active = settingsActive,
                    shape = iconShape,
                    onClick = onOpenSettings
                )
                TopBarIconButton(
                    icon = Icons.Rounded.Info,
                    contentDescription = lang.t("Tentang IronPulse", "About IronPulse"),
                    active = aboutOpen,
                    shape = iconShape,
                    onClick = onOpenAbout
                )
                Button(
                    onClick = onTestAlarm,
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    ),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                    modifier = Modifier.height(40.dp)
                ) {
                    Text(
                        text = lang.t("Tes Alarm", "Test Alarm"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }
            }
        }
        HorizontalDivider(thickness = 1.dp, color = headerBorder)
    }
}

@Composable
private fun TopBarIconButton(
    icon: ImageVector,
    contentDescription: String,
    active: Boolean,
    shape: RoundedCornerShape,
    onClick: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val containerColor = when {
        active && isMaterialYou -> tokens.palette.secondaryContainer
        active -> tokens.accentColor.copy(alpha = 0.18f)
        isMaterialYou -> tokens.palette.surfaceContainerHigh
        tokens.uiTheme == UiTheme.UBUNTU_YARU -> Color(0xFF353535)
        tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.08f)
        tokens.uiTheme == UiTheme.AEROGLASS -> Color(0x2838BDF8)
        else -> Color(0xCC13161C)
    }
    val borderColor = when {
        active && isMaterialYou -> tokens.palette.secondaryContainer
        active -> tokens.accentColor.copy(alpha = 0.65f)
        isMaterialYou -> tokens.palette.outlineVariant
        tokens.uiTheme == UiTheme.AEROGLASS -> Color(0x52BAE6FD)
        else -> Color.White.copy(alpha = 0.14f)
    }
    val tint = when {
        active && isMaterialYou -> tokens.palette.onSecondaryContainer
        active -> tokens.accentColor
        else -> tokens.palette.onSurfaceVariant
    }

    Surface(
        onClick = onClick,
        shape = shape,
        color = containerColor,
        border = BorderStroke(1.dp, borderColor),
        modifier = Modifier.size(40.dp)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = tint,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
fun IronPulseBottomNav(
    activeTab: AppTab,
    restRemainingSeconds: Int,
    restRunning: Boolean,
    onSelectTab: (AppTab) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val isFrosted = tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val isAero = tokens.uiTheme == UiTheme.AEROGLASS
    val isCarbon = tokens.uiTheme == UiTheme.CARBON_FORGE

    val items = listOf(
        Triple(AppTab.TODAY, lang.t("Hari Ini", "Today"), Icons.Rounded.PlayCircle),
        Triple(AppTab.SCHEDULE, lang.t("Jadwal", "Schedule"), Icons.Rounded.CalendarMonth),
        Triple(AppTab.HISTORY, lang.t("Riwayat", "History"), Icons.Rounded.History),
        Triple(AppTab.EXERCISES, lang.t("Gerakan", "Exercises"), Icons.Rounded.FitnessCenter)
    )

    val outerPadding = if (isFrosted) {
        Modifier
            .navigationBarsPadding()
            .padding(start = 12.dp, end = 12.dp, bottom = 10.dp)
    } else {
        Modifier
    }

    val barModifier = if (isFrosted) {
        Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens, shapeRadius = 28.dp)
            .border(1.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(28.dp))
    } else {
        val topBorder = when (tokens.uiTheme) {
            UiTheme.AEROGLASS -> Color(0x59BAE6FD)
            UiTheme.MATERIAL_YOU -> tokens.palette.outlineVariant
            UiTheme.CARBON_FORGE, UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.12f)
            UiTheme.OBSIDIAN -> tokens.phaseTokens.headerBorder
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.2f)
        }
        Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens)
            .border(BorderStroke(1.dp, topBorder))
            .navigationBarsPadding()
    }

    Box(modifier = outerPadding) {
        Row(
            modifier = barModifier
                .height(if (isFrosted) 60.dp else 64.dp)
                .padding(horizontal = if (isFrosted || isAero) 6.dp else 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { (tab, label, icon) ->
                val isActive = activeTab == tab || (tab == AppTab.TODAY && activeTab == AppTab.WORKOUT)
                val showCompactRest = tab == AppTab.TODAY && restRunning && activeTab != AppTab.WORKOUT

                val itemContentColor = when {
                    isActive && isMaterialYou -> tokens.palette.onSurface
                    isActive -> tokens.accentColor
                    else -> tokens.palette.onSurfaceVariant
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp)
                        .clip(
                            RoundedCornerShape(
                                when {
                                    isFrosted -> 22.dp
                                    isAero -> 12.dp
                                    else -> 10.dp
                                }
                            )
                        )
                        .background(
                            when {
                                isActive && isFrosted -> Color.White.copy(alpha = 0.13f)
                                isActive && isAero -> Color(0x2E38BDF8)
                                else -> Color.Transparent
                            }
                        )
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onSelectTab(tab) },
                    contentAlignment = Alignment.Center
                ) {
                    // Top accent bar indicator on non-frosted, non-M3, non-Aero themes
                    if (isActive && !isFrosted && !isMaterialYou && !isAero) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopCenter)
                                .width(if (isCarbon) 36.dp else 32.dp)
                                .height(2.5.dp)
                                .background(
                                    tokens.accentColor,
                                    if (isCarbon) RoundedCornerShape(0.dp) else RoundedCornerShape(999.dp)
                                )
                        )
                    }

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .width(52.dp)
                                .height(28.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(
                                    if (isActive && isMaterialYou) {
                                        tokens.palette.secondaryContainer
                                    } else {
                                        Color.Transparent
                                    }
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = label,
                                tint = if (isActive && isMaterialYou) {
                                    tokens.palette.onSecondaryContainer
                                } else {
                                    itemContentColor
                                },
                                modifier = Modifier.size(21.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = if (showCompactRest) GymModelHelpers.formatRestDuration(restRemainingSeconds) else label,
                            fontSize = 11.sp,
                            fontFamily = if (showCompactRest) FontFamily.Monospace else FontFamily.SansSerif,
                            fontWeight = if (showCompactRest || isActive) FontWeight.Bold else FontWeight.Medium,
                            color = if (showCompactRest) tokens.accentColor else itemContentColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PhaseLogoEmblem(
    timePhase: DayTimePhase,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val accent = tokens.phaseTokens.accentBright
    val cornerRadius = when (tokens.uiTheme) {
        UiTheme.MATERIAL_YOU, UiTheme.MIDNIGHT_FROSTED -> 18.dp
        UiTheme.CARBON_FORGE -> 10.dp
        else -> 14.dp
    }

    Box(
        modifier = modifier
            .size(54.dp)
            .ironGlassSurface(
                tokens = tokens,
                subtle = true,
                borderOverride = accent.copy(alpha = 0.45f),
                radiusOverride = cornerRadius
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(30.dp)) {
            val w = size.width
            val h = size.height
            when (timePhase) {
                DayTimePhase.MORNING -> {
                    val cx = w * 0.5f
                    val cy = h * 0.62f
                    drawCircle(
                        color = accent,
                        radius = w * 0.22f,
                        center = Offset(cx, cy),
                        style = Stroke(width = 2.4.dp.toPx())
                    )
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.14f, cy + h * 0.18f),
                        end = Offset(w * 0.86f, cy + h * 0.18f),
                        strokeWidth = 2.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                    listOf(
                        Offset(cx, h * 0.14f) to Offset(cx, h * 0.28f),
                        Offset(w * 0.22f, h * 0.28f) to Offset(w * 0.31f, h * 0.37f),
                        Offset(w * 0.78f, h * 0.28f) to Offset(w * 0.69f, h * 0.37f)
                    ).forEach { (s, e) ->
                        drawLine(accent, s, e, strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
                    }
                }
                DayTimePhase.AFTERNOON -> {
                    val cx = w * 0.5f
                    val cy = h * 0.5f
                    drawCircle(
                        color = accent,
                        radius = w * 0.21f,
                        center = Offset(cx, cy),
                        style = Stroke(width = 2.4.dp.toPx())
                    )
                    for (i in 0 until 8) {
                        val angle = Math.toRadians((i * 45).toDouble())
                        val r1 = w * 0.31f
                        val r2 = w * 0.43f
                        drawLine(
                            color = accent,
                            start = Offset(
                                (cx + r1 * kotlin.math.cos(angle)).toFloat(),
                                (cy + r1 * kotlin.math.sin(angle)).toFloat()
                            ),
                            end = Offset(
                                (cx + r2 * kotlin.math.cos(angle)).toFloat(),
                                (cy + r2 * kotlin.math.sin(angle)).toFloat()
                            ),
                            strokeWidth = 2.dp.toPx(),
                            cap = StrokeCap.Round
                        )
                    }
                }
                DayTimePhase.NIGHT -> {
                    val p = Path().apply {
                        moveTo(w * 0.62f, h * 0.18f)
                        cubicTo(w * 0.35f, h * 0.20f, w * 0.24f, h * 0.52f, w * 0.40f, h * 0.74f)
                        cubicTo(w * 0.52f, h * 0.88f, w * 0.74f, h * 0.82f, w * 0.82f, h * 0.68f)
                        cubicTo(w * 0.60f, h * 0.74f, w * 0.44f, h * 0.56f, w * 0.48f, h * 0.36f)
                        cubicTo(w * 0.50f, h * 0.27f, w * 0.56f, h * 0.22f, w * 0.62f, h * 0.18f)
                        close()
                    }
                    drawPath(p, color = accent)
                    drawCircle(accent, radius = 2.dp.toPx(), center = Offset(w * 0.74f, h * 0.28f))
                }
            }
        }
    }
}

@Composable
fun LiveFluidClock(
    nowMillis: Long,
    clockFormat: ClockFormat,
    lang: AppLanguage
) {
    val tokens = LocalIronPulseTokens.current
    val date = remember(nowMillis) { Date(nowMillis) }
    val hhmm = remember(nowMillis / 1000L, clockFormat) {
        if (clockFormat == ClockFormat.H12) {
            SimpleDateFormat("h:mm", Locale.US).format(date)
        } else {
            SimpleDateFormat("HH:mm", Locale.US).format(date)
        }
    }
    val ss = remember(nowMillis / 1000L) {
        SimpleDateFormat("ss", Locale.US).format(date)
    }
    val periodLabel = remember(nowMillis / 60_000L, clockFormat, lang) {
        if (clockFormat == ClockFormat.H24) {
            ""
        } else {
            val cal = java.util.Calendar.getInstance().apply { time = date }
            val h = cal.get(java.util.Calendar.HOUR_OF_DAY)
            if (lang == AppLanguage.ID) {
                when {
                    h < 5 -> "Dini hari"
                    h < 11 -> "Pagi"
                    h < 15 -> "Siang"
                    h < 19 -> "Sore"
                    else -> "Malam"
                }
            } else {
                if (h >= 12) "PM" else "AM"
            }
        }
    }

    Row(verticalAlignment = Alignment.Bottom) {
        AnimatedContent(
            targetState = hhmm,
            transitionSpec = {
                fadeIn(tween(180)) togetherWith fadeOut(tween(150))
            },
            label = "clockDigits"
        ) { timeText ->
            Text(
                text = timeText,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 40.sp,
                lineHeight = 42.sp,
                letterSpacing = (-1).sp,
                color = Color(0xFFF8FAFC)
            )
        }
        Spacer(modifier = Modifier.width(6.dp))
        Column(modifier = Modifier.padding(bottom = 5.dp)) {
            Text(
                text = ":$ss",
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = tokens.phaseTokens.accentBright
            )
            if (periodLabel.isNotEmpty()) {
                Text(
                    text = periodLabel,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.palette.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun TactileStepperControl(
    valueText: String,
    label: String? = null,
    onDecrement: () -> Unit,
    onIncrement: () -> Unit,
    onDirectEdit: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    var editing by remember { mutableStateOf(false) }
    var draft by remember(valueText) { mutableStateOf(valueText) }

    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        if (!label.isNullOrBlank()) {
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = tokens.palette.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 4.dp)
            )
        }
        Row(
            modifier = Modifier
                .height(44.dp)
                .ironGlassSurface(tokens, subtle = true, radiusOverride = tokens.inputRadius)
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onDecrement),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.Remove,
                    contentDescription = "-",
                    tint = tokens.palette.onSurface,
                    modifier = Modifier.size(16.dp)
                )
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clickable(enabled = onDirectEdit != null) {
                        draft = valueText
                        editing = true
                    },
                contentAlignment = Alignment.Center
            ) {
                if (editing && onDirectEdit != null) {
                    BasicTextField(
                        value = draft,
                        onValueChange = { next ->
                            draft = next
                            onDirectEdit(next)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        textStyle = TextStyle(
                            color = tokens.accentColor,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        ),
                        cursorBrush = SolidColor(tokens.accentColor),
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text(
                        text = valueText,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = tokens.palette.onSurface,
                        maxLines = 1
                    )
                }
            }

            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onIncrement),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.Add,
                    contentDescription = "+",
                    tint = tokens.accentColor,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun ConfirmDeleteDialog(
    title: String,
    message: String,
    confirmLabel: String,
    cancelLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = tokens.palette.surfaceContainerHigh,
        titleContentColor = tokens.palette.onSurface,
        textContentColor = tokens.palette.onSurfaceVariant,
        icon = {
            Icon(
                imageVector = Icons.Rounded.Warning,
                contentDescription = null,
                tint = Color(0xFFF87171)
            )
        },
        title = {
            Text(text = title, fontWeight = FontWeight.Bold)
        },
        text = {
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                shape = RoundedCornerShape(tokens.buttonRadius),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFDC2626),
                    contentColor = Color.White
                )
            ) {
                Text(confirmLabel, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.surfaceBorderColor)
            ) {
                Text(cancelLabel, color = tokens.palette.onSurface)
            }
        }
    )
}
