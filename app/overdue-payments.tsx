import React from 'react';
import { PaymentContactListScreen } from '@/components/finance/PaymentContactListScreen';
import { listOverduePayments } from '@/api/finance';
import { daysBetween } from '@/lib/dateDiff';

/** Lista de pagamentos vencidos, com atalho pra ligar direto pro responsável. */
export default function OverduePaymentsScreen() {
  return (
    <PaymentContactListScreen
      title="Inadimplentes"
      emptyIcon="checkmark-done-circle-outline"
      emptyText="Nenhum pagamento vencido no momento."
      fetcher={listOverduePayments}
      badgeFor={(dueDate) => {
        const days = daysBetween(dueDate);
        return { label: `${days} dia${days === 1 ? '' : 's'} em atraso`, tone: 'danger' };
      }}
    />
  );
}
