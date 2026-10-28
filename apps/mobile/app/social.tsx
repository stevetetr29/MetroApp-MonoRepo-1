/**
 * /social — activity feed mockup.
 *
 * Shows rider activity posts (station check-ins, AI photo task completions,
 * booster pack pulls) with Facebook-style reactions and a comment drawer.
 * Reactions and comments persist locally in AsyncStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flame,
  Gift,
  MapPin,
  Camera,
  MessageCircle,
  Send,
  ThumbsUp,
} from 'lucide-react-native';
import type { City } from '@metro/shared';
import { colors } from '../lib/theme';
import { SEED_FEED, type FeedPost } from '../lib/data';
import { loadPlayer } from '../lib/player';

const FEED_STATE_KEY = 'metro:feed_state';

type Reaction = 'like' | 'hyped';

interface FeedState {
  /** postId -> set of reactions the local user has added */
  reactions: Record<string, Reaction[]>;
  /** postId -> comments the local user has added */
  userComments: Record<string, { username: string; text: string; timeAgo: string }[]>;
}

const EMPTY_STATE: FeedState = { reactions: {}, userComments: {} };

const KIND_META: Record<
  FeedPost['kind'],
  { icon: typeof MapPin; label: string; color: string }
> = {
  check_in: { icon: MapPin, label: 'Checked in', color: colors.green },
  photo_task: { icon: Camera, label: 'Task verified', color: colors.accent },
  booster_pack: { icon: Gift, label: 'Pack opened', color: colors.purple },
};

