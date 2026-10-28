import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarClock,
  Crown,
  LogOut,
  ShieldCheck,
  Swords,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import {
  CITIES,
  CITY_SHORT,
  LINE_COLORS,
  LINE_EVENTS,
  type City,
  type LineStanding,
} from '@metro/shared';
import { colors } from '../../lib/theme';
import { FACTION_BASE_XP, FACTIONS } from '../../lib/data';
import { loadPlayer, savePlayer } from '../../lib/player';
import { getSessionUserId, supabase } from '../../lib/supabase';

export default function LineWarsScreen() {
  const [city, setCity] = useState<City>('NYC');
  const [myLine, setMyLine] = useState('');
  const [standings, setStandings] = useState<LineStanding[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStandings = useCallback(
    async (selectedCity: City, playerLine: string, playerXp: number) => {
      // Remote standings first; fall back to seed baseline + local player XP.
      let remote: LineStanding[] | null = null;
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('get_line_leaderboard', {
            p_city: selectedCity,
          });
          if (!error && data && data.length > 0) remote = data as LineStanding[];
        } catch {
          remote = null;
        }
      }
      const base = remote ?? [];
      const lines = FACTIONS[selectedCity];
      const merged: LineStanding[] = lines.map((line) => {
        const found = base.find((s) => s.line_name === line);
        const seed = found
          ? Number(found.weekly_xp)
          : (FACTION_BASE_XP[line] ?? 3000);
        return {
          line_name: line,
          city: selectedCity,
          weekly_xp: seed + (line === playerLine ? playerXp : 0),
          rank: 0,
        };
      });
      merged.sort((a, b) => b.weekly_xp - a.weekly_xp);
      merged.forEach((s, i) => {
        s.rank = i + 1;
      });
      setStandings(merged);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    loadPlayer().then((player) => {
      setCity(player.city);
      setMyLine(player.primary_line);
      void loadStandings(player.city, player.primary_line, player.total_xp);
    });
  }, [loadStandings]);

  const joinLine = async (line: string) => {
    const player = await loadPlayer();
    const updated = await savePlayer({ ...player, primary_line: line, city });
    setMyLine(line);
    const userId = await getSessionUserId();
    if (supabase && userId) {
      try {
        await supabase
          .from('profiles')
          .update({ primary_line: line, city })
          .eq('id', userId);
      } catch {
        // stored locally — syncs next session
      }
    }
    void loadStandings(city, updated.primary_line, updated.total_xp);
  };

  const leaveLine = async () => {
    const player = await loadPlayer();
    const updated = await savePlayer({ ...player, primary_line: '' });
    setMyLine('');
    const userId = await getSessionUserId();
    if (supabase && userId) {
      try {
        await supabase
          .from('profiles')
          .update({ primary_line: '' })
          .eq('id', userId);
      } catch {
        // stored locally — syncs next session
      }
    }
    void loadStandings(city, '', updated.total_xp);
  };

  const maxXp = Math.max(...standings.map((s) => s.weekly_xp), 1);
  const myStanding = standings.find((s) => s.line_name === myLine);
  const events = LINE_EVENTS.filter((e) => e.city === city);
  const lineColorFor = (line: string) => LINE_COLORS[line] ?? colors.accent;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={standings}
        keyExtractor={(s) => s.line_name}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <Swords color={colors.red} size={26} />
              <Text style={styles.heading}>Line Wars</Text>
            </View>
            <Text style={styles.subheading}>
              Pick your line. Every XP you earn this week counts for your faction.
            </Text>

            <View style={styles.citySwitcher}>
              {CITIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.cityPill, c === city && styles.cityPillActive]}
                  onPress={() => {
                    setCity(c);
                    setLoading(true);
                    void loadPlayer().then((p) =>
                      loadStandings(c, p.primary_line, p.total_xp),
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.cityPillText,
                      c === city && styles.cityPillTextActive,
                    ]}
                  >
                    {CITY_SHORT[c]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {myStanding && (
              <View
                style={[
                  styles.factionBanner,
                  { borderColor: lineColorFor(myLine) },
                ]}
              >
                <ShieldCheck color={lineColorFor(myLine)} size={28} />
                <View style={styles.factionBannerText}>
                  <Text style={styles.factionBannerTitle}>
                    Active Faction: {myLine}
                  </Text>
                  <Text style={styles.factionBannerSub}>
                    Rank #{myStanding.rank} ·{' '}
                    {myStanding.weekly_xp.toLocaleString()} weekly XP (your XP
                    counts toward this)
                  </Text>
                </View>
                <Pressable
                  style={styles.leaveButton}
                  onPress={() => void leaveLine()}
                  accessibilityRole="button"
                >
                  <LogOut color={colors.red} size={13} />
                  <Text style={styles.leaveButtonText}>Switch</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.eventsHeader}>
              <CalendarClock color={colors.gold} size={18} />
              <Text style={styles.sectionTitle}>Active Line Events</Text>
            </View>
            {events.map((event) => {
              const applies = event.lines.length === 0 || event.lines.includes(myLine);
              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventTop}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.bonusBadge}>
                      <Zap color={colors.bg} size={11} />
                      <Text style={styles.bonusText}>{event.bonus_label}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventDesc}>{event.description}</Text>
                  <View style={styles.eventMeta}>
                    {event.lines.length > 0 && (
                      <Text style={styles.eventLines}>
                        {event.lines.join(' · ')}
                      </Text>
                    )}
                    <Text style={styles.eventEnds}>{event.ends_label}</Text>
                    {applies && myLine !== '' && (
                      <Text style={styles.eventApplies}>Applies to your line</Text>
                    )}
                  </View>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>Weekly Standings</Text>
            {loading && (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
            )}
          </>
        }
        renderItem={({ item }) => {
          const isMine = item.line_name === myLine;
          const isLeader = item.rank === 1;
          const pct = item.weekly_xp / maxXp;
          return (
            <View
              style={[
                styles.factionRow,
                isMine && { borderColor: lineColorFor(item.line_name) },
              ]}
            >
              <View style={styles.rankWrap}>
                {isLeader ? (
                  <Crown color={colors.gold} size={16} />
                ) : (
                  <Text style={styles.rankText}>{item.rank}</Text>
                )}
              </View>
              <View style={styles.factionBody}>
                <View style={styles.factionTop}>
                  <Text style={styles.factionName}>
                    {item.line_name}
                    {isMine ? '  ·  your line' : ''}
                  </Text>
                  <Text style={styles.factionXp}>
                    {item.weekly_xp.toLocaleString()} XP
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        flex: Math.max(pct, 0.03),
                        backgroundColor: isLeader
                          ? colors.gold
                          : lineColorFor(item.line_name),
                      },
                    ]}
                  />
                  <View style={{ flex: 1 - Math.max(pct, 0.03) }} />
                </View>
              </View>
              {!isMine && (
                <Pressable
                  style={styles.joinButton}
                  onPress={() => void joinLine(item.line_name)}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={styles.footerNote}>
            <TrendingUp color={colors.muted} size={12} /> Weekly standings reset
            every Monday. Earn XP from check-ins, tasks and trivia to push your
            line to the crown.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900' },
  subheading: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
  citySwitcher: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityPill: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  cityPillActive: { backgroundColor: colors.accent },
  cityPillText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  cityPillTextActive: { color: colors.bg },
  factionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    marginBottom: 18,
  },
  factionBannerText: { flex: 1, gap: 3 },
  factionBannerTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  factionBannerSub: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leaveButtonText: { color: colors.red, fontWeight: '800', fontSize: 10 },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  eventCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { color: colors.text, fontSize: 14, fontWeight: '800', flex: 1 },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 8,
  },
  bonusText: { color: colors.bg, fontSize: 10, fontWeight: '900' },
  eventDesc: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' },
  eventLines: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  eventEnds: { color: colors.muted, fontSize: 11 },
  eventApplies: { color: colors.green, fontSize: 11, fontWeight: '700' },
  factionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rankWrap: { width: 22, alignItems: 'center' },
  rankText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  factionBody: { flex: 1, gap: 6 },
  factionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factionName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  factionXp: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  barTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: { borderRadius: 999 },
  joinButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  joinButtonText: { color: colors.accent, fontWeight: '800', fontSize: 11 },
  footerNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
  },
});
