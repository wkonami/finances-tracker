package com.wkonami.financestracker.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.pixDataStore by preferencesDataStore(
    name = "pix_settings"
)

class PixConfigStorage(context: Context) {

    private val dataStore: DataStore<Preferences> =
        context.applicationContext.pixDataStore

    private object Keys {
        val PIX_KEY = stringPreferencesKey("pix_key")
        val MERCHANT_NAME = stringPreferencesKey("merchant_name")
        val MERCHANT_CITY = stringPreferencesKey("merchant_city")
    }

    val config: Flow<PixConfig> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(
                    androidx.datastore.preferences.core.emptyPreferences()
                )
            } else {
                throw exception
            }
        }
        .map { preferences ->
            PixConfig(
                pixKey = preferences[Keys.PIX_KEY] ?: "",
                merchantName = preferences[Keys.MERCHANT_NAME] ?: "",
                merchantCity = preferences[Keys.MERCHANT_CITY] ?: ""
            )
        }

    suspend fun save(config: PixConfig) {
        dataStore.edit { preferences ->
            preferences[Keys.PIX_KEY] = config.pixKey.trim()
            preferences[Keys.MERCHANT_NAME] = config.merchantName.trim()
            preferences[Keys.MERCHANT_CITY] = config.merchantCity.trim()
        }
    }

    suspend fun clear() {
        dataStore.edit { preferences ->
            preferences.remove(Keys.PIX_KEY)
            preferences.remove(Keys.MERCHANT_NAME)
            preferences.remove(Keys.MERCHANT_CITY)
        }
    }
}