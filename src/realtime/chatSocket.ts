import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ChatBroadcastDto } from '@/types';
import { API_BASE_URL } from '@/api/client';

/** Deriva a URL do WebSocket (ws/wss) a partir da base HTTP da API. */
function wsUrl(): string {
  return API_BASE_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/ws';
}

interface Target {
  conversationId: number;
  onMessage: (msg: ChatBroadcastDto) => void;
}

/**
 * Wrapper fino do cliente STOMP para o chat em tempo real (WebSocket nativo, sem
 * SockJS). A assinatura é (re)feita sempre que a conexão é estabelecida — inclusive
 * após reconexão — garantindo entrega ao vivo enquanto a conversa está aberta.
 */
export class ChatSocket {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private target: Target | null = null;

  connect(token: string, onReady?: () => void): void {
    if (this.client) return;
    const client = new Client({
      webSocketFactory: () => new WebSocket(wsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        onReady?.();
        this.resubscribe();
      },
    });
    this.client = client;
    client.activate();
  }

  /** Define a conversa a ouvir; assina imediatamente se já conectado. */
  subscribeConversation(conversationId: number, onMessage: (msg: ChatBroadcastDto) => void): void {
    this.target = { conversationId, onMessage };
    this.resubscribe();
  }

  private resubscribe(): void {
    if (!this.client?.connected || !this.target) return;
    this.subscription?.unsubscribe();
    const { conversationId, onMessage } = this.target;
    this.subscription = this.client.subscribe(
      `/topic/conversations/${conversationId}`,
      (frame: IMessage) => {
        try {
          onMessage(JSON.parse(frame.body) as ChatBroadcastDto);
        } catch {
          /* ignora frame malformado */
        }
      },
    );
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.target = null;
    this.client?.deactivate();
    this.client = null;
  }
}
