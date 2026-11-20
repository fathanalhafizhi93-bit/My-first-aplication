package com.fathan.ironpulse.data

import android.content.Context
import androidx.compose.runtime.Immutable
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.DayTimeMode
import com.fathan.ironpulse.model.PerformancePreferences
import com.fathan.ironpulse.model.PerformancePresetId
import com.fathan.ironpulse.model.UiTheme
import com.fathan.ironpulse.ui.theme.MaterialYouColorEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

@Immutable
data class AppPreferences(
    val lang: AppLanguage = AppLanguage.ID,
    val clockFormat: ClockFormat = ClockFormat.H24,
    val todayThemeMode: DayTimeMode = DayTimeMode.AUTO,
    val uiTheme: UiTheme = UiTheme.MATERIAL_YOU,
    val accentColorHex: String = MaterialYouColorEngine.DEFAULT_ACCENT_COLOR,
    val materialTintColorHex: String? = null,
    val hapticsEnabled: Boolean = true,
    val mascotVoiceEnabled: Boolean = true,
    val performance: PerformancePreferences = PerformancePreferences(),
    val floatingOrbSideRight: Boolean = true,
    val floatingOrbYRatio: Float = 0.72f
)

class PreferencesStore(context: Context) {

    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _state = MutableStateFlow(readAll())
    val state: StateFlow<AppPreferences> = _state.asStateFlow()

    private fun readAll(): AppPreferences {
        return AppPreferences(
            lang = AppLanguage.fromWire(prefs.getString(KEY_LANG, "id")),
            clockFormat = ClockFormat.fromWire(prefs.getString(KEY_CLOCK_FORMAT, "24h")),
            todayThemeMode = DayTimeMode.fromWire(prefs.getString(KEY_TODAY_THEME_MODE, "auto")),
            uiTheme = UiTheme.fromWire(prefs.getString(KEY_UI_THEME, "material-you")),
            accentColorHex = MaterialYouColorEngine.normalizeHexColor(
                prefs.getString(KEY_ACCENT_COLOR, MaterialYouColorEngine.DEFAULT_ACCENT_COLOR)
            ),
            materialTintColorHex = prefs.getString(KEY_MATERIAL_TINT, null)?.let {
                if (Regex("^#[0-9A-Fa-f]{6}$").matches(it)) it.uppercase() else null
            },
            hapticsEnabled = prefs.getBoolean(KEY_HAPTICS, true),
            mascotVoiceEnabled = prefs.getBoolean(KEY_MASCOT_VOICE, true),
            performance = PerformancePreferences(
                noBlur = prefs.getBoolean(KEY_PERF_NO_BLUR, false),
                noAnimations = prefs.getBoolean(KEY_PERF_NO_ANIM, false),
                noAmbientGlow = prefs.getBoolean(KEY_PERF_NO_GLOW, false),
                staticMascot = prefs.getBoolean(KEY_PERF_STATIC_MASCOT, false)
            ),
            floatingOrbSideRight = prefs.getBoolean(KEY_ORB_SIDE_RIGHT, true),
            floatingOrbYRatio = prefs.getFloat(KEY_ORB_Y_RATIO, 0.72f).coerceIn(0.15f, 0.85f)
        )
    }

    fun setLang(lang: AppLanguage) {
        prefs.edit().putString(KEY_LANG, lang.wireValue).apply()
        _state.value = _state.value.copy(lang = lang)
    }

    fun setClockFormat(format: ClockFormat) {
        prefs.edit().putString(KEY_CLOCK_FORMAT, format.wireValue).apply()
        _state.value = _state.value.copy(clockFormat = format)
    }

    fun setTodayThemeMode(mode: DayTimeMode) {
        prefs.edit().putString(KEY_TODAY_THEME_MODE, mode.wireValue).apply()
        _state.value = _state.value.copy(todayThemeMode = mode)
    }

