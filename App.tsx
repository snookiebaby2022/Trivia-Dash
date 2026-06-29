import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthLinkHandler } from './src/components/AuthLinkHandler';
import { DevClientGate } from './src/components/DevClientGate';
import { ProfileProvider } from './src/context/ProfileContext';
import { ShareCardProvider } from './src/context/ShareCardProvider';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { initAudio } from './src/lib/audio';
import { initAnalytics } from './src/lib/analytics';
import { initFriends } from './src/lib/friends';
import { initOfflineSync } from './src/lib/offlineSync';
import type { RootStackParamList } from './src/navigation';
import { AchievementWallScreen } from './src/screens/AchievementWallScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PassPlayGameScreen } from './src/screens/PassPlayGameScreen';
import { PassPlaySetupScreen } from './src/screens/PassPlaySetupScreen';
import { CategoryPracticeScreen } from './src/screens/CategoryPracticeScreen';
import { CoinShopScreen } from './src/screens/CoinShopScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { TournamentScreen } from './src/screens/TournamentScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { LiveHostScreen } from './src/screens/LiveHostScreen';
import { PackBuilderScreen } from './src/screens/PackBuilderScreen';
import { MatchReplayScreen } from './src/screens/MatchReplayScreen';
import { SeasonalEventsScreen } from './src/screens/SeasonalEventsScreen';
import { NichePacksScreen } from './src/screens/NichePacksScreen';
import { DailyLeaderboardScreen } from './src/screens/DailyLeaderboardScreen';
import { FriendPartyScreen } from './src/screens/FriendPartyScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { SeasonPassScreen } from './src/screens/SeasonPassScreen';
import { UgcPacksScreen } from './src/screens/UgcPacksScreen';
import { VoicePacksScreen } from './src/screens/VoicePacksScreen';
import { UnlockFeaturesScreen } from './src/screens/UnlockFeaturesScreen';
import { WedgeProfileScreen } from './src/screens/WedgeProfileScreen';
import { PartyLobbyScreen } from './src/screens/PartyLobbyScreen';
import { QuadGameScreen } from './src/screens/QuadGameScreen';
import { QuadSetupScreen } from './src/screens/QuadSetupScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigation() {
  const { colors, isDark, scheme } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        background: colors.bg,
        card: colors.bg,
        text: colors.text,
        border: colors.cardBorder,
        primary: colors.primary,
      },
    }),
    [colors, isDark]
  );

  return (
    <>
      <AuthLinkHandler />
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          key={scheme}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen
            name="Achievements"
            component={AchievementWallScreen}
            options={{ title: 'Trophy Case' }}
          />
          <Stack.Screen
            name="PassPlaySetup"
            component={PassPlaySetupScreen}
            options={{ title: 'Pass & Play' }}
          />
          <Stack.Screen
            name="PassPlayGame"
            component={PassPlayGameScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="QuadSetup"
            component={QuadSetupScreen}
            options={{ title: '4-Player' }}
          />
          <Stack.Screen
            name="QuadGame"
            component={QuadGameScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="PartyLobby"
            component={PartyLobbyScreen}
            options={{ title: 'Party Lobby' }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="WedgeProfile" component={WedgeProfileScreen} options={{ title: 'Wedges' }} />
          <Stack.Screen name="CategoryPractice" component={CategoryPracticeScreen} options={{ title: 'Practice' }} />
          <Stack.Screen name="SeasonPass" component={SeasonPassScreen} options={{ title: 'Season pass' }} />
          <Stack.Screen name="FriendParty" component={FriendPartyScreen} options={{ title: 'Friend party' }} />
          <Stack.Screen name="DailyLeaderboard" component={DailyLeaderboardScreen} options={{ title: 'Daily ranks' }} />
          <Stack.Screen name="UgcPacks" component={UgcPacksScreen} options={{ title: 'Community packs' }} />
          <Stack.Screen name="VoicePacks" component={VoicePacksScreen} options={{ title: 'AI voices' }} />
          <Stack.Screen name="UnlockFeatures" component={UnlockFeaturesScreen} options={{ title: 'Unlock everything' }} />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ title: 'Leaderboard' }}
          />
          <Stack.Screen name="CoinShop" component={CoinShopScreen} options={{ title: 'Coin Shop' }} />
          <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
          <Stack.Screen name="Tournament" component={TournamentScreen} options={{ title: 'Tournament' }} />
          <Stack.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
          <Stack.Screen name="LiveHost" component={LiveHostScreen} options={{ title: 'Live Host' }} />
          <Stack.Screen name="PackBuilder" component={PackBuilderScreen} options={{ title: 'Question Pack Builder' }} />
          <Stack.Screen
            name="MatchReplay"
            component={MatchReplayScreen}
            options={{ title: 'Match Replay' }}
          />
          <Stack.Screen name="SeasonalEvents" component={SeasonalEventsScreen} options={{ title: 'Events' }} />
          <Stack.Screen name="NichePacks" component={NichePacksScreen} options={{ title: 'Fandom Packs' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  useEffect(() => {
    void initAudio();
    void initAnalytics();
    void initFriends();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DevClientGate>
          <ProfileProvider>
            <ShareCardProvider>
              <AppNavigation />
            </ShareCardProvider>
          </ProfileProvider>
        </DevClientGate>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
