import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Campaign } from '../../services/api';

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

export default function CampaignCard({
  campaign,
  onPress,
  variant = 'default',
}: CampaignCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="megaphone" size={24} color="#4f46e5" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
            }}
            numberOfLines={1}
          >
            {campaign.name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginTop: 2,
            }}
          >
            {campaign.brand}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#059669',
            }}
          >
            ${campaign.reward}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginTop: 2,
            }}
          >
            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Campaign Image */}
      <View
        style={{
          height: 120,
          backgroundColor: isDark ? '#374151' : '#eef2ff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {campaign.image ? (
          <Image
            source={{ uri: campaign.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="image-outline" size={48} color="#4f46e5" />
        )}
      </View>

      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
              }}
              numberOfLines={1}
            >
              {campaign.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
                marginTop: 2,
              }}
            >
              {campaign.brand}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#dcfce7',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#166534', fontWeight: '600', fontSize: 14 }}>
              ${campaign.reward}
            </Text>
          </View>
        </View>

        {/* Requirements */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          {campaign.requirements.slice(0, 3).map((req, index) => (
            <View
              key={index}
              style={{
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? '#d1d5db' : '#4b5563',
                }}
              >
                {req}
              </Text>
            </View>
          ))}
          {campaign.requirements.length > 3 && (
            <View
              style={{
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? '#d1d5db' : '#4b5563',
                }}
              >
                +{campaign.requirements.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#e5e7eb',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Text
              style={{
                marginLeft: 4,
                fontSize: 13,
                color: daysLeft <= 3 ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280',
              }}
            >
              {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="people-outline"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Text
              style={{
                marginLeft: 4,
                fontSize: 13,
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
            >
              {campaign.filledSlots}/{campaign.slots} spots
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
