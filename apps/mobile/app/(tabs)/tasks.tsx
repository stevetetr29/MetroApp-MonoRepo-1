import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CheckCircle2,
  Footprints,
  Gift,
  HelpCircle,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';
import {
  isRushHour,
  RARITY_COLORS,
  type Card,
  type Task,
} from '@metro/shared';
import { colors } from '../../lib/theme';
import { drawBoosterPack } from '../../lib/data';
import {
  awardXp,
  fetchCards,
  fetchTasks,
  grantCards,
  loadCompletions,
  loadStepProgress,
  markTaskCompleted,
  periodKey,
  saveStepProgress,
} from '../../lib/player';

type TaskTab = 'daily' | 'weekly' | 'rush' | 'monthly';

const TABS: { key: TaskTab; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'rush', label: 'Rush Hour' },
  { key: 'monthly', label: 'Monthly' },
];

const STEP_INCREMENT = 50;

interface Victory {
  task: Task;
  boosterPack: Card[];
}

export default function TasksScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TaskTab>('daily');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [triviaTask, setTriviaTask] = useState<Task | null>(null);
  const [stepTask, setStepTask] = useState<Task | null>(null);
  const [victory, setVictory] = useState<Victory | null>(null);

  const refreshCompletions = useCallback(() => {
    loadCompletions().then(setCompletions);
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchCards()]).then(([t, c]) => {
      setTasks(t);
      setCards(c);
      setLoading(false);
    });
  }, []);

  // Refresh completion state when returning from the /camera route.
  useFocusEffect(refreshCompletions);

  const filteredTasks = tasks.filter((t) =>
    tab === 'rush'
      ? t.is_rush_hour_only
      : !t.is_rush_hour_only && t.cadence === tab,
  );

  const isDone = useCallback(
    (task: Task) => completions.includes(`${task.id}:${periodKey(task.cadence)}`),
    [completions],
  );

  const rushActive = isRushHour();

  const completeTask = useCallback(
    async (task: Task) => {
      await markTaskCompleted(task.id, task.cadence);
      await awardXp(task.points);
      refreshCompletions();
    },
    [refreshCompletions],
  );

  const completeTaskWithPack = useCallback(
    async (task: Task) => {
      await completeTask(task);
      const pack = drawBoosterPack(cards, 3);
      if (pack.length > 0) await grantCards(pack.map((c) => c.id));
      setVictory({ task, boosterPack: pack });
    },
    [cards, completeTask],
  );

  const openTask = (task: Task) => {
    if (isDone(task)) return;
    if (task.is_rush_hour_only && !rushActive) {
      Alert.alert(
        'Rush Hour Only',
        'This micro-task unlocks during rush hours (7–10 AM, 5–8 PM).',
      );
      return;
    }
    if (task.task_type === 'trivia') setTriviaTask(task);
    else if (task.task_type === 'step_count') setStepTask(task);
    else router.push({ pathname: '/camera', params: { taskId: task.id } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Tasks</Text>
      <Text style={styles.subheading}>
        Complete tasks to earn XP and card packs
      </Text>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabPill, tab === t.key && styles.tabPillActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'rush' && (
        <View
          style={[
            styles.rushBanner,
            { borderColor: rushActive ? colors.green : colors.gold },
          ]}
        >
          <Zap color={rushActive ? colors.green : colors.gold} size={16} />
          <Text style={styles.rushBannerText}>
            {rushActive
              ? 'Rush hour is LIVE — micro-tasks are unlocked!'
              : 'Rush-hour micro-tasks unlock 7–10 AM & 5–8 PM.'}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks in this category yet.</Text>
          }
          renderItem={({ item }) => {
            const done = isDone(item);
            const locked = item.is_rush_hour_only && !rushActive && !done;
            const Icon =
              item.task_type === 'photo_ai'
                ? Camera
                : item.task_type === 'trivia'
                  ? HelpCircle
                  : Footprints;
            return (
              <Pressable
                style={[styles.taskCard, done && styles.taskCardDone]}
                onPress={() => openTask(item)}
              >
                <View
                  style={[
                    styles.taskIconWrap,
                    { backgroundColor: done ? colors.green : colors.surfaceAlt },
                  ]}
                >
                  {done ? (
                    <CheckCircle2 color={colors.bg} size={22} />
                  ) : (
                    <Icon
                      color={locked ? colors.muted : colors.accent}
                      size={22}
                    />
                  )}
                </View>
                <View style={styles.taskBody}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskPoints}>+{item.points} XP</Text>
                    <Text style={styles.taskCity}>{item.city}</Text>
                    {item.is_rush_hour_only && (
                      <Text style={styles.rushTag}>RUSH</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <TriviaModal
        task={triviaTask}
        onClose={() => setTriviaTask(null)}
        onSolved={(task) => {
          setTriviaTask(null);
          void completeTaskWithPack(task);
        }}
      />

      <StepTaskModal
        task={stepTask}
        onClose={() => setStepTask(null)}
        onCompleted={(task) => {
          setStepTask(null);
          void completeTaskWithPack(task);
        }}
      />

      <VictoryModal victory={victory} onClose={() => setVictory(null)} />
    </SafeAreaView>
  );
}

// ── Trivia micro-task modal ─────────────────────────────────────────────────

function TriviaModal({
  task,
  onClose,
  onSolved,
}: {
  task: Task | null;
  onClose: () => void;
  onSolved: (task: Task) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [task?.id]);

  if (!task || !task.trivia_options) return null;
  const answerIdx = task.trivia_answer_idx ?? -1;

  const pick = (idx: number) => {
    setPicked(idx);
    if (idx === answerIdx) {
      setTimeout(() => onSolved(task), 600);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.centerBackdrop}>
        <View style={styles.dialogCard}>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>{task.title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color={colors.muted} size={22} />
            </Pressable>
          </View>
          <Text style={styles.dialogBody}>{task.description}</Text>
          {task.trivia_options.map((option, idx) => {
            const isPick = picked === idx;
            const isCorrect = idx === answerIdx;
            const showResult = picked !== null;
            const bg = showResult
              ? isCorrect
                ? colors.green
                : isPick
                  ? colors.red
                  : colors.surfaceAlt
              : colors.surfaceAlt;
            return (
              <Pressable
                key={option}
                style={[styles.optionButton, { backgroundColor: bg }]}
                onPress={() => picked === null && pick(idx)}
              >
                <Text
                  style={[
                    styles.optionText,
                    showResult && (isCorrect || isPick) && { color: colors.bg },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
          {picked !== null && picked !== answerIdx && (
            <Pressable style={styles.retryButton} onPress={() => setPicked(null)}>
              <RefreshCw color={colors.text} size={16} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Step-counter micro-task modal ───────────────────────────────────────────

function StepTaskModal({
  task,
  onClose,
  onCompleted,
}: {
  task: Task | null;
  onClose: () => void;
  onCompleted: (task: Task) => void;
}) {
  const [steps, setSteps] = useState(0);
  const goal = task?.step_goal ?? 200;

  useEffect(() => {
    if (task) {
      loadStepProgress(task.id, task.cadence).then(setSteps);
    } else {
      setSteps(0);
    }
  }, [task]);

  if (!task) return null;
  const progress = Math.min(1, steps / goal);

  const addSteps = async () => {
    const next = Math.min(goal, steps + STEP_INCREMENT);
    setSteps(next);
    await saveStepProgress(task.id, task.cadence, next);
    if (next >= goal) {
      setTimeout(() => onCompleted(task), 500);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.centerBackdrop}>
        <View style={styles.dialogCard}>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>{task.title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color={colors.muted} size={22} />
            </Pressable>
          </View>
          <Text style={styles.dialogBody}>{task.description}</Text>
          <View style={styles.stepCountWrap}>
            <Footprints color={colors.accent} size={40} />
            <Text style={styles.stepCount}>
              {steps}
              <Text style={styles.stepGoal}> / {goal} steps</Text>
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
          <Pressable style={styles.primaryButton} onPress={addSteps}>
            <Text style={styles.primaryButtonText}>
              Log {STEP_INCREMENT} steps
            </Text>
          </Pressable>
          <Text style={styles.finePrint}>
            Progress syncs with your device's step counter when connected.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ── Victory modal — XP + booster pack reveal ────────────────────────────────

function VictoryModal({
  victory,
  onClose,
}: {
  victory: Victory | null;
  onClose: () => void;
}) {
  if (!victory) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.centerBackdrop}>
        <View style={styles.victoryCard}>
          <Sparkles color={colors.gold} size={44} />
          <Text style={styles.victoryTitle}>Task Complete!</Text>
          <Text style={styles.victoryXp}>+{victory.task.points} XP</Text>
          {victory.boosterPack.length > 0 && (
            <>
              <View style={styles.packHeader}>
                <Gift color={colors.accent} size={18} />
                <Text style={styles.packTitle}>Booster Pack Dropped</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {victory.boosterPack.map((card) => (
                  <View
                    key={`${card.id}-${Math.random()}`}
                    style={[
                      styles.packCard,
                      { borderColor: RARITY_COLORS[card.rarity] },
                    ]}
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
          <Pressable style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Collect</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  subheading: {
    color: colors.muted,
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.bg },
  rushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  rushBannerText: { color: colors.text, fontSize: 12, flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 48 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  taskCardDone: { opacity: 0.55 },
  taskIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  taskDesc: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  taskMeta: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  taskPoints: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  taskCity: { color: colors.muted, fontSize: 11 },
  rushTag: {
    color: colors.red,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  dialogBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  optionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  retryText: { color: colors.text, fontWeight: '700' },
  stepCountWrap: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  stepCount: { color: colors.text, fontSize: 36, fontWeight: '900' },
  stepGoal: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  progressTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.accent, borderRadius: 999 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryButtonText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
  finePrint: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  victoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    gap: 10,
  },
  victoryTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  victoryXp: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
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
