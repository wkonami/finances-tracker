package com.wkonami.financestracker.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
    modifier: Modifier = Modifier
) {
    var showEventDialog by remember { mutableStateOf(false) }
    var showCreateForm by remember { mutableStateOf(false) }
    var eventName by remember { mutableStateOf("") }
    var eventLocation by remember { mutableStateOf("") }
    var eventError by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {

        // Cabeçalho
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "FINANCES",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "Tracker PDV",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(48.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "FT",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Apresentação
        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Olá!",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = "Registre suas vendas de forma rápida, mesmo sem internet.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Modo evento
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (eventModeEnabled) {
                    MaterialTheme.colorScheme.primaryContainer
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            )
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Modo evento",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = if (eventModeEnabled) {
                                "As próximas vendas serão vinculadas a um evento."
                            } else {
                                "Ative para registrar vendas vinculadas a um evento."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Switch(
                        checked = eventModeEnabled,
                        onCheckedChange = { enabled ->
                            if (enabled) {
                                showEventDialog = true
                            } else {
                                onDisableEventMode()
                            }
                        }
                    )
                }

                if (eventModeEnabled && selectedEvent != null) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.75f)
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Text(
                                text = "Evento ativo",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Text(
                                text = selectedEvent.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )

                            selectedEvent.location?.let { location ->
                                Text(
                                    text = location,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = {
                            showEventDialog = true
                            showCreateForm = false
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Trocar evento")
                    }
                } else if (eventModeEnabled) {
                    Text(
                        text = "O evento selecionado não foi encontrado. Selecione outro evento.",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )

                    OutlinedButton(
                        onClick = {
                            showEventDialog = true
                            showCreateForm = false
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Selecionar evento")
                    }
                }
            }
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
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
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

    if (showEventDialog) {
        AlertDialog(
            onDismissRequest = {
                showEventDialog = false
                showCreateForm = false
                eventError = null
            },
            title = {
                Text(
                    if (showCreateForm) "Novo evento" else "Selecionar evento"
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
                            label = { Text("Nome do evento") },
                            placeholder = { Text("Ex.: Feira de Artesanato") },
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = eventLocation,
                            onValueChange = {
                                eventLocation = it
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Local (opcional)") },
                            singleLine = true
                        )

                        if (eventError != null) {
                            Text(
                                text = eventError.orEmpty(),
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
                                        showEventDialog = false
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

                                        event.location?.let {
                                            Text(
                                                text = it,
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
                                    eventLocation.trim().takeIf { it.isNotEmpty() }
                                )

                                eventName = ""
                                eventLocation = ""
                                eventError = null
                                showCreateForm = false
                                showEventDialog = false
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
                            eventError = null
                        } else {
                            showEventDialog = false
                        }
                    }
                ) {
                    Text(if (showCreateForm) "Voltar" else "Cancelar")
                }
            }
        )
    }
}