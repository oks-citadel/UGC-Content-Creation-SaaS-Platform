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
import { useContentStore } from '../../store/contentStore';
import Card from '../../components/common/Card';
import EarningsChart from '../../components/earnings/EarningsChart';
import Button from '../../components/common/Button';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EarningsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EarningsScreen() {
  const navigation = useNavigation<EarningsNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    earnings,
    totalEarnings,
    availableBalance,
    pendingBalance,
    payouts,
    fetchEarnings,
    fetchPayouts,
  } = useContentStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'earnings' | 'payouts'>('earnings');

  useEffect(() => {
    fetchEarnings();
    fetchPayouts();
  }, [fetchEarnings, fetchPayouts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchEarnings(), fetchPayouts()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'completed':
        return { bg: '#dcfce7', text: '#166534' };
      case 'pending':
      case 'processing':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'paid':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'failed':
        return { bg: '#fef2f2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Earnings Chart */}
      <View style={{ padding: 20 }}>
        <EarningsChart
          totalEarnings={totalEarnings}
          availableBalance={availableBalance}
          pendingEarnings={pendingBalance}
        />
      </View>

      {/* Withdraw Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Button
          title="Request Payout"
          onPress={() => navigation.navigate('PayoutRequest')}
          fullWidth
          size="lg"
          disabled={availableBalance === 0}
        />
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('earnings')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'earnings' ? '#4f46e5' : 'transparent',
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === 'earnings' ? '#4f46e5' : isDark ? '#9ca3af' : '#6b7280',
            }}
          >
            Earnings History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('payouts')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'payouts' ? '#4f46e5' : 'transparent',
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === 'payouts' ? '#4f46e5' : isDark ? '#9ca3af' : '#6b7280',
            }}
          >
            Payout History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 20 }}>
        {activeTab === 'earnings' ? (
          earnings.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons
                  name="wallet-outline"
                  size={48}
                  color={isDark ? '#4b5563' : '#9ca3af'}
                />
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 16,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  No earnings yet
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    color: isDark ? '#6b7280' : '#9ca3af',
                    textAlign: 'center',
                  }}
                >
                  Complete campaigns to start earning
                </Text>
              </View>
            </Card>
          ) : (
            earnings.map((earning) => {
              const statusColor = getStatusColor(earning.status);
              return (
                <Card key={earning.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: isDark ? '#f9fafb' : '#111827',
                        }}
                      >
                        {earning.campaignName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: isDark ? '#9ca3af' : '#6b7280',
                          marginTop: 4,
                        }}
                      >
                        {new Date(earning.earnedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: '#059669',
                        }}
                      >
                        +${earning.amount}
                      </Text>
                      <View
                        style={{
                          backgroundColor: statusColor.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '500',
                            color: statusColor.text,
                            textTransform: 'capitalize',
                          }}
                        >
                          {earning.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })
          )
        ) : payouts.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons
                name="cash-outline"
                size={48}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 16,
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                No payouts yet
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: isDark ? '#6b7280' : '#9ca3af',
                  textAlign: 'center',
                }}
              >
                Request a payout when you have available balance
              </Text>
            </View>
          </Card>
        ) : (
          payouts.map((payout) => {
            const statusColor = getStatusColor(payout.status);
            return (
              <Card key={payout.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isDark ? '#f9fafb' : '#111827',
                        textTransform: 'capitalize',
                      }}
                    >
                      {payout.method.replace('_', ' ')}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 4,
                      }}
                    >
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: isDark ? '#f9fafb' : '#111827',
                      }}
                    >
                      ${payout.amount}
                    </Text>
                    <View
                      style={{
                        backgroundColor: statusColor.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '500',
                          color: statusColor.text,
                          textTransform: 'capitalize',
                        }}
                      >
                        {payout.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
