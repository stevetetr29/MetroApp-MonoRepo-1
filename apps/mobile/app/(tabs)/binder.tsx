import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BellRing,
  Crown,
  Flame,
  Ghost,
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
import { CHAMPION_NAMES } from '../../lib/data';
import {
  fetchCards,
  grantCards,
  loadArNotify,
  loadOwnedCardIds,
  saveArNotify,
} from '../../lib/player';
import { getSessionUserId, isSupabaseConfigured, supabase } from '../../lib/supabase';

const CODE_PATTERN = /^[A-Z0-9]{8}$/;

/** Per-champion accent + icon for the hero silhouette. */
const CHAMPION_THEME: Record<
  string,
  { color: string; icon: typeof Flame }
> = {
  'Grand Central Dragon': { color: '#F59E0B', icon: Flame },
  'The Maglev Empress': { color: '#38BDF8', icon: Crown },
  'Express Phantom': { color: '#A855F7', icon: Ghost },
};

interface ChampionGroup {
  name: string;
  championCard: Card | undefined;
  members: Card[];
  unlocked: boolean;
}

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

  const groups: ChampionGroup[] = CHAMPION_NAMES.map((name) => {
    const members = cards.filter((c) => c.champion === name && c.name !== name);
    const championCard = cards.find((c) => c.name === name);
    return {
      name,
      championCard,
      members,
      unlocked: championCard ? ownedIds.includes(championCard.id) : false,
    };
  });

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

      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((group) => (
          <View key={group.name} style={styles.championSection}>
            <ChampionHero group={group} onRedeem={() => setRedeemOpen(true)} />
            <View style={styles.subGrid}>
              {group.members.map((card) => (
                <SubCard
                  key={card.id}
                  card={card}
                  owned={ownedIds.includes(card.id)}
                />
              ))}
            </View>
          </View>
        ))}

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
            <Text style={[styles.notifyText, arNotify && styles.notifyTextOn]}>
              {arNotify ? "We'll notify you" : 'Notify Me'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

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

// ── Champion hero card — colored when owned, silhouette when locked ──────────

function ChampionHero({
  group,
  onRedeem,
}: {
  group: ChampionGroup;
  onRedeem: () => void;
}) {
  const theme = CHAMPION_THEME[group.name] ?? { color: colors.accent, icon: Ghost };
  const Icon = theme.icon;
  const card = group.championCard;

  return (
    <View
      style={[
        styles.heroCard,
        { borderColor: group.unlocked ? theme.color : colors.border },
      ]}
    >
      {/* Artwork — real image when artwork_url exists, icon stand-in otherwise.
          Locked champions render as a black silhouette (tintColor / opacity). */}
      <View style={styles.heroArt}>
        {card?.artwork_url ? (
          <Image
            source={{ uri: card.artwork_url }}
            style={styles.heroImage}
            tintColor={group.unlocked ? undefined : '#000000'}
            resizeMode="cover"
          />
        ) : (
          <Icon
            color={group.unlocked ? theme.color : '#000000'}
            size={64}
            style={!group.unlocked ? { opacity: 0.5 } : undefined}
          />
        )}
        {!group.unlocked && <View style={styles.heroVeil} />}
        {!group.unlocked && (
          <View style={styles.heroLockOverlay}>
            <Lock color={colors.muted} size={18} />
            <Text style={styles.heroLockText}>Unlock via physical cards</Text>
          </View>
        )}
      </View>

      <View style={styles.heroMeta}>
        <Text style={styles.heroName}>{group.unlocked ? group.name : '???'}</Text>
        {card && (
          <Text style={[styles.heroRarity, { color: RARITY_COLORS[card.rarity] }]}>
            {card.rarity} Champion
          </Text>
        )}
        {group.unlocked && card ? (
          <Text style={styles.heroDesc} numberOfLines={3}>
            {card.description}
          </Text>
        ) : null}
        {group.unlocked && card && (
          <View style={styles.statRow}>
            <View style={styles.statBadge}>
              <Sword color={colors.red} size={12} />
              <Text style={styles.statText}>{card.attack}</Text>
            </View>
            <View style={styles.statBadge}>
              <Shield color={colors.accent} size={12} />
              <Text style={styles.statText}>{card.defense}</Text>
            </View>
          </View>
        )}
        {!group.unlocked && (
          <Pressable style={styles.heroRedeem} onPress={onRedeem}>
            <Ticket color={colors.bg} size={14} />
            <Text style={styles.heroRedeemText}>Redeem Scratch Code</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Set sub-card (collectible beneath each champion) ─────────────────────────

function SubCard({ card, owned }: { card: Card; owned: boolean }) {
  const rarityColor = RARITY_COLORS[card.rarity];
  return (
    <View
      style={[
        styles.subCard,
        { borderColor: owned ? rarityColor : colors.border },
        !owned && styles.subCardLocked,
      ]}
    >
      {owned ? (
        <>
          <Sparkles color={rarityColor} size={18} />
          <Text style={styles.subCardName} numberOfLines={2}>
            {card.name}
          </Text>
          <Text style={[styles.subCardRarity, { color: rarityColor }]}>
            {card.rarity}
          </Text>
          <View style={styles.subStatRow}>
            <View style={styles.statBadge}>
              <Sword color={colors.red} size={10} />
              <Text style={styles.subStatText}>{card.attack}</Text>
            </View>
            <View style={styles.statBadge}>
              <Shield color={colors.accent} size={10} />
              <Text style={styles.subStatText}>{card.defense}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <Lock color={colors.muted} size={18} />
          <Text style={styles.subCardNameLocked}>???</Text>
          <Text style={styles.subCardLockedHint}>{card.rarity}</Text>
        </>
      )}
    </View>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 20 },
  championSection: { gap: 10 },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  heroArt: {
    width: 132,
    minHeight: 150,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: { width: '100%', height: '100%' },
  heroVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroLockOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  heroLockText: { color: colors.muted, fontSize: 9, fontWeight: '700', flexShrink: 1 },
  heroMeta: { flex: 1, padding: 14, gap: 6 },
  heroName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  heroRarity: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroDesc: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
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
  heroRedeem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  heroRedeemText: { color: colors.bg, fontWeight: '800', fontSize: 11 },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subCard: {
    width: '31.5%',
    minHeight: 118,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  subCardLocked: { borderStyle: 'dashed', opacity: 0.75 },
  subCardName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
  },
  subCardRarity: { fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
  subStatRow: { flexDirection: 'row', gap: 5 },
  subStatText: { color: colors.text, fontWeight: '800', fontSize: 9 },
  subCardNameLocked: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  subCardLockedHint: { color: colors.muted, fontSize: 9 },
  arCard: {
    marginTop: 4,
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
