import { getDatabase } from "./database";
import type {
  CreateSerieInput,
  Serie,
  SerieFilter,
  UpdateSerieInput,
} from "../types/serie";

function validateInput(input: CreateSerieInput): CreateSerieInput {
  const titulo = input.titulo.trim();
  const plataforma = input.plataforma.trim();
  if (!titulo || !plataforma)
    throw new Error("Preencha o título e a plataforma.");
  if (!Number.isSafeInteger(input.temporadas) || input.temporadas < 0) {
    throw new Error(
      "Temporadas deve ser um número inteiro maior ou igual a zero.",
    );
  }
  if (
    input.nota !== null &&
    (!Number.isInteger(input.nota) || input.nota < 1 || input.nota > 5)
  ) {
    throw new Error("A nota deve estar entre 1 e 5.");
  }
  return { ...input, titulo, plataforma };
}

export async function getSeries(filtro: SerieFilter): Promise<Serie[]> {
  const db = await getDatabase();
  if (filtro === "todas")
    return db.getAllAsync<Serie>(
      "SELECT * FROM series ORDER BY createdAt DESC, id DESC",
    );
  return db.getAllAsync<Serie>(
    "SELECT * FROM series WHERE concluida = ? ORDER BY createdAt DESC, id DESC",
    filtro === "concluidas" ? 1 : 0,
  );
}

export async function getSerieById(id: number): Promise<Serie | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Serie>("SELECT * FROM series WHERE id = ?", id);
}

export async function createSerie(input: CreateSerieInput): Promise<Serie> {
  const values = validateInput(input);
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    "INSERT INTO series (titulo, plataforma, temporadas, nota, concluida, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    values.titulo,
    values.plataforma,
    values.temporadas,
    values.nota,
    0,
    createdAt,
  );
  return { ...values, id: result.lastInsertRowId, concluida: 0, createdAt };
}

export async function updateSerie(
  id: number,
  input: UpdateSerieInput,
): Promise<void> {
  const values = validateInput(input);
  const db = await getDatabase();
  const result = await db.runAsync(
    "UPDATE series SET titulo = ?, plataforma = ?, temporadas = ?, nota = ? WHERE id = ?",
    values.titulo,
    values.plataforma,
    values.temporadas,
    values.nota,
    id,
  );
  if (!result.changes) throw new Error("Série não encontrada.");
}

export async function toggleSerieConcluida(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "UPDATE series SET concluida = CASE WHEN concluida = 0 THEN 1 ELSE 0 END WHERE id = ?",
    id,
  );
  if (!result.changes) throw new Error("Série não encontrada.");
}

export async function deleteSerie(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM series WHERE id = ?", id);
}
