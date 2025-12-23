import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface ChartData {
  month: string;
  earnings: number;
}

interface EarningsChartProps {
  data?: ChartData[];
  totalEarnings?: number;
  pendingEarnings?: number;
  availableBalance?: number;
}

const defaultData: ChartData[] = [
  { month: 'Jan', earnings: 1200 },
  { month: 'Feb', earnings: 1800 },
  { month: 'Mar', earnings: 2400 },
  { month: 'Apr', earnings: 2100 },
  { month: 'May', earnings: 3200 },
  { month: 'Jun', earnings: 2800 },
];

export default function EarningsChart({
  data = defaultData,
  totalEarnings = 13500,
  pendingEarnings = 850,
  availableBalance = 2450,
}: EarningsChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const maxEarnings = Math.max(...data.map((d) => d.earnings));

  return (
    <View>
      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#4f46e5',
            borderRadius: 12,
            padding: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
            Available
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700', marginTop: 4 }}>
            ${availableBalance.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            borderRadius: 12,
            padding: 16,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
            Pending
          </Text>
          <Text
            style={{
              color: isDark ? '#f9fafb' : '#111827',
              fontSize: 24,
              fontWeight: '700',
              marginTop: 4,
            }}
          >
            ${pendingEarnings.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Total Earnings */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 14 }}>
          Total Earnings
        </Text>
        <Text
          style={{
            color: isDark ? '#f9fafb' : '#111827',
            fontSize: 32,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          ${totalEarnings.toLocaleString()}
        </Text>
      </View>

      {/* Bar Chart */}
      <View
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#f9fafb' : '#111827',
            marginBottom: 16,
          }}
        >
          Monthly Earnings
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: 150,
          }}
        >
          {data.map((item, index) => {
            const barHeight = (item.earnings / maxEarnings) * 120;
            return (
              <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginBottom: 4,
                  }}
                >
                  ${(item.earnings / 1000).toFixed(1)}K
                </Text>
                <View
                  style={{
                    width: '60%',
                    height: barHeight,
                    backgroundColor: index === data.length - 1 ? '#4f46e5' : '#c7d2fe',
                    borderRadius: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginTop: 8,
                  }}
                >
                  {item.month}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 16,
            marginRight: 6,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827',
            }}
          >
            ${(totalEarnings / data.length / 1000).toFixed(1)}K
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
            Avg Monthly
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 16,
            marginLeft: 6,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#10b981' }}>
            +24%
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
            Growth Rate
          </Text>
        </View>
      </View>
    </View>
  );
}
