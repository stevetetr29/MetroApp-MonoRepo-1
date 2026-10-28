import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, ShieldCheck, Swords, TrendingUp } from 'lucide-react-native';
import { CITIES, type City, type LineStanding } from '@metro/shared';
import { colors, lineColor } from '../../lib/theme';
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

  const maxXp = Math.max(...standings.map((s) => s.weekly_xp), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
                style={[styles.cityPillText, c === city && styles.cityPillTextActive]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          standings.map((standing) => {
            const isMine = standing.line_name === myLine;
            const isLeader = standing.rank === 1;
            const pct = standing.weekly_xp / maxXp;
            return (
              <View
                key={standing.line_name}
                style={[
                  styles.factionCard,
                  isMine && { borderColor: colors.accent },
                ]}
              >
                <View style={styles.factionHeader}>
                  <View style={styles.factionTitleWrap}>
                    {isLeader && <Crown color={colors.gold} size={20} />}
                    <Text style={styles.factionName}>{standing.line_name}</Text>
                    {isMine && (
                      <View style={styles.yourBadge}>
                        <ShieldCheck color={colors.accent} size={12} />
                        <Text style={styles.yourBadgeText}>YOUR LINE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.factionRank}>#{standing.rank}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        flex: Math.max(pct, 0.03),
                        backgroundColor: isLeader
                          ? colors.gold
                          : lineColor(standing.line_name),
                      },
                    ]}
                  />
                  <View style={{ flex: 1 - Math.max(pct, 0.03) }} />
                </View>
                <View style={styles.factionFooter}>
                  <View style={styles.xpWrap}>
                    <TrendingUp color={colors.muted} size={14} />
                    <Text style={styles.xpText}>
                      {standing.weekly_xp.toLocaleString()} weekly XP
                    </Text>
                  </View>
                  {!isMine && (
                    <Pressable
                      style={styles.joinButton}
                      onPress={() => void joinLine(standing.line_name)}
                    >
                      <Text style={styles.joinButtonText}>Join</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.footerNote}>
          Weekly standings reset every Monday. Earn XP from check-ins, tasks and
          trivia to push your line to the crown.
        </Text>
      </ScrollView>
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
    marginBottom: 18,
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
  factionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  factionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  factionName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  factionRank: { color: colors.muted, fontWeight: '800', fontSize: 14 },
  yourBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  yourBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: { borderRadius: 999 },
  factionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  joinButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  joinButtonText: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  footerNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
