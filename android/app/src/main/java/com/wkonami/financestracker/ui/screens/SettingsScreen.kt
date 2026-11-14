
package com.wkonami.financestracker.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onPixClick: () -> Unit,
    onUnavailableClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        TextButton(onClick = onBack) {
            Text("← Voltar")
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "Configurações",
                style = MaterialTheme.typography.headlineMedium
            )

            Text(
                text = "Personalize o funcionamento do aplicativo.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SettingsMenuItem(
                title = "Pix",
                description = "Configure a chave e os dados do recebedor.",
                onClick = onPixClick
            )

            SettingsMenuItem(
                title = "Aparência",
                description = "Tema e preferências visuais.",
                onClick = { onUnavailableClick("Aparência") },
                comingSoon = true
            )

            SettingsMenuItem(
                title = "Operação",
                description = "Preferências de funcionamento do PDV.",
                onClick = { onUnavailableClick("Operação") },
                comingSoon = true
            )

            SettingsMenuItem(
                title = "Eventos",
                description = "Preferências relacionadas ao modo evento.",
                onClick = { onUnavailableClick("Eventos") },
                comingSoon = true
            )

            SettingsMenuItem(
                title = "Dados locais",
                description = "Informações armazenadas neste aparelho.",
                onClick = { onUnavailableClick("Dados locais") },
                comingSoon = true
            )

            SettingsMenuItem(
                title = "Sincronização",
                description = "Preferências de envio ao servidor.",
                onClick = { onUnavailableClick("Sincronização") },
                comingSoon = true
            )

            SettingsMenuItem(
                title = "Sobre",
                description = "Informações e versão do aplicativo.",
                onClick = { onUnavailableClick("Sobre") },
                comingSoon = true
            )
        }
    }
}

@Composable
private fun SettingsMenuItem(
    title: String,
    description: String,
    onClick: () -> Unit,
    comingSoon: Boolean = false
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium
                )

                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Text(
                text = if (comingSoon) "Em breve" else "›",
                style = MaterialTheme.typography.labelMedium,
                color = if (comingSoon) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.primary
                },
                modifier = Modifier.padding(start = 12.dp)
            )
        }
    }
}
