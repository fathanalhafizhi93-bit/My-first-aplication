package com.fathan.ironpulse.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fathan.ironpulse.data.AppPreferences
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.PerformancePreferences
import com.fathan.ironpulse.model.UiTheme

@Immutable
data class PhaseThemeTokens(
    val phase: DayTimePhase,
    val accentHex: String,
    val accentBrightHex: String,
    val accent: Color,
    val accentBright: Color,
    val heroStart: Color,
    val heroMid: Color,
    val heroEnd: Color,
    val heroBorder: Color,
    val headerBorder: Color,
    val glowPrimary: Color,
    val glowSecondary: Color
)

fun resolvePhaseThemeTokens(phase: DayTimePhase): PhaseThemeTokens = when (phase) {
    DayTimePhase.MORNING -> PhaseThemeTokens(
        phase = phase,
        accentHex = "#F59E0B",
        accentBrightHex = "#FBBF24",
        accent = Color(0xFFF59E0B),
        accentBright = Color(0xFFFBBF24),
        heroStart = Color(0xCC2A1B08),
        heroMid = Color(0xB8181410),
        heroEnd = Color(0xD612151C),
        heroBorder = Color(0x52FBBF24),
        headerBorder = Color(0x38F59E0B),
        glowPrimary = Color(0x28FBBF24),
        glowSecondary = Color(0x1AEAB308)
    )
    DayTimePhase.AFTERNOON -> PhaseThemeTokens(
        phase = phase,
        accentHex = "#38BDF8",
        accentBrightHex = "#7DD3FC",
        accent = Color(0xFF38BDF8),
        accentBright = Color(0xFF7DD3FC),
        heroStart = Color(0xCC0D2337),
        heroMid = Color(0xB8121B28),
        heroEnd = Color(0xD612151C),
        heroBorder = Color(0x477DD3FC),
        headerBorder = Color(0x3338BDF8),
        glowPrimary = Color(0x2438BDF8),
        glowSecondary = Color(0x160EA5E9)
    )
    DayTimePhase.NIGHT -> PhaseThemeTokens(
        phase = phase,
        accentHex = "#818CF8",
        accentBrightHex = "#A5B4FC",
        accent = Color(0xFF818CF8),
        accentBright = Color(0xFFA5B4FC),
        heroStart = Color(0xD6161432),
        heroMid = Color(0xC2121321),
        heroEnd = Color(0xDE0E1017),
        heroBorder = Color(0x47A5B4FC),
        headerBorder = Color(0x33818CF8),
        glowPrimary = Color(0x26818CF8),
        glowSecondary = Color(0x186366F1)
    )
}

@Immutable
data class IronPulseThemeTokens(
    val uiTheme: UiTheme,
    val palette: MaterialYouPalette,
    val accentColor: Color,
    val onAccentColor: Color,
    val effectiveTintColor: Color,
    val canvasBg: Color,
    val wellBg: Color,
    val controlBg: Color,
    val subtleChipBg: Color,
    val mutedTextColor: Color,
    val cardTopHighlight: Color,
    val surfaceBorderColor: Color,
    val subtleBorderColor: Color,
    val cardRadius: Dp,
    val buttonRadius: Dp,
    val inputRadius: Dp,
    val timePhase: DayTimePhase,
    val phaseTokens: PhaseThemeTokens,
    val performance: PerformancePreferences,
    val lang: AppLanguage,
    val clockFormat: ClockFormat
)

private val DefaultPalette = MaterialYouColorEngine.generateMaterialYouPalette(
    MaterialYouColorEngine.DEFAULT_ACCENT_COLOR,
    null
)

val LocalIronPulseTokens = staticCompositionLocalOf {
    IronPulseThemeTokens(
        uiTheme = UiTheme.MATERIAL_YOU,
        palette = DefaultPalette,
        accentColor = DefaultPalette.primary,
        onAccentColor = DefaultPalette.onPrimary,
        effectiveTintColor = MaterialYouColorEngine.parseColor("#1C1B22"),
        canvasBg = DefaultPalette.surface,
        wellBg = DefaultPalette.surfaceContainerLowest,
        controlBg = DefaultPalette.surfaceContainerHigh,
        subtleChipBg = DefaultPalette.surfaceContainerHigh,
        mutedTextColor = DefaultPalette.onSurfaceVariant,
        cardTopHighlight = Color.White.copy(alpha = 0.06f),
        surfaceBorderColor = DefaultPalette.outlineVariant,
        subtleBorderColor = DefaultPalette.outlineVariant.copy(alpha = 0.7f),
        cardRadius = 24.dp,
        buttonRadius = 999.dp,
        inputRadius = 14.dp,
        timePhase = DayTimePhase.MORNING,
        phaseTokens = resolvePhaseThemeTokens(DayTimePhase.MORNING),
        performance = PerformancePreferences(),
        lang = AppLanguage.ID,
        clockFormat = ClockFormat.H24
    )
}

