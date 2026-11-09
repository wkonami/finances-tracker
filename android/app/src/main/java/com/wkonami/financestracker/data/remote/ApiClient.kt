
package com.wkonami.financestracker.data.remote

import com.google.gson.Gson
import com.wkonami.financestracker.data.remote.dto.LoginRequest
import com.wkonami.financestracker.data.remote.dto.LoginResponse
import com.wkonami.financestracker.data.remote.dto.SyncRequest
import com.wkonami.financestracker.data.remote.dto.SyncResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClient(
    private val baseUrl: String
) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .callTimeout(120, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val gson = Gson()

    private val jsonMediaType =
        "application/json; charset=utf-8".toMediaType()

    suspend fun login(
        username: String,
        password: String
    ): String = withContext(Dispatchers.IO) {

        val body = gson.toJson(
            LoginRequest(username, password)
        ).toRequestBody(jsonMediaType)

        val request = Request.Builder()
            .url("$baseUrl/auth/login")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->

            val responseBody = response.body?.string()
                ?: throw IOException("Resposta vazia do servidor")

            if (!response.isSuccessful) {
                throw IOException(
                    extractMessage(responseBody, "Falha na autenticação")
                )
            }

            val loginResponse = gson.fromJson(
                responseBody,
                LoginResponse::class.java
            )

            loginResponse.token
                .takeIf { it.isNotBlank() }
                ?: throw IOException("Token não recebido do servidor")
        }
    }

    suspend fun syncSales(
        token: String,
        syncRequest: SyncRequest
    ): SyncResponse = withContext(Dispatchers.IO) {

        val body = gson.toJson(syncRequest)
            .toRequestBody(jsonMediaType)

        val request = Request.Builder()
            .url("$baseUrl/debts/sync")
            .header("Authorization", "Bearer $token")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->

            val responseBody = response.body?.string()
                ?: throw IOException("Resposta vazia do servidor")

            if (!response.isSuccessful) {
                throw IOException(
                    extractMessage(responseBody, "Falha na sincronização")
                )
            }

            gson.fromJson(
                responseBody,
                SyncResponse::class.java
            )
        }
    }

    private fun extractMessage(
        body: String,
        fallback: String
    ): String {
        return try {
            gson.fromJson(body, Map::class.java)
                ?.get("message")
                ?.toString()
                ?: fallback
        } catch (_: Exception) {
            fallback
        }
    }
}
