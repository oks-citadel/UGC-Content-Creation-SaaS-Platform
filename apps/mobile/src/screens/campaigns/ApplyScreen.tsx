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
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ApplyRouteProp = RouteProp<RootStackParamList, 'Apply'>;

export default function ApplyScreen() {
  const navigation = useNavigation();
  const route = useRoute<ApplyRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { campaignId, campaignName } = route.params;
  const { applyToCampaign } = useCampaignStore();

  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pitch.trim()) {
      Alert.alert('Error', 'Please write a pitch for your application');
      return;
    }

    if (pitch.length < 50) {
      Alert.alert('Error', 'Your pitch should be at least 50 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await applyToCampaign(campaignId, pitch);
      Alert.alert(
        'Application Submitted!',
        'Your application has been sent to the brand. You will be notified when they respond.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    } finally {
      setIsSubmitting(false);
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
        {/* Campaign Info */}
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="megaphone" size={24} color="#4f46e5" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#f9fafb' : '#111827',
                }}
              >
                {campaignName}
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }}>
                Application for campaign
              </Text>
            </View>
          </View>
        </Card>

        {/* Tips */}
        <Card style={{ marginBottom: 20, backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="bulb" size={24} color="#3b82f6" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: isDark ? '#93c5fd' : '#1e40af',
                  marginBottom: 8,
                }}
              >
                Tips for a great pitch
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#bfdbfe' : '#1e40af', lineHeight: 20 }}>
                {'\u2022'} Explain why you are a good fit for this campaign{'\n'}
                {'\u2022'} Mention relevant experience or past collaborations{'\n'}
                {'\u2022'} Share your content creation style and approach{'\n'}
                {'\u2022'} Be authentic and show your personality
              </Text>
            </View>
          </View>
        </Card>

        {/* Pitch Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              marginBottom: 8,
            }}
          >
            Your Pitch
          </Text>
          <TextInput
            placeholder="Tell the brand why you would be perfect for this campaign..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={pitch}
            onChangeText={setPitch}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: isDark ? '#f9fafb' : '#111827',
              minHeight: 200,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }}
          />
          <Text
            style={{
              fontSize: 13,
              color: pitch.length < 50 ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280',
              marginTop: 8,
              textAlign: 'right',
            }}
          >
            {pitch.length}/500 characters (min. 50)
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          title="Submit Application"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={pitch.length < 50}
          fullWidth
          size="lg"
        />

        <Text
          style={{
            fontSize: 13,
            color: isDark ? '#6b7280' : '#9ca3af',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          By submitting, you agree to the campaign terms and conditions
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
