import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components';
import { useAppState } from '@/context/AppState';
import { listMessages, markConversationRead, sendMessage } from '@/api/chat';
import { ChatSocket } from '@/realtime/chatSocket';
import { MessageDto } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

/** Conversa individual em tempo real (WebSocket) — compartilhada pelos dois perfis. */
export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const conversationId = Number(id);
  const { token, user } = useAppState();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  // Anexa uma mensagem evitando duplicatas (o broadcast pode ecoar o próprio envio).
  const appendMessage = useCallback((msg: MessageDto) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  // Histórico (REST) + conexão/assinatura do WebSocket.
  useEffect(() => {
    if (!token || !conversationId) return;

    listMessages(token, conversationId).then(setMessages).catch(() => undefined);

    const socket = new ChatSocket();
    socketRef.current = socket;
    socket.connect(token, () => setConnected(true));
    socket.subscribeConversation(conversationId, (broadcast) => {
      const fromMe = broadcast.senderUserId === user?.id;
      appendMessage({ id: broadcast.id, text: broadcast.text, time: broadcast.time, fromMe });
      // Mensagem recebida com a conversa aberta = já lida (mantém o badge zerado).
      if (!fromMe) {
        markConversationRead(token, conversationId).catch(() => undefined);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, conversationId, user?.id, appendMessage]);

  async function send() {
    const text = draft.trim();
    if (!text || !token) return;
    setDraft('');
    try {
      const saved = await sendMessage(token, conversationId, text);
      appendMessage(saved); // imediato para o remetente; o eco do WS é deduplicado
    } catch {
      setDraft(text); // restaura o rascunho em caso de falha
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Avatar name={name ?? 'Conversa'} size={40} />
        <View style={styles.headerInfo}>
          <Text style={typography.cardTitle}>{name ?? 'Conversa'}</Text>
          <Text style={[styles.status, connected ? styles.online : styles.offline]}>
            {connected ? 'Online' : 'Conectando…'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}
            >
              <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMine]}>
                {msg.text}
              </Text>
              <Text style={[styles.time, msg.fromMe && styles.timeMine]}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color={colors.textOnBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {
    gap: 1,
  },
  status: {
    fontSize: 12,
  },
  online: {
    color: colors.success,
  },
  offline: {
    color: colors.textMuted,
  },
  messages: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  bubbleTextMine: {
    color: colors.textOnBrand,
  },
  time: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: colors.brandDark,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
