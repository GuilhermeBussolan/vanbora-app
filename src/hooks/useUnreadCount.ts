import { useEffect, useState } from 'react';
import { useAppState } from '@/context/AppState';
import { listConversations } from '@/api/chat';

const POLL_MS = 5000;

/**
 * Número de conversas com mensagens não lidas (estilo WhatsApp). Atualiza por
 * polling enquanto o usuário está logado, refletindo novas mensagens e leituras.
 */
export function useUnreadCount(): number {
  const { token } = useAppState();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }
    let active = true;

    const poll = () => {
      listConversations(token)
        .then((list) => {
          if (active) setCount(list.filter((c) => c.unread > 0).length);
        })
        .catch(() => undefined);
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  return count;
}
