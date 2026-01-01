import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';

type CampaignDetailRouteProp = RouteProp<RootStackParamList, 'CampaignDetail'>;
type CampaignDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CampaignDetailScreen() {
  const navigation = useNavigation<CampaignDetailNavigationProp>();
  const route = useRoute<CampaignDetailRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { id } = route.params;
  const { selectedCampaign, selectedCampaignLoading, fetchCampaign, clearSelectedCampaign } =
    useCampaignStore();

  useEffect(() => {
    fetchCampaign(id);
    return () => clearSelectedCampaign();
  }, [id, fetchCampaign, clearSelectedCampaign]);

  if (selectedCampaignLoading || !selectedCampaign) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#111827' : '#f9fafb',
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const campaign = selectedCampaign;
  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Campaign Image */}
        <View
          style={{
            height: 200,
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
            <Ionicons name="image-outline" size={64} color="#4f46e5" />
          )}
        </View>

        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: isDark ? '#f9fafb' : '#111827',
                }}
              >
                {campaign.name}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginTop: 4,
                }}
              >
                by {campaign.brand}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#dcfce7',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: '#166534', fontWeight: '700', fontSize: 18 }}>
                ${campaign.reward}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                padding: 12,
                borderRadius: 12,
                marginRight: 8,
              }}
            >
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <View style={{ marginLeft: 8 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: daysLeft <= 3 ? '#ef4444' : isDark ? '#f9fafb' : '#111827',
                  }}
                >
                  {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                  remaining
                </Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                padding: 12,
                borderRadius: 12,
                marginLeft: 8,
              }}
            >
              <Ionicons name="people-outline" size={20} color="#4f46e5" />
              <View style={{ marginLeft: 8 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isDark ? '#f9fafb' : '#111827',
                  }}
                >
                  {campaign.filledSlots}/{campaign.slots}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                  spots filled
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: 8,
              }}
            >
              About this Campaign
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: isDark ? '#d1d5db' : '#4b5563',
              }}
            >
              {campaign.description}
            </Text>
          </Card>

          {/* Requirements */}
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: 12,
              }}
            >
              Requirements
            </Text>
            {campaign.requirements.map((req, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: index < campaign.requirements.length - 1 ? 8 : 0,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text
                  style={{
                    marginLeft: 10,
                    fontSize: 15,
                    color: isDark ? '#d1d5db' : '#4b5563',
                  }}
                >
                  {req}
                </Text>
              </View>
            ))}
          </Card>

          {/* Deliverables */}
          <Card>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: 12,
              }}
            >
              Deliverables
            </Text>
            {campaign.deliverables.map((deliverable, index) => (
              <View
                key={deliverable.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: index < campaign.deliverables.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#e5e7eb',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons
                    name={
                      deliverable.type === 'video'
                        ? 'videocam'
                        : deliverable.type === 'photo'
                        ? 'camera'
                        : 'document-text'
                    }
                    size={24}
                    color="#4f46e5"
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: isDark ? '#f9fafb' : '#111827',
                        textTransform: 'capitalize',
                      }}
                    >
                      {deliverable.quantity}x {deliverable.type}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      {deliverable.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          backgroundColor: isDark ? '#111827' : '#f9fafb',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        }}
      >
        <Button
          title="Apply to Campaign"
          onPress={() =>
            navigation.navigate('Apply', {
              campaignId: campaign.id,
              campaignName: campaign.name,
            })
          }
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}
