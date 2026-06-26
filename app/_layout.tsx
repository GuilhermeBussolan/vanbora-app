import '@/lib/polyfills';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '@/context/AppState';
import { ThemeProvider, useTheme } from '@/theme';

/** Stack de navegação com cores/barra de status reativas ao tema ativo. */
function ThemedStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(guardian)" />
        <Stack.Screen name="(transporter)" />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="transporter/[id]" />
        <Stack.Screen name="contract/[id]" />
        <Stack.Screen name="add-dependent" />
        <Stack.Screen name="edit-dependent" />
        <Stack.Screen name="edit-address" />
        <Stack.Screen name="add-helper" />
        <Stack.Screen name="edit-helper" />
        <Stack.Screen name="edit-vehicle" />
        <Stack.Screen name="edit-service-area" />
        <Stack.Screen name="edit-pricing" />
        <Stack.Screen name="hire/[id]" />
        <Stack.Screen name="add-expense" />
        <Stack.Screen name="add-fuel" />
        <Stack.Screen name="finance-settings" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="notifications-settings" />
        <Stack.Screen name="appearance-settings" />
        <Stack.Screen name="report-absence" />
        <Stack.Screen name="attendance-history" />
        <Stack.Screen name="review-transporter" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="new-notice" />
        <Stack.Screen name="edit-notice" />
        <Stack.Screen name="notice-audience" />
        <Stack.Screen name="notice/[id]" />
        <Stack.Screen name="transporter-notice/[id]" />
        <Stack.Screen name="guardian-notices" />
      </Stack>
    </>
  );
}

/** Layout raiz: provedores globais + stack de navegação. */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppStateProvider>
            <ThemedStack />
          </AppStateProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
