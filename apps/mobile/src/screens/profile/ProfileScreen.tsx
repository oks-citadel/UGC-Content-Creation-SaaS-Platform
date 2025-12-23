import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/common/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const menuItems = [
  { id: 'edit', name: 'Edit Profile', icon: 'person-outline', route: 'EditProfile' },
  { id: 'portfolio', name: 'My Portfolio', icon: 'briefcase-outline', route: null },
  { id: 'analytics', name: 'Analytics', icon: 'bar-chart-outline', route: null },
  { id: 'notifications', name: 'Notifications', icon: 'notifications-outline', route: null },
  { id: 'settings', name: 'Settings', icon: 'settings-outline', route: 'Settings' },
  { id: 'help', name: 'Help & Support', icon: 'help-circle-outline', route: null },
];

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleMenuPress = (item: (typeof menuItems)[0]) => {
    if (item.route) {
      navigation.navigate(item.route as keyof RootStackParamList);
    } else {
      Alert.alert('Coming Soon', `${item.name} feature coming soon!`);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Profile Header */}
      <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 96, height: 96, borderRadius: 48 }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#eef2ff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#4f46e5' }}>
              {getInitials(user?.fullName || 'User')}
            </Text>
          </View>
        )}

        <Text
          style={{
            marginTop: 16,
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#f9fafb' : '#111827',
          }}
        >
          {user?.fullName || 'Creator'}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginTop: 4,
          }}
        >
          {user?.email}
        </Text>

        {user?.niche && (
          <View
            style={{
              backgroundColor: '#eef2ff',
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#4f46e5', fontWeight: '500' }}>{user.niche} Creator</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: isDark ? '#374151' : '#e5e7eb',
        }}
      >
        {[
          { label: 'Campaigns', value: '24' },
          { label: 'Content', value: '156' },
          { label: 'Earned', value: '$8.5K' },
        ].map((stat, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? '#9ca3af' : '#6b7280',
                marginTop: 4,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={{ padding: 20 }}>
        <Card padding="none">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuPress(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? '#374151' : '#f3f4f6',
              }}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 16,
                  fontSize: 16,
                  color: isDark ? '#f9fafb' : '#111827',
                }}
              >
                {item.name}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      {/* Sign Out */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 16 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
          color: isDark ? '#6b7280' : '#9ca3af',
        }}
      >
        NEXUS Creator v1.0.0
      </Text>
    </ScrollView>
  );
}
