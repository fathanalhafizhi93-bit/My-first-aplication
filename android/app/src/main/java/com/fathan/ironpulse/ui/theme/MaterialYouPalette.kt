package com.fathan.ironpulse.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import com.fathan.ironpulse.model.UiTheme
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

@Immutable
data class MaterialYouPalette(
    val seed: String,
    val primaryHex: String,
    val onPrimaryHex: String,
    val primaryContainerHex: String,
    val onPrimaryContainerHex: String,
    val secondaryHex: String,
    val onSecondaryHex: String,
    val secondaryContainerHex: String,
    val onSecondaryContainerHex: String,
    val tertiaryHex: String,
    val onTertiaryHex: String,
    val tertiaryContainerHex: String,
    val onTertiaryContainerHex: String,
    val surfaceHex: String,
    val surfaceContainerLowestHex: String,
    val surfaceContainerLowHex: String,
    val surfaceContainerHex: String,
    val surfaceContainerHighHex: String,
    val surfaceContainerHighestHex: String,
    val onSurfaceHex: String,
    val onSurfaceVariantHex: String,
    val outlineHex: String,
    val outlineVariantHex: String,
    // Compose Colors
    val primary: Color,
    val onPrimary: Color,
    val primaryContainer: Color,
    val onPrimaryContainer: Color,
    val secondary: Color,
    val onSecondary: Color,
    val secondaryContainer: Color,
    val onSecondaryContainer: Color,
    val tertiary: Color,
    val onTertiary: Color,
    val tertiaryContainer: Color,
    val onTertiaryContainer: Color,
    val surface: Color,
    val surfaceContainerLowest: Color,
    val surfaceContainerLow: Color,
    val surfaceContainer: Color,
    val surfaceContainerHigh: Color,
    val surfaceContainerHighest: Color,
    val onSurface: Color,
    val onSurfaceVariant: Color,
    val outline: Color,
    val outlineVariant: Color
)

object MaterialYouColorEngine {

    const val DEFAULT_ACCENT_COLOR = "#C8FF2E"
    const val YARU_ORANGE_ACCENT = "#E95420"

    fun defaultTintForTheme(theme: UiTheme): String = when (theme) {
        UiTheme.OBSIDIAN -> "#161A23"
        UiTheme.MIDNIGHT_FROSTED -> "#162238"
        UiTheme.CARBON_FORGE -> "#12151B"
        UiTheme.MATERIAL_YOU -> "#1C1B22"
        UiTheme.AEROGLASS -> "#1B334B"
        UiTheme.UBUNTU_YARU -> "#2C2C2C"
    }

    fun normalizeHexColor(hex: String?, fallback: String = DEFAULT_ACCENT_COLOR): String {
        val cleaned = (hex ?: "").trim()
        return if (Regex("^#[0-9A-Fa-f]{6}$").matches(cleaned)) {
            cleaned.uppercase()
        } else {
            fallback.uppercase()
        }
    }

    fun parseColor(hex: String, fallback: Color = Color(0xFFC8FF2E)): Color {
        val valid = normalizeHexColor(hex, "")
        if (valid.isEmpty()) return fallback
        return Color(
            red = valid.substring(1, 3).toInt(16),
            green = valid.substring(3, 5).toInt(16),
            blue = valid.substring(5, 7).toInt(16)
        )
    }

    private fun hexToRgb(hex: String): Triple<Int, Int, Int> {
        val valid = normalizeHexColor(hex)
        return Triple(
            valid.substring(1, 3).toInt(16),
            valid.substring(3, 5).toInt(16),
            valid.substring(5, 7).toInt(16)
        )
    }

    private fun rgbToHex(r: Double, g: Double, b: Double): String {
        val ri = r.roundToInt().coerceIn(0, 255)
        val gi = g.roundToInt().coerceIn(0, 255)
        val bi = b.roundToInt().coerceIn(0, 255)
        return String.format("#%02X%02X%02X", ri, gi, bi)
    }

    private fun rgbToHsl(r: Int, g: Int, b: Int): Triple<Double, Double, Double> {
        val rn = r / 255.0
        val gn = g / 255.0
        val bn = b / 255.0
        val maxC = max(rn, max(gn, bn))
        val minC = min(rn, min(gn, bn))
        val delta = maxC - minC

        var h = 0.0
        var s = 0.0
        val l = (maxC + minC) / 2.0

        if (delta != 0.0) {
            s = delta / (1.0 - abs(2.0 * l - 1.0))
            h = when (maxC) {
                rn -> 60.0 * (((gn - bn) / delta) % 6.0)
                gn -> 60.0 * ((bn - rn) / delta + 2.0)
                else -> 60.0 * ((rn - gn) / delta + 4.0)
            }
        }
        if (h < 0.0) h += 360.0
        return Triple(h, s * 100.0, l * 100.0)
    }

