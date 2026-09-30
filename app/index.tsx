import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSeries } from "../src/database/serieRepository";
import type { Serie, SerieFilter } from "../src/types/serie";
import {
  Button,
  errorMessage,
  Loading,
  Message,
  Rating,
  Status,
} from "../src/components/ui";

const filters: { value: SerieFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "assistindo", label: "Assistindo" },
  { value: "concluidas", label: "Concluídas" },
];

export default function Index() {
  const [filtro, setFiltro] = useState<SerieFilter>("todas");
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // The list stays mounted under the form; reload every time it regains focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      getSeries(filtro)
        .then((result) => {
          if (active) setSeries(result);
        })
        .catch((e: unknown) => {
          if (active) setError(errorMessage(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // retry intentionally invalidates this focus callback after a failed query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtro, retry]),
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-canvas">
      <View className="mx-auto w-full max-w-2xl flex-1 px-6">
        <View className="gap-3 pb-6 pt-7">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-accent" />
            <Text className="text-xs font-bold uppercase tracking-widest text-accent">
              Seu diário de maratonas
            </Text>
          </View>
          <Text className="text-4xl font-bold tracking-tight text-white">
            Boas histórias.{"\n"}Todas aqui.
          </Text>
          <Text className="text-base leading-6 text-muted">
            Acompanhe, avalie e guarde suas séries favoritas.
          </Text>
        </View>
        <View className="mb-5 flex-row gap-2 rounded-2xl bg-panel p-1.5">
          {filters.map((filter) => (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityState={{ selected: filtro === filter.value }}
              onPress={() => setFiltro(filter.value)}
              className={`min-h-12 flex-1 items-center justify-center rounded-xl px-2 py-3 ${filtro === filter.value ? "bg-accent" : "bg-panel"}`}
            >
              <Text
                className={`text-sm font-bold ${filtro === filter.value ? "text-canvas" : "text-muted"}`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-muted">
            Sua coleção
          </Text>
          <Text className="text-xs text-muted">
            {loading
              ? "Carregando…"
              : error
                ? "Indisponível"
                : `${series.length} ${series.length === 1 ? "série" : "séries"}`}
          </Text>
        </View>
        {loading ? (
          <Loading />
        ) : error ? (
          <View className="flex-1">
            <Message
              title="Não foi possível carregar"
              action={
                <Button
                  title="Tentar novamente"
                  onPress={() => setRetry((v) => v + 1)}
                />
              }
            >
              {error}
            </Message>
          </View>
        ) : (
          <FlatList
            data={series}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-3 pb-5"
            ListEmptyComponent={
              <Message
                title={
                  filtro === "todas"
                    ? "Sua próxima maratona começa aqui."
                    : "Nenhuma série por aqui ainda."
                }
              >
                {filtro === "todas"
                  ? "Adicione sua primeira série para acompanhar cada temporada."
                  : filtro === "concluidas"
                    ? "As séries que você finalizar aparecem aqui."
                    : "Adicione uma série ou volte a acompanhar uma já concluída."}
              </Message>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.titulo}`}
                onPress={() =>
                  router.push({
                    pathname: "/detalhe",
                    params: { id: String(item.id) },
                  })
                }
                className={`gap-4 rounded-3xl border p-5 active:opacity-70 ${item.concluida ? "border-accent/25 bg-accent/5" : "border-white/10 bg-panel"}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-xl font-bold text-white">
                      {item.titulo}
                    </Text>
                    <Text className="text-sm text-muted">
                      {item.plataforma} · {item.temporadas}{" "}
                      {item.temporadas === 1 ? "temporada" : "temporadas"}
                    </Text>
                  </View>
                  <Text className="text-2xl text-muted">›</Text>
                </View>
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <Status concluida={item.concluida} />
                  <Rating nota={item.nota} />
                </View>
              </Pressable>
            )}
          />
        )}
        <View className="pb-4 pt-3">
          <Button title="+ Nova série" onPress={() => router.push("/form")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
