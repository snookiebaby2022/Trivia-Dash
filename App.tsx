import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileProvider } from './src/context/ProfileContext';
import { initAudio } from './src/lib/audio';
import { getActiveRouteName, syncMenuMusicForRoute } from './src/lib/menuMusicNav';
import type { RootStackParamList } from './src/navigation';
import { AchievementWallScreen } from './src/screens/AchievementWallScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PassPlayGameScreen } from './src/screens/PassPlayGameScreen';
import { PassPlaySetupScreen } from './src/screens/PassPlaySetupScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { PartyLobbyScreen } from './src/screens/PartyLobbyScreen';
import { QuadGameScreen } from './src/screens/QuadGameScreen';
import { QuadSetupScreen } from './src/screens/QuadSetupScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.cardBorder,
    primary: colors.primary,
  },
};

export default function App() {
  useEffect(() => {
    void initAudio();
  }, []);

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <NavigationContainer
          theme={navTheme}
          onReady={() => syncMenuMusicForRoute('Home')}
          onStateChange={(state) => syncMenuMusicForRoute(getActiveRouteName(state))}
        >
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
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
            <Stack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={{ title: 'Leaderboard' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
