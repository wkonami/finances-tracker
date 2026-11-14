package com.wkonami.financestracker.domain.pix

import com.wkonami.financestracker.data.local.PixConfig
import java.util.Locale

object PixPayloadGenerator {

    fun generate(
        config: PixConfig,
        amountInCents: Long? = null
    ): String {

        require(config.isConfigured) {
            "Configure a chave Pix, o nome e a cidade do recebedor."
        }

        require(amountInCents == null || amountInCents > 0) {
            "O valor do Pix deve ser maior que zero."
        }

        val pixKey = config.pixKey.trim()
        val merchantName = config.merchantName.trim().uppercase()
        val merchantCity = config.merchantCity.trim().uppercase()

        require(merchantName.toByteArray(Charsets.UTF_8).size <= 25) {
            "O nome do recebedor deve ter no máximo 25 bytes."
        }

        require(merchantCity.toByteArray(Charsets.UTF_8).size <= 15) {
            "A cidade deve ter no máximo 15 bytes."
        }

        require(pixKey.toByteArray(Charsets.UTF_8).size <= 77) {
            "A chave Pix é muito longa."
        }

        // Informações da conta Pix
        val merchantAccountInformation =
            tlv("00", "BR.GOV.BCB.PIX") +
            tlv("01", pixKey)

        // Dados adicionais da transação
        val additionalData =
            tlv("05", "***")

        // Montagem do BR Code
        val payload = buildString {

            append(tlv("00", "01"))

            // QR Code estático
            append(tlv("01", "11"))

            // Conta Pix
            append(tlv("26", merchantAccountInformation))

            // Categoria do estabelecimento
            append(tlv("52", "0000"))

            // Moeda brasileira
            append(tlv("53", "986"))

            // Valor opcional
            if (amountInCents != null) {
                val amount = String.format(
                    Locale.US,
                    "%d.%02d",
                    amountInCents / 100,
                    amountInCents % 100
                )

                append(tlv("54", amount))
            }

            // País
            append(tlv("58", "BR"))

            // Nome do recebedor
            append(tlv("59", merchantName))

            // Cidade do recebedor
            append(tlv("60", merchantCity))

            // Identificador da transação
            append(tlv("62", additionalData))

            // Campo reservado para o CRC
            append("6304")
        }

        val crc = calculateCrc16(payload)

        return payload + crc
    }

    private fun tlv(
        id: String,
        value: String
    ): String {

        val length = value.toByteArray(Charsets.UTF_8).size

        require(length <= 99) {
            "Campo Pix excede o tamanho permitido."
        }

        return id +
            length.toString().padStart(2, '0') +
            value
    }

    private fun calculateCrc16(data: String): String {

        var crc = 0xFFFF

        for (byte in data.toByteArray(Charsets.UTF_8)) {

            crc = crc xor ((byte.toInt() and 0xFF) shl 8)

            repeat(8) {
                crc = if ((crc and 0x8000) != 0) {
                    (crc shl 1) xor 0x1021
                } else {
                    crc shl 1
                }

                crc = crc and 0xFFFF
            }
        }

        return crc.toString(16)
            .uppercase(Locale.ROOT)
            .padStart(4, '0')
    }
}