package com.wkonami.financestracker.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "events",
    indices = [
        Index(value = ["externalId"], unique = true),
        Index(value = ["syncStatus"])
    ]
)
data class EventEntity(

    @PrimaryKey(autoGenerate = true)
    val localId: Long = 0,

    // Identificador independente do banco local, utilizado na sincronização.
    val externalId: String = UUID.randomUUID().toString(),

    val name: String,

    val location: String? = null,

    // Milissegundos desde 01/01/1970. Podem ficar nulos.
    val startDate: Long? = null,

    val endDate: Long? = null,

    val createdAt: Long = System.currentTimeMillis(),

    val syncStatus: SyncStatus = SyncStatus.PENDING,

    val syncError: String? = null,

    val syncedAt: Long? = null
)