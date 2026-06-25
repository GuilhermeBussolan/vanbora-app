import { ConversationDto, MessageDto } from '@/types';
import { apiFetch } from './client';

/** Lista as conversas do usuário autenticado. */
export function listConversations(token: string): Promise<ConversationDto[]> {
  return apiFetch<ConversationDto[]>('/api/conversations', { token });
}

/** [Responsável] Abre (ou reusa) a conversa com um transportador; devolve a conversa. */
export function startConversation(token: string, transporterId: number): Promise<ConversationDto> {
  return apiFetch<ConversationDto>('/api/conversations', {
    method: 'POST',
    body: { transporterId },
    token,
  });
}

/** Histórico de mensagens de uma conversa. */
export function listMessages(token: string, conversationId: number): Promise<MessageDto[]> {
  return apiFetch<MessageDto[]>(`/api/conversations/${conversationId}/messages`, { token });
}

/** Envia uma mensagem (persiste e dispara o broadcast em tempo real no servidor). */
export function sendMessage(
  token: string,
  conversationId: number,
  text: string,
): Promise<MessageDto> {
  return apiFetch<MessageDto>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { text },
    token,
  });
}

/** Marca a conversa como lida (zera as não lidas do usuário). */
export function markConversationRead(token: string, conversationId: number): Promise<void> {
  return apiFetch<void>(`/api/conversations/${conversationId}/read`, { method: 'POST', token });
}
