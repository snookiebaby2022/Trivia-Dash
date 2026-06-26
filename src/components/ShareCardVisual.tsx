import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME, APP_TAGLINE } from '../lib/brand';
import { CATEGORY_WEDGES } from '../lib/categoryTheme';
import type { Category } from '../types';

export type ShareCardJob =
  | { kind: 'wedge'; category: Category; username: string; message: string }
  | { kind: 'daily'; dateKey: string; score: number; rank: number; username: string; message: string };

type Props = {
  job: ShareCardJob;
};

export function ShareCardVisual({ job }: Props) {
  if (job.kind === 'wedge') {
    const theme = CATEGORY_WEDGES[job.category];
    return (
      <View style={styles.card}>
        <View style={[styles.glow, { backgroundColor: theme.glow }]} />
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.emoji}>{theme.icon}</Text>
        <Text style={[styles.headline, { color: theme.accent }]}>{job.category} wedge!</Text>
        <Text style={styles.body}>50 correct in {theme.label}</Text>
        <Text style={styles.user}>— {job.username}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.glow, { backgroundColor: 'rgba(124, 92, 255, 0.35)' }]} />
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.emoji}>📅</Text>
      <Text style={[styles.headline, { color: '#A78BFA' }]}>Daily challenge</Text>
      <Text style={styles.body}>
        {job.dateKey} · Score {job.score}
        {job.rank > 0 ? ` · Rank #${job.rank}` : ''}
      </Text>
      <Text style={styles.user}>— {job.username}</Text>
      <Text style={styles.tagline}>Same 10 questions for everyone today</Text>
    </View>
  );
}

const CARD_W = 1080;
const CARD_H = 1080;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0B0B16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: CARD_W * 0.9,
    height: CARD_W * 0.9,
    borderRadius: CARD_W,
    top: -CARD_W * 0.2,
    opacity: 0.5,
  },
  brand: {
    color: '#FFD24D',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 32,
  },
  headline: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: '#E8E8F0',
    fontSize: 44,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  user: {
    color: '#9CA3AF',
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 48,
  },
  tagline: {
    color: '#6B7280',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
  },
});
