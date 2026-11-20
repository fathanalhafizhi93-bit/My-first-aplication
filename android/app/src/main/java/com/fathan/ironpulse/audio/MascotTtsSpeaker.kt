package com.fathan.ironpulse.audio

import android.content.Context
import android.speech.tts.TextToSpeech
import com.fathan.ironpulse.model.AppLanguage
import java.util.Locale

class MascotTtsSpeaker(context: Context) {

    private var tts: TextToSpeech? = null
    @Volatile
    private var ready: Boolean = false

    init {
        runCatching {
            tts = TextToSpeech(context.applicationContext) { status ->
                ready = status == TextToSpeech.SUCCESS
            }
        }
    }

    fun speak(text: String, lang: AppLanguage, enabled: Boolean) {
        if (!enabled || !ready) return
        val engine = tts ?: return
        val cleaned = text.trim()
        if (cleaned.isEmpty()) return

        runCatching {
            val targetLocale = if (lang == AppLanguage.EN) Locale.US else Locale.forLanguageTag("id-ID")
            val res = engine.setLanguage(targetLocale)
            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                engine.language = Locale.US
            }
            engine.setPitch(1.08f)
            engine.setSpeechRate(1.02f)
            engine.speak(cleaned, TextToSpeech.QUEUE_FLUSH, null, "ironpulse_mascot_line")
        }
    }

    fun stop() {
        runCatching { tts?.stop() }
    }

    fun shutdown() {
        runCatching {
            tts?.stop()
            tts?.shutdown()
        }
        tts = null
        ready = false
    }
}
