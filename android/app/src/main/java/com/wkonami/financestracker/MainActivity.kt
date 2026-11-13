package com.wkonami.financestracker

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.wkonami.financestracker.data.local.AppDatabase
import com.wkonami.financestracker.data.local.EventModePreferences
import com.wkonami.financestracker.data.local.EventModeState
import com.wkonami.financestracker.data.remote.ApiClient
import com.wkonami.financestracker.data.repository.EventRepository
import com.wkonami.financestracker.data.repository.SaleRepository
import com.wkonami.financestracker.data.repository.SyncRepository
import com.wkonami.financestracker.data.repository.SyncPhase
import com.wkonami.financestracker.data.repository.SyncProgress
import com.wkonami.financestracker.ui.screens.HomeScreen
import com.wkonami.financestracker.ui.screens.sale.NewSaleScreen
import com.wkonami.financestracker.ui.screens.sale.SalesListScreen
import com.wkonami.financestracker.ui.screens.sync.SyncScreen
import com.wkonami.financestracker.ui.theme.FinancesTrackerPDVTheme
import kotlinx.coroutines.launch

private const val API_BASE_URL = "https://finances-q6s6.onrender.com/api"

private enum class AppScreen {
    HOME,
    NEW_SALE,
    SALES_LIST,
    SYNC
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        setContent {
            FinancesTrackerPDVTheme {
                val context = LocalContext.current

                val database = remember(context) {
                    AppDatabase.getDatabase(context)
                }

                val repository = remember(database) {
                    SaleRepository(
                        saleDao = database.saleDao(),
                        eventDao = database.eventDao()
                    )
                }

                val eventRepository = remember(database) {
                    EventRepository(database.eventDao())
                }

                val eventModePreferences = remember(context) {
                    EventModePreferences(context)
                }

                val syncRepository = remember(database) {
                    SyncRepository(
                        saleDao = database.saleDao(),
                        apiClient = ApiClient(API_BASE_URL)
                    )
                }

                val coroutineScope = rememberCoroutineScope()

                val pendingCount by repository
                    .observePendingCount()
                    .collectAsState(initial = 0)

                val sales by repository
                    .observeSales()
                    .collectAsState(initial = emptyList())

                val events by eventRepository
                    .observeEvents()
                    .collectAsState(initial = emptyList())

                val eventModeState by eventModePreferences.state
                    .collectAsState(initial = EventModeState())

                val selectedEvent = events.firstOrNull {
                    it.localId == eventModeState.selectedEventId
                }

                // Pilha de navegação
                val backStack = remember {
                    mutableStateListOf(AppScreen.HOME)
                }

                val currentScreen = backStack.last()

                fun navigateTo(screen: AppScreen) {
                    if (backStack.lastOrNull() != screen) {
                        backStack.add(screen)
                    }
                }

                fun navigateBack() {
                    if (backStack.size > 1) {
                        backStack.removeAt(backStack.lastIndex)
                    }
                }

                var syncProgress by remember {
                    mutableStateOf(SyncProgress())
                }

                var isSyncing by remember {
                    mutableStateOf(false)
                }

                // Gerenciamento do botão Voltar do Android
                BackHandler(enabled = backStack.size > 1) {
                    if (!(currentScreen == AppScreen.SYNC && isSyncing)) {
                        navigateBack()
                    }
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize()
                ) { innerPadding ->

                    when (currentScreen) {

                        AppScreen.HOME -> {
                            HomeScreen(
                                pendingSalesCount = pendingCount,
                                eventModeEnabled = eventModeState.enabled,
                                selectedEvent = selectedEvent,
                                events = events,

                                onEnableEventMode = { eventId ->
                                    coroutineScope.launch {
                                        try {
                                            val event = eventRepository.findById(eventId)
                                                ?: throw IllegalStateException(
                                                    "O evento selecionado não existe."
                                                )

                                            eventModePreferences.enableWithEvent(
                                                event.localId
                                            )

                                        } catch (error: Exception) {
                                            Toast.makeText(
                                                context,
                                                error.message
                                                    ?: "Não foi possível ativar o modo evento.",
                                                Toast.LENGTH_LONG
                                            ).show()
                                        }
                                    }
                                },

                                onDisableEventMode = {
                                    coroutineScope.launch {
                                        eventModePreferences.disable()
                                    }
                                },

                                onCreateEvent = { name, location ->
                                    coroutineScope.launch {
                                        try {
                                            val eventId = eventRepository.registerEvent(
                                                name = name,
                                                location = location,
                                                startDate = null,
                                                endDate = null
                                            )

                                            eventModePreferences.enableWithEvent(eventId)

                                            Toast.makeText(
                                                context,
                                                "Evento cadastrado e ativado!",
                                                Toast.LENGTH_SHORT
                                            ).show()

                                        } catch (error: Exception) {
                                            Toast.makeText(
                                                context,
                                                error.message
                                                    ?: "Não foi possível cadastrar o evento.",
                                                Toast.LENGTH_LONG
                                            ).show()
                                        }
                                    }
                                },

                                onNewSaleClick = {
                                    navigateTo(AppScreen.NEW_SALE)
                                },

                                onSalesClick = {
                                    navigateTo(AppScreen.SALES_LIST)
                                },

                                onSyncClick = {
                                    navigateTo(AppScreen.SYNC)
                                },

                                onSettingsClick = {
                                    // Tela de configurações será implementada posteriormente.
                                },

                                modifier = Modifier.padding(innerPadding)
                            )
                        }

                        AppScreen.NEW_SALE -> {
                            NewSaleScreen(
                                eventModeEnabled = eventModeState.enabled,
                                eventName = selectedEvent?.name,

                                onBack = {
                                    navigateBack()
                                },

                                onSaveSale = {
                                    debtorName,
                                    amountInCents,
                                    note,
                                    isPaid,
                                    isDelivered ->

                                    val eventId = if (eventModeState.enabled) {
                                        selectedEvent?.localId
                                            ?: throw IllegalStateException(
                                                "Selecione um evento antes de registrar a venda."
                                            )
                                    } else {
                                        null
                                    }

                                    repository.registerSale(
                                        debtorName = if (eventId != null) {
                                            "Não identificado"
                                        } else {
                                            debtorName
                                        },
                                        amountInCents = amountInCents,
                                        note = note,
                                        eventId = eventId,
                                        isPaid = isPaid,
                                        isDelivered = isDelivered
                                    )

                                    navigateBack()

                                    Toast.makeText(
                                        context,
                                        "Venda salva neste aparelho!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                },

                                modifier = Modifier.padding(innerPadding)
                            )
                        }

                        AppScreen.SALES_LIST -> {
                            SalesListScreen(
                                sales = sales,

                                onBack = {
                                    navigateBack()
                                },

                                modifier = Modifier.padding(innerPadding)
                            )
                        }

                        AppScreen.SYNC -> {
                            SyncScreen(
                                pendingSalesCount = pendingCount,
                                progress = syncProgress,
                                isSyncing = isSyncing,

                                onBack = {
                                    if (!isSyncing) {
                                        navigateBack()
                                    }
                                },

                                onSync = { username, password ->

                                    if (isSyncing) return@SyncScreen

                                    syncProgress = SyncProgress()
                                    isSyncing = true

                                    coroutineScope.launch {
                                        try {
                                            val result = syncRepository.synchronize(
                                                username = username,
                                                password = password,
                                                onProgress = { progress ->
                                                    syncProgress = progress
                                                }
                                            )

                                            Toast.makeText(
                                                context,
                                                """
                                                Sincronização concluída!

                                                Novas: ${result.created}
                                                Já sincronizadas: ${result.alreadySynced}
                                                Com erro: ${result.failed}
                                                """.trimIndent(),
                                                Toast.LENGTH_LONG
                                            ).show()

                                        } catch (error: Exception) {

                                            android.util.Log.e(
                                                "PDV_SYNC",
                                                "Erro durante a sincronização",
                                                error
                                            )

                                            syncProgress = syncProgress.copy(
                                                phase = SyncPhase.FAILED,
                                                message = error.message
                                                    ?: "Erro durante a sincronização."
                                            )

                                            val message = when (error) {
                                                is java.net.SocketTimeoutException ->
                                                    "Tempo de conexão esgotado. Verifique o servidor e tente novamente."

                                                is java.net.ConnectException ->
                                                    "Não foi possível conectar ao servidor."

                                                else ->
                                                    error.message
                                                        ?: "Erro inesperado durante a sincronização."
                                            }

                                            Toast.makeText(
                                                context,
                                                message,
                                                Toast.LENGTH_LONG
                                            ).show()

                                        } finally {
                                            isSyncing = false
                                        }
                                    }
                                },

                                modifier = Modifier.padding(innerPadding)
                            )
                        }
                    }
                }
            }
        }
    }
}