package com.wkonami.financestracker.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wkonami.financestracker.data.local.PixConfig
import com.wkonami.financestracker.domain.pix.PixPayloadGenerator
import com.wkonami.financestracker.domain.pix.PixQrCodeGenerator
import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale

@Composable
fun PixQrCodeDialog(
    config: PixConfig,
    amountInCents: Long?,
    onDismiss: () -> Unit
) {

    val clipboardManager = LocalClipboardManager.current

    val payloadResult = remember(config, amountInCents) {
        runCatching {
            PixPayloadGenerator.generate(
                config = config,
                amountInCents = amountInCents
            )
        }
    }

    val payload = payloadResult.getOrNull()

    val bitmap = remember(payload) {
        payload?.let {
            runCatching {
                PixQrCodeGenerator.generate(it)
            }.getOrNull()
        }
    }

    val currencyFormatter = remember {
        NumberFormat.getCurrencyInstance(
            Locale("pt", "BR")
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,

        title = {
            Text(
                text = "Pagamento via Pix",
                style = MaterialTheme.typography.titleLarge
            )
        },

        text = {

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                when {

                    !config.isConfigured -> {

                        Text(
                            text = "Pix não configurado",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.error
                        )

                        Text(
                            text = "Para gerar o QR Code, configure a chave Pix, o nome e a cidade do recebedor nas configurações do aplicativo.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }

                    payload == null || bitmap == null -> {

                        Text(
                            text = "Não foi possível gerar o QR Code.",
                            color = MaterialTheme.colorScheme.error
                        )

                        Text(
                            text = payloadResult.exceptionOrNull()?.message
                                ?: "Verifique os dados Pix configurados."
                        )
                    }

                    else -> {

                        Text(
                            text = if (amountInCents != null) {
                                currencyFormatter.format(
                                    BigDecimal(amountInCents).movePointLeft(2)
                                )
                            } else {
                                "QR Code"
                            },
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = "QR Code Pix",
                            modifier = Modifier
                                .size(250.dp)
                                .background(
                                    androidx.compose.ui.graphics.Color.White,
                                    RoundedCornerShape(12.dp)
                                )
                                .padding(8.dp)
                        )

                        Text(
                            text = "Escaneie o QR Code pelo aplicativo do seu banco.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        OutlinedButton(
                            onClick = {
                                clipboardManager.setText(
                                    AnnotatedString(payload)
                                )
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Pix Copia e Cola")
                        }
                    }
                }
            }
        },

        confirmButton = {

            Button(
                onClick = onDismiss
            ) {
                Text("Fechar")
            }
        }
    )
}