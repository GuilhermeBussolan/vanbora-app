import {
  AudienceRecipient,
  GuardianNoticeDto,
  NoticeCommentDto,
  NoticePriority,
  TransporterNoticeDto,
} from '@/types';
import { apiFetch } from './client';

export interface NoticeInput {
  title: string | null;
  message: string;
  publishInHours: number | null;
  allowComments: boolean;
  priority: NoticePriority;
  /** null/vazio = todos; senão, ids de GuardianProfile selecionados. */
  recipientGuardianIds: number[] | null;
}

// ----- Transportador -----

export function listMyNotices(token: string): Promise<TransporterNoticeDto[]> {
  return apiFetch<TransporterNoticeDto[]>('/api/transporters/me/notices', { token });
}

/** Possíveis destinatários (responsáveis com matrícula ativa) para segmentar. */
export function getAudience(token: string): Promise<AudienceRecipient[]> {
  return apiFetch<AudienceRecipient[]>('/api/transporters/me/audience', { token });
}

export function getMyNotice(token: string, id: number): Promise<TransporterNoticeDto> {
  return apiFetch<TransporterNoticeDto>(`/api/transporters/me/notices/${id}`, { token });
}

export function createNotice(token: string, input: NoticeInput): Promise<TransporterNoticeDto> {
  return apiFetch<TransporterNoticeDto>('/api/transporters/me/notices', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateNotice(token: string, id: number, input: NoticeInput): Promise<TransporterNoticeDto> {
  return apiFetch<TransporterNoticeDto>(`/api/transporters/me/notices/${id}`, {
    method: 'PUT',
    body: input,
    token,
  });
}

export function deleteNotice(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/notices/${id}`, { method: 'DELETE', token });
}

export function listTransporterComments(token: string, id: number): Promise<NoticeCommentDto[]> {
  return apiFetch<NoticeCommentDto[]>(`/api/transporters/me/notices/${id}/comments`, { token });
}

/** [Transportador] Modera (exclui) qualquer comentário do próprio aviso. */
export function moderateComment(token: string, noticeId: number, commentId: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/notices/${noticeId}/comments/${commentId}`, {
    method: 'DELETE',
    token,
  });
}

// ----- Responsável -----

export function listGuardianNotices(token: string): Promise<GuardianNoticeDto[]> {
  return apiFetch<GuardianNoticeDto[]>('/api/guardians/me/notices', { token });
}

export function getGuardianNotice(token: string, id: number): Promise<GuardianNoticeDto> {
  return apiFetch<GuardianNoticeDto>(`/api/guardians/me/notices/${id}`, { token });
}

export function setReaction(token: string, id: number, emoji: string): Promise<GuardianNoticeDto> {
  return apiFetch<GuardianNoticeDto>(`/api/guardians/me/notices/${id}/reaction`, {
    method: 'PUT',
    body: { emoji },
    token,
  });
}

export function removeReaction(token: string, id: number): Promise<GuardianNoticeDto> {
  return apiFetch<GuardianNoticeDto>(`/api/guardians/me/notices/${id}/reaction`, {
    method: 'DELETE',
    token,
  });
}

export function listGuardianComments(token: string, id: number): Promise<NoticeCommentDto[]> {
  return apiFetch<NoticeCommentDto[]>(`/api/guardians/me/notices/${id}/comments`, { token });
}

export function addComment(token: string, id: number, text: string): Promise<NoticeCommentDto> {
  return apiFetch<NoticeCommentDto>(`/api/guardians/me/notices/${id}/comments`, {
    method: 'POST',
    body: { text },
    token,
  });
}

/** [Responsável] Exclui o próprio comentário. */
export function deleteOwnComment(token: string, noticeId: number, commentId: number): Promise<void> {
  return apiFetch<void>(`/api/guardians/me/notices/${noticeId}/comments/${commentId}`, {
    method: 'DELETE',
    token,
  });
}
