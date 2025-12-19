import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  FlatList,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const campaigns = [
  {
    id: '1',
    name: 'Summer Collection Launch',
    brand: 'Fashion Brand Co.',
    category: 'Fashion',
    reward: '$500',
    deadline: '5 days',
    slots: '3/10',
    requirements: ['1 Reel', '2 Stories'],
    image: null,
  },
  {
    id: '2',
    name: 'Tech Product Review',
    brand: 'Tech Gadgets Inc.',
    category: 'Technology',
    reward: '$200',
    deadline: '2 days',
    slots: '8/15',
    requirements: ['1 Video', '1 Post'],
    image: null,
  },
  {
    id: '3',
    name: 'Lifestyle Brand Story',
    brand: 'Lifestyle Co.',
    category: 'Lifestyle',
    reward: '$350',
    deadline: '10 days',
    slots: '5/20',
    requirements: ['3 Posts', '5 Stories'],
    image: null,
  },
  {
    id: '4',
    name: 'Food & Beverage Promo',
    brand: 'Tasty Foods',
    category: 'Food',
    reward: '$150',
    deadline: '7 days',
    slots: '2/8',
    requirements: ['2 Reels'],
    image: null,
  },
];

const categories = ['All', 'Fashion', 'Technology', 'Lifestyle', 'Food', 'Beauty'];

export default function CampaignsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory =
      selectedCategory === 'All' || campaign.category === selectedCategory;
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Search */}
      <View className="px-4 py-3">
        <View
          className={`flex-row items-center px-4 rounded-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <Ionicons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            className={`flex-1 py-3 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
            placeholder="Search campaigns..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`px-4 py-2 mr-2 rounded-full ${
              selectedCategory === category
                ? 'bg-primary-600'
                : isDark
                ? 'bg-gray-800'
                : 'bg-white'
            }`}
          >
            <Text
              className={`font-medium ${
                selectedCategory === category
                  ? 'text-white'
                  : isDark
                  ? 'text-gray-300'
                  : 'text-gray-700'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Campaign List */}
      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item }) => (
          <Link href={`/campaign/${item.id}`} asChild>
            <TouchableOpacity
              className={`rounded-xl overflow-hidden ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
            >
              {/* Campaign Image Placeholder */}
              <View className="h-32 bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
                <Ionicons name="image-outline" size={48} color="#4f46e5" />
              </View>

              <View className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Text>
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.brand}
                    </Text>
                  </View>
                  <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                    <Text className="text-green-700 dark:text-green-400 font-semibold">
                      {item.reward}
                    </Text>
                  </View>
                </View>

                {/* Requirements */}
                <View className="mt-3 flex-row flex-wrap">
                  {item.requirements.map((req, index) => (
                    <View
                      key={index}
                      className={`mr-2 mb-2 px-2 py-1 rounded ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {req}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer */}
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text
                      className={`ml-1 text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item.deadline} left
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text
                      className={`ml-1 text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item.slots} slots
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons
              name="search-outline"
              size={48}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text
              className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              No campaigns found
            </Text>
          </View>
        }
      />
    </View>
  );
}
