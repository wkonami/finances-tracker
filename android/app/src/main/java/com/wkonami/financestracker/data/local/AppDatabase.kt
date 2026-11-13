package com.wkonami.financestracker.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

class DatabaseConverters {

    @TypeConverter
    fun fromSyncStatus(value: SyncStatus): String {
        return value.name
    }

    @TypeConverter
    fun toSyncStatus(value: String): SyncStatus {
        return SyncStatus.valueOf(value)
    }
}

@Database(
    entities = [
        SaleEntity::class,
        EventEntity::class
    ],
    version = 3,
    exportSchema = true
)
@TypeConverters(DatabaseConverters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun saleDao(): SaleDao

    abstract fun eventDao(): EventDao

    companion object {

        @Volatile
        private var INSTANCE: AppDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {

            override fun migrate(db: SupportSQLiteDatabase) {

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS events (
                        localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        externalId TEXT NOT NULL,
                        name TEXT NOT NULL,
                        location TEXT,
                        startDate INTEGER,
                        endDate INTEGER,
                        createdAt INTEGER NOT NULL,
                        syncStatus TEXT NOT NULL,
                        syncError TEXT,
                        syncedAt INTEGER
                    )
                """.trimIndent())

                db.execSQL("""
                    CREATE UNIQUE INDEX IF NOT EXISTS
                    index_events_externalId
                    ON events(externalId)
                """.trimIndent())

                db.execSQL("""
                    CREATE INDEX IF NOT EXISTS
                    index_events_syncStatus
                    ON events(syncStatus)
                """.trimIndent())

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS sales_new (
                        localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        externalId TEXT NOT NULL,
                        debtorName TEXT NOT NULL,
                        amountInCents INTEGER NOT NULL,
                        note TEXT,
                        eventId INTEGER,
                        createdAt INTEGER NOT NULL,
                        syncStatus TEXT NOT NULL,
                        syncError TEXT,
                        syncedAt INTEGER,
                        FOREIGN KEY(eventId)
                            REFERENCES events(localId)
                            ON UPDATE NO ACTION
                            ON DELETE RESTRICT
                    )
                """.trimIndent())

                db.execSQL("""
                    INSERT INTO sales_new (
                        localId,
                        externalId,
                        debtorName,
                        amountInCents,
                        note,
                        eventId,
                        createdAt,
                        syncStatus,
                        syncError,
                        syncedAt
                    )
                    SELECT
                        localId,
                        externalId,
                        debtorName,
                        amountInCents,
                        note,
                        NULL,
                        createdAt,
                        syncStatus,
                        syncError,
                        syncedAt
                    FROM sales
                """.trimIndent())

                db.execSQL("DROP TABLE sales")

                db.execSQL("ALTER TABLE sales_new RENAME TO sales")

                db.execSQL("""
                    CREATE UNIQUE INDEX IF NOT EXISTS
                    index_sales_externalId
                    ON sales(externalId)
                """.trimIndent())

                db.execSQL("""
                    CREATE INDEX IF NOT EXISTS
                    index_sales_syncStatus
                    ON sales(syncStatus)
                """.trimIndent())

                db.execSQL("""
                    CREATE INDEX IF NOT EXISTS
                    index_sales_eventId
                    ON sales(eventId)
                """.trimIndent())
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {

            override fun migrate(db: SupportSQLiteDatabase) {

                db.execSQL("""
                    ALTER TABLE sales
                    ADD COLUMN isPaid INTEGER NOT NULL DEFAULT 1
                """.trimIndent())

                db.execSQL("""
                    ALTER TABLE sales
                    ADD COLUMN isDelivered INTEGER NOT NULL DEFAULT 1
                """.trimIndent())
            }
        }

        fun getDatabase(context: Context): AppDatabase {

            return INSTANCE ?: synchronized(this) {

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "finances_tracker.db"
                )
                    .addMigrations(
                        MIGRATION_1_2,
                        MIGRATION_2_3
                    )
                    .build()

                INSTANCE = instance

                instance
            }
        }
    }
}