import { View, Text, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { id: 'portfolio', name: 'My Portfolio', icon: 'briefcase-outline' },
  { id: 'earnings', name: 'Earnings', icon: 'wallet-outline' },
  { id: 'analytics', name: 'Analytics', icon: 'bar-chart-outline' },
  { id: 'notifications', name: 'Notifications', icon: 'notifications-outline' },
  { id: 'settings', name: 'Settings', icon: 'settings-outline' },
  { id: 'help', name: 'Help & Support', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Profile Header */}
      <View className="items-center pt-8 pb-6">
        <View className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
          <Text className="text-3xl font-bold text-primary-600">SJ</Text>
        </View>
        <Text className={`mt-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sarah Johnson
        </Text>
        <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          @sarahjohnson
        </Text>
        <View className="flex-row mt-2">
          <View className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full">
            <Text className="text-primary-600 text-sm font-medium">Pro Creator</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row px-8 py-4">
        {[
          { label: 'Campaigns', value: '24' },
          { label: 'Content', value: '156' },
          { label: 'Earned', value: '$8.5K' },
        ].map((stat, index) => (
          <View key={index} className="flex-1 items-center">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stat.value}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View className="mt-4 px-4">
        <View
          className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              className={`flex-row items-center p-4 ${
                index < menuItems.length - 1
                  ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`
                  : ''
              }`}
            >
              <Ionicons
                name={item.icon as never}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text className={`flex-1 ml-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <View className="mt-6 px-4">
        <TouchableOpacity
          className={`p-4 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text className={`text-center mt-6 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        NEXUS Creator v1.0.0
      </Text>
    </ScrollView>
  );
}
