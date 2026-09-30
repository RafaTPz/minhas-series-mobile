import { useCallback, useRef, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  deleteSerie,
  getSerieById,
  toggleSerieConcluida,
} from "../src/database/serieRepository";
import type { Serie } from "../src/types/serie";
import {
  Button,
  errorMessage,
  Loading,
  Message,
  parseSerieId,
  Rating,
  Status,
} from "../src/components/ui";

export default function Detalhe() {
  const { id: param } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = parseSerieId(param);
  const [serie, setSerie] = useState<Serie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [retry, setRetry] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      (async () => {
        if (id === null) throw new Error("Identificador de série inválido.");
        const result = await getSerieById(id);
        if (active) setSerie(result);
      })()
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
    }, [id, retry]),
  );

  async function runAction(action: "toggle" | "delete") {
    if (id === null || actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    setError("");
    try {
      if (action === "delete") {
        await deleteSerie(id);
        router.dismissTo("/");
      } else {
        await toggleSerieConcluida(id);
        setSerie(await getSerieById(id));
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      actionLock.current = false;
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  function requestDelete() {
    if (Platform.OS === "web") {
      setConfirmDelete(true);
      return;
    }
    Alert.alert(
      "Excluir série?",
      `“${serie?.titulo}” será removida da sua coleção. Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => void runAction("delete"),
        },
      ],
    );
  }

  if (loading) return <Loading />;
  if (!serie)
    return (
      <View className="flex-1 bg-canvas p-6">
        <Message
          title={error ? "Não foi possível carregar" : "Série não encontrada"}
          action={
            <Button
              title={error ? "Tentar novamente" : "Voltar à coleção"}
              onPress={() =>
                error ? setRetry((v) => v + 1) : router.replace("/")
              }
            />
          }
        >
          {error || "Ela pode ter sido excluída. Volte para ver sua coleção."}
        </Message>
      </View>
    );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="mx-auto w-full max-w-2xl gap-6 px-6 pb-10 pt-6">
        <View className="gap-5 rounded-3xl border border-white/10 bg-panel p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted">
              Na sua coleção
            </Text>
            <Status concluida={serie.concluida} />
          </View>
          <Text className="text-4xl font-bold leading-tight text-white">
            {serie.titulo}
          </Text>
          <Text className="text-lg text-muted">{serie.plataforma}</Text>
          <View className="h-px bg-white/10" />
          <View className="flex-row justify-between gap-4">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-white">
                {serie.temporadas.toString().padStart(2, "0")}
              </Text>
              <Text className="text-sm text-muted">temporadas assistidas</Text>
            </View>
            <View className="justify-center gap-2">
              <Text className="text-sm text-muted">Sua avaliação</Text>
              <Rating nota={serie.nota} />
            </View>
          </View>
        </View>
        <View className="gap-2">
          <Text className="font-semibold text-white">
            Uma história no seu ritmo.
          </Text>
          <Text className="text-base leading-6 text-muted">
            {serie.concluida
              ? "Mais uma série finalizada! Você pode voltar a acompanhar se uma nova temporada chegar."
              : "Continue de onde parou. Atualize as temporadas e a nota sempre que quiser."}
          </Text>
        </View>
        {error ? (
          <Text accessibilityRole="alert" className="text-red-300">
            {error}
          </Text>
        ) : null}
        <View className="gap-3">
          <Button
            title={
              busy
                ? "Aguarde…"
                : serie.concluida
                  ? "Voltar para assistindo"
                  : "✓ Marcar como concluída"
            }
            onPress={() => void runAction("toggle")}
            disabled={busy}
          />
          <Button
            title="Editar série"
            secondary
            onPress={() =>
              router.push({
                pathname: "/form",
                params: { id: String(serie.id) },
              })
            }
            disabled={busy}
          />
        </View>
        <View className="gap-1">
          <Text className="text-xs text-muted">
            Adicionada em {new Date(serie.createdAt).toLocaleString("pt-BR")}
          </Text>
          <Text className="text-xs text-muted">Registro #{serie.id}</Text>
        </View>
        {confirmDelete ? (
          <Message
            title="Excluir série?"
            action={
              <View className="gap-3">
                <Button
                  danger
                  title="Confirmar exclusão"
                  disabled={busy}
                  onPress={() => void runAction("delete")}
                />
                <Button
                  secondary
                  title="Cancelar"
                  disabled={busy}
                  onPress={() => setConfirmDelete(false)}
                />
              </View>
            }
          >
            “{serie.titulo}” será removida. Essa ação não pode ser desfeita.
          </Message>
        ) : (
          <Button
            title="Excluir série"
            danger
            onPress={requestDelete}
            disabled={busy}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
