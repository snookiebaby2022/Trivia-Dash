import AsyncStorage from '@react-native-async-storage/async-storage';

import { ALL_UGC_SEED_PACKS, FREE_UGC_SEED_PACKS, PRO_UGC_SEED_PACKS } from '../data/ugcSeedPacks';
import type { Category, Question, UgcPack } from '../types';

const UGC_KEY = 'td.ugc.packs.v1';

export async function loadUgcPacks(isPro = false): Promise<UgcPack[]> {
  try {
    const raw = await AsyncStorage.getItem(UGC_KEY);
    const custom = raw ? (JSON.parse(raw) as UgcPack[]) : [];
    const approvedCustom = custom.filter((p) => p.status === 'approved');
    const seeds = isPro ? ALL_UGC_SEED_PACKS : FREE_UGC_SEED_PACKS;
    const merged = [...seeds, ...approvedCustom.filter((p) => isPro || p.tier !== 'pro')];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  } catch {
    return isPro ? ALL_UGC_SEED_PACKS : FREE_UGC_SEED_PACKS;
  }
}

export function countUgcPacks(isPro: boolean): { free: number; pro: number; total: number } {
  const free = FREE_UGC_SEED_PACKS.length;
  const pro = PRO_UGC_SEED_PACKS.length;
  return { free, pro, total: isPro ? free + pro : free };
}

export async function submitUgcPack(
  title: string,
  author: string,
  category: Category,
  questions: Omit<Question, 'tier' | 'packId'>[]
): Promise<UgcPack> {
  const raw = await AsyncStorage.getItem(UGC_KEY);
  const custom: UgcPack[] = raw ? (JSON.parse(raw) as UgcPack[]) : [];
  const id = `ugc_${Date.now()}`;
  const pack: UgcPack = {
    id,
    title,
    author,
    category,
    questionIds: questions.map((q) => q.id),
    status: 'pending',
    tier: 'pro',
    createdAt: Date.now(),
  };
  custom.push(pack);
  await AsyncStorage.setItem(UGC_KEY, JSON.stringify(custom));
  return pack;
}

export async function loadPendingPacks(): Promise<UgcPack[]> {
  const raw = await AsyncStorage.getItem(UGC_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as UgcPack[]).filter((p) => p.status === 'pending');
}

export async function getUgcPackById(id: string): Promise<UgcPack | undefined> {
  const raw = await AsyncStorage.getItem(UGC_KEY);
  const custom: UgcPack[] = raw ? (JSON.parse(raw) as UgcPack[]) : [];
  return [...ALL_UGC_SEED_PACKS, ...custom].find((p) => p.id === id);
}

/** Stable seed for shuffling pack question order. */
export function packQuestionSeed(packId: string): number {
  let h = 0;
  for (let i = 0; i < packId.length; i++) h = (h * 31 + packId.charCodeAt(i)) >>> 0;
  return h || 42;
}
