package com.wkonami.financestracker.ui.screens.sale

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AssistChip
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import java.math.BigDecimal
import java.math.RoundingMode
import kotlinx.coroutines.launch
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import com.wkonami.financestracker.ui.components.clearFocusOnTap
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import com.wkonami.financestracker.data.local.PaymentMethod
import androidx.compose.material3.OutlinedButton
import com.wkonami.financestracker.data.local.PixConfig
import com.wkonami.financestracker.ui.components.PixQrCodeDialog

private const val MAX_NOTE_LENGTH = 500

private val DEFAULT_QUICK_NOTES = listOf(
    "Colar",
    "Kanzashi",
    "Pulseira"
)

private fun parseAmountToCents(value: String): Long? {
    val normalized = value.trim()
        .replace(" ", "")
        .let {
            if (it.contains(",")) {
                it.replace(".", "").replace(",", ".")
            } else {
                it
            }
        }

    return try {
        BigDecimal(normalized)
            .setScale(2, RoundingMode.UNNECESSARY)
            .movePointRight(2)
            .longValueExact()
    } catch (_: Exception) {
        null
    }
}

@Composable
fun NewSaleScreen(
    onBack: () -> Unit,
    eventModeEnabled: Boolean,
    eventName: String?,
    pixConfig: PixConfig,
    onSaveSale: suspend (
        String,
        Long,
        String?,
        Boolean,
        Boolean,
        PaymentMethod?
    ) -> Unit,
    modifier: Modifier = Modifier,
    quickNotes: List<String> = DEFAULT_QUICK_NOTES
) {
    var debtorName by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }
    var isPaid by remember { mutableStateOf(true) }
    var isDelivered by remember { mutableStateOf(true) }
    var paymentMethod by remember {
        mutableStateOf<PaymentMethod?>(null)
    }
    var showPixDialog by remember {
        mutableStateOf(false)
    }

    var pixAmountInCents by remember {
        mutableStateOf<Long?>(null)
    }

    val scope = rememberCoroutineScope()

    fun addQuickNote(text: String) {
        if (text.isBlank()) return

        val separator = if (note.isBlank()) "" else "\n"
        val remaining = MAX_NOTE_LENGTH - note.length - separator.length

        if (remaining <= 0) return

        note += separator + text.take(remaining)
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .clearFocusOnTap()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        TextButton(
            onClick = onBack,
            enabled = !isSaving
        ) {
            Text("← Voltar")
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "Nova venda",
                style = MaterialTheme.typography.headlineMedium
            )

            Text(
                text = if (eventModeEnabled) {
                    "Registre uma venda no evento selecionado."
                } else {
                    "Informe os dados para registrar uma nova venda."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (eventModeEnabled) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "VENDA POR EVENTO",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    Text(
                        text = eventName ?: "Evento não selecionado",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    Text(
                        text = "Comprador não identificado",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        } else {
            Column(
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Comprador",
                    style = MaterialTheme.typography.titleSmall
                )

                OutlinedTextField(
                    value = debtorName,
                    onValueChange = {
                        debtorName = it
                        errorMessage = null
                    },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Nome do comprador") },
                    supportingText = {
                        Text("Obrigatório")
                    },
                    singleLine = true,
                    enabled = !isSaving,
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(
                        imeAction = ImeAction.Next
                    )
                )
            }
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Valor da venda",
                style = MaterialTheme.typography.titleSmall
            )

            OutlinedTextField(
                value = amount,
                onValueChange = {
                    amount = it.filter { char ->
                        char.isDigit() || char == ',' || char == '.'
                    }
                    errorMessage = null
                },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("0,00") },
                prefix = {
                    Text("R$")
                },
                singleLine = true,
                enabled = !isSaving,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Decimal,
                    imeAction = ImeAction.Next
                )
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Checkbox(
                        checked = isPaid,
                        onCheckedChange = { isPaid = it },
                        enabled = !isSaving
                    )

                    Text(
                        text = "Pago",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Checkbox(
                        checked = isDelivered,
                        onCheckedChange = { isDelivered = it },
                        enabled = !isSaving
                    )

                    Text(
                        text = "Entregue",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        if (isPaid) {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Forma de pagamento",
                    style = MaterialTheme.typography.titleSmall
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val methods = listOf(
                        PaymentMethod.CASH to "Dinheiro",
                        PaymentMethod.CARD to "Cartão",
                        PaymentMethod.PIX to "Pix"
                    )

                    methods.forEach { (method, label) ->
                        FilterChip(
                            selected = paymentMethod == method,
                            onClick = {
                                paymentMethod = method
                                errorMessage = null
                            },
                            enabled = !isSaving,
                            label = { Text(label) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                if (paymentMethod == PaymentMethod.PIX) {

                    OutlinedButton(
                        onClick = {

                            val parsedAmount = if (amount.isBlank()) {
                                null
                            } else {
                                parseAmountToCents(amount)
                            }

                            when {
                                amount.isNotBlank() &&
                                    (parsedAmount == null || parsedAmount <= 0) -> {

                                    errorMessage = "Informe um valor válido para gerar o QR Code."
                                }

                                else -> {
                                    pixAmountInCents = parsedAmount
                                    showPixDialog = true
                                    errorMessage = null
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isSaving,
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("QR")
                    }
                }
            }
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Observação",
                style = MaterialTheme.typography.titleSmall
            )

            if (quickNotes.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    quickNotes.forEach { quickNote ->
                        AssistChip(
                            onClick = {
                                addQuickNote(quickNote)
                            },
                            enabled = !isSaving &&
                                note.length < MAX_NOTE_LENGTH,
                            label = {
                                Text(quickNote)
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = note,
                onValueChange = {
                    if (it.length <= MAX_NOTE_LENGTH) {
                        note = it
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("Adicione detalhes sobre a venda...")
                },
                minLines = 3,
                maxLines = 5,
                enabled = !isSaving,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Done
                ),
                supportingText = {
                    Text(
                        "${note.length}/$MAX_NOTE_LENGTH",
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            )
        }

        if (errorMessage != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = errorMessage.orEmpty(),
                    modifier = Modifier.padding(12.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Button(
            onClick = {
                val amountInCents = parseAmountToCents(amount)

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

                    isPaid && paymentMethod == null -> {
                        errorMessage = "Selecione a forma de pagamento."
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
                                    note.trim().takeIf { it.isNotEmpty() },
                                    isPaid,
                                    isDelivered,
                                    paymentMethod
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
                .padding(top = 4.dp),
            enabled = !isSaving,
            shape = RoundedCornerShape(14.dp)
        ) {
            if (isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.padding(2.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("Salvar venda")
            }
        }
    }
    if (showPixDialog) {
        PixQrCodeDialog(
            config = pixConfig,
            amountInCents = pixAmountInCents,
            onDismiss = {
                showPixDialog = false
            }
        )
    }
}