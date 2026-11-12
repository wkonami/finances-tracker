package com.wkonami.financestracker.ui.screens.sale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import java.math.BigDecimal
import java.math.RoundingMode
import kotlinx.coroutines.launch

@Composable
fun NewSaleScreen(
    onBack: () -> Unit,
    eventModeEnabled: Boolean,
    eventName: String?,
    onSaveSale: suspend (String, Long, String?) -> Unit,
    modifier: Modifier = Modifier
) {
    var debtorName by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        TextButton(
            onClick = onBack,
            enabled = !isSaving
        ) {
            Text("← Voltar")
        }

        Text(
            text = "Nova venda",
            style = MaterialTheme.typography.headlineMedium
        )

        Text(
            text = if (eventModeEnabled) {
                "Esta venda será registrada no evento selecionado."
            } else {
                "Preencha os dados da venda. Ela será salva neste aparelho."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (eventModeEnabled) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Evento",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    Text(
                        text = eventName ?: "Evento não selecionado",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    Text(
                        text = "Comprador: Não identificado",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        } else {
            OutlinedTextField(
                value = debtorName,
                onValueChange = {
                    debtorName = it
                    errorMessage = null
                },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nome do comprador") },
                placeholder = { Text("Digite o nome") },
                singleLine = true,
                enabled = !isSaving,
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Next
                )
            )
        }

        OutlinedTextField(
            value = amount,
            onValueChange = {
                amount = it.filter { char ->
                    char.isDigit() || char == ',' || char == '.'
                }
                errorMessage = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Valor da venda") },
            placeholder = { Text("0,00") },
            prefix = { Text("R$ ") },
            singleLine = true,
            enabled = !isSaving,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Decimal,
                imeAction = ImeAction.Next
            )
        )

        OutlinedTextField(
            value = note,
            onValueChange = {
                if (it.length <= 500) {
                    note = it
                }
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Observação (opcional)") },
            placeholder = { Text("Informações adicionais") },
            minLines = 3,
            maxLines = 5,
            enabled = !isSaving,
            keyboardOptions = KeyboardOptions(
                imeAction = ImeAction.Done
            ),
            supportingText = {
                Text("${note.length}/500")
            }
        )

        if (errorMessage != null) {
            Text(
                text = errorMessage.orEmpty(),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Button(
            onClick = {
                val normalizedAmount = amount.trim()
                    .replace(",", ".")

                val amountInCents = try {
                    BigDecimal(normalizedAmount)
                        .setScale(2, RoundingMode.UNNECESSARY)
                        .movePointRight(2)
                        .longValueExact()
                } catch (_: Exception) {
                    null
                }

                when {
                    !eventModeEnabled && debtorName.isBlank() -> {
                        errorMessage = "Informe o nome do comprador."
                    }

                    amountInCents == null || amountInCents <= 0 -> {
                        errorMessage = "Informe um valor válido e maior que zero."
                    }

                    eventModeEnabled && eventName.isNullOrBlank() -> {
                        errorMessage = "Nenhum evento está selecionado."
                    }

                    else -> {
                        scope.launch {
                            isSaving = true
                            errorMessage = null

                            try {
                                onSaveSale(
                                    if (eventModeEnabled) {
                                        "Não identificado"
                                    } else {
                                        debtorName.trim()
                                    },
                                    amountInCents,
                                    note.trim().takeIf { it.isNotEmpty() }
                                )
                            } catch (exception: Exception) {
                                errorMessage = exception.message
                                    ?: "Não foi possível salvar a venda."
                            } finally {
                                isSaving = false
                            }
                        }
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            enabled = !isSaving
        ) {
            if (isSaving) {
                CircularProgressIndicator()
            } else {
                Text("Salvar venda")
            }
        }
    }
}