    private fun hslToHex(h: Double, s: Double, l: Double): String {
        val hue = ((h % 360.0) + 360.0) % 360.0
        val sat = s.coerceIn(0.0, 100.0) / 100.0
        val lig = l.coerceIn(0.0, 100.0) / 100.0

        val c = (1.0 - abs(2.0 * lig - 1.0)) * sat
        val x = c * (1.0 - abs(((hue / 60.0) % 2.0) - 1.0))
        val m = lig - c / 2.0

        val (r, g, b) = when {
            hue < 60.0 -> Triple(c, x, 0.0)
            hue < 120.0 -> Triple(x, c, 0.0)
            hue < 180.0 -> Triple(0.0, c, x)
            hue < 240.0 -> Triple(0.0, x, c)
            hue < 300.0 -> Triple(x, 0.0, c)
            else -> Triple(c, 0.0, x)
        }
        return rgbToHex((r + m) * 255.0, (g + m) * 255.0, (b + m) * 255.0)
    }

    private fun relativeLuminance(hex: String): Double {
        val (r, g, b) = hexToRgb(hex)
        fun toLinear(channel: Int): Double {
            val s = channel / 255.0
            return if (s <= 0.03928) s / 12.92 else ((s + 0.055) / 1.055).pow(2.4)
        }
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }

    private fun contrastRatio(hexA: String, hexB: String): Double {
        val lumA = relativeLuminance(hexA)
        val lumB = relativeLuminance(hexB)
        val lighter = max(lumA, lumB)
        val darker = min(lumA, lumB)
        return (lighter + 0.05) / (darker + 0.05)
    }

    private fun computeTonalOnColor(bgHex: String, hue: Double, seedSat: Double): String {
        val darkCandidate = hslToHex(hue, (seedSat * 0.35).coerceIn(6.0, 32.0), 8.5)
        val lightCandidate = hslToHex(hue, (seedSat * 0.25).coerceIn(6.0, 26.0), 96.0)
        val darkRatio = contrastRatio(bgHex, darkCandidate)
        val lightRatio = contrastRatio(bgHex, lightCandidate)
        return if (darkRatio >= lightRatio) {
            if (darkRatio >= 4.5) darkCandidate else "#08090C"
        } else {
            if (lightRatio >= 4.5) lightCandidate else "#FFFFFF"
        }
    }

