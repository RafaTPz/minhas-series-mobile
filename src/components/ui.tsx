import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-14 items-center justify-center rounded-2xl px-5 py-4 ${disabled ? "opacity-50" : "active:opacity-70"} ${danger ? "border border-red-400/30 bg-red-400/10" : secondary ? "border border-white/15 bg-panel" : "bg-accent"}`}
    >
      <Text
        className={`text-base font-bold ${danger ? "text-red-300" : secondary ? "text-white" : "text-canvas"}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas p-6">
      <ActivityIndicator color="#c5f277" size="large" />
      <Text className="text-muted">Carregando sua coleção…</Text>
    </View>
  );
}

export function Message({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View className="gap-4 rounded-3xl border border-white/10 bg-panel p-6">
      <Text className="text-xl font-bold text-white">{title}</Text>
      {children ? (
        <Text className="text-base leading-6 text-muted">{children}</Text>
      ) : null}
      {action}
    </View>
  );
}

export function Rating({ nota }: { nota: number | null }) {
  return (
    <Text
      accessibilityLabel={nota === null ? "Sem nota" : `Nota ${nota} de 5`}
      className="text-sm font-semibold text-accent"
    >
      {nota === null
        ? "Sem nota"
        : `${"★".repeat(nota)}${"☆".repeat(5 - nota)}  ${nota}/5`}
    </Text>
  );
}

export function Status({ concluida }: { concluida: number }) {
  return (
    <View
      className={`self-start rounded-full px-3 py-1.5 ${concluida ? "bg-accent/15" : "bg-sky-400/10"}`}
    >
      <Text
        className={`text-xs font-semibold ${concluida ? "text-accent" : "text-sky-300"}`}
      >
        {concluida ? "✓ Concluída" : "● Assistindo"}
      </Text>
    </View>
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível completar a operação. Tente novamente.";
}

export function parseSerieId(
  value: string | string[] | undefined,
): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