    fun setAccentColor(hex: String) {
        val normalized = MaterialYouColorEngine.normalizeHexColor(hex)
        prefs.edit().putString(KEY_ACCENT_COLOR, normalized).apply()
        _state.value = _state.value.copy(accentColorHex = normalized)
    }

    fun setMaterialTintColor(hex: String?) {
        if (hex == null) {
            prefs.edit().remove(KEY_MATERIAL_TINT).apply()
            _state.value = _state.value.copy(materialTintColorHex = null)
        } else {
            val normalized = MaterialYouColorEngine.normalizeHexColor(
                hex,
                MaterialYouColorEngine.defaultTintForTheme(UiTheme.OBSIDIAN)
            )
            prefs.edit().putString(KEY_MATERIAL_TINT, normalized).apply()
            _state.value = _state.value.copy(materialTintColorHex = normalized)
        }
    }

    fun setUiTheme(next: UiTheme) {
        val current = _state.value
        if (next == current.uiTheme) return

        var nextAccent = current.accentColorHex
        var nextTint = current.materialTintColorHex

        if (next == UiTheme.UBUNTU_YARU && current.uiTheme != UiTheme.UBUNTU_YARU) {
            prefs.edit()
                .putString(KEY_PRE_YARU_ACCENT, current.accentColorHex)
                .putString(KEY_PRE_YARU_TINT, current.materialTintColorHex ?: "__AUTO__")
                .apply()
            nextAccent = MaterialYouColorEngine.YARU_ORANGE_ACCENT
            nextTint = null
        } else if (current.uiTheme == UiTheme.UBUNTU_YARU && next != UiTheme.UBUNTU_YARU) {
            val savedAccent = prefs.getString(KEY_PRE_YARU_ACCENT, null)
            val savedTint = prefs.getString(KEY_PRE_YARU_TINT, null)
            prefs.edit()
                .remove(KEY_PRE_YARU_ACCENT)
                .remove(KEY_PRE_YARU_TINT)
                .apply()

            if (current.accentColorHex.equals(MaterialYouColorEngine.YARU_ORANGE_ACCENT, ignoreCase = true)) {
                nextAccent = MaterialYouColorEngine.normalizeHexColor(
                    savedAccent,
                    MaterialYouColorEngine.DEFAULT_ACCENT_COLOR
                )
            }
            if (current.materialTintColorHex == null && savedTint != null) {
                nextTint = if (savedTint == "__AUTO__") {
                    null
                } else {
                    MaterialYouColorEngine.normalizeHexColor(
                        savedTint,
                        MaterialYouColorEngine.defaultTintForTheme(next)
                    )
                }
            }
        }

        prefs.edit()
            .putString(KEY_UI_THEME, next.wireValue)
            .putString(KEY_ACCENT_COLOR, nextAccent)
            .apply {
                if (nextTint == null) remove(KEY_MATERIAL_TINT) else putString(KEY_MATERIAL_TINT, nextTint)
            }
            .apply()

        _state.value = current.copy(
            uiTheme = next,
            accentColorHex = nextAccent,
            materialTintColorHex = nextTint
        )
    }

    fun resetThemeCustomization() {
        val current = _state.value
        val nextAccent = if (current.uiTheme == UiTheme.UBUNTU_YARU) {
            MaterialYouColorEngine.YARU_ORANGE_ACCENT
        } else {
            MaterialYouColorEngine.DEFAULT_ACCENT_COLOR
        }
        prefs.edit()
            .remove(KEY_PRE_YARU_ACCENT)
            .remove(KEY_PRE_YARU_TINT)
            .remove(KEY_MATERIAL_TINT)
            .putString(KEY_ACCENT_COLOR, nextAccent)
            .apply()
        _state.value = current.copy(
            accentColorHex = nextAccent,
            materialTintColorHex = null
        )
    }

