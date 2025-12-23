import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useContentStore } from '../../store/contentStore';
import Button from '../../components/common/Button';
import MediaPicker from '../../components/content/MediaPicker';
import Input from '../../components/common/Input';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ContentUploadRouteProp = RouteProp<RootStackParamList, 'ContentUpload'>;

export default function ContentUploadScreen() {
  const navigation = useNavigation();
  const route = useRoute<ContentUploadRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { uploadContent, isUploading } = useContentStore();

  const [mediaUri, setMediaUri] = useState(route.params?.uri || '');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>(
    route.params?.type || 'photo'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleMediaSelected = (uri: string, type: 'photo' | 'video') => {
    setMediaUri(uri);
    setMediaType(type);
  };

  const handleUpload = async () => {
    if (!mediaUri) {
      Alert.alert('Error', 'Please select media to upload');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title for your content');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: mediaUri,
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `content.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      } as never);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', mediaType);
      if (route.params?.campaignId) {
        formData.append('campaignId', route.params.campaignId);
      }

      await uploadContent(formData);
      Alert.alert('Success', 'Content uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to upload content'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Media Picker */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              marginBottom: 12,
            }}
          >
            Select Media
          </Text>
          <MediaPicker
            onMediaSelected={handleMediaSelected}
            allowVideo={true}
            placeholder="Tap to add photo or video"
          />
        </View>

        {/* Title */}
        <Input
          label="Title"
          placeholder="Give your content a title"
          value={title}
          onChangeText={setTitle}
          leftIcon="text"
        />

        {/* Description */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: isDark ? '#f3f4f6' : '#374151',
              marginBottom: 6,
            }}
          >
            Description (optional)
          </Text>
          <TextInput
            placeholder="Add a description..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: isDark ? '#f9fafb' : '#111827',
              minHeight: 100,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#d1d5db',
            }}
          />
        </View>

        {/* Upload Button */}
        <Button
          title={isUploading ? 'Uploading...' : 'Upload Content'}
          onPress={handleUpload}
          loading={isUploading}
          disabled={!mediaUri || !title.trim()}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