fun Modifier.ironGlassSurface(
    tokens: IronPulseThemeTokens,
    subtle: Boolean = false,
    borderOverride: Color? = null,
    radiusOverride: Dp? = null
): Modifier {
    val radius = radiusOverride ?: tokens.cardRadius
    val shape = RoundedCornerShape(radius)
    val tint = tokens.effectiveTintColor
    val borderColor = borderOverride ?: if (subtle) tokens.subtleBorderColor else tokens.surfaceBorderColor
    val noBlur = tokens.performance.noBlur

    return when (tokens.uiTheme) {
        UiTheme.MATERIAL_YOU -> {
            val bg = if (subtle) tokens.palette.surfaceContainerLow else tokens.palette.surfaceContainer
            this
                .clip(shape)
                .background(bg, shape)
                .border(1.dp, borderColor, shape)
        }
        UiTheme.UBUNTU_YARU -> {
            val bg = if (subtle) Color(0xFF242424) else Color(0xFF2C2C2C)
            this
                .clip(shape)
                .drawWithCache {
                    val strokePx = 1.dp.toPx()
                    val bevelColor = Color.White.copy(alpha = 0.06f)
                    onDrawBehind {
                        drawRect(bg)
                        drawLine(
                            color = bevelColor,
                            start = Offset(0f, strokePx * 0.5f),
                            end = Offset(size.width, strokePx * 0.5f),
                            strokeWidth = strokePx
                        )
                    }
                }
                .border(1.dp, borderColor, shape)
        }
        UiTheme.CARBON_FORGE -> {
            val baseBg = tint.copy(alpha = if (subtle) 0.92f else 0.97f)
            this
                .clip(shape)
                .drawWithCache {
                    val step = 6.dp.toPx()
                    val strokePx = 1.dp.toPx()
                    val highlight = Color.White.copy(alpha = 0.036f)
                    val shadow = Color.Black.copy(alpha = 0.26f)
                    val rimColor = Color.White.copy(alpha = 0.08f)
                    val highlightPath = Path()
                    val shadowPath = Path()
                    var x = -size.height
                    while (x < size.width + size.height) {
                        highlightPath.moveTo(x, 0f)
                        highlightPath.lineTo(x + size.height, size.height)
                        shadowPath.moveTo(x + step * 0.5f, size.height)
                        shadowPath.lineTo(x + step * 0.5f + size.height, 0f)
                        x += step
                    }
                    val weaveStroke = Stroke(width = strokePx)
                    onDrawBehind {
                        drawRect(baseBg)
                        drawPath(highlightPath, color = highlight, style = weaveStroke)
                        drawPath(shadowPath, color = shadow, style = weaveStroke)
                        drawLine(
                            color = rimColor,
                            start = Offset(0f, strokePx * 0.5f),
                            end = Offset(size.width, strokePx * 0.5f),
                            strokeWidth = strokePx
                        )
                    }
                }
                .border(1.dp, borderColor, shape)
        }
        UiTheme.MIDNIGHT_FROSTED -> {
            val topAlpha = if (noBlur) 0.07f else if (subtle) 0.11f else 0.16f
            val botAlpha = if (noBlur) 0.86f else if (subtle) 0.56f else 0.68f
            val rimAlpha = if (subtle) 0.16f else 0.25f
            this
                .clip(shape)
                .drawWithCache {
                    val strokePx = 1.dp.toPx()
                    val brush = Brush.linearGradient(
                        colors = listOf(
                            Color.White.copy(alpha = topAlpha),
                            tint.copy(alpha = botAlpha)
                        ),
                        start = Offset.Zero,
                        end = Offset(size.width.coerceAtLeast(300f), size.height.coerceAtLeast(300f))
                    )
                    val rim = Color.White.copy(alpha = rimAlpha)
                    onDrawBehind {
                        drawRect(brush)
                        drawLine(
                            color = rim,
                            start = Offset(0f, strokePx * 0.5f),
                            end = Offset(size.width, strokePx * 0.5f),
                            strokeWidth = strokePx
                        )
                    }
                }
                .border(1.dp, borderColor, shape)
        }
        UiTheme.AEROGLASS -> {
            val baseAlpha = if (noBlur) 0.84f else if (subtle) 0.52f else 0.64f
            val topSheen = if (subtle) 0.18f else 0.27f
            this
                .clip(shape)
                .drawWithCache {
                    val strokePx = 1.dp.toPx()
                    val sheen = Brush.verticalGradient(
                        0.0f to Color.White.copy(alpha = topSheen),
                        0.455f to Color.White.copy(alpha = 0.07f),
                        0.475f to Color(0xFF0EA5E9).copy(alpha = 0.03f),
                        1.0f to Color(0xFF38BDF8).copy(alpha = 0.13f)
                    )
                    val base = tint.copy(alpha = baseAlpha)
                    val topRim = Color.White.copy(alpha = 0.36f)
                    onDrawBehind {
                        drawRect(base)
                        drawRect(sheen)
                        drawLine(
                            color = topRim,
                            start = Offset(0f, strokePx * 0.5f),
                            end = Offset(size.width, strokePx * 0.5f),
                            strokeWidth = strokePx
                        )
                    }
                }
                .border(1.dp, borderColor, shape)
        }
        UiTheme.OBSIDIAN -> {
            val alpha = if (noBlur) 0.94f else if (subtle) 0.74f else 0.86f
            this
                .clip(shape)
                .drawWithCache {
                    val strokePx = 1.dp.toPx()
                    val brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = if (subtle) 0.035f else 0.06f),
                            tint.copy(alpha = alpha)
                        )
                    )
                    val rim = Color.White.copy(alpha = if (subtle) 0.07f else 0.11f)
                    onDrawBehind {
                        drawRect(tint.copy(alpha = alpha))
                        drawRect(brush)
                        drawLine(
                            color = rim,
                            start = Offset(0f, strokePx * 0.5f),
                            end = Offset(size.width, strokePx * 0.5f),
                            strokeWidth = strokePx
                        )
                    }
                }
                .border(1.dp, borderColor, shape)
        }
    }
}

