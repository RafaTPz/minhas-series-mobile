import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return <><StatusBar style="light" /><Stack screenOptions={{ headerStyle: { backgroundColor: '#101412' }, headerTintColor: '#c5f277', contentStyle: { backgroundColor: '#101412' } }}><Stack.Screen name="index" options={{ title: 'Minhas Séries' }} /></Stack></>;
}