export default function SocialScreen() {
  const router = useRouter();
  const [feedState, setFeedState] = useState<FeedState>(EMPTY_STATE);
  const [username, setUsername] = useState('rider_local');
  const [commentTarget, setCommentTarget] = useState<FeedPost | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(FEED_STATE_KEY)
      .then((raw) => {
        if (raw) setFeedState({ ...EMPTY_STATE, ...(JSON.parse(raw) as FeedState) });
      })
      .catch(() => {});
    loadPlayer().then((p) => setUsername(p.username));
  }, []);

  const persist = useCallback((next: FeedState) => {
    setFeedState(next);
    AsyncStorage.setItem(FEED_STATE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const toggleReaction = (postId: string, reaction: Reaction) => {
    const mine = feedState.reactions[postId] ?? [];
    const next = mine.includes(reaction)
      ? mine.filter((r) => r !== reaction)
      : [...mine, reaction];
    persist({ ...feedState, reactions: { ...feedState.reactions, [postId]: next } });
  };

  const addComment = () => {
    const text = draft.trim();
    if (!text || !commentTarget) return;
    const entry = { username, text, timeAgo: 'now' };
    const existing = feedState.userComments[commentTarget.id] ?? [];
    persist({
      ...feedState,
      userComments: {
        ...feedState.userComments,
        [commentTarget.id]: [...existing, entry],
      },
    });
    setDraft('');
  };

  const reactionCount = (post: FeedPost, reaction: Reaction): number => {
    const base = reaction === 'like' ? post.likes : post.hyped;
    const mine = feedState.reactions[post.id] ?? [];
    return base + (mine.includes(reaction) ? 1 : 0);
  };

  const allComments = (post: FeedPost) => [
    ...post.comments,
    ...(feedState.userComments[post.id] ?? []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.heading}>Rider Feed</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={SEED_FEED}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            feedState={feedState}
            likeCount={reactionCount(item, 'like')}
            hypeCount={reactionCount(item, 'hyped')}
            commentCount={allComments(item).length}
            onReact={toggleReaction}
            onComment={() => setCommentTarget(item)}
          />
        )}
      />

      {/* Comment drawer */}
      <Modal
        visible={commentTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentTarget(null)}
      >
        <Pressable style={styles.drawerBackdrop} onPress={() => setCommentTarget(null)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.drawerWrap}
        >
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>
              Comments — @{commentTarget?.username}
            </Text>
            <ScrollView style={styles.commentList}>
              {commentTarget &&
                allComments(commentTarget).map((c, i) => (
                  <View key={i} style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarLetter}>
                        {c.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentUser}>@{c.username}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                    <Text style={styles.commentTime}>{c.timeAgo}</Text>
                  </View>
                ))}
              {commentTarget && allComments(commentTarget).length === 0 && (
                <Text style={styles.noComments}>
                  No comments yet — start the conversation.
                </Text>
              )}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a comment…"
                placeholderTextColor={colors.muted}
                onSubmitEditing={addComment}
                returnKeyType="send"
              />
              <Pressable style={styles.sendButton} onPress={addComment} hitSlop={8}>
                <Send color={colors.bg} size={18} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FeedCard({
  post,
  feedState,
  likeCount,
  hypeCount,
  commentCount,
  onReact,
  onComment,
}: {
  post: FeedPost;
  feedState: FeedState;
  likeCount: number;
  hypeCount: number;
  commentCount: number;
  onReact: (postId: string, reaction: Reaction) => void;
  onComment: () => void;
}) {
  const mine = feedState.reactions[post.id] ?? [];
  const meta = KIND_META[post.kind];
  const KindIcon = meta.icon;

  return (
    <View style={styles.card}>
      {/* Header: avatar, username, timestamp, location tag */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
          <Text style={styles.avatarLetter}>
            {post.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username}>@{post.username}</Text>
          <Text style={styles.metaLine}>
            {post.timeAgo} · {post.city} • {post.station} ({post.line})
          </Text>
        </View>
      </View>

      {/* Post image area — stylized placeholder per post kind */}
      <View style={[styles.postImage, { borderColor: meta.color }]}>
        <View style={[styles.postImageInner, { backgroundColor: `${meta.color}18` }]}>
          <KindIcon color={meta.color} size={44} />
          <View style={[styles.kindBadge, { backgroundColor: meta.color }]}>
            <KindIcon color={colors.bg} size={11} />
            <Text style={styles.kindBadgeText}>{meta.label}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {/* Facebook-style reaction row */}
      <View style={styles.reactionRow}>
        <Pressable
          style={styles.reactionButton}
          onPress={() => onReact(post.id, 'like')}
        >
          <ThumbsUp
            color={mine.includes('like') ? colors.accent : colors.muted}
            size={17}
            fill={mine.includes('like') ? colors.accent : 'transparent'}
          />
          <Text
            style={[
              styles.reactionText,
              mine.includes('like') && { color: colors.accent },
            ]}
          >
            {likeCount} Like
          </Text>
        </Pressable>
        <Pressable
          style={styles.reactionButton}
          onPress={() => onReact(post.id, 'hyped')}
        >
          <Flame
            color={mine.includes('hyped') ? colors.gold : colors.muted}
            size={17}
            fill={mine.includes('hyped') ? colors.gold : 'transparent'}
          />
          <Text
            style={[
              styles.reactionText,
              mine.includes('hyped') && { color: colors.gold },
            ]}
          >
            {hypeCount} Hyped
          </Text>
        </Pressable>
        <Pressable style={styles.reactionButton} onPress={onComment}>
          <MessageCircle color={colors.muted} size={17} />
          <Text style={styles.reactionText}>
            {commentCount} Comment{commentCount === 1 ? '' : 's'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { width: 32, alignItems: 'flex-start' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.bg, fontWeight: '900', fontSize: 16 },
  headerText: { flex: 1 },
  username: { color: colors.text, fontWeight: '800', fontSize: 14 },
  metaLine: { color: colors.muted, fontSize: 11, marginTop: 2 },
  postImage: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  postImageInner: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  kindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kindBadgeText: { color: colors.bg, fontSize: 10, fontWeight: '900' },
  postText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  reactionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  reactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reactionText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawerWrap: { justifyContent: 'flex-end' },
  drawer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '70%',
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  drawerTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 12 },
  commentList: { maxHeight: 320 },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarLetter: { color: colors.text, fontWeight: '800', fontSize: 12 },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentUser: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  commentText: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 2 },
  commentTime: { color: colors.muted, fontSize: 10, marginTop: 8 },
  noComments: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
