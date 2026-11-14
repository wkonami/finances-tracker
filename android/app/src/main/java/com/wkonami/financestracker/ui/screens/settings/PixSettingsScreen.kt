package com.wkonami.financestracker.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wkonami.financestracker.data.local.PixConfig

@Composable
fun PixSettingsScreen(
    config: PixConfig,
    onBack: () -> Unit,
    onSave: (PixConfig) -> Unit,
    modifier: Modifier = Modifier
) {
    var pixKey by remember(config) {
        mutableStateOf(config.pixKey)
    }

    var merchantName by remember(config) {
        mutableStateOf(config.merchantName)
    }

    var merchantCity by remember(config) {
        mutableStateOf(config.merchantCity)
    }

    val nameTooLong = merchantName.toByteArray(Charsets.UTF_8).size > 25
    val cityTooLong = merchantCity.toByteArray(Charsets.UTF_8).size > 15
    val keyTooLong = pixKey.toByteArray(Charsets.UTF_8).size > 77

    val canSave = pixKey.isNotBlank() &&
        merchantName.isNotBlank() &&
        merchantCity.isNotBlank() &&
        !nameTooLong &&
        !cityTooLong &&
        !keyTooLong

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        TextButton(onClick = onBack) {
            Text("← Voltar")
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "Configurações do Pix",
                style = MaterialTheme.typography.headlineMedium
            )

            Text(
                text = "Informe os dados que serão utilizados na geração dos QR Codes Pix.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Chave Pix",
                style = MaterialTheme.typography.titleSmall
            )

            OutlinedTextField(
                value = pixKey,
                onValueChange = { pixKey = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("CPF, CNPJ, e-mail, telefone ou chave aleatória")
                },
                supportingText = {
                    Text(
                        text = if (keyTooLong) {
                            "A chave ultrapassa o limite de 77 bytes."
                        } else {
                            "Informe a chave Pix que receberá os pagamentos."
                        }
                    )
                },
                isError = keyTooLong,
                singleLine = true,
                shape = RoundedCornerShape(14.dp)
            )
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Nome do recebedor",
                style = MaterialTheme.typography.titleSmall
            )

            OutlinedTextField(
                value = merchantName,
                onValueChange = { merchantName = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("Nome exibido no aplicativo bancário")
                },
                supportingText = {
                    Text(
                        text = if (nameTooLong) {
                            "O nome deve ter no máximo 25 bytes em UTF-8."
                        } else {
                            "${merchantName.toByteArray(Charsets.UTF_8).size}/25 bytes"
                        }
                    )
                },
                isError = nameTooLong,
                singleLine = true,
                shape = RoundedCornerShape(14.dp)
            )
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Cidade do recebedor",
                style = MaterialTheme.typography.titleSmall
            )

            OutlinedTextField(
                value = merchantCity,
                onValueChange = { merchantCity = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("Ex.: DOURADOS")
                },
                supportingText = {
                    Text(
                        text = if (cityTooLong) {
                            "A cidade deve ter no máximo 15 bytes em UTF-8."
                        } else {
                            "${merchantCity.toByteArray(Charsets.UTF_8).size}/15 bytes"
                        }
                    )
                },
                isError = cityTooLong,
                singleLine = true,
                shape = RoundedCornerShape(14.dp)
            )
        }

        Text(
            text = "Esses dados ficam armazenados localmente neste aparelho e são utilizados para gerar o Pix mesmo sem conexão com a internet.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Button(
            onClick = {
                onSave(
                    PixConfig(
                        pixKey = pixKey.trim(),
                        merchantName = merchantName.trim(),
                        merchantCity = merchantCity.trim()
                    )
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = canSave
        ) {
            Text("Salvar configurações")
        }
    }
}