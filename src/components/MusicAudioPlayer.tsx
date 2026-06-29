import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { isSfxEnabled } from '../lib/gameAudio';

interface Props {
  url: string | undefined;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
}

let globalMusicPlayer: ReturnType<typeof createAudioPlayer> | null = null;

export function MusicAudioPlayer({ url, autoPlay = true, onPlaybackEnd }: Props) {
  useEffect(() => {
    if (!url || !autoPlay || !isSfxEnabled()) return;

    let cancelled = false;

    // Stop any existing music clip
    if (globalMusicPlayer) {
      try {
        globalMusicPlayer.pause();
        globalMusicPlayer.remove();
      } catch {}
      globalMusicPlayer = null;
    }

    try {
      const player = createAudioPlayer({ uri: url });
      player.volume = 0.75;

      if (cancelled) {
        player.remove();
        return;
      }

      globalMusicPlayer = player;

      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          onPlaybackEnd?.();
        }
      });

      player.play();
    } catch (e) {
      console.warn('[MusicPlayer] failed to play', url, e);
    }

    return () => {
      cancelled = true;
      if (globalMusicPlayer) {
        try {
          globalMusicPlayer.pause();
          globalMusicPlayer.remove();
        } catch {}
        globalMusicPlayer = null;
      }
    };
  }, [url, autoPlay]);

  if (!url || !isSfxEnabled()) return null;

  return (
    <View style={styles.indicator}>
      <Text style={styles.label}>Now playing</Text>
    </View>
  );
}

export function stopMusicClip(): void {
  if (globalMusicPlayer) {
    try {
      globalMusicPlayer.pause();
      globalMusicPlayer.remove();
    } catch {}
    globalMusicPlayer = null;
  }
}

const styles = StyleSheet.create({
  indicator: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    color: '#A0A0C0',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