    fun generateMaterialYouPalette(
        seedHex: String,
        surfaceTintOverrideHex: String? = null
    ): MaterialYouPalette {
        val seed = normalizeHexColor(seedHex, DEFAULT_ACCENT_COLOR)
        val (r, g, b) = hexToRgb(seed)
        val (seedH, seedS, _) = rgbToHsl(r, g, b)

        var surfaceH = seedH
        var surfaceSatBoost = seedS
        if (!surfaceTintOverrideHex.isNullOrBlank() && Regex("^#[0-9A-Fa-f]{6}$").matches(surfaceTintOverrideHex)) {
            val (or, og, ob) = hexToRgb(surfaceTintOverrideHex)
            val (oh, os, _) = rgbToHsl(or, og, ob)
            if (os >= 6.0) {
                surfaceH = oh
                surfaceSatBoost = max(os, 18.0)
            }
        }

        val isNeutralSeed = seedS < 8.0
        val primaryHex = seed
        val onPrimaryHex = computeTonalOnColor(primaryHex, seedH, seedS)

        val primaryContainerHex = hslToHex(
            seedH,
            if (isNeutralSeed) 6.0 else (seedS * 0.52).coerceIn(22.0, 54.0),
            22.0
        )
        val onPrimaryContainerHex = hslToHex(
            seedH,
            if (isNeutralSeed) 8.0 else (seedS * 0.78).coerceIn(36.0, 90.0),
            90.0
        )

        val secondaryHex = hslToHex(
            seedH,
            if (isNeutralSeed) 6.0 else (seedS * 0.34).coerceIn(14.0, 34.0),
            78.0
        )
        val onSecondaryHex = computeTonalOnColor(secondaryHex, seedH, seedS * 0.4)
        val secondaryContainerHex = hslToHex(
            seedH,
            if (isNeutralSeed) 8.0 else (seedS * 0.34).coerceIn(16.0, 36.0),
            24.0
        )
        val onSecondaryContainerHex = hslToHex(
            seedH,
            if (isNeutralSeed) 10.0 else (seedS * 0.56).coerceIn(24.0, 74.0),
            91.0
        )

        val tertiaryH = (seedH + 55.0) % 360.0
        val tertiaryHex = hslToHex(
            tertiaryH,
            if (isNeutralSeed) 10.0 else (seedS * 0.56).coerceIn(26.0, 66.0),
            78.0
        )
        val onTertiaryHex = computeTonalOnColor(tertiaryHex, tertiaryH, seedS * 0.5)
        val tertiaryContainerHex = hslToHex(
            tertiaryH,
            if (isNeutralSeed) 10.0 else (seedS * 0.42).coerceIn(18.0, 42.0),
            23.0
        )
        val onTertiaryContainerHex = hslToHex(
            tertiaryH,
            if (isNeutralSeed) 10.0 else (seedS * 0.62).coerceIn(28.0, 78.0),
            90.0
        )

        val neutralSat = if (surfaceSatBoost < 8.0) 3.0 else (surfaceSatBoost * 0.14).coerceIn(7.0, 15.0)
        val surfaceHex = hslToHex(surfaceH, neutralSat, 6.8)
        val surfaceContainerLowestHex = hslToHex(surfaceH, neutralSat, 4.6)
        val surfaceContainerLowHex = hslToHex(surfaceH, (neutralSat + 1.0).coerceIn(3.0, 17.0), 9.6)
        val surfaceContainerHex = hslToHex(surfaceH, (neutralSat + 2.0).coerceIn(4.0, 18.0), 12.2)
        val surfaceContainerHighHex = hslToHex(surfaceH, (neutralSat + 3.0).coerceIn(4.0, 20.0), 15.6)
        val surfaceContainerHighestHex = hslToHex(surfaceH, (neutralSat + 4.0).coerceIn(5.0, 22.0), 19.6)

        val onSurfaceHex = hslToHex(surfaceH, (neutralSat * 0.9).coerceIn(2.0, 14.0), 93.5)
        val onSurfaceVariantHex = hslToHex(surfaceH, (neutralSat + 3.0).coerceIn(4.0, 18.0), 74.0)
        val outlineHex = hslToHex(surfaceH, (neutralSat + 5.0).coerceIn(5.0, 20.0), 47.0)
        val outlineVariantHex = hslToHex(surfaceH, (neutralSat + 4.0).coerceIn(5.0, 19.0), 25.0)

        return MaterialYouPalette(
            seed = seed,
            primaryHex = primaryHex,
            onPrimaryHex = onPrimaryHex,
            primaryContainerHex = primaryContainerHex,
            onPrimaryContainerHex = onPrimaryContainerHex,
            secondaryHex = secondaryHex,
            onSecondaryHex = onSecondaryHex,
            secondaryContainerHex = secondaryContainerHex,
            onSecondaryContainerHex = onSecondaryContainerHex,
            tertiaryHex = tertiaryHex,
            onTertiaryHex = onTertiaryHex,
            tertiaryContainerHex = tertiaryContainerHex,
            onTertiaryContainerHex = onTertiaryContainerHex,
            surfaceHex = surfaceHex,
            surfaceContainerLowestHex = surfaceContainerLowestHex,
            surfaceContainerLowHex = surfaceContainerLowHex,
            surfaceContainerHex = surfaceContainerHex,
            surfaceContainerHighHex = surfaceContainerHighHex,
            surfaceContainerHighestHex = surfaceContainerHighestHex,
            onSurfaceHex = onSurfaceHex,
            onSurfaceVariantHex = onSurfaceVariantHex,
            outlineHex = outlineHex,
            outlineVariantHex = outlineVariantHex,
            primary = parseColor(primaryHex),
            onPrimary = parseColor(onPrimaryHex),
            primaryContainer = parseColor(primaryContainerHex),
            onPrimaryContainer = parseColor(onPrimaryContainerHex),
            secondary = parseColor(secondaryHex),
            onSecondary = parseColor(onSecondaryHex),
            secondaryContainer = parseColor(secondaryContainerHex),
            onSecondaryContainer = parseColor(onSecondaryContainerHex),
            tertiary = parseColor(tertiaryHex),
            onTertiary = parseColor(onTertiaryHex),
            tertiaryContainer = parseColor(tertiaryContainerHex),
            onTertiaryContainer = parseColor(onTertiaryContainerHex),
            surface = parseColor(surfaceHex),
            surfaceContainerLowest = parseColor(surfaceContainerLowestHex),
            surfaceContainerLow = parseColor(surfaceContainerLowHex),
            surfaceContainer = parseColor(surfaceContainerHex),
            surfaceContainerHigh = parseColor(surfaceContainerHighHex),
            surfaceContainerHighest = parseColor(surfaceContainerHighestHex),
            onSurface = parseColor(onSurfaceHex),
            onSurfaceVariant = parseColor(onSurfaceVariantHex),
            outline = parseColor(outlineHex),
            outlineVariant = parseColor(outlineVariantHex)
        )
    }
}
