import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);

  const sections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          name: 'Push Notifications',
          icon: 'notifications-outline' as const,
          type: 'toggle' as const,
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          id: 'email',
          name: 'Email Notifications',
          icon: 'mail-outline' as const,
          type: 'toggle' as const,
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
        {
          id: 'campaigns',
          name: 'Campaign Alerts',
          icon: 'megaphone-outline' as const,
          type: 'toggle' as const,
          value: campaignAlerts,
          onToggle: setCampaignAlerts,
        },
      ],
    },
    {
      title: 'Payment',
      items: [
        {
          id: 'payout-methods',
          name: 'Payout Methods',
          icon: 'wallet-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Coming Soon', 'Payout methods management coming soon!'),
        },
        {
          id: 'tax-info',
          name: 'Tax Information',
          icon: 'document-text-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Coming Soon', 'Tax information management coming soon!'),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'password',
          name: 'Change Password',
          icon: 'lock-closed-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Coming Soon', 'Password change coming soon!'),
        },
        {
          id: 'two-factor',
          name: 'Two-Factor Authentication',
          icon: 'shield-checkmark-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Coming Soon', '2FA coming soon!'),
        },
        {
          id: 'privacy',
          name: 'Privacy Settings',
          icon: 'eye-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          name: 'Help Center',
          icon: 'help-circle-outline' as const,
          type: 'link' as const,
          onPress: () => Linking.openURL('https://nexus.com/help'),
        },
        {
          id: 'contact',
          name: 'Contact Support',
          icon: 'chatbubble-outline' as const,
          type: 'link' as const,
          onPress: () => Linking.openURL('mailto:support@nexus.com'),
        },
        {
          id: 'feedback',
          name: 'Send Feedback',
          icon: 'paper-plane-outline' as const,
          type: 'link' as const,
          onPress: () => Alert.alert('Feedback', 'Thank you for your interest in providing feedback!'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          name: 'Terms of Service',
          icon: 'document-outline' as const,
          type: 'link' as const,
          onPress: () => Linking.openURL('https://nexus.com/terms'),
        },
        {
          id: 'privacy-policy',
          name: 'Privacy Policy',
          icon: 'shield-outline' as const,
          type: 'link' as const,
          onPress: () => Linking.openURL('https://nexus.com/privacy'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'delete',
          name: 'Delete Account',
          icon: 'trash-outline' as const,
          type: 'action' as const,
          onPress: () =>
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => Alert.alert('Account Deletion', 'Please contact support to delete your account.'),
                },
              ]
            ),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
    >
      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {section.title}
          </Text>
          <Card padding="none">
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.type === 'toggle' ? undefined : item.onPress}
                disabled={item.type === 'toggle'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={
                    item.id === 'delete'
                      ? '#ef4444'
                      : isDark
                      ? '#9ca3af'
                      : '#6b7280'
                  }
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 14,
                    fontSize: 16,
                    color:
                      item.id === 'delete'
                        ? '#ef4444'
                        : isDark
                        ? '#f9fafb'
                        : '#111827',
                  }}
                >
                  {item.name}
                </Text>
                {item.type === 'toggle' && 'onToggle' in item ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#818cf8' }}
                    thumbColor={item.value ? '#4f46e5' : isDark ? '#6b7280' : '#f9fafb'}
                  />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#4b5563' : '#9ca3af'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      ))}

      {/* App Version */}
      <Text
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: isDark ? '#6b7280' : '#9ca3af',
        }}
      >
        NEXUS Creator v1.0.0 (Build 1)
      </Text>
    </ScrollView>
  );
}
