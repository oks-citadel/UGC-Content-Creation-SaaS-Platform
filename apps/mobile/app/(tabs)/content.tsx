import { View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons
          name="images-outline"
          size={64}
          color={isDark ? '#4b5563' : '#9ca3af'}
        />
        <Text className={`mt-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Content Library
        </Text>
        <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          All your created and uploaded content will appear here
        </Text>
      </View>
    </View>
  );
}
