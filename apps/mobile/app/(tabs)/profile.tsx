import { useCallback, useEffect, useState } from 'react';
import {
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
  Album,
  Crown,
  MapPin,
  Pencil,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react-native';
import {
  XP_PER_LEVEL,
  type City,
  type LeaderboardEntry,
} from '@metro/shared';
import { colors, lineColor } from '../../lib/theme';
import { SEED_LEADERBOARD } from '../../lib/data';
import {
  loadCheckIns,
  loadCompletions,
  loadOwnedCardIds,
  loadPlayer,
  savePlayer,
  type LocalPlayer,
} from '../../lib/player';
import { getSessionUserId, supabase } from '../../lib/supabase';

type BoardTab = 'friends' | 'city' | 'global';

const BOARD_TABS: { key: BoardTab; label: string }[] = [
  { key: 'friends', label: 'Friends' },
  { key: 'city', label: 'City' },
  { key: 'global', label: 'Global' },
];

export default function ProfileScreen() {
  const [player, setPlayer] = useState<LocalPlayer | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [tab, setTab] = useState<BoardTab>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  const refresh = useCallback(async () => {
    const [p, owned, checkIns, completions] = await Promise.all([
      loadPlayer(),
      loadOwnedCardIds(),
      loadCheckIns(),
      loadCompletions(),
    ]);
    setPlayer(p);
    setCardCount(owned.length);
    setCheckInCount(Object.keys(checkIns).length);
    setTasksDone(completions.length);
    return p;
  }, []);

  const loadBoard = useCallback(
    async (which: BoardTab, me: LocalPlayer | null) => {
      let remote: LeaderboardEntry[] | null = null;
      if (supabase) {
        try {
          let query = supabase
            .from('profiles')
            .select('id, username, primary_line, total_xp, level, avatar_url')
            .order('total_xp', { ascending: false })
            .limit(50);
          if (which === 'city' && me) query = query.eq('city', me.city);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            remote = data.map((row, i) => ({
              rank: i + 1,
              user_id: row.id as string,
              username: row.username as string,
              primary_line: (row.primary_line as string) ?? '',
              total_xp: row.total_xp as number,
              level: row.level as number,
              avatar_url: (row.avatar_url as string) ?? undefined,
            }));
          }
        } catch {
          remote = null;
        }
      }

      const base = remote ?? SEED_LEADERBOARD.slice(0, which === 'friends' ? 5 : 8);
      const list = base.map((e) => ({ ...e }));
      if (me) {
        const selfEntry: LeaderboardEntry = {
          rank: 0,
          user_id: 'me',
          username: me.username,
          primary_line: me.primary_line,
          total_xp: me.total_xp,
          level: me.level,
        };
        const existing = list.findIndex((e) => e.username === me.username);
        if (existing >= 0) list.splice(existing, 1);
        list.push(selfEntry);
      }
      list.sort((a, b) => b.total_xp - a.total_xp);
      list.forEach((e, i) => {
        e.rank = i + 1;
      });
      setEntries(list);
    },
    [],
  );

  useEffect(() => {
    void refresh().then((p) => loadBoard(tab, p ?? null));
  }, [refresh, tab, loadBoard]);

  const saveName = async () => {
    const name = draftName.trim();
    if (!name || !player) {
      setEditOpen(false);
      return;
    }
    const updated = await savePlayer({ ...player, username: name });
    setPlayer(updated);
    const userId = await getSessionUserId();
    if (supabase && userId) {
      try {
        await supabase.from('profiles').update({ username: name }).eq('id', userId);
      } catch {
        // saved locally
      }
    }
    setEditOpen(false);
    void loadBoard(tab, updated);
  };

  if (!player) return <SafeAreaView style={styles.container} />;

  const xpIntoLevel = player.total_xp % XP_PER_LEVEL;
  const levelPct = xpIntoLevel / XP_PER_LEVEL;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={(e) => `${tab}-${e.user_id}`}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {player.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.username}>@{player.username}</Text>
                  <Pressable
                    onPress={() => {
                      setDraftName(player.username);
                      setEditOpen(true);
                    }}
                    hitSlop={10}
                  >
                    <Pencil color={colors.muted} size={15} />
                  </Pressable>
                </View>
                <Text style={styles.levelText}>
                  Level {player.level} · {player.total_xp.toLocaleString()} XP
                </Text>
                <View style={styles.levelTrack}>
                  <View style={[styles.levelFill, { flex: Math.max(levelPct, 0.02) }]} />
                  <View style={{ flex: 1 - Math.max(levelPct, 0.02) }} />
                </View>
                <Text style={styles.levelHint}>
                  {XP_PER_LEVEL - xpIntoLevel} XP to level {player.level + 1}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.cityBadge}>
                    <MapPin color={colors.accent} size={12} />
                    <Text style={styles.badgeText}>{player.city}</Text>
                  </View>
                  {player.primary_line !== '' && (
                    <View
                      style={[
                        styles.cityBadge,
                        { borderColor: lineColor(player.primary_line) },
                      ]}
                    >
                      <ShieldCheck color={lineColor(player.primary_line)} size={12} />
                      <Text style={styles.badgeText}>{player.primary_line}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Stat icon={<Album color={colors.purple} size={18} />} label="Cards" value={cardCount} />
              <Stat icon={<MapPin color={colors.green} size={18} />} label="Check-ins" value={checkInCount} />
              <Stat icon={<Trophy color={colors.gold} size={18} />} label="Tasks" value={tasksDone} />
            </View>

            <View style={styles.boardTabs}>
              {BOARD_TABS.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.boardTab, tab === t.key && styles.boardTabActive]}
                  onPress={() => setTab(t.key)}
                >
                  <Text
                    style={[
                      styles.boardTabText,
                      tab === t.key && styles.boardTabTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isMe = item.user_id === 'me';
          return (
            <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
              <View style={styles.rankWrap}>
                {item.rank === 1 ? (
                  <Crown color={colors.gold} size={18} />
                ) : (
                  <Text style={styles.rankText}>{item.rank}</Text>
                )}
              </View>
              <View style={[styles.smallAvatar, isMe && { backgroundColor: colors.accent }]}>
                <Text style={styles.smallAvatarLetter}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.leaderMeta}>
                <Text style={styles.leaderName}>
                  {item.username}
                  {isMe ? ' (you)' : ''}
                </Text>
                <Text style={styles.leaderLine}>
                  Lv {item.level}
                  {item.primary_line ? ` · ${item.primary_line}` : ''}
                </Text>
              </View>
              <Text style={styles.leaderXp}>{item.total_xp.toLocaleString()}</Text>
            </View>
          );
        }}
      />

      <Modal visible={editOpen} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Edit Username</Text>
              <Pressable onPress={() => setEditOpen(false)} hitSlop={12}>
                <X color={colors.muted} size={22} />
              </Pressable>
            </View>
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Pressable style={styles.primaryButton} onPress={saveName}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.bg, fontSize: 32, fontWeight: '900' },
  profileMeta: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  username: { color: colors.text, fontSize: 19, fontWeight: '900' },
  levelText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  levelTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: 2,
  },
  levelFill: { backgroundColor: colors.accent, borderRadius: 999 },
  levelHint: { color: colors.muted, fontSize: 11 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  boardTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
    marginBottom: 14,
  },
  boardTab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  boardTabActive: { backgroundColor: colors.accent },
  boardTabText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  boardTabTextActive: { color: colors.bg },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  leaderRowMe: { borderColor: colors.accent },
  rankWrap: { width: 24, alignItems: 'center' },
  rankText: { color: colors.muted, fontWeight: '800', fontSize: 14 },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarLetter: { color: colors.text, fontWeight: '900', fontSize: 15 },
  leaderMeta: { flex: 1 },
  leaderName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  leaderLine: { color: colors.muted, fontSize: 11, marginTop: 2 },
  leaderXp: { color: colors.gold, fontWeight: '900', fontSize: 14 },
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
  nameInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
});