fun Modifier.ironGlassBar(
    tokens: IronPulseThemeTokens,
    shapeRadius: Dp = 0.dp,
    topHairlineColor: Color? = null,
    bottomHairlineColor: Color? = null
): Modifier {
    val shape = RoundedCornerShape(shapeRadius)
    val tint = tokens.effectiveTintColor
    val noBlur = tokens.performance.noBlur

    return this
        .clip(shape)
        .drawWithCache {
            val strokePx = 1.dp.toPx()
            val brush = when (tokens.uiTheme) {
                UiTheme.MATERIAL_YOU -> null
                UiTheme.UBUNTU_YARU -> null
                UiTheme.CARBON_FORGE -> null
                UiTheme.MIDNIGHT_FROSTED -> Brush.verticalGradient(
                    colors = listOf(
                        tint.copy(alpha = if (noBlur) 0.96f else 0.86f),
                        tint.copy(alpha = if (noBlur) 0.92f else 0.76f)
                    )
                )
                UiTheme.AEROGLASS -> Brush.verticalGradient(
                    0.0f to Color.White.copy(alpha = 0.16f),
                    0.48f to Color.White.copy(alpha = 0.04f),
                    1.0f to Color(0xFF0EA5E9).copy(alpha = 0.10f)
                )
                UiTheme.OBSIDIAN -> null
            }
            val solidBg = when (tokens.uiTheme) {
                UiTheme.MATERIAL_YOU -> tokens.palette.surfaceContainerLow.copy(alpha = if (noBlur) 1f else 0.94f)
                UiTheme.UBUNTU_YARU -> Color(0xFF262626)
                UiTheme.CARBON_FORGE -> tint.copy(alpha = 0.97f)
                UiTheme.AEROGLASS -> tint.copy(alpha = if (noBlur) 0.94f else 0.78f)
                UiTheme.OBSIDIAN -> tint.copy(alpha = if (noBlur) 0.97f else 0.91f)
                UiTheme.MIDNIGHT_FROSTED -> Color.Transparent
            }
            onDrawBehind {
                if (solidBg != Color.Transparent) {
                    drawRect(solidBg)
                }
                if (brush != null) {
                    drawRect(brush)
                }
                if (topHairlineColor != null) {
                    drawLine(
                        color = topHairlineColor,
                        start = Offset(0f, strokePx * 0.5f),
                        end = Offset(size.width, strokePx * 0.5f),
                        strokeWidth = strokePx
                    )
                }
                if (bottomHairlineColor != null) {
                    drawLine(
                        color = bottomHairlineColor,
                        start = Offset(0f, size.height - strokePx * 0.5f),
                        end = Offset(size.width, size.height - strokePx * 0.5f),
                        strokeWidth = strokePx
                    )
                }
            }
        }
}

