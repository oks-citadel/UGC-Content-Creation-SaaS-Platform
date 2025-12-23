import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/campaignStore';
import CampaignCard from '../../components/campaigns/CampaignCard';
import { RootStackParamList } from '../../navigation/AppNavigator';

type CampaignsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const categories = ['All', 'Fashion', 'Beauty', 'Tech', 'Lifestyle', 'Food', 'Travel'];

export default function CampaignsListScreen() {
  const navigation = useNavigation<CampaignsNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    opportunities,
    opportunitiesLoading,
    opportunitiesError,
    fetchOpportunities,
    setFilters,
    filters,
  } = useCampaignStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilters({ ...filters, search: text || undefined });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFilters({
      ...filters,
      category: category === 'All' ? undefined : category,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOpportunities();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      {/* Search Bar */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            placeholder="Search campaigns..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={handleSearch}
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 12,
              fontSize: 16,
              color: isDark ? '#f9fafb' : '#111827',
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategorySelect(item)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor:
                  selectedCategory === item
                    ? '#4f46e5'
                    : isDark
                    ? '#1f2937'
                    : '#ffffff',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color:
                    selectedCategory === item
                      ? '#ffffff'
                      : isDark
                      ? '#d1d5db'
                      : '#4b5563',
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Campaigns List */}
      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            onPress={() => navigation.navigate('CampaignDetail', { id: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            {opportunitiesLoading ? (
              <>
                <Ionicons
                  name="hourglass-outline"
                  size={48}
                  color={isDark ? '#4b5563' : '#9ca3af'}
                />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 16,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  Loading campaigns...
                </Text>
              </>
            ) : opportunitiesError ? (
              <>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#ef4444"
                />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 16,
                    color: '#ef4444',
                  }}
                >
                  {opportunitiesError}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchOpportunities()}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ color: '#4f46e5', fontWeight: '600' }}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={isDark ? '#4b5563' : '#9ca3af'}
                />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 16,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  No campaigns found
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    color: isDark ? '#6b7280' : '#9ca3af',
                  }}
                >
                  Try adjusting your search or filters
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}
