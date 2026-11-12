package com.wkonami.financestracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(event: EventEntity): Long

    @Query("""
        SELECT * FROM events
        ORDER BY createdAt DESC
    """)
    fun observeAll(): Flow<List<EventEntity>>

    @Query("""
        SELECT * FROM events
        WHERE localId = :id
        LIMIT 1
    """)
    suspend fun findById(id: Long): EventEntity?

    @Query("""
        SELECT * FROM events
        WHERE syncStatus IN ('PENDING', 'ERROR')
        ORDER BY createdAt ASC
    """)
    suspend fun getEventsToSync(): List<EventEntity>

    @Query("""
        UPDATE events
        SET syncStatus = 'SYNCED',
            syncError = NULL,
            syncedAt = :syncedAt
        WHERE localId = :localId
    """)
    suspend fun markAsSynced(
        localId: Long,
        syncedAt: Long
    )

    @Query("""
        UPDATE events
        SET syncStatus = 'ERROR',
            syncError = :error
        WHERE localId = :localId
    """)
    suspend fun markAsError(
        localId: Long,
        error: String
    )
}