    fun setHapticsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_HAPTICS, enabled).apply()
        _state.value = _state.value.copy(hapticsEnabled = enabled)
    }

    fun setMascotVoiceEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_MASCOT_VOICE, enabled).apply()
        _state.value = _state.value.copy(mascotVoiceEnabled = enabled)
    }

    fun setPerformance(
        noBlur: Boolean? = null,
        noAnimations: Boolean? = null,
        noAmbientGlow: Boolean? = null,
        staticMascot: Boolean? = null
    ) {
        val prev = _state.value.performance
        val next = prev.copy(
            noBlur = noBlur ?: prev.noBlur,
            noAnimations = noAnimations ?: prev.noAnimations,
            noAmbientGlow = noAmbientGlow ?: prev.noAmbientGlow,
            staticMascot = staticMascot ?: prev.staticMascot
        )
        savePerformance(next)
    }

    fun applyPerformancePreset(preset: PerformancePresetId) {
        val next = when (preset) {
            PerformancePresetId.ULTRA -> PerformancePreferences(
                noBlur = true,
                noAnimations = true,
                noAmbientGlow = true,
                staticMascot = true
            )
            PerformancePresetId.BATTERY -> PerformancePreferences(
                noBlur = true,
                noAnimations = false,
                noAmbientGlow = true,
                staticMascot = false
            )
            PerformancePresetId.BALANCED -> PerformancePreferences()
        }
        savePerformance(next)
    }

    private fun savePerformance(next: PerformancePreferences) {
        prefs.edit()
            .putBoolean(KEY_PERF_NO_BLUR, next.noBlur)
            .putBoolean(KEY_PERF_NO_ANIM, next.noAnimations)
            .putBoolean(KEY_PERF_NO_GLOW, next.noAmbientGlow)
            .putBoolean(KEY_PERF_STATIC_MASCOT, next.staticMascot)
            .apply()
        _state.value = _state.value.copy(performance = next)
    }

    fun setFloatingOrbAnchor(sideRight: Boolean, yRatio: Float) {
        val clamped = yRatio.coerceIn(0.15f, 0.85f)
        prefs.edit()
            .putBoolean(KEY_ORB_SIDE_RIGHT, sideRight)
            .putFloat(KEY_ORB_Y_RATIO, clamped)
            .apply()
        _state.value = _state.value.copy(
            floatingOrbSideRight = sideRight,
            floatingOrbYRatio = clamped
        )
    }

    fun isNameConfirmed(uid: String): Boolean =
        prefs.getBoolean("name_confirmed_$uid", false)

    fun setNameConfirmed(uid: String, confirmed: Boolean) {
        prefs.edit().putBoolean("name_confirmed_$uid", confirmed).apply()
    }

    fun isTutorialSeen(uid: String): Boolean =
        prefs.getBoolean("tutorial_seen_$uid", false)

    fun setTutorialSeen(uid: String, seen: Boolean) {
        prefs.edit().putBoolean("tutorial_seen_$uid", seen).apply()
    }

    companion object {
        private const val PREFS_NAME = "ironpulse_ui_prefs_v1"
        private const val KEY_LANG = "lang"
        private const val KEY_CLOCK_FORMAT = "clock_format"
        private const val KEY_TODAY_THEME_MODE = "today_theme_mode"
        private const val KEY_UI_THEME = "ui_theme"
        private const val KEY_ACCENT_COLOR = "accent_color"
        private const val KEY_MATERIAL_TINT = "material_tint"
        private const val KEY_PRE_YARU_ACCENT = "pre_yaru_accent"
        private const val KEY_PRE_YARU_TINT = "pre_yaru_tint"
        private const val KEY_HAPTICS = "haptics_enabled"
        private const val KEY_MASCOT_VOICE = "mascot_voice_enabled"
        private const val KEY_PERF_NO_BLUR = "perf_no_blur"
        private const val KEY_PERF_NO_ANIM = "perf_no_anim"
        private const val KEY_PERF_NO_GLOW = "perf_no_glow"
        private const val KEY_PERF_STATIC_MASCOT = "perf_static_mascot"
        private const val KEY_ORB_SIDE_RIGHT = "floating_orb_side_right"
        private const val KEY_ORB_Y_RATIO = "floating_orb_y_ratio"
    }
}
