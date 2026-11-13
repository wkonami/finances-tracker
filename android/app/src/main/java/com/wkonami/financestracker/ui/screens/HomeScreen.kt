package com.wkonami.financestracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wkonami.financestracker.data.local.EventEntity
import com.wkonami.financestracker.ui.components.HomeActionCard

@Composable
fun HomeScreen(
    pendingSalesCount: Int,
    eventModeEnabled: Boolean,
    selectedEvent: EventEntity?,
    events: List<EventEntity>,
    onEnableEventMode: (Long) -> Unit,
    onDisableEventMode: () -> Unit,
    onCreateEvent: (String, String?) -> Unit,
    onNewSaleClick: () -> Unit,
    onSalesClick: () -> Unit,
    onSyncClick: () -> Unit,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var showEventDialog by remember { mutableStateOf(false) }
    var showCreateForm by remember { mutableStateOf(false) }

    var eventName by remember { mutableStateOf("") }
    var eventLocation by remember { mutableStateOf("") }
    var eventError by remember { mutableStateOf<String?>(null) }

    fun closeEventDialog() {
        showEventDialog = false
        showCreateForm = false
        eventName = ""
        eventLocation = ""
        eventError = null
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {

        // Cabeçalho principal
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {

            // Configurações
            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.CenterStart
            ) {
                IconButton(
                    onClick = onSettingsClick,
                    modifier = Modifier
                        .size(44.dp)
                        .semantics {
                            contentDescription = "Abrir configurações"
                        }
                ) {
                    Text(
                        text = "⚙",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Nome centralizado
            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Offline Helper",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            // Modo evento
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
            ) {
                Switch(
                    checked = eventModeEnabled,
                    onCheckedChange = { enabled ->
                        if (enabled) {
                            showEventDialog = true
                        } else {
                            onDisableEventMode()
                        }
                    },
                    modifier = Modifier.semantics {
                        contentDescription = "Ativar ou desativar modo evento"
                    }
                )

                Text(
                    text = "Evento",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Evento selecionado
        if (eventModeEnabled) {
            Text(
                text = selectedEvent?.let {
                    "Modo evento ativo: ${it.name}"
                } ?: "Nenhum evento selecionado",
                style = MaterialTheme.typography.bodySmall,
                color = if (selectedEvent == null) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Ações principais
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Operações",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            HomeActionCard(
                symbol = "+",
                title = "Nova venda",
                description = "Registrar uma nova venda offline",
                onClick = onNewSaleClick
            )

            HomeActionCard(
                symbol = "≡",
                title = "Vendas registradas",
                description = "Consultar as vendas salvas no aparelho",
                onClick = onSalesClick
            )
        }

        // Resumo de sincronização
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Vendas pendentes",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = pendingSalesCount.toString(),
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    Text(
                        text = "Aguardando envio",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                Text(
                    text = "As vendas ficam salvas neste aparelho até você enviar ao servidor.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        // Sincronização
        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "Sincronização",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Button(
                onClick = onSyncClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    text = "Enviar ao servidor",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            Text(
                text = "O envio é manual. Você poderá conferir as vendas antes de sincronizá-las.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))
    }

    // Diálogo de eventos
    if (showEventDialog) {
        AlertDialog(
            onDismissRequest = {
                closeEventDialog()
            },
            title = {
                Text(
                    if (showCreateForm) {
                        "Novo evento"
                    } else {
                        "Selecionar evento"
                    }
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (showCreateForm) {

                        Text(
                            text = "Cadastre um evento para começar a registrar vendas nele.",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        OutlinedTextField(
                            value = eventName,
                            onValueChange = {
                                eventName = it
                                eventError = null
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = {
                                Text("Nome do evento")
                            },
                            placeholder = {
                                Text("Ex.: Feira de Artesanato")
                            },
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = eventLocation,
                            onValueChange = {
                                eventLocation = it
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = {
                                Text("Local (opcional)")
                            },
                            singleLine = true
                        )

                        eventError?.let { error ->
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                    } else {

                        if (events.isEmpty()) {
                            Text(
                                text = "Nenhum evento cadastrado neste aparelho.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            Text(
                                text = "Escolha o evento que receberá as próximas vendas.",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            events.forEach { event ->
                                OutlinedButton(
                                    onClick = {
                                        onEnableEventMode(event.localId)
                                        closeEventDialog()
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp),
                                        verticalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Text(
                                            text = event.name,
                                            fontWeight = FontWeight.SemiBold
                                        )

                                        event.location?.let { location ->
                                            Text(
                                                text = location,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                if (showCreateForm) {
                    Button(
                        onClick = {
                            if (eventName.isBlank()) {
                                eventError = "Informe o nome do evento."
                            } else {
                                onCreateEvent(
                                    eventName.trim(),
                                    eventLocation.trim().takeIf {
                                        it.isNotEmpty()
                                    }
                                )

                                closeEventDialog()
                            }
                        }
                    ) {
                        Text("Criar e ativar")
                    }
                } else {
                    TextButton(
                        onClick = {
                            showCreateForm = true
                            eventError = null
                        }
                    ) {
                        Text("Cadastrar evento")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        if (showCreateForm) {
                            showCreateForm = false
                            eventName = ""
                            eventLocation = ""
                            eventError = null
                        } else {
                            closeEventDialog()
                        }
                    }
                ) {
                    Text(
                        if (showCreateForm) {
                            "Voltar"
                        } else {
                            "Cancelar"
                        }
                    )
                }
            }
        )
    }
}