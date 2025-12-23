import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useColorScheme,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface MediaPickerProps {
  onMediaSelected: (uri: string, type: 'photo' | 'video') => void;
  allowVideo?: boolean;
  maxDuration?: number;
  aspectRatio?: [number, number];
  placeholder?: string;
}

export default function MediaPicker({
  onMediaSelected,
  allowVideo = true,
  maxDuration = 60,
  aspectRatio,
  placeholder = 'Tap to add media',
}: MediaPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'photo' | 'video';
  } | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and media library permissions to continue.'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    setShowOptions(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({ uri: asset.uri, type: 'photo' });
      onMediaSelected(asset.uri, 'photo');
    }
  };

  const handleRecordVideo = async () => {
    if (!allowVideo) return;
    setShowOptions(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: maxDuration,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({ uri: asset.uri, type: 'video' });
      onMediaSelected(asset.uri, 'video');
    }
  };

  const handlePickFromLibrary = async () => {
    setShowOptions(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 1,
      videoMaxDuration: maxDuration,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'photo';
      setSelectedMedia({ uri: asset.uri, type });
      onMediaSelected(asset.uri, type);
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowOptions(true)}
        activeOpacity={0.8}
        style={{
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: isDark ? '#374151' : '#d1d5db',
          borderRadius: 16,
          height: 200,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {selectedMedia ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image
              source={{ uri: selectedMedia.uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {selectedMedia.type === 'video' && (
              <View
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -24 }, { translateY: -24 }],
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="play" size={24} color="white" />
              </View>
            )}
            <TouchableOpacity
              onPress={clearMedia}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isDark ? '#374151' : '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="camera"
                size={32}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </View>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
            >
              {placeholder}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDark ? '#4b5563' : '#d1d5db',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 24,
              }}
            />

            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              Add Media
            </Text>

            <TouchableOpacity
              onPress={handleTakePhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Ionicons name="camera" size={24} color="#4f46e5" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 16,
                  color: isDark ? '#f9fafb' : '#111827',
                }}
              >
                Take Photo
              </Text>
            </TouchableOpacity>

            {allowVideo && (
              <TouchableOpacity
                onPress={handleRecordVideo}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="videocam" size={24} color="#4f46e5" />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 16,
                    color: isDark ? '#f9fafb' : '#111827',
                  }}
                >
                  Record Video
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handlePickFromLibrary}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                borderRadius: 12,
              }}
            >
              <Ionicons name="images" size={24} color="#4f46e5" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 16,
                  color: isDark ? '#f9fafb' : '#111827',
                }}
              >
                Choose from Library
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
