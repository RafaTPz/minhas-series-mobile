import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL CHECK(length(trim(titulo)) > 0),
      plataforma TEXT NOT NULL CHECK(length(trim(plataforma)) > 0),
      temporadas INTEGER NOT NULL CHECK(temporadas >= 0),
      nota INTEGER CHECK(nota BETWEEN 1 AND 5),
      concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0, 1)),
      createdAt TEXT NOT NULL
    );
  `);
}

// Cache the promise, not just the connection: simultaneous calls share initialization.
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await openDatabaseAsync("minhas-series.db");
      try {
        await runMigrations(db);
        return db;
      } catch (error) {
        await db.closeAsync();
        throw error;
      }
    })().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
