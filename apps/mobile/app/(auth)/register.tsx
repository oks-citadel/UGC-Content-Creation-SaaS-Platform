import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
  TextInput,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const niches = ['Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Travel', 'Fitness', 'Other'];
const platforms = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter' },
];

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [socialHandle, setSocialHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!niche || !socialHandle.trim()) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Simulated registration - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#ffffff' }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, padding: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => (step === 1 ? router.back() : setStep(1))}
              style={{ marginBottom: 16 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? '#f9fafb' : '#111827'}
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            >
              {step === 1 ? 'Create Account' : 'Complete Profile'}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: isDark ? '#9ca3af' : '#6b7280',
                marginTop: 8,
              }}
            >
              {step === 1
                ? 'Start your creator journey with NEXUS'
                : 'Tell us about your content'}
            </Text>

            {/* Progress Indicator */}
            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <View
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: '#4f46e5',
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: step === 2 ? '#4f46e5' : isDark ? '#374151' : '#e5e7eb',
                  borderRadius: 2,
                }}
              />
            </View>
          </View>

          {step === 1 ? (
            <View>
              {/* Full Name */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isDark ? '#f3f4f6' : '#374151',
                    marginBottom: 6,
                  }}
                >
                  Full Name
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#d1d5db',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="person-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={fullName}
                    onChangeText={setFullName}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      color: isDark ? '#f9fafb' : '#111827',
                    }}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isDark ? '#f3f4f6' : '#374151',
                    marginBottom: 6,
                  }}
                >
                  Email
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#d1d5db',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      color: isDark ? '#f9fafb' : '#111827',
                    }}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isDark ? '#f3f4f6' : '#374151',
                    marginBottom: 6,
                  }}
                >
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#d1d5db',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <TextInput
                    placeholder="Create a password"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      color: isDark ? '#f9fafb' : '#111827',
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: '#4f46e5',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Niche Selection */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isDark ? '#f3f4f6' : '#374151',
                  marginBottom: 8,
                }}
              >
                Select Your Niche
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
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

              {/* Platform Selection */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isDark ? '#f3f4f6' : '#374151',
                  marginBottom: 8,
                }}
              >
                Primary Platform
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                {platforms.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPlatform(p.id)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 12,
                      marginHorizontal: 4,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: platform === p.id ? '#4f46e5' : isDark ? '#374151' : '#e5e7eb',
                      backgroundColor: platform === p.id ? '#eef2ff' : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={p.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={platform === p.id ? '#4f46e5' : isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: platform === p.id ? '#4f46e5' : isDark ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Social Handle */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isDark ? '#f3f4f6' : '#374151',
                    marginBottom: 6,
                  }}
                >
                  Social Handle
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#d1d5db',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="at" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <TextInput
                    placeholder="@yourusername"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={socialHandle}
                    onChangeText={setSocialHandle}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      color: isDark ? '#f9fafb' : '#111827',
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                style={{
                  backgroundColor: '#4f46e5',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
