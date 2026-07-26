import { ConversationDto, MessageDto } from '@/types';
import { apiFetch, apiUpload, UploadFile } from './client';

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

/** Envia uma imagem na conversa (multipart). */
export function sendImageMessage(
  token: string,
  conversationId: number,
  file: UploadFile,
): Promise<MessageDto> {
  return apiUpload<MessageDto>(`/api/conversations/${conversationId}/messages/image`, file, token);
}

/** Marca a conversa como lida (zera as não lidas do usuário). */
export function markConversationRead(token: string, conversationId: number): Promise<void> {
  return apiFetch<void>(`/api/conversations/${conversationId}/read`, { method: 'POST', token });
}
