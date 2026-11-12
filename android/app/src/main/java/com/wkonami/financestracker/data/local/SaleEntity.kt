package com.wkonami.financestracker.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class SyncStatus {
    PENDING,
    SYNCED,
    ERROR
}

@Entity(
    tableName = "sales",
    foreignKeys = [
        ForeignKey(
            entity = EventEntity::class,
            parentColumns = ["localId"],
            childColumns = ["eventId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [
        Index(value = ["externalId"], unique = true),
        Index(value = ["syncStatus"]),
        Index(value = ["eventId"])
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

    // Identificador local do evento. Nulo para vendas normais.
    val eventId: Long? = null,

    // Data e hora em milissegundos desde 01/01/1970.
    val createdAt: Long,

    val syncStatus: SyncStatus = SyncStatus.PENDING,

    val syncError: String? = null,

    val syncedAt: Long? = null
)