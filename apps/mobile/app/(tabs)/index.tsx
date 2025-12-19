import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const quickStats = [
  { label: 'Active Campaigns', value: '5', icon: 'megaphone' },
  { label: 'Content Submitted', value: '24', icon: 'images' },
  { label: 'Total Earnings', value: '$2,450', icon: 'cash' },
  { label: 'Pending Reviews', value: '3', icon: 'time' },
];

const activeCampaigns = [
  {
    id: '1',
    name: 'Summer Collection',
    brand: 'Fashion Brand Co.',
    deadline: '5 days',
    reward: '$500',
    progress: 60,
  },
  {
    id: '2',
    name: 'Product Review',
    brand: 'Tech Gadgets Inc.',
    deadline: '2 days',
    reward: '$200',
    progress: 80,
  },
  {
    id: '3',
    name: 'Brand Story',
    brand: 'Lifestyle Co.',
    deadline: '10 days',
    reward: '$350',
    progress: 25,
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-6">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome back, Sarah!
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Here&apos;s what&apos;s happening with your campaigns
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="px-4">
        <View className="flex-row flex-wrap -mx-2">
          {quickStats.map((stat, index) => (
            <View key={index} className="w-1/2 px-2 mb-4">
              <View
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
              >
                <View className="flex-row items-center justify-between">
                  <Ionicons
                    name={stat.icon as never}
                    size={24}
                    color="#4f46e5"
                  />
                  <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </Text>
                </View>
                <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Active Campaigns */}
      <View className="mt-6 px-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Active Campaigns
          </Text>
          <Link href="/campaigns" asChild>
            <TouchableOpacity>
              <Text className="text-primary-600">See all</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {activeCampaigns.map((campaign) => (
          <Link key={campaign.id} href={`/campaign/${campaign.id}`} asChild>
            <TouchableOpacity
              className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.name}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {campaign.brand}
                  </Text>
                </View>
                <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-green-700 dark:text-green-400">
                    {campaign.reward}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Progress
                  </Text>
                  <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.progress}%
                  </Text>
                </View>
                <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <View
                    className="h-full bg-primary-600 rounded-full"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </View>
              </View>

              {/* Deadline */}
              <View className="mt-3 flex-row items-center">
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Due in {campaign.deadline}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* Quick Actions */}
      <View className="mt-6 px-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </Text>
        <View className="flex-row">
          <Link href="/content/create" asChild>
            <TouchableOpacity
              className="flex-1 mr-2 p-4 bg-primary-600 rounded-xl items-center"
            >
              <Ionicons name="add-circle" size={32} color="white" />
              <Text className="mt-2 text-white font-medium">Create Content</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/campaigns" asChild>
            <TouchableOpacity
              className={`flex-1 ml-2 p-4 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
            >
              <Ionicons name="search" size={32} color="#4f46e5" />
              <Text className={`mt-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Find Campaigns
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
