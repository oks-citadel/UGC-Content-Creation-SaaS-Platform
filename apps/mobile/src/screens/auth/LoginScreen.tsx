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
import { validateEmail } from '../../services/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    clearError();
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      Alert.alert(
        'Login Failed',
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
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Logo / Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: '#4f46e5',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="sparkles" size={40} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            >
              Welcome Back
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: isDark ? '#9ca3af' : '#6b7280',
                marginTop: 8,
              }}
            >
              Sign in to continue to NEXUS
            </Text>
          </View>

          {/* Form */}
          <View>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={passwordError}
            />

            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginBottom: 24 }}
              onPress={() => Alert.alert('Forgot Password', 'Feature coming soon!')}
            >
              <Text style={{ color: '#4f46e5', fontWeight: '500' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

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
                <Text style={{ color: '#991b1b', marginLeft: 8, flex: 1 }}>
                  {error}
                </Text>
              </View>
            )}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Social Login */}
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                }}
              />
              <Text
                style={{
                  marginHorizontal: 16,
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                or continue with
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 8,
                }}
                onPress={() => Alert.alert('Coming Soon', 'Google login coming soon!')}
              >
                <Ionicons name="logo-google" size={24} color="#db4437" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 8,
                }}
                onPress={() => Alert.alert('Coming Soon', 'Apple login coming soon!')}
              >
                <Ionicons name="logo-apple" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              Don&apos;t have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
