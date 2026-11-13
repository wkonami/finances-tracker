package com.wkonami.financestracker.data.repository

import com.wkonami.financestracker.data.local.EventDao
import com.wkonami.financestracker.data.local.SaleDao
import com.wkonami.financestracker.data.local.SaleEntity
import java.util.UUID
import kotlinx.coroutines.flow.Flow

class SaleRepository(
    private val saleDao: SaleDao,
    private val eventDao: EventDao
) {

    fun observeSales(): Flow<List<SaleEntity>> {
        return saleDao.observeAll()
    }

    fun observePendingCount(): Flow<Int> {
        return saleDao.observePendingCount()
    }

    suspend fun registerSale(
        debtorName: String,
        amountInCents: Long,
        note: String?,
        eventId: Long? = null,
        isPaid: Boolean = true,
        isDelivered: Boolean = true
    ): Long {

        require(debtorName.isNotBlank()) {
            "O nome do comprador é obrigatório."
        }

        require(amountInCents > 0) {
            "O valor da venda deve ser maior que zero."
        }

        if (eventId != null) {
            require(eventDao.findById(eventId) != null) {
                "O evento selecionado não existe mais."
            }
        }

        val sale = SaleEntity(
            externalId = UUID.randomUUID().toString(),
            debtorName = debtorName.trim(),
            amountInCents = amountInCents,
            note = note?.trim()?.takeIf { it.isNotEmpty() },
            eventId = eventId,
            isPaid = isPaid,
            isDelivered = isDelivered,
            createdAt = System.currentTimeMillis()
        )

        return saleDao.insert(sale)
    }
}