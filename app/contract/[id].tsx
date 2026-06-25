import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getContract, signContract } from '@/api/contracts';
import { listPaymentMethods, savePaymentMethod } from '@/api/payments';
import {
  CardInput,
  formatCardNumber,
  formatExpiry,
  tokenizeCard,
  validateCard,
} from '@/lib/fakeCardToken';
import { formatCurrency } from '@/data/mockData';
import { ContractDto, PaymentMethodDto, PaymentMethodType } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

const emptyCard: CardInput = { number: '', holder: '', expiry: '', cvv: '' };

/** Tela de contrato: revisar termos, cadastrar pagamento e assinar. */
export default function ContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = Number(id);
  const { token, setHasTransporter } = useAppState();

  const [contract, setContract] = useState<ContractDto | null>(null);
  const [methods, setMethods] = useState<PaymentMethodDto[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCardForm, setShowCardForm] = useState(false);
  const [card, setCard] = useState<CardInput>(emptyCard);
  const [cardType, setCardType] = useState<PaymentMethodType>('CREDIT_CARD');
  const [savingCard, setSavingCard] = useState(false);
  const [signing, setSigning] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [c, m] = await Promise.all([
        getContract(token, contractId),
        listPaymentMethods(token),
      ]);
      setContract(c);
      setMethods(m);
      setSelectedMethod((prev) => prev ?? m[0]?.id ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível carregar o contrato.');
    } finally {
      setLoading(false);
    }
  }, [token, contractId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddCard() {
    const validation = validateCard(card);
    if (validation) {
      setError(validation);
      return;
    }
    if (!token) return;
    setSavingCard(true);
    setError(null);
    try {
      // Tokeniza no cliente: o número do cartão NÃO vai para a API.
      const tokenized = tokenizeCard(card);
      const saved = await savePaymentMethod(token, { ...tokenized, type: cardType });
      setMethods((prev) => [saved, ...prev]);
      setSelectedMethod(saved.id);
      setShowCardForm(false);
      setCard(emptyCard);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o cartão.');
    } finally {
      setSavingCard(false);
    }
  }

  async function handleSign() {
    if (!token || !selectedMethod) return;
    setSigning(true);
    setError(null);
    try {
      await signContract(token, contractId, selectedMethod);
      setHasTransporter(true);
      Alert.alert('Contrato assinado!', 'A matrícula foi ativada e a primeira mensalidade foi processada.', [
        { text: 'OK', onPress: () => router.replace('/(guardian)/home') },
      ]);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao assinar o contrato.');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  const alreadyActive = contract?.status === 'ACTIVE';

  return (
    <Screen
      footer={
        !alreadyActive ? (
          <Button
            label="Assinar contrato"
            icon="create-outline"
            onPress={handleSign}
            loading={signing}
            disabled={!selectedMethod}
          />
        ) : undefined
      }
    >
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Contrato</Text>

      <Card style={styles.termsCard}>
        <Row label="Transportador" value={contract?.transporterName ?? '—'} />
        <Row label="Aluno" value={contract?.studentName ?? '—'} />
        <Row label="Escola" value={contract?.school ?? '—'} />
        <Row
          label="Mensalidade"
          value={contract ? formatCurrency(contract.monthlyFee) : '—'}
          strong
        />
      </Card>

      {alreadyActive ? (
        <Card style={styles.activeCard}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={styles.activeText}>Contrato já assinado e ativo.</Text>
        </Card>
      ) : (
        <>
          <Text style={[typography.sectionTitle, styles.section]}>Forma de pagamento</Text>

          <View style={styles.methods}>
            {methods.map((m) => {
              const selected = m.id === selectedMethod;
              return (
                <Pressable key={m.id} onPress={() => setSelectedMethod(m.id)}>
                  <Card style={StyleSheet.flatten([styles.methodCard, selected && styles.methodSelected])}>
                    <Ionicons
                      name={m.type === 'AUTO_DEBIT' ? 'sync-outline' : 'card-outline'}
                      size={20}
                      color={colors.textPrimary}
                    />
                    <View style={styles.flex}>
                      <Text style={styles.methodTitle}>
                        {m.brand} •••• {m.last4}
                      </Text>
                      <Text style={styles.methodSub}>
                        {m.type === 'AUTO_DEBIT' ? 'Débito automático' : 'Cartão de crédito'}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.brandDark : colors.textMuted}
                    />
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {showCardForm ? (
            <Card style={styles.formCard}>
              <View style={styles.typeRow}>
                {(['CREDIT_CARD', 'AUTO_DEBIT'] as PaymentMethodType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setCardType(t)}
                    style={[styles.typeChip, cardType === t && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeChipText, cardType === t && styles.typeChipTextActive]}>
                      {t === 'CREDIT_CARD' ? 'Crédito' : 'Débito automático'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Input
                icon="card-outline"
                placeholder="Número do cartão"
                keyboardType="number-pad"
                maxLength={23}
                value={card.number}
                onChangeText={(v) => setCard((c) => ({ ...c, number: formatCardNumber(v) }))}
                containerStyle={styles.field}
              />
              <Input
                icon="person-outline"
                placeholder="Nome impresso no cartão"
                autoCapitalize="characters"
                value={card.holder}
                onChangeText={(v) => setCard((c) => ({ ...c, holder: v }))}
                containerStyle={styles.field}
              />
              <View style={styles.inlineFields}>
                <Input
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={card.expiry}
                  onChangeText={(v) => setCard((c) => ({ ...c, expiry: formatExpiry(v) }))}
                  containerStyle={styles.flex}
                />
                <Input
                  placeholder="CVV"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={card.cvv}
                  onChangeText={(v) => setCard((c) => ({ ...c, cvv: v.replace(/\D/g, '') }))}
                  containerStyle={styles.flex}
                />
              </View>
              <Text style={styles.secureNote}>
                <Ionicons name="lock-closed" size={11} color={colors.textMuted} /> Os dados do cartão são
                tokenizados no aparelho — o VanBora nunca armazena o número.
              </Text>
              <Button
                label="Salvar cartão"
                onPress={handleAddCard}
                loading={savingCard}
                style={styles.saveCardBtn}
              />
            </Card>
          ) : (
            <Pressable onPress={() => setShowCardForm(true)} style={styles.addCard}>
              <Ionicons name="add-circle-outline" size={20} color={colors.brandDark} />
              <Text style={styles.addCardText}>Adicionar cartão / débito automático</Text>
            </Pressable>
          )}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.lg },
  termsCard: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowValueStrong: { fontSize: 18, fontWeight: '800', color: colors.brandDark },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  methods: { gap: spacing.sm },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodSelected: { borderColor: colors.brand, borderWidth: 2 },
  flex: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  methodSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  addCardText: { fontSize: 14, fontWeight: '600', color: colors.brandDark },
  formCard: { marginTop: spacing.sm, gap: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.textOnBrand },
  field: { marginTop: 0 },
  inlineFields: { flexDirection: 'row', gap: spacing.sm },
  secureNote: { fontSize: 11, color: colors.textMuted, lineHeight: 15, marginTop: spacing.xs },
  saveCardBtn: { height: 46, marginTop: spacing.sm },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  activeText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
