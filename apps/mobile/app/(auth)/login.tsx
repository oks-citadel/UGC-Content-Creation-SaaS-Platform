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

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Simulated login - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Login failed. Please try again.');
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
            {/* Email Input */}
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
                  autoCorrect={false}
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

            {/* Password Input */}
            <View style={{ marginBottom: 16 }}>
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
                  placeholder="Enter your password"
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
              style={{ alignSelf: 'flex-end', marginBottom: 24 }}
              onPress={() => Alert.alert('Forgot Password', 'Feature coming soon!')}
            >
              <Text style={{ color: '#4f46e5', fontWeight: '500' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
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
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