private val IronPulseTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 32.sp,
        lineHeight = 36.sp,
        fontFeatureSettings = "tnum"
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 19.sp,
        lineHeight = 25.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontFeatureSettings = "tnum"
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        fontFeatureSettings = "tnum"
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        fontFeatureSettings = "tnum"
    )
)

@Composable
fun IronPulseTheme(
    prefs: AppPreferences = AppPreferences(),
    timePhase: DayTimePhase = DayTimePhase.MORNING,
    content: @Composable () -> Unit
) {
    val uiTheme = prefs.uiTheme
    val effectiveAccentHex = if (uiTheme == UiTheme.UBUNTU_YARU &&
        prefs.accentColorHex.equals(MaterialYouColorEngine.DEFAULT_ACCENT_COLOR, ignoreCase = true)
    ) {
        MaterialYouColorEngine.YARU_ORANGE_ACCENT
    } else {
        prefs.accentColorHex
    }

    val effectiveTintHex = prefs.materialTintColorHex
        ?: MaterialYouColorEngine.defaultTintForTheme(uiTheme)

    val palette = remember(effectiveAccentHex, prefs.materialTintColorHex, uiTheme) {
        MaterialYouColorEngine.generateMaterialYouPalette(
            seedHex = effectiveAccentHex,
            surfaceTintOverrideHex = prefs.materialTintColorHex
        )
    }

    val phaseTokens = remember(timePhase) { resolvePhaseThemeTokens(timePhase) }

    val tokens = remember(uiTheme, palette, effectiveTintHex, timePhase, phaseTokens, prefs) {
        val canvasBg = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.surface
            UiTheme.UBUNTU_YARU -> Color(0xFF1E1E1E)
            UiTheme.CARBON_FORGE -> Color(0xFF07080A)
            UiTheme.MIDNIGHT_FROSTED -> Color(0xFF05070C)
            UiTheme.AEROGLASS -> Color(0xFF06101B)
            UiTheme.OBSIDIAN -> Color(0xFF0A0B0E)
        }
        val borderColor = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.outlineVariant
            UiTheme.AEROGLASS -> Color(0x5EB8E6FE)
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.22f)
            UiTheme.CARBON_FORGE -> Color.White.copy(alpha = 0.14f)
            UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.11f)
            UiTheme.OBSIDIAN -> Color.White.copy(alpha = 0.12f)
        }
        val subtleBorder = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.outlineVariant.copy(alpha = 0.7f)
            UiTheme.AEROGLASS -> Color(0x45BAE6FD)
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.15f)
            else -> Color.White.copy(alpha = 0.10f)
        }
        val cardRadius = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> 24.dp
            UiTheme.MIDNIGHT_FROSTED -> 22.dp
            UiTheme.CARBON_FORGE -> 10.dp
            UiTheme.UBUNTU_YARU -> 12.dp
            UiTheme.AEROGLASS -> 16.dp
            UiTheme.OBSIDIAN -> 16.dp
        }
        val buttonRadius = when (uiTheme) {
            UiTheme.MATERIAL_YOU, UiTheme.MIDNIGHT_FROSTED -> 999.dp
            UiTheme.CARBON_FORGE -> 8.dp
            UiTheme.UBUNTU_YARU -> 10.dp
            UiTheme.AEROGLASS -> 12.dp
            UiTheme.OBSIDIAN -> 12.dp
        }
        val inputRadius = when (uiTheme) {
            UiTheme.CARBON_FORGE -> 8.dp
            UiTheme.UBUNTU_YARU -> 10.dp
            else -> 12.dp
        }
        val wellBg = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.surfaceContainerLowest
            UiTheme.UBUNTU_YARU -> Color(0xFF242424)
            UiTheme.CARBON_FORGE -> Color(0xFF090B0E)
            UiTheme.MIDNIGHT_FROSTED -> Color(0x88080D18)
            UiTheme.AEROGLASS -> Color(0x780B1C2E)
            UiTheme.OBSIDIAN -> Color(0xFF0C0E13)
        }
        val controlBg = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.surfaceContainerHigh
            UiTheme.UBUNTU_YARU -> Color(0xFF353535)
            UiTheme.CARBON_FORGE -> Color(0xFF161A22)
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.09f)
            UiTheme.AEROGLASS -> Color(0x2E38BDF8)
            UiTheme.OBSIDIAN -> Color(0xFF171B24)
        }
        val subtleChipBg = when (uiTheme) {
            UiTheme.MATERIAL_YOU -> palette.surfaceContainerHigh.copy(alpha = 0.75f)
            UiTheme.UBUNTU_YARU -> Color(0xFF303030)
            UiTheme.CARBON_FORGE -> Color(0xFF131720)
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.07f)
            UiTheme.AEROGLASS -> Color(0x227DD3FC)
            UiTheme.OBSIDIAN -> Color(0xFF141821)
        }
        val mutedTextColor = when (uiTheme) {
            UiTheme.UBUNTU_YARU -> Color(0xFFB5B4B0)
            UiTheme.MIDNIGHT_FROSTED -> Color(0xFFB8C4DC)
            UiTheme.AEROGLASS -> Color(0xFFBAD2E8)
            else -> palette.onSurfaceVariant
        }
        val cardTopHighlight = when (uiTheme) {
            UiTheme.AEROGLASS -> Color.White.copy(alpha = 0.36f)
            UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.25f)
            UiTheme.OBSIDIAN -> Color.White.copy(alpha = 0.11f)
            UiTheme.CARBON_FORGE -> Color.White.copy(alpha = 0.08f)
            UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.06f)
            UiTheme.MATERIAL_YOU -> Color.White.copy(alpha = 0.06f)
        }
        IronPulseThemeTokens(
            uiTheme = uiTheme,
            palette = palette,
            accentColor = palette.primary,
            onAccentColor = palette.onPrimary,
            effectiveTintColor = MaterialYouColorEngine.parseColor(effectiveTintHex, Color(0xFF161A23)),
            canvasBg = canvasBg,
            wellBg = wellBg,
            controlBg = controlBg,
            subtleChipBg = subtleChipBg,
            mutedTextColor = mutedTextColor,
            cardTopHighlight = cardTopHighlight,
            surfaceBorderColor = borderColor,
            subtleBorderColor = subtleBorder,
            cardRadius = cardRadius,
            buttonRadius = buttonRadius,
            inputRadius = inputRadius,
            timePhase = timePhase,
            phaseTokens = phaseTokens,
            performance = prefs.performance,
            lang = prefs.lang,
            clockFormat = prefs.clockFormat
        )
    }

    val colorScheme = remember(tokens) {
        darkColorScheme(
            primary = tokens.palette.primary,
            onPrimary = tokens.palette.onPrimary,
            primaryContainer = tokens.palette.primaryContainer,
            onPrimaryContainer = tokens.palette.onPrimaryContainer,
            secondary = tokens.palette.secondary,
            onSecondary = tokens.palette.onSecondary,
            secondaryContainer = tokens.palette.secondaryContainer,
            onSecondaryContainer = tokens.palette.onSecondaryContainer,
            tertiary = tokens.palette.tertiary,
            onTertiary = tokens.palette.onTertiary,
            tertiaryContainer = tokens.palette.tertiaryContainer,
            onTertiaryContainer = tokens.palette.onTertiaryContainer,
            background = tokens.canvasBg,
            onBackground = tokens.palette.onSurface,
            surface = tokens.canvasBg,
            onSurface = tokens.palette.onSurface,
            surfaceVariant = tokens.palette.surfaceContainerHigh,
            onSurfaceVariant = tokens.palette.onSurfaceVariant,
            surfaceContainerLowest = tokens.palette.surfaceContainerLowest,
            surfaceContainerLow = tokens.palette.surfaceContainerLow,
            surfaceContainer = tokens.palette.surfaceContainer,
            surfaceContainerHigh = tokens.palette.surfaceContainerHigh,
            surfaceContainerHighest = tokens.palette.surfaceContainerHighest,
            outline = tokens.palette.outline,
            outlineVariant = tokens.palette.outlineVariant,
            error = Color(0xFFF87171),
            onError = Color(0xFF2F0808)
        )
    }

    CompositionLocalProvider(LocalIronPulseTokens provides tokens) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = IronPulseTypography,
            content = content
        )
    }
}
