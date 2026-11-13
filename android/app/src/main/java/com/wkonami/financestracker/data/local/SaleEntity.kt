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

enum class PaymentMethod {
    UNKNOWN,
    CASH,
    PIX,
    CARD
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

    val amountInCents: Long,

    val note: String? = null,

    val eventId: Long? = null,

    val isPaid: Boolean = true,

    val paymentMethod: PaymentMethod? = null,

    val isDelivered: Boolean = true,

    val createdAt: Long,

    val syncStatus: SyncStatus = SyncStatus.PENDING,

    val syncError: String? = null,

    val syncedAt: Long? = null
)