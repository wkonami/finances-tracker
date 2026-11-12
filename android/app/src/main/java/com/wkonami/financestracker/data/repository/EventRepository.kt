package com.wkonami.financestracker.data.repository

import com.wkonami.financestracker.data.local.EventDao
import com.wkonami.financestracker.data.local.EventEntity
import kotlinx.coroutines.flow.Flow

class EventRepository(
    private val eventDao: EventDao
) {

    fun observeEvents(): Flow<List<EventEntity>> {
        return eventDao.observeAll()
    }

    suspend fun findById(id: Long): EventEntity? {
        return eventDao.findById(id)
    }

    suspend fun registerEvent(
        name: String,
        location: String?,
        startDate: Long?,
        endDate: Long?
    ): Long {

        val normalizedName = name.trim()

        require(normalizedName.isNotEmpty()) {
            "O nome do evento é obrigatório."
        }

        require(
            startDate == null ||
                endDate == null ||
                endDate >= startDate
        ) {
            "A data final não pode ser anterior à data inicial."
        }

        val event = EventEntity(
            name = normalizedName,
            location = location
                ?.trim()
                ?.takeIf { it.isNotEmpty() },
            startDate = startDate,
            endDate = endDate
        )

        return eventDao.insert(event)
    }
}