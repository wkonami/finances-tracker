
package com.wkonami.financestracker.ui.screens.sale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wkonami.financestracker.data.local.SaleEntity
import com.wkonami.financestracker.data.local.SyncStatus
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.math.BigDecimal

@Composable
fun SalesListScreen(
    sales: List<SaleEntity>,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val currencyFormatter = NumberFormat.getCurrencyInstance(
        Locale("pt", "BR")
    )

    val dateFormatter = SimpleDateFormat(
        "dd/MM/yyyy 'às' HH:mm",
        Locale("pt", "BR")
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        TextButton(onClick = onBack) {
            Text("← Voltar")
        }

        Text(
            text = "Vendas registradas",
            style = MaterialTheme.typography.headlineMedium
        )

        Text(
            text = "${sales.size} venda(s) armazenada(s) neste aparelho",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (sales.isEmpty()) {
            Text(
                text = "Nenhuma venda cadastrada ainda.",
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(top = 24.dp)
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = sales,
                    key = { it.localId }
                ) { sale ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = sale.debtorName,
                                    style = MaterialTheme.typography.titleMedium
                                )

                                Text(
                                    text = currencyFormatter.format(
                                        BigDecimal.valueOf(sale.amountInCents, 2)
                                    ),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Text(
                                text = dateFormatter.format(
                                    Date(sale.createdAt)
                                ),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            if (!sale.note.isNullOrBlank()) {
                                Text(
                                    text = sale.note,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }

                            val status = when (sale.syncStatus) {
                                SyncStatus.PENDING -> "Aguardando envio"
                                SyncStatus.ERROR -> "Erro no envio"
                                SyncStatus.SYNCED -> "Sincronizada"
                            }

                            Text(
                                text = status,
                                style = MaterialTheme.typography.labelMedium,
                                color = when (sale.syncStatus) {
                                    SyncStatus.SYNCED ->
                                        MaterialTheme.colorScheme.primary

                                    SyncStatus.ERROR ->
                                        MaterialTheme.colorScheme.error

                                    SyncStatus.PENDING ->
                                        MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
