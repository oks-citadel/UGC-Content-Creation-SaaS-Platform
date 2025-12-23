import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const niches = ['Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Travel', 'Fitness', 'Other'];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, updateUser, isLoading } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [niche, setNiche] = useState(user?.niche || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [socialAccounts, setSocialAccounts] = useState(user?.socialAccounts || {});

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    try {
      await updateUser({
        fullName: fullName.trim(),
        bio: bio.trim(),
        niche,
        avatar,
        socialAccounts,
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity onPress={handlePickAvatar}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#eef2ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 40, fontWeight: '700', color: '#4f46e5' }}>
                  {getInitials(fullName || 'User')}
                </Text>
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#4f46e5',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: isDark ? '#111827' : '#f9fafb',
              }}
            >
              <Ionicons name="camera" size={18} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              color: '#4f46e5',
              fontWeight: '500',
            }}
          >
            Change Photo
          </Text>
        </View>

        {/* Form Fields */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          leftIcon="person-outline"
        />

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: isDark ? '#f3f4f6' : '#374151',
              marginBottom: 6,
            }}
          >
            Bio
          </Text>
          <Input
            placeholder="Tell brands about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Niche Selection */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: isDark ? '#f3f4f6' : '#374151',
              marginBottom: 8,
            }}
          >
            Your Niche
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {niches.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setNiche(n)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: niche === n ? '#4f46e5' : isDark ? '#374151' : '#e5e7eb',
                  backgroundColor: niche === n ? '#eef2ff' : 'transparent',
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: niche === n ? '#4f46e5' : isDark ? '#d1d5db' : '#4b5563',
                    fontWeight: niche === n ? '600' : '400',
                  }}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Social Accounts */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isDark ? '#f9fafb' : '#111827',
            marginBottom: 16,
          }}
        >
          Social Accounts
        </Text>

        <Input
          label="Instagram"
          placeholder="@yourusername"
          value={socialAccounts.instagram || ''}
          onChangeText={(text) =>
            setSocialAccounts({ ...socialAccounts, instagram: text })
          }
          leftIcon="logo-instagram"
        />

        <Input
          label="YouTube"
          placeholder="Channel URL"
          value={socialAccounts.youtube || ''}
          onChangeText={(text) =>
            setSocialAccounts({ ...socialAccounts, youtube: text })
          }
          leftIcon="logo-youtube"
        />

        <Input
          label="TikTok"
          placeholder="@yourusername"
          value={socialAccounts.tiktok || ''}
          onChangeText={(text) =>
            setSocialAccounts({ ...socialAccounts, tiktok: text })
          }
          leftIcon="logo-tiktok"
        />

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          size="lg"
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
