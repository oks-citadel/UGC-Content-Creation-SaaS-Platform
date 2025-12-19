import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
