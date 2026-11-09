package com.wkonami.financestracker.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class SyncStatus {
    PENDING,
    SYNCED,
    ERROR
}

@Entity(
    tableName = "sales",
    indices = [
        Index(value = ["externalId"], unique = true),
        Index(value = ["syncStatus"])
    ]
)
data class SaleEntity(

    @PrimaryKey(autoGenerate = true)
    val localId: Long = 0,

    val externalId: String,

    val debtorName: String,

    // Valor armazenado em centavos para evitar erros de ponto flutuante.
    val amountInCents: Long,

    val note: String? = null,

    // Data e hora em milissegundos desde 01/01/1970.
    val createdAt: Long,

    val syncStatus: SyncStatus = SyncStatus.PENDING,

    val syncError: String? = null,

    val syncedAt: Long? = null
)