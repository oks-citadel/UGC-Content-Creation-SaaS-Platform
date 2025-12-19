import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="campaign/[id]"
          options={{
            title: 'Campaign Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="content/create"
          options={{
            title: 'Create Content',
            presentation: 'modal',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
