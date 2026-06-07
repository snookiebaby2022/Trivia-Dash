import type { NavigationState, PartialState } from '@react-navigation/native';

import { startMenuMusic, stopMenuMusic } from './audio';

const MENU_ROUTES = new Set([
  'Home',
  'Leaderboard',
  'PartyLobby',
  'QuadSetup',
  'PassPlaySetup',
  'Achievements',
]);

export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined
): string {
  if (!state || typeof state.index !== 'number') return 'Home';
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState | PartialState<NavigationState>);
  }
  return route.name;
}

export function syncMenuMusicForRoute(routeName: string): void {
  if (MENU_ROUTES.has(routeName)) {
    void startMenuMusic();
  } else {
    void stopMenuMusic();
  }
}
