package com.wkonami.financestracker.data.local

data class PixConfig(
    val pixKey: String = "",
    val merchantName: String = "",
    val merchantCity: String = ""
) {
    val isConfigured: Boolean
        get() = pixKey.isNotBlank() &&
            merchantName.isNotBlank() &&
            merchantCity.isNotBlank()
}