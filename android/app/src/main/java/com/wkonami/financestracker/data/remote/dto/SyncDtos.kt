
package com.wkonami.financestracker.data.remote.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String
)

data class SyncRequest(
    val sales: List<SyncSaleRequest>
)

data class SyncSaleRequest(
    val externalId: String,
    val debtorName: String,
    val totalAmount: String,
    val notes: String?
)

data class SyncResponse(
    val message: String,
    val summary: SyncSummary,
    val results: List<SyncSaleResult>
)

data class SyncSummary(
    val total: Int,
    val created: Int,

    @SerializedName("alreadySynced")
    val alreadySynced: Int,

    val failed: Int
)

data class SyncSaleResult(
    val externalId: String?,
    val status: String,
    val saleId: Int?,
    val message: String?
)
