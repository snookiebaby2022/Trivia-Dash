import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import type ViewShot from 'react-native-view-shot';

import { ShareCardVisual, type ShareCardJob } from '../components/ShareCardVisual';

type ShareHandler = (job: ShareCardJob) => Promise<void>;

let shareHandler: ShareHandler | null = null;

export function registerShareHandler(handler: ShareHandler | null) {
  shareHandler = handler;
}

export async function runShareJob(job: ShareCardJob): Promise<void> {
  if (shareHandler) {
    await shareHandler(job);
    return;
  }
  await Share.share({ message: job.message, title: APP_SHARE_TITLE(job) });
}

function APP_SHARE_TITLE(job: ShareCardJob): string {
  return job.kind === 'wedge' ? 'Trivia Dash wedge' : 'Trivia Dash Daily';
}

function waitForPaint(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getViewShotComponent(): typeof ViewShot | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-view-shot').default as typeof ViewShot;
  } catch {
    return null;
  }
}

export function ShareCardProvider({ children }: { children: React.ReactNode }) {
  const shotRef = useRef<ViewShot>(null);
  const [job, setJob] = useState<ShareCardJob | null>(null);
  const ViewShotComponent = getViewShotComponent();

  const captureAndShare = useCallback(async (next: ShareCardJob) => {
    if (!ViewShotComponent) {
      await Share.share({ message: next.message, title: APP_SHARE_TITLE(next) });
      return;
    }

    setJob(next);
    await waitForPaint(180);
    try {
      const uri = await shotRef.current?.capture?.();
      const cacheDir = FileSystem.cacheDirectory;
      if (uri && cacheDir) {
        const dest = `${cacheDir}share-${Date.now()}.png`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(dest, {
            mimeType: 'image/png',
            dialogTitle: APP_SHARE_TITLE(next),
          });
          setJob(null);
          return;
        }
      }
    } catch {
      // fall through to text share
    }
    setJob(null);
    await Share.share({ message: next.message, title: APP_SHARE_TITLE(next) });
  }, [ViewShotComponent]);

  useEffect(() => {
    registerShareHandler(captureAndShare);
    return () => registerShareHandler(null);
  }, [captureAndShare]);

  return (
    <>
      {children}
      {job && ViewShotComponent ? (
        <View style={styles.offscreen} pointerEvents="none">
          <ViewShotComponent ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
            <ShareCardVisual job={job} />
          </ViewShotComponent>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -2000,
    opacity: 0,
  },
  shot: {
    backgroundColor: '#0B0B16',
  },
});
