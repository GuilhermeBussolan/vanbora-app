import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import { listMessages, markConversationRead, sendImageMessage, sendMessage } from '@/api/chat';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { ChatSocket } from '@/realtime/chatSocket';
import { MessageDto, NOTICE_EMOJIS } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Conversa individual em tempo real (WebSocket) — compartilhada pelos dois perfis. */
export default function ChatScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id, name, transporterId } = useLocalSearchParams<{
    id: string;
    name?: string;
    transporterId?: string;
  }>();
  const conversationId = Number(id);
  const { token, user, role } = useAppState();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  // Só o responsável tem um perfil público de transportador para abrir pelo chat.
  const canOpenProfile = role === 'guardian' && !!transporterId;

  function openProfile() {
    if (canOpenProfile) router.push(`/transporter/${transporterId}`);
  }

  async function sendImage() {
    if (!token) return;
    const file = await pickImage();
    if (!file) return;
    setSendingImage(true);
    try {
      appendMessage(await sendImageMessage(token, conversationId, file));
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao enviar a imagem.');
    } finally {
      setSendingImage(false);
    }
  }

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
      appendMessage({
        id: broadcast.id,
        text: broadcast.text,
        time: broadcast.time,
        fromMe,
        type: broadcast.type,
        mediaUrl: broadcast.mediaUrl,
      });
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
        <Pressable
          onPress={openProfile}
          disabled={!canOpenProfile}
          style={styles.headerPeer}
          hitSlop={6}
        >
          <Avatar name={name ?? 'Conversa'} size={40} />
          <View style={styles.headerInfo}>
            <Text style={typography.cardTitle}>{name ?? 'Conversa'}</Text>
            <Text style={[styles.status, connected ? styles.online : styles.offline]}>
              {connected ? 'Online' : 'Conectando…'}
            </Text>
          </View>
          {canOpenProfile ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          ) : null}
        </Pressable>
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
              {msg.type === 'IMAGE' && msg.mediaUrl ? (
                <Image source={{ uri: mediaUrl(msg.mediaUrl) }} style={styles.bubbleImage} />
              ) : (
                <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMine]}>
                  {msg.text}
                </Text>
              )}
              <Text style={[styles.time, msg.fromMe && styles.timeMine]}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        {showEmojis ? (
          <View style={styles.emojiBar}>
            {NOTICE_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setDraft((d) => d + emoji)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setShowEmojis((v) => !v)}
            hitSlop={6}
            accessibilityLabel="Emojis"
          >
            <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={sendImage}
            disabled={sendingImage}
            hitSlop={6}
            accessibilityLabel="Enviar foto"
          >
            <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setShowEmojis(false)}
            multiline
          />
          <Pressable
            style={styles.iconBtn}
            hitSlop={6}
            onPress={() => Alert.alert('Áudio', 'Gravação de áudio chega em breve.')}
            accessibilityLabel="Gravar áudio (em breve)"
          >
            <Ionicons name="mic-outline" size={22} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color={colors.textOnBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
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
  headerPeer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
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
  bubbleImage: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.border,
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
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  emojiBtn: { padding: spacing.sm },
  emoji: { fontSize: 26 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
