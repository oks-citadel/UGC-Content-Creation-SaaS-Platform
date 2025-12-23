import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import { useContentStore } from '../../store/contentStore';
import Card from '../../components/common/Card';
import CampaignCard from '../../components/campaigns/CampaignCard';
import { RootStackParamList } from '../../navigation/AppNavigator';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const quickStats = [
  { label: 'Active', value: '5', icon: 'megaphone', color: '#4f46e5' },
  { label: 'Submitted', value: '12', icon: 'checkmark-circle', color: '#10b981' },
  { label: 'Pending', value: '3', icon: 'time', color: '#f59e0b' },
  { label: 'Earned', value: '$2.4K', icon: 'cash', color: '#059669' },
];

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { myCampaigns, myCampaignsLoading, fetchMyCampaigns } = useCampaignStore();
  const { availableBalance, fetchEarnings } = useContentStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchMyCampaigns('active');
    fetchEarnings();
  }, [fetchMyCampaigns, fetchEarnings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMyCampaigns('active'), fetchEarnings()]);
    setRefreshing(false);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Creator';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: isDark ? '#f9fafb' : '#111827',
          }}
        >
          Welcome back, {firstName}!
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginTop: 4,
          }}
        >
          Here&apos;s what&apos;s happening with your campaigns
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {quickStats.map((stat, index) => (
            <View key={index} style={{ width: '50%', padding: 6 }}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: `${stat.color}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={stat.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={stat.color}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '700',
                      color: isDark ? '#f9fafb' : '#111827',
                    }}
                  >
                    {stat.value}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginTop: 8,
                  }}
                >
                  {stat.label}
                </Text>
              </Card>
            </View>
          ))}
        </View>
      </View>

      {/* Available Balance Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PayoutRequest')}
          activeOpacity={0.8}
        >
          <View
            style={{
              backgroundColor: '#4f46e5',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                Available Balance
              </Text>
              <Text
                style={{ color: '#ffffff', fontSize: 32, fontWeight: '700', marginTop: 4 }}
              >
                ${availableBalance.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('PayoutRequest')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* Active Campaigns */}
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
            }}
          >
            Active Campaigns
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Campaigns' } as never)}>
            <Text style={{ color: '#4f46e5', fontWeight: '500' }}>See all</Text>
          </TouchableOpacity>
        </View>

        {myCampaignsLoading ? (
          <Card>
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
              Loading campaigns...
            </Text>
          </Card>
        ) : myCampaigns.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons
                name="megaphone-outline"
                size={48}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
              <Text
                style={{
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginTop: 12,
                  fontSize: 15,
                }}
              >
                No active campaigns
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', { screen: 'Campaigns' } as never)}
                style={{ marginTop: 16 }}
              >
                <Text style={{ color: '#4f46e5', fontWeight: '600' }}>
                  Browse Opportunities
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          myCampaigns.slice(0, 3).map((campaign) => (
            <View key={campaign.id} style={{ marginBottom: 12 }}>
              <CampaignCard
                campaign={campaign}
                onPress={() => navigation.navigate('CampaignDetail', { id: campaign.id })}
                variant="compact"
              />
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDark ? '#f9fafb' : '#111827',
            marginBottom: 16,
          }}
        >
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ContentUpload', {})}
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: '#4f46e5',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Ionicons name="add-circle" size={32} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '600', marginTop: 8 }}>
              Create Content
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main', { screen: 'Campaigns' } as never)}
            style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="search" size={32} color="#4f46e5" />
            <Text
              style={{
                color: isDark ? '#f9fafb' : '#111827',
                fontWeight: '600',
                marginTop: 8,
              }}
            >
              Find Campaigns
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
