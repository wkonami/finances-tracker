
package com.wkonami.financestracker.data.repository

import com.wkonami.financestracker.data.local.SaleDao
import com.wkonami.financestracker.data.remote.ApiClient
import com.wkonami.financestracker.data.remote.dto.SyncRequest
import com.wkonami.financestracker.data.remote.dto.SyncSaleRequest
import kotlinx.coroutines.CancellationException
import java.util.Locale
import com.wkonami.financestracker.data.local.PaymentMethod

enum class SyncPhase {
    IDLE,
    PREPARING,
    AUTHENTICATING,
    SENDING,
    COMPLETED,
    FAILED
}

data class SyncProgress(
    val phase: SyncPhase = SyncPhase.IDLE,
    val total: Int = 0,
    val processed: Int = 0,
    val created: Int = 0,
    val alreadySynced: Int = 0,
    val failed: Int = 0,
    val currentBatch: Int = 0,
    val totalBatches: Int = 0,
    val message: String = ""
) {
    val percentage: Int
        get() = if (total == 0) {
            0
        } else {
            ((processed * 100f) / total).toInt().coerceIn(0, 100)
        }
}

data class SyncResult(
    val total: Int,
    val created: Int,
    val alreadySynced: Int,
    val failed: Int,
    val message: String
)

class SyncRepository(
    private val saleDao: SaleDao,
    private val apiClient: ApiClient
) {

    suspend fun synchronize(
        username: String,
        password: String,
        onProgress: (SyncProgress) -> Unit = {}
    ): SyncResult {

        require(username.isNotBlank()) {
            "Informe o nome de usuário."
        }

        require(password.isNotBlank()) {
            "Informe a senha."
        }

        onProgress(
            SyncProgress(
                phase = SyncPhase.PREPARING,
                message = "Consultando vendas pendentes..."
            )
        )

        val pendingSales = saleDao.getSalesToSync()

        if (pendingSales.isEmpty()) {
            onProgress(
                SyncProgress(
                    phase = SyncPhase.COMPLETED,
                    message = "Não existem vendas pendentes."
                )
            )

            return SyncResult(
                total = 0,
                created = 0,
                alreadySynced = 0,
                failed = 0,
                message = "Não existem vendas pendentes."
            )
        }

        val batches = pendingSales.chunked(50)

        onProgress(
            SyncProgress(
                phase = SyncPhase.AUTHENTICATING,
                total = pendingSales.size,
                totalBatches = batches.size,
                message = "Autenticando no servidor..."
            )
        )

        val token = apiClient.login(username, password)

        var created = 0
        var alreadySynced = 0
        var failed = 0
        var processed = 0

        for ((batchIndex, batch) in batches.withIndex()) {

            onProgress(
                SyncProgress(
                    phase = SyncPhase.SENDING,
                    total = pendingSales.size,
                    processed = processed,
                    created = created,
                    alreadySynced = alreadySynced,
                    failed = failed,
                    currentBatch = batchIndex + 1,
                    totalBatches = batches.size,
                    message = "Enviando lote ${batchIndex + 1} de ${batches.size}..."
                )
            )

            val request = SyncRequest(
                sales = batch.map { sale ->
                    SyncSaleRequest(
                        externalId = sale.externalId,
                        debtorName = sale.debtorName,
                        totalAmount = String.format(
                            Locale.US,
                            "%d.%02d",
                            sale.amountInCents / 100,
                            sale.amountInCents % 100
                        ),
                        notes = sale.note,
                        isPaid = sale.isPaid,
                        isDelivered = sale.isDelivered,
                        paymentMethod = when {
                            !sale.isPaid -> null
                            sale.paymentMethod == null -> PaymentMethod.UNKNOWN.name
                            else -> sale.paymentMethod.name
                        }
                    )
                }
            )

            try {
                val response = apiClient.syncSales(
                    token = token,
                    syncRequest = request
                )

                val resultsById = response.results
                    .filter { !it.externalId.isNullOrBlank() }
                    .associateBy { it.externalId!! }

                for (sale in batch) {
                    val result = resultsById[sale.externalId]

                    when (result?.status) {
                        "created" -> {
                            saleDao.markAsSynced(
                                localId = sale.localId,
                                syncedAt = System.currentTimeMillis()
                            )
                            created++
                        }

                        "already_synced" -> {
                            saleDao.markAsSynced(
                                localId = sale.localId,
                                syncedAt = System.currentTimeMillis()
                            )
                            alreadySynced++
                        }

                        "error" -> {
                            saleDao.markAsError(
                                localId = sale.localId,
                                error = result.message
                                    ?: "Erro ao sincronizar venda."
                            )
                            failed++
                        }

                        else -> {
                            saleDao.markAsError(
                                localId = sale.localId,
                                error = "Resposta inválida do servidor."
                            )
                            failed++
                        }
                    }

                    processed++

                    onProgress(
                        SyncProgress(
                            phase = SyncPhase.SENDING,
                            total = pendingSales.size,
                            processed = processed,
                            created = created,
                            alreadySynced = alreadySynced,
                            failed = failed,
                            currentBatch = batchIndex + 1,
                            totalBatches = batches.size,
                            message = "Processando vendas: $processed de ${pendingSales.size}"
                        )
                    )
                }

            } catch (error: CancellationException) {
                throw error

            } catch (error: Exception) {

                for (sale in batch) {
                    saleDao.markAsError(
                        localId = sale.localId,
                        error = error.message
                            ?: "Falha na comunicação com o servidor."
                    )

                    failed++
                    processed++

                    onProgress(
                        SyncProgress(
                            phase = SyncPhase.SENDING,
                            total = pendingSales.size,
                            processed = processed,
                            created = created,
                            alreadySynced = alreadySynced,
                            failed = failed,
                            currentBatch = batchIndex + 1,
                            totalBatches = batches.size,
                            message = "Falha no lote. Registrando vendas para nova tentativa..."
                        )
                    )
                }

                // Não tenta enviar os próximos lotes após falha de comunicação.
                break
            }
        }

        val finalProgress = SyncProgress(
            phase = SyncPhase.COMPLETED,
            total = pendingSales.size,
            processed = processed,
            created = created,
            alreadySynced = alreadySynced,
            failed = failed,
            currentBatch = batches.size,
            totalBatches = batches.size,
            message = "Sincronização concluída."
        )

        onProgress(finalProgress)

        return SyncResult(
            total = pendingSales.size,
            created = created,
            alreadySynced = alreadySynced,
            failed = failed,
            message = finalProgress.message
        )
    }
}
