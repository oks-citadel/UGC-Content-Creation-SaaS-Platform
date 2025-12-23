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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { validateEmail, validatePassword, validateFullName } from '../../services/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const niches = ['Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Travel', 'Fitness', 'Other'];
const platforms = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter' },
];

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { register, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'tiktok' | 'twitter'>('instagram');
  const [socialHandle, setSocialHandle] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!validateFullName(fullName)) {
      newErrors.fullName = 'Please enter your full name';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message || 'Invalid password';
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!niche) {
      newErrors.niche = 'Please select your niche';
    }

    if (!socialHandle.trim()) {
      newErrors.socialHandle = 'Social handle is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    clearError();
    if (!validateStep2()) return;

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        niche,
        platform,
        socialHandle: socialHandle.trim(),
      });
    } catch (err) {
      Alert.alert(
        'Registration Failed',
        err instanceof Error ? err.message : 'An error occurred'
      );
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
              onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
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
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                leftIcon="person-outline"
                error={errors.fullName}
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail-outline"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.confirmPassword}
              />

              <Button
                title="Continue"
                onPress={handleNext}
                fullWidth
                size="lg"
                style={{ marginTop: 16 }}
              />
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
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
              {errors.niche && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8 }}>
                  {errors.niche}
                </Text>
              )}

              {/* Platform Selection */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isDark ? '#f3f4f6' : '#374151',
                  marginBottom: 8,
                  marginTop: 8,
                }}
              >
                Primary Platform
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                {platforms.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPlatform(p.id as typeof platform)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 12,
                      marginHorizontal: 4,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor:
                        platform === p.id ? '#4f46e5' : isDark ? '#374151' : '#e5e7eb',
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

              <Input
                label="Social Handle"
                placeholder="@yourusername"
                value={socialHandle}
                onChangeText={setSocialHandle}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="at"
                error={errors.socialHandle}
              />

              {error && (
                <View
                  style={{
                    backgroundColor: '#fef2f2',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={{ color: '#991b1b', marginLeft: 8, flex: 1 }}>{error}</Text>
                </View>
              )}

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                fullWidth
                size="lg"
                style={{ marginTop: 16 }}
              />
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
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
