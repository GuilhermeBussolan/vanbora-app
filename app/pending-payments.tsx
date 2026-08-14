import React from 'react';
import { PaymentContactListScreen } from '@/components/finance/PaymentContactListScreen';
import { listPendingPayments } from '@/api/finance';
import { daysBetween } from '@/lib/dateDiff';

/** Lista de pagamentos dentro do prazo, com atalho pra ligar direto pro responsável. */
export default function PendingPaymentsScreen() {
  return (
    <PaymentContactListScreen
      title="Pendentes"
      emptyIcon="hourglass-outline"
      emptyText="Nenhum pagamento pendente no momento."
      fetcher={listPendingPayments}
      badgeFor={(dueDate) => {
        const daysUntil = -daysBetween(dueDate);
        const label = daysUntil === 0 ? 'Vence hoje' : `Vence em ${daysUntil} dia${daysUntil === 1 ? '' : 's'}`;
        return { label, tone: 'warning' };
      }}
    />
  );
}
