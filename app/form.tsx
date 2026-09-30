import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createSerie,
  getSerieById,
  updateSerie,
} from "../src/database/serieRepository";
import {
  Button,
  errorMessage,
  Loading,
  Message,
  parseSerieId,
} from "../src/components/ui";

const inputClass =
  "min-h-14 rounded-2xl border border-white/15 bg-panel px-4 py-4 text-base text-white";

export default function Form() {
  const { id: param } = useLocalSearchParams<{ id?: string | string[] }>();
  const editing = param !== undefined;
  const id = parseSerieId(param);
  const [titulo, setTitulo] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [temporadas, setTemporadas] = useState("0");
  const [nota, setNota] = useState<number | null>(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!editing) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    (async () => {
      if (id === null) throw new Error("Identificador de série inválido.");
      const serie = await getSerieById(id);
      if (!serie) throw new Error("Essa série não foi encontrada.");
      if (active) {
        setTitulo(serie.titulo);
        setPlataforma(serie.plataforma);
        setTemporadas(String(serie.temporadas));
        setNota(serie.nota);
      }
    })()
      .catch((e: unknown) => {
        if (active) setLoadError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editing, id, retry]);

  async function save() {
    if (saveLock.current) return;
    setError("");
    if (!titulo.trim() || !plataforma.trim()) {
      setError("Preencha o título e a plataforma.");
      return;
    }
    const count = Number(temporadas);
    if (!/^\d+$/.test(temporadas.trim()) || !Number.isSafeInteger(count)) {
      setError("Informe um número inteiro de temporadas, a partir de zero.");
      return;
    }
    saveLock.current = true;
    setSaving(true);
    try {
      const input = {
        titulo: titulo.trim(),
        plataforma: plataforma.trim(),
        temporadas: count,
        nota,
      };
      if (editing) {
        if (id === null) throw new Error("Identificador inválido.");
        await updateSerie(id, input);
      } else await createSerie(input);
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (loadError)
    return (
      <View className="flex-1 bg-canvas p-6">
        <Message
          title="Não foi possível abrir a série"
          action={
            <Button
              title="Tentar novamente"
              onPress={() => setRetry((value) => value + 1)}
            />
          }
        >
          {loadError}
        </Message>
      </View>
    );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-canvas">
      <Stack.Screen
        options={{ title: editing ? "Editar série" : "Nova série" }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="mx-auto w-full max-w-2xl gap-6 px-6 pb-10 pt-6"
        >
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-accent">
              {editing ? "Atualize sua coleção" : "Mais uma boa história"}
            </Text>
            <Text className="text-3xl font-bold text-white">
              {editing ? "Cada episódio conta." : "O que você está vendo?"}
            </Text>
            <Text className="text-base leading-6 text-muted">
              Guarde seu progresso e dê a sua nota.
            </Text>
          </View>
          <View className="gap-2">
            <Text nativeID="titulo-label" className="font-semibold text-white">
              Título da série *
            </Text>
            <TextInput
              accessibilityLabel="Título da série"
              accessibilityLabelledBy="titulo-label"
              className={inputClass}
              placeholder="Ex.: Ruptura"
              placeholderTextColor="#728178"
              value={titulo}
              onChangeText={setTitulo}
              editable={!saving}
              maxLength={200}
            />
          </View>
          <View className="gap-2">
            <Text className="font-semibold text-white">Onde assistir *</Text>
            <TextInput
              accessibilityLabel="Plataforma"
              className={inputClass}
              placeholder="Ex.: Apple TV+, Netflix, Max"
              placeholderTextColor="#728178"
              value={plataforma}
              onChangeText={setPlataforma}
              editable={!saving}
              maxLength={100}
            />
          </View>
          <View className="gap-2">
            <Text className="font-semibold text-white">
              Temporadas assistidas *
            </Text>
            <TextInput
              accessibilityLabel="Temporadas assistidas"
              className={inputClass}
              keyboardType="numeric"
              value={temporadas}
              onChangeText={setTemporadas}
              editable={!saving}
              maxLength={7}
            />
            <Text className="text-sm text-muted">
              Ainda no primeiro episódio? Pode deixar em zero.
            </Text>
          </View>
          <View className="gap-3">
            <Text className="font-semibold text-white">
              Sua avaliação{" "}
              <Text className="font-normal text-muted">· opcional</Text>
            </Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`Nota ${value}`}
                  accessibilityState={{
                    selected: nota === value,
                    disabled: saving,
                  }}
                  disabled={saving}
                  onPress={() => setNota(nota === value ? null : value)}
                  className={`min-h-14 flex-1 items-center justify-center rounded-xl border py-3 ${nota !== null && value <= nota ? "border-accent/50 bg-accent/15" : "border-white/10 bg-panel"}`}
                >
                  <Text
                    className={`text-xl ${nota !== null && value <= nota ? "text-accent" : "text-muted"}`}
                  >
                    ★
                  </Text>
                  <Text className="text-xs text-muted">{value}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-sm text-muted">
              {nota === null
                ? "Sem nota por enquanto."
                : `${nota} de 5 · Toque na mesma nota para remover.`}
            </Text>
          </View>
          {error ? (
            <Text
              accessibilityRole="alert"
              className="rounded-xl bg-red-400/10 p-4 text-red-300"
            >
              {error}
            </Text>
          ) : null}
          <Button
            title={
              saving
                ? "Salvando…"
                : editing
                  ? "Salvar alterações"
                  : "Adicionar à coleção"
            }
            onPress={() => void save()}
            disabled={saving}
          />
          <Text className="text-center text-xs leading-5 text-muted">
            Seus dados ficam salvos neste dispositivo.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
