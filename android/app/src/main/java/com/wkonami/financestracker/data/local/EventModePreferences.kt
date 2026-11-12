package com.wkonami.financestracker.data.local

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.eventModeDataStore by preferencesDataStore(
    name = "event_mode_preferences"
)

data class EventModeState(
    val enabled: Boolean = false,
    val selectedEventId: Long? = null
)

class EventModePreferences(
    private val context: Context
) {

    private object PreferencesKeys {
        val EVENT_MODE_ENABLED = booleanPreferencesKey("event_mode_enabled")
        val SELECTED_EVENT_ID = longPreferencesKey("selected_event_id")
    }

    val state: Flow<EventModeState> =
        context.eventModeDataStore.data.map { preferences ->

            EventModeState(
                enabled = preferences[
                    PreferencesKeys.EVENT_MODE_ENABLED
                ] ?: false,

                selectedEventId = preferences[
                    PreferencesKeys.SELECTED_EVENT_ID
                ]
            )
        }

    suspend fun enableWithEvent(eventId: Long) {
        require(eventId > 0) {
            "Evento inválido."
        }

        context.eventModeDataStore.edit { preferences ->
            preferences[PreferencesKeys.SELECTED_EVENT_ID] = eventId
            preferences[PreferencesKeys.EVENT_MODE_ENABLED] = true
        }
    }

    suspend fun disable() {
        context.eventModeDataStore.edit { preferences ->
            preferences[PreferencesKeys.EVENT_MODE_ENABLED] = false
        }
    }

    suspend fun selectEvent(eventId: Long) {
        require(eventId > 0) {
            "Evento inválido."
        }

        context.eventModeDataStore.edit { preferences ->
            preferences[PreferencesKeys.SELECTED_EVENT_ID] = eventId
        }
    }
}