package com.wkonami.financestracker.data.local

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class SavedSyncCredentials(
    val username: String,
    val password: String
)

class SyncCredentialsStorage(context: Context) {

    private val preferences = context.applicationContext.getSharedPreferences(
        "sync_credentials",
        Context.MODE_PRIVATE
    )

    companion object {
        private const val KEY_ALIAS = "finances_tracker_sync_key"
        private const val KEY_USERNAME = "username"
        private const val KEY_PASSWORD = "encrypted_password"
        private const val KEY_IV = "password_iv"
        private const val KEY_REMEMBER = "remember_credentials"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }

    suspend fun load(): SavedSyncCredentials? = withContext(Dispatchers.IO) {
        try {
            if (!preferences.getBoolean(KEY_REMEMBER, false)) {
                return@withContext null
            }

            val username = preferences.getString(KEY_USERNAME, null)
                ?: return@withContext null

            val encryptedPassword = preferences.getString(KEY_PASSWORD, null)
                ?: return@withContext null

            val iv = preferences.getString(KEY_IV, null)
                ?: return@withContext null

            val password = decrypt(encryptedPassword, iv)

            SavedSyncCredentials(
                username = username,
                password = password
            )
        } catch (_: Exception) {
            clearInternal()
            null
        }
    }

    suspend fun save(username: String, password: String) {
        withContext(Dispatchers.IO) {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())

            val encryptedPassword = Base64.encodeToString(
                cipher.doFinal(password.toByteArray(Charsets.UTF_8)),
                Base64.NO_WRAP
            )

            val iv = Base64.encodeToString(
                cipher.iv,
                Base64.NO_WRAP
            )

            preferences.edit()
                .putString(KEY_USERNAME, username)
                .putString(KEY_PASSWORD, encryptedPassword)
                .putString(KEY_IV, iv)
                .putBoolean(KEY_REMEMBER, true)
                .apply()
        }
    }

    suspend fun clear() {
        withContext(Dispatchers.IO) {
            clearInternal()
        }
    }

    private fun decrypt(
        encryptedPassword: String,
        encodedIv: String
    ): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)

        val iv = Base64.decode(encodedIv, Base64.NO_WRAP)
        val encryptedBytes = Base64.decode(
            encryptedPassword,
            Base64.NO_WRAP
        )

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateKey(),
            GCMParameterSpec(128, iv)
        )

        return String(
            cipher.doFinal(encryptedBytes),
            Charsets.UTF_8
        )
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        val existingKey = keyStore.getKey(KEY_ALIAS, null) as? SecretKey

        if (existingKey != null) {
            return existingKey
        }

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        )

        val keySpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or
                KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build()

        keyGenerator.init(keySpec)

        return keyGenerator.generateKey()
    }

    private fun clearInternal() {
        preferences.edit()
            .remove(KEY_USERNAME)
            .remove(KEY_PASSWORD)
            .remove(KEY_IV)
            .remove(KEY_REMEMBER)
            .apply()
    }
}