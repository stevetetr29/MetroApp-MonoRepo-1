import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  LocateFixed,
  Satellite,
  TrainFront,
  X,
} from 'lucide-react-native';
import { CITIES, distanceMeters, type City, type Station } from '@metro/shared';
import { CITY_REGIONS, colors, lineColor } from '../../lib/theme';
import {
  awardXp,
  fetchStations,
  loadCheckIns,
  recordCheckIn,
} from '../../lib/player';

const CHECK_IN_RADIUS_M = 100;
const CHECK_IN_XP = 50;
const GPS_TIMEOUT_MS = 8000;

type SheetState = 'idle' | 'locating' | 'nearest' | 'manual' | 'done';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('gps_timeout')), ms),
    ),
  ]);
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [city, setCity] = useState<City>('NYC');
  const [stations, setStations] = useState<Station[]>([]);
  const [checkIns, setCheckIns] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<SheetState>('idle');
  const [nearest, setNearest] = useState<{ station: Station; distance: number } | null>(null);
  const [checkedInStation, setCheckedInStation] = useState<Station | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);

  useEffect(() => {
    fetchStations().then(setStations);
    loadCheckIns().then(setCheckIns);
  }, []);

  useEffect(() => {
    mapRef.current?.animateToRegion(CITY_REGIONS[city], 400);
    setNearest(null);
  }, [city]);

  const cityStations = stations.filter((s) => s.city === city);

  const completeCheckIn = useCallback(async (station: Station, method: 'gps' | 'manual') => {
    await recordCheckIn(station, method);
    const player = await awardXp(CHECK_IN_XP);
    setEarnedXp(CHECK_IN_XP);
    void player;
    setCheckedInStation(station);
    setCheckIns(await loadCheckIns());
    setSheet('done');
  }, []);

  const startCheckIn = useCallback(async () => {
    setSheet('locating');
    setNearest(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSheet('manual');
        return;
      }
      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        GPS_TIMEOUT_MS,
      );
      const { latitude, longitude } = position.coords;
      let best: { station: Station; distance: number } | null = null;
      for (const station of cityStations) {
        const distance = distanceMeters(
          latitude,
          longitude,
          station.latitude,
          station.longitude,
        );
        if (!best || distance < best.distance) best = { station, distance };
      }
      if (!best) {
        setSheet('manual');
        return;
      }
      setNearest(best);
      if (best.distance <= CHECK_IN_RADIUS_M) {
        await completeCheckIn(best.station, 'gps');
      } else {
        setSheet('nearest');
      }
    } catch {
      // Underground / tunnel: no GPS fix — fall back to manual station pick.
      setSheet('manual');
    }
  }, [cityStations, completeCheckIn]);

  const sheetVisible = sheet !== 'idle';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={CITY_REGIONS.NYC}
        userInterfaceStyle="dark"
      >
        {cityStations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            title={station.name}
            description={station.line_name}
            pinColor={
              checkIns[station.id] ? colors.green : lineColor(station.line_name)
            }
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.citySwitcher}>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.cityPill, c === city && styles.cityPillActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[styles.cityPillText, c === city && styles.cityPillTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomBar} pointerEvents="box-none">
          <Text style={styles.hintText}>
            {Object.keys(checkIns).length > 0
              ? `${Object.keys(checkIns).length} station${Object.keys(checkIns).length === 1 ? '' : 's'} checked in`
              : 'Get within 100m of a station to check in'}
          </Text>
          <Pressable style={styles.checkInButton} onPress={startCheckIn}>
            <LocateFixed color={colors.bg} size={20} />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={sheetVisible} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Station Check-In</Text>
              <Pressable onPress={() => setSheet('idle')} hitSlop={12}>
                <X color={colors.muted} size={22} />
              </Pressable>
            </View>

            {sheet === 'locating' && (
              <View style={styles.sheetCenter}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={styles.sheetBody}>Acquiring GPS signal…</Text>
                <Text style={styles.sheetSub}>
                  Underground? Signal drops in tunnels — you'll get a manual
                  picker if we can't locate you.
                </Text>
              </View>
            )}

            {sheet === 'nearest' && nearest && (
              <View style={styles.sheetCenter}>
                <Satellite color={colors.gold} size={36} />
                <Text style={styles.sheetBody}>
                  Nearest station: {nearest.station.name}
                </Text>
                <Text style={styles.sheetSub}>
                  {Math.round(nearest.distance)}m away — get within{' '}
                  {CHECK_IN_RADIUS_M}m for GPS check-in, or select a station
                  manually.
                </Text>
                <View style={styles.sheetRow}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setSheet('manual')}
                  >
                    <Text style={styles.secondaryButtonText}>Pick Manually</Text>
                  </Pressable>
                  <Pressable style={styles.primaryButton} onPress={startCheckIn}>
                    <Text style={styles.primaryButtonText}>Retry GPS</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {sheet === 'manual' && (
              <View style={styles.manualList}>
                <Text style={styles.sheetSub}>
                  GPS unavailable — select your station to check in manually.
                </Text>
                <FlatList
                  data={cityStations}
                  keyExtractor={(s) => s.id}
                  style={styles.stationList}
                  renderItem={({ item }) => {
                    const already = Boolean(checkIns[item.id]);
                    return (
                      <Pressable
                        style={[styles.stationRow, already && styles.stationRowDone]}
                        onPress={() => !already && completeCheckIn(item, 'manual')}
                      >
                        <TrainFront
                          color={already ? colors.green : lineColor(item.line_name)}
                          size={20}
                        />
                        <View style={styles.stationRowText}>
                          <Text style={styles.stationName}>{item.name}</Text>
                          <Text style={styles.stationLine}>{item.line_name}</Text>
                        </View>
                        {already && <CheckCircle2 color={colors.green} size={18} />}
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}

            {sheet === 'done' && checkedInStation && (
              <View style={styles.sheetCenter}>
                <CheckCircle2 color={colors.green} size={48} />
                <Text style={styles.sheetBody}>
                  Checked in at {checkedInStation.name}!
                </Text>
                <Text style={styles.sheetSub}>
                  +{earnedXp} XP earned. Keep riding to unlock more tasks.
                </Text>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => setSheet('idle')}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  citySwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(11,16,32,0.85)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  cityPillActive: { backgroundColor: colors.accent },
  cityPillText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  cityPillTextActive: { color: colors.bg },
  bottomBar: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(11,16,32,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  hintText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
  },
  checkInButtonText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sheetCenter: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  sheetBody: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sheetSub: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  sheetRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: { color: colors.bg, fontWeight: '800' },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '700' },
  manualList: { gap: 12 },
  stationList: { maxHeight: 320 },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stationRowDone: { opacity: 0.6 },
  stationRowText: { flex: 1 },
  stationName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  stationLine: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
