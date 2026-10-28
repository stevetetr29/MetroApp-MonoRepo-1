/**
 * /camera — full-screen photo task capture route.
 *
 * Pushed from the tasks screen with ?taskId=<id>. Captures a photo (or picks
 * from the library), sends it base64 to the verify-task Edge Function
 * (Gemini), then shows a victory overlay awarding XP + a booster pack.
 *
 * Header controls are padded by the device safe-area insets so the close
 * button and criteria text clear the notch / Dynamic Island on every iPhone.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Gift,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react-native';
import {
  RARITY_COLORS,
  type Card,
  type Task,
  type VerifyTaskResponse,
} from '@metro/shared';
import { colors } from '../lib/theme';
import { drawBoosterPack } from '../lib/data';
import {
  awardXp,
  fetchCards,
  fetchTasks,
  grantCards,
  markTaskCompleted,
} from '../lib/player';
import { isSupabaseConfigured, VERIFY_TASK_URL } from '../lib/supabase';

type Phase = 'camera' | 'verifying' | 'victory' | 'error';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [task, setTask] = useState<Task | null>(null);
  const [phase, setPhase] = useState<Phase>('camera');
  const [errorMsg, setErrorMsg] = useState('');
  const [pack, setPack] = useState<Card[]>([]);

  useEffect(() => {
    fetchTasks().then((tasks) => {
      setTask(tasks.find((t) => t.id === taskId) ?? null);
    });
  }, [taskId]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const submitPhoto = useCallback(
    async (base64: string) => {
      if (!task) return;
      if (!isSupabaseConfigured) {
        setPhase('error');
        setErrorMsg(
          'Verification backend is not configured. Deploy the verify-task function and set EXPO_PUBLIC_SUPABASE_URL.',
        );
        return;
      }
      setPhase('verifying');
      try {
        const res = await fetch(VERIFY_TASK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          },
          body: JSON.stringify({
            imageBase64: base64,
            taskCriteria: task.ai_prompt_criteria ?? task.description,
          }),
        });
        const json = (await res.json()) as VerifyTaskResponse & { error?: string };
        if (!res.ok || json.error) {
          setPhase('error');
          setErrorMsg(json.error ?? `Server error (${res.status}). Please retry.`);
        } else if (json.verified) {
          await markTaskCompleted(task.id, task.cadence);
          await awardXp(task.points);
          const cards = await fetchCards();
          const drawn = drawBoosterPack(cards, 3);
          if (drawn.length > 0) await grantCards(drawn.map((c) => c.id));
          setPack(drawn);
          setPhase('victory');
        } else {
          setPhase('error');
          setErrorMsg(
            `Gemini didn't verify this photo (${Math.round(json.confidence * 100)}% confidence): ${json.reason}`,
          );
        }
      } catch {
        setPhase('error');
        setErrorMsg('Network request failed — check your connection and retry.');
      }
    },
    [task],
  );

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      if (photo?.base64) await submitPhoto(photo.base64);
    } catch {
      setPhase('error');
      setErrorMsg('Could not capture photo. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.6,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (asset?.base64) await submitPhoto(asset.base64);
    } catch {
      setPhase('error');
      setErrorMsg('Could not read photo from library.');
    }
  };

  const retry = () => {
    setErrorMsg('');
    setPhase('camera');
  };

  return (
    <View style={styles.container}>
      {permission?.granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={styles.cameraFallback}>
          <Camera color={colors.muted} size={48} />
          <Text style={styles.fallbackText}>
            Camera permission is required for photo tasks.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
          </Pressable>
        </View>
      )}

      {/* Safe-area-aware header: clears notch / Dynamic Island on all iPhones */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={12}>
          <X color="#fff" size={24} />
        </Pressable>
        <View style={styles.criteriaBadge}>
          <Text style={styles.criteriaTitle}>{task?.title ?? 'Photo Task'}</Text>
          <Text style={styles.criteriaText} numberOfLines={3}>
            {task?.ai_prompt_criteria ?? task?.description ?? 'Loading task…'}
          </Text>
        </View>
      </View>

      {phase === 'camera' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.cameraControls}>
            <Pressable style={styles.libraryButton} onPress={pickFromLibrary}>
              <ImageIcon color="#fff" size={24} />
            </Pressable>
            <Pressable style={styles.shutter} onPress={capture}>
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={styles.libraryButton} />
          </View>
        </View>
      )}

      {phase === 'verifying' && (
        <View style={styles.fullOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.verifyingText}>Gemini AI Verifying…</Text>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.fullOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Verification Failed</Text>
            <Text style={styles.dialogBody}>{errorMsg}</Text>
            <Pressable style={styles.primaryButton} onPress={retry}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>Back to Tasks</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'victory' && task && (
        <View style={styles.fullOverlay}>
          <View style={styles.victoryCard}>
            <Sparkles color={colors.gold} size={44} />
            <Text style={styles.victoryTitle}>Task Complete!</Text>
            <Text style={styles.victoryXp}>+{task.points} XP</Text>
            {pack.length > 0 && (
              <>
                <View style={styles.packHeader}>
                  <Gift color={colors.accent} size={18} />
                  <Text style={styles.packTitle}>Booster Pack Dropped</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {pack.map((card, i) => (
                    <View
                      key={`${card.id}-${i}`}
                      style={[styles.packCard, { borderColor: RARITY_COLORS[card.rarity] }]}
                    >
                      <Text style={styles.packCardName} numberOfLines={2}>
                        {card.name}
                      </Text>
                      <Text
                        style={[
                          styles.packCardRarity,
                          { color: RARITY_COLORS[card.rarity] },
                        ]}
                      >
                        {card.rarity}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Collect</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  fallbackText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 12,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    padding: 8,
    marginTop: 4,
  },
  criteriaBadge: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  criteriaTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  criteriaText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  libraryButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  verifyingText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    alignSelf: 'stretch',
  },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  dialogBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.text, fontWeight: '700' },
  victoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
  },
  victoryTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  victoryXp: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  packHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  packTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  packCard: {
    width: 110,
    height: 140,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.surfaceAlt,
    marginRight: 10,
    padding: 10,
    justifyContent: 'space-between',
  },
  packCardName: { color: colors.text, fontWeight: '800', fontSize: 12 },
  packCardRarity: { fontWeight: '900', fontSize: 11 },
});
