package com.wkonami.financestracker.data.repository

import com.wkonami.financestracker.data.local.SaleDao
import com.wkonami.financestracker.data.local.SaleEntity
import com.wkonami.financestracker.data.local.SyncStatus
import java.util.UUID
import kotlinx.coroutines.flow.Flow

class SaleRepository(
    private val saleDao: SaleDao
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
        note: String?
    ): Long {

        require(debtorName.isNotBlank()) {
            "O nome do devedor é obrigatório."
        }

        require(amountInCents > 0) {
            "O valor da venda deve ser maior que zero."
        }

        val sale = SaleEntity(
            externalId = UUID.randomUUID().toString(),
            debtorName = debtorName.trim(),
            amountInCents = amountInCents,
            note = note?.trim()?.takeIf { it.isNotEmpty() },
            createdAt = System.currentTimeMillis()
        )

        return saleDao.insert(sale)
    }
}