import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { initDatabase } from '@/features/storage/sqlite';
import { SessionProvider } from '@/features/session/context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
      } catch (e) {
        console.error('Failed to init database:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
