package com.wkonami.financestracker.domain.pix

import android.graphics.Bitmap
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

object PixQrCodeGenerator {

    fun generate(
        payload: String,
        size: Int = 800
    ): Bitmap {

        val hints = mapOf(
            EncodeHintType.CHARACTER_SET to "UTF-8",
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 2
        )

        val bitMatrix = QRCodeWriter().encode(
            payload,
            BarcodeFormat.QR_CODE,
            size,
            size,
            hints
        )

        return Bitmap.createBitmap(
            size,
            size,
            Bitmap.Config.ARGB_8888
        ).apply {

            for (x in 0 until size) {
                for (y in 0 until size) {

                    setPixel(
                        x,
                        y,
                        if (bitMatrix[x, y]) {
                            android.graphics.Color.BLACK
                        } else {
                            android.graphics.Color.WHITE
                        }
                    )
                }
            }
        }
    }
}