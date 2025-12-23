import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../../store/contentStore';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const payoutMethods = [
  { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'business' },
  { id: 'venmo', name: 'Venmo', icon: 'phone-portrait' },
];

export default function PayoutRequestScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { availableBalance, requestPayout } = useContentStore();

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'bank_transfer' | 'venmo'>('paypal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(numericText);
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (numAmount > availableBalance) {
      Alert.alert('Error', 'Amount exceeds available balance');
      return;
    }

    if (numAmount < 10) {
      Alert.alert('Error', 'Minimum payout amount is $10');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayout(numAmount, selectedMethod);
      Alert.alert(
        'Payout Requested',
        `Your payout of $${numAmount.toFixed(2)} has been requested. You will receive it within 3-5 business days.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to request payout'
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
        {/* Available Balance */}
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: '#4f46e5',
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Available Balance
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '700', marginTop: 4 }}>
            ${availableBalance.toLocaleString()}
          </Text>
        </Card>

        {/* Amount Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              marginBottom: 12,
            }}
          >
            Amount to Withdraw
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#d1d5db',
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            >
              $
            </Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 8,
                fontSize: 24,
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
            <TouchableOpacity
              onPress={handleMaxAmount}
              style={{
                backgroundColor: '#eef2ff',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 13 }}>MAX</Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginTop: 8,
            }}
          >
            Minimum payout: $10
          </Text>
        </View>

        {/* Payout Method */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              marginBottom: 12,
            }}
          >
            Payout Method
          </Text>
          {payoutMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setSelectedMethod(method.id as typeof selectedMethod)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderRadius: 12,
                borderWidth: 2,
                borderColor:
                  selectedMethod === method.id
                    ? '#4f46e5'
                    : isDark
                    ? '#374151'
                    : '#e5e7eb',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={method.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={selectedMethod === method.id ? '#4f46e5' : isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 16,
                  fontWeight: '500',
                  color: isDark ? '#f9fafb' : '#111827',
                  flex: 1,
                }}
              >
                {method.name}
              </Text>
              {selectedMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <Card style={{ marginBottom: 24, backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }}>
          <View style={{ flexDirection: 'row' }}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#93c5fd' : '#1e40af',
                  lineHeight: 20,
                }}
              >
                Payouts are typically processed within 3-5 business days. You will receive a
                confirmation email once your payout is complete.
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title={isSubmitting ? 'Processing...' : 'Request Payout'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
