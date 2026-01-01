import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../../store/contentStore';
import { Content } from '../../services/api';
import Button from '../../components/common/Button';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ContentPreviewRouteProp = RouteProp<RootStackParamList, 'ContentPreview'>;

export default function ContentPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<ContentPreviewRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { contentId } = route.params;
  const { content, deleteContent } = useContentStore();
  const [contentItem, setContentItem] = useState<Content | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const item = content.find((c) => c.id === contentId);
    setContentItem(item || null);
  }, [content, contentId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this content? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteContent(contentId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete content');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', text: '#166534' };
      case 'submitted':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'rejected':
        return { bg: '#fef2f2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  if (!contentItem) {
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

  const statusColor = getStatusColor(contentItem.status);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      {/* Media Preview */}
      <View
        style={{
          height: 400,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={{ uri: contentItem.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
        {contentItem.type === 'video' && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(255,255,255,0.9)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="play" size={32} color="#4f46e5" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Info */}
      <View style={{ padding: 20 }}>
        {/* Status Badge */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: statusColor.bg,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: statusColor.text,
                fontWeight: '600',
                fontSize: 13,
                textTransform: 'capitalize',
              }}
            >
              {contentItem.status}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: isDark ? '#f9fafb' : '#111827',
          }}
        >
          {contentItem.title || 'Untitled Content'}
        </Text>

        {/* Campaign Link */}
        {contentItem.campaignName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="megaphone-outline" size={16} color="#4f46e5" />
            <Text style={{ marginLeft: 6, color: '#4f46e5', fontWeight: '500' }}>
              {contentItem.campaignName}
            </Text>
          </View>
        )}

        {/* Description */}
        {contentItem.description && (
          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginTop: 16,
              lineHeight: 22,
            }}
          >
            {contentItem.description}
          </Text>
        )}

        {/* Created Date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
          <Text
            style={{
              marginLeft: 6,
              fontSize: 14,
              color: isDark ? '#9ca3af' : '#6b7280',
            }}
          >
            Created {new Date(contentItem.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ marginTop: 24 }}>
          {contentItem.status === 'draft' && (
            <Button
              title="Submit for Review"
              onPress={() => Alert.alert('Submit', 'Content submitted for review!')}
              fullWidth
              size="lg"
              style={{ marginBottom: 12 }}
            />
          )}

          <Button
            title={isDeleting ? 'Deleting...' : 'Delete Content'}
            onPress={handleDelete}
            variant="danger"
            loading={isDeleting}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </View>
  );
}
