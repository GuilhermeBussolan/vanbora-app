import React from 'react';
import { Stack } from 'expo-router';

/**
 * Stack interno da aba Financeiro. A `Tabs` do rodapé (app/(transporter)/_layout.tsx)
 * continua montada — só o conteúdo do slot "Financeiro" ganha essas 5 sub-rotas.
 * `animation: 'none'` porque a troca entre elas deve parecer troca de aba, não drill-down.
 */
export default function FinanceInternalLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
