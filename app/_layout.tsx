import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#101412" },
          headerTintColor: "#c5f277",
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#101412" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Minhas Séries", headerShown: false }}
        />
        <Stack.Screen name="form" options={{ title: "Nova série" }} />
        <Stack.Screen name="detalhe" options={{ title: "Sua série" }} />
      </Stack>
    </>
  );
}
