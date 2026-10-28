import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BellRing,
  Lock,
  ScanLine,
  Shield,
  Sparkles,
  Sword,
  Ticket,
  X,
} from 'lucide-react-native';
import { RARITY_COLORS, type Card } from '@metro/shared';
import { colors } from '../../lib/theme';
import {
  fetchCards,
  grantCards,
  loadArNotify,
  loadOwnedCardIds,
  saveArNotify,
} from '../../lib/player';
import { getSessionUserId, isSupabaseConfigured, supabase } from '../../lib/supabase';

const CODE_PATTERN = /^[A-Z0-9]{8}$/;

export default function BinderScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [arNotify, setArNotify] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([fetchCards(), loadOwnedCardIds()]).then(([catalog, owned]) => {
      setCards(catalog);
      setOwnedIds(owned);
    });
    loadArNotify().then(setArNotify);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const redeem = async () => {
    const normalized = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) {
      Alert.alert('Invalid code', 'Scratch codes are 8 characters: A–Z and 0–9.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      Alert.alert(
        'Offline',
        'Code redemption needs a connection to the game server. The rest of your binder still works offline.',
      );
      return;
    }
    setRedeeming(true);
    try {
      const userId = await getSessionUserId();
      if (!userId) {
        Alert.alert('Sign in required', 'Sign in to redeem physical card codes.');
        return;
      }
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        p_code: normalized,
        p_user_id: userId,
      });
      if (error || !data) {
        Alert.alert(
          'Code rejected',
          'That code is invalid or has already been redeemed.',
        );
        return;
      }
      const cardId = data as string;
      const card = cards.find((c) => c.id === cardId);
      await grantCards([cardId]);
      setOwnedIds(await loadOwnedCardIds());
      setRedeemOpen(false);
      setCode('');
      Alert.alert(
        'Card unlocked!',
        card ? `${card.name} (${card.rarity}) added to your binder.` : 'Card added to your binder.',
      );
    } catch {
      Alert.alert('Network error', 'Could not reach the server. Try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const toggleArNotify = async () => {
    const next = !arNotify;
    setArNotify(next);
    await saveArNotify(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Card Binder</Text>
          <Text style={styles.subheading}>
            {ownedIds.length} / {cards.length} digital twins collected
          </Text>
        </View>
        <Pressable style={styles.redeemButton} onPress={() => setRedeemOpen(true)}>
          <Ticket color={colors.bg} size={16} />
          <Text style={styles.redeemButtonText}>Redeem Code</Text>
        </Pressable>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        ListFooterComponent={
          <View style={styles.arCard}>
            <ScanLine color={colors.accent} size={32} />
            <Text style={styles.arTitle}>AR Card Scanner</Text>
            <Text style={styles.arSubtitle}>
              Coming Soon — point your camera at a physical card to summon its
              digital twin.
            </Text>
            <Pressable
              style={[styles.notifyButton, arNotify && styles.notifyButtonOn]}
              onPress={toggleArNotify}
            >
              {arNotify ? (
                <BellRing color={colors.bg} size={16} />
              ) : (
                <Bell color={colors.text} size={16} />
              )}
              <Text
                style={[styles.notifyText, arNotify && styles.notifyTextOn]}
              >
                {arNotify ? "We'll notify you" : 'Notify Me'}
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const owned = ownedIds.includes(item.id);
          const rarityColor = RARITY_COLORS[item.rarity];
          return (
            <View
              style={[
                styles.cardTile,
                { borderColor: owned ? rarityColor : colors.border },
                !owned && styles.cardTileLocked,
              ]}
            >
              {owned ? (
                <>
                  <Sparkles color={rarityColor} size={26} />
                  <Text style={styles.cardName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardRarity, { color: rarityColor }]}>
                    {item.rarity}
                  </Text>
                  <View style={styles.statRow}>
                    <View style={styles.statBadge}>
                      <Sword color={colors.red} size={11} />
                      <Text style={styles.statText}>{item.attack}</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Shield color={colors.accent} size={11} />
                      <Text style={styles.statText}>{item.defense}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Lock color={colors.muted} size={26} />
                  <Text style={styles.cardNameLocked}>???</Text>
                  <Text style={styles.cardLockedHint}>Locked</Text>
                </>
              )}
            </View>
          );
        }}
      />

      <Modal visible={redeemOpen} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Redeem Scratch Code</Text>
              <Pressable onPress={() => setRedeemOpen(false)} hitSlop={12}>
                <X color={colors.muted} size={22} />
              </Pressable>
            </View>
            <Text style={styles.dialogBody}>
              Enter the 8-character code from your physical card pack.
            </Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="e.g. K7F2D9QW"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            <Pressable
              style={[styles.primaryButton, redeeming && { opacity: 0.6 }]}
              onPress={redeem}
              disabled={redeeming}
            >
              <Text style={styles.primaryButtonText}>
                {redeeming ? 'Redeeming…' : 'Redeem'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900' },
  subheading: { color: colors.muted, fontSize: 13, marginTop: 4 },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  redeemButtonText: { color: colors.bg, fontWeight: '800', fontSize: 12 },
  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  gridRow: { gap: 12, marginBottom: 12 },
  cardTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    minHeight: 168,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardTileLocked: { borderStyle: 'dashed' },
  cardName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  cardRarity: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  cardNameLocked: { color: colors.muted, fontWeight: '800', fontSize: 14 },
  cardLockedHint: { color: colors.muted, fontSize: 11 },
  statRow: { flexDirection: 'row', gap: 8 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statText: { color: colors.text, fontWeight: '800', fontSize: 11 },
  arCard: {
    marginTop: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  arTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  arSubtitle: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  notifyButtonOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  notifyText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  notifyTextOn: { color: colors.bg },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  dialogBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  codeInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
});
