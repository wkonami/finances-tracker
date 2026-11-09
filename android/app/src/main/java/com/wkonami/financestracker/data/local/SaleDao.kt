package com.wkonami.financestracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SaleDao {

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(sale: SaleEntity): Long

    @Query("SELECT * FROM sales ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<SaleEntity>>

    @Query(
        """
        SELECT COUNT(*) FROM sales
        WHERE syncStatus IN ('PENDING', 'ERROR')
        """
    )
    fun observePendingCount(): Flow<Int>

    @Query(
        """
        SELECT * FROM sales
        WHERE syncStatus IN ('PENDING', 'ERROR')
        ORDER BY createdAt ASC
        """
    )
    suspend fun getSalesToSync(): List<SaleEntity>

    @Query("""
        UPDATE sales
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
        UPDATE sales
        SET syncStatus = 'ERROR',
            syncError = :error
        WHERE localId = :localId
    """)
    suspend fun markAsError(
        localId: Long,
        error: String
    )

    @Query("SELECT * FROM sales WHERE localId = :id LIMIT 1")
    suspend fun findById(id: Long): SaleEntity?
}