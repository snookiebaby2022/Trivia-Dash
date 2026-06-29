import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { CATEGORY_LIST } from '../lib/categoryTheme';
import { saveProfile } from '../lib/storage';
import { syncProfile } from '../lib/leaderboard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { Category, Question } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PackBuilder'>;

const STORAGE_KEY = 'bb.ugc_packs.v1';

interface CustomQuestion {
  prompt: string;
  options: string[];
  answer: number;
}

interface CreatedPack {
  id: string;
  title: string;
  category: Category;
  questions: CustomQuestion[];
  createdAt: number;
}

export function PackBuilderScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile, update } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [editing, setEditing] = useState<CustomQuestion | null>(null);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answerIdx, setAnswerIdx] = useState(0);
  const [myPacks, setMyPacks] = useState<CreatedPack[]>([]);

  if (!profile?.isPro) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Pro Only</Text>
          <Text style={styles.lockDesc}>Upgrade to Pro to create and share trivia packs.</Text>
          <PrimaryButton label="View Pro Plans" variant="accent" onPress={() => navigation.navigate('UnlockFeatures')} />
        </View>
      </SafeAreaView>
    );
  }

  const addQuestion = () => {
    if (!prompt.trim() || options.some((o) => !o.trim())) {
      Alert.alert('Incomplete', 'Fill in the prompt and all 4 options.');
      return;
    }
    setQuestions((prev) => [...prev, { prompt: prompt.trim(), options: options.map((o) => o.trim()), answer: answerIdx }]);
    setPrompt('');
    setOptions(['', '', '', '']);
    setAnswerIdx(0);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const savePack = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give your pack a name.');
      return;
    }
    if (questions.length < 5) {
      Alert.alert('Too few questions', 'Add at least 5 questions.');
      return;
    }

    const pack: CreatedPack = {
      id: `ugc_${Date.now()}`,
      title: title.trim(),
      category,
      questions,
      createdAt: Date.now(),
    };

    setMyPacks((prev) => {
      const next = [...prev, pack];
      // Persist would go here in a real app with Supabase
      return next;
    });

    Alert.alert('Pack Created!', `"${pack.title}" with ${questions.length} questions. It will be reviewed before going live.`);
    setTitle('');
    setQuestions([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pack Builder</Text>
        <Text style={styles.subtitle}>Create trivia packs for the community</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Pack Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="My Trivia Pack"
            placeholderTextColor={colors.textFaint}
            maxLength={40}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {CATEGORY_LIST.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat as Category)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Add Question ({questions.length} added)</Text>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Question text"
            placeholderTextColor={colors.textFaint}
          />
          {options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <Pressable
                style={[styles.answerDot, answerIdx === i && { backgroundColor: colors.success }]}
                onPress={() => setAnswerIdx(i)}
              >
                <Text style={styles.answerLetter}>{String.fromCharCode(65 + i)}</Text>
              </Pressable>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={opt}
                onChangeText={(t) => {
                  const next = [...options];
                  next[i] = t;
                  setOptions(next);
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                placeholderTextColor={colors.textFaint}
              />
            </View>
          ))}
          <PrimaryButton label="Add Question" variant="ghost" onPress={addQuestion} />
        </View>

        {questions.length > 0 && (
          <View style={styles.questionsList}>
            {questions.map((q, i) => (
              <View key={i} style={styles.questionPreview}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNum}>Q{i + 1}</Text>
                  <Text style={styles.questionPrompt} numberOfLines={1}>{q.prompt}</Text>
                  <Pressable onPress={() => removeQuestion(i)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.questionAnswer}>Answer: {q.options[q.answer]}</Text>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={`Save Pack — ${questions.length} questions`}
          variant="accent"
          onPress={savePack}
          disabled={questions.length < 5}
        />
        <PrimaryButton label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Home')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    lockEmoji: { fontSize: 48 },
    lockTitle: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
    lockDesc: { color: colors.textMuted, fontSize: font.body, textAlign: 'center' },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: colors.textMuted, fontSize: font.body, textAlign: 'center' },
    field: { gap: spacing.sm },
    label: { color: colors.textMuted, fontSize: font.small, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      color: colors.text,
      fontSize: font.body,
      fontWeight: '700',
    },
    categoryRow: { gap: spacing.sm },
    catChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    catTextActive: { color: colors.text },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    answerDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    answerLetter: { color: colors.text, fontSize: font.small, fontWeight: '900' },
    questionsList: { gap: spacing.sm },
    questionPreview: {
      backgroundColor: colors.card,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.sm,
    },
    questionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    questionNum: { color: colors.primary, fontSize: font.small, fontWeight: '900', width: 28 },
    questionPrompt: { flex: 1, color: colors.text, fontSize: font.small, fontWeight: '700' },
    removeBtn: { color: colors.danger, fontSize: font.body, fontWeight: '900' },
    questionAnswer: { color: colors.success, fontSize: 11, fontWeight: '700', marginTop: 4 },
  });
}
