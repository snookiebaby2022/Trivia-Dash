import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';

import { useProfile } from '../context/ProfileContext';
import { handleAuthRedirectUrl } from '../lib/auth';

/** Handles OAuth deep links when returning from Google sign-in. */
export function AuthLinkHandler() {
  const { applyAuthUser } = useProfile();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('access_token') && !url.includes('code=')) return;
      const user = await handleAuthRedirectUrl(url);
      if (user) await applyAuthUser(user);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => sub.remove();
  }, [applyAuthUser]);

  return null;
}
