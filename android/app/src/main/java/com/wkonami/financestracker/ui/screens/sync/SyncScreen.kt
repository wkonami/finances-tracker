package com.wkonami.financestracker.ui.screens.sync

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.wkonami.financestracker.data.repository.SyncPhase
import com.wkonami.financestracker.data.repository.SyncProgress
import androidx.compose.material3.Checkbox
import androidx.compose.ui.platform.LocalContext
import com.wkonami.financestracker.data.local.SyncCredentialsStorage
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll

@Composable
fun SyncScreen(
    pendingSalesCount: Int,
    progress: SyncProgress,
    isSyncing: Boolean,
    onBack: () -> Unit,
    onSync: (String, String, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    val credentialsStorage = remember(context) {
        SyncCredentialsStorage(context)
    }

    var rememberCredentials by remember {
        mutableStateOf(false)
    }

    var isLoadingCredentials by remember {
        mutableStateOf(true)
    }

    val scope = rememberCoroutineScope()

    LaunchedEffect(credentialsStorage) {
        try {
            val savedCredentials = credentialsStorage.load()

            if (savedCredentials != null) {
                username = savedCredentials.username
                password = savedCredentials.password
                rememberCredentials = true
            }
        } finally {
            isLoadingCredentials = false
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {

        TextButton(
            onClick = onBack,
            enabled = !isSyncing
        ) {
            Text("← Voltar")
        }

        Text(
            text = "Enviar ao servidor",
            style = MaterialTheme.typography.headlineMedium
        )

        Text(
            text = "Informe suas credenciais para autenticar e enviar as vendas armazenadas neste aparelho.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Vendas pendentes",
                    style = MaterialTheme.typography.titleMedium
                )

                Text(
                    text = pendingSalesCount.toString(),
                    style = MaterialTheme.typography.displayMedium,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "As vendas serão registradas no servidor em nome do usuário autenticado.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        OutlinedTextField(
            value = username,
            onValueChange = {
                username = it
                errorMessage = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Usuário") },
            singleLine = true,
            enabled = !isSyncing,
            keyboardOptions = KeyboardOptions(
                imeAction = ImeAction.Next
            )
        )

        OutlinedTextField(
            value = password,
            onValueChange = {
                password = it
                errorMessage = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Senha") },
            singleLine = true,
            enabled = !isSyncing,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            )
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = rememberCredentials,
                onCheckedChange = { checked ->
                    rememberCredentials = checked

                    if (!checked) {
                        scope.launch {
                            credentialsStorage.clear()
                        }
                    }
                },
                enabled = !isSyncing && !isLoadingCredentials
            )

            Text(
                text = "Lembrar usuário e senha",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (errorMessage != null) {
            Text(
                text = errorMessage.orEmpty(),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        if (progress.phase != SyncPhase.IDLE) {
            SyncProgressCard(progress = progress)
        }

        Button(
            onClick = {
                when {
                    pendingSalesCount == 0 -> {
                        errorMessage = "Não existem vendas pendentes."
                    }

                    username.isBlank() -> {
                        errorMessage = "Informe o usuário."
                    }

                    password.isBlank() -> {
                        errorMessage = "Informe a senha."
                    }

                    else -> {
                        errorMessage = null
                        onSync(
                            username.trim(),
                            password,
                            rememberCredentials
                        )
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = (
                !isSyncing &&
                !isLoadingCredentials &&
                pendingSalesCount > 0
                )
        ) {
            if (isSyncing) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .padding(end = 10.dp)
                        .height(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary
                )

                Text("Sincronizando...")
            } else {
                Text("Autenticar e enviar $pendingSalesCount venda(s)")
            }
        }
    }
}

@Composable
private fun SyncProgressCard(
    progress: SyncProgress
) {
    val colorScheme = MaterialTheme.colorScheme

    val statusColor = when (progress.phase) {
        SyncPhase.FAILED -> colorScheme.error
        SyncPhase.COMPLETED -> colorScheme.primary
        else -> colorScheme.primary
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {

            Text(
                text = when (progress.phase) {
                    SyncPhase.PREPARING -> "Preparando sincronização"
                    SyncPhase.AUTHENTICATING -> "Autenticando"
                    SyncPhase.SENDING -> "Enviando vendas"
                    SyncPhase.COMPLETED -> "Sincronização concluída"
                    SyncPhase.FAILED -> "Falha na sincronização"
                    SyncPhase.IDLE -> "Aguardando"
                },
                style = MaterialTheme.typography.titleMedium,
                color = statusColor
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (
                    progress.phase == SyncPhase.PREPARING ||
                    progress.phase == SyncPhase.AUTHENTICATING ||
                    progress.phase == SyncPhase.SENDING
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(22.dp),
                        strokeWidth = 2.dp
                    )
                }

                Text(
                    text = progress.message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = colorScheme.onSurfaceVariant
                )
            }

            if (progress.total > 0) {
                LinearProgressIndicator(
                    progress = {
                        (progress.percentage / 100f).coerceIn(0f, 1f)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp),
                    color = statusColor,
                    trackColor = colorScheme.surfaceVariant
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${progress.processed} de ${progress.total} vendas",
                        style = MaterialTheme.typography.bodySmall
                    )

                    Text(
                        text = "${progress.percentage}%",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            if (progress.totalBatches > 0) {
                Text(
                    text = "Lote ${progress.currentBatch} de ${progress.totalBatches}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colorScheme.onSurfaceVariant
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SyncCounter(
                    label = "Novas",
                    value = progress.created,
                    modifier = Modifier.weight(1f)
                )

                SyncCounter(
                    label = "Existentes",
                    value = progress.alreadySynced,
                    modifier = Modifier.weight(1f)
                )

                SyncCounter(
                    label = "Falhas",
                    value = progress.failed,
                    modifier = Modifier.weight(1f),
                    error = true
                )
            }
        }
    }
}

@Composable
private fun SyncCounter(
    label: String,
    value: Int,
    modifier: Modifier = Modifier,
    error: Boolean = false
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value.toString(),
            style = MaterialTheme.typography.titleLarge,
            color = if (error && value > 0) {
                MaterialTheme.colorScheme.error
            } else {
                MaterialTheme.colorScheme.primary
            }
        )

        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}