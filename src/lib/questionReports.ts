import AsyncStorage from '@react-native-async-storage/async-storage';

import { track } from './analytics';

const REPORTS_KEY = 'bb.question_reports.v1';

export type ReportReason = 'wrong_answer' | 'offensive' | 'duplicate' | 'unclear' | 'outdated';

export interface QuestionReport {
  questionId: string;
  reason: ReportReason;
  timestamp: number;
}

export const REPORT_REASONS: { id: ReportReason; label: string; emoji: string }[] = [
  { id: 'wrong_answer', label: 'Wrong answer', emoji: '❌' },
  { id: 'offensive', label: 'Offensive content', emoji: '⚠️' },
  { id: 'duplicate', label: 'Duplicate question', emoji: '🔁' },
  { id: 'unclear', label: 'Unclear question', emoji: '❓' },
  { id: 'outdated', label: 'Outdated info', emoji: '📅' },
];

export async function reportQuestion(questionId: string, reason: ReportReason): Promise<void> {
  const report: QuestionReport = { questionId, reason, timestamp: Date.now() };
  track({ type: 'question_reported', questionId, reason, timestamp: Date.now() });

  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const reports: QuestionReport[] = raw ? JSON.parse(raw) : [];
    reports.push(report);
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(-200)));
  } catch {
    // best effort
  }
}

export async function getReportedQuestionIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    if (!raw) return new Set();
    const reports: QuestionReport[] = JSON.parse(raw);
    return new Set(reports.map((r) => r.questionId));
  } catch {
    return new Set();
  }
}

export async function getReportCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    if (!raw) return 0;
    const reports: QuestionReport[] = JSON.parse(raw);
    return reports.length;
  } catch {
    return 0;
  }
}
