export interface Serie {
  id: number;
  titulo: string;
  plataforma: string;
  temporadas: number;
  nota: number | null;
  concluida: number;
  createdAt: string;
}

export type CreateSerieInput = Pick<
  Serie,
  "titulo" | "plataforma" | "temporadas" | "nota"
>;
export type UpdateSerieInput = CreateSerieInput;
export type SerieFilter = "todas" | "assistindo" | "concluidas";
