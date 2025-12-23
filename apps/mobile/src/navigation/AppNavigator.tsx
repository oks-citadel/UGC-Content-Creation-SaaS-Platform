import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Screen imports for modal/stack screens
import CampaignDetailScreen from '../screens/campaigns/CampaignDetailScreen';
import ApplyScreen from '../screens/campaigns/ApplyScreen';
import ContentUploadScreen from '../screens/content/ContentUploadScreen';
import ContentPreviewScreen from '../screens/content/ContentPreviewScreen';
import PayoutRequestScreen from '../screens/earnings/PayoutRequestScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CampaignDetail: { id: string };
  Apply: { campaignId: string; campaignName: string };
  ContentUpload: { uri?: string; type?: 'photo' | 'video'; campaignId?: string };
  ContentPreview: { contentId: string };
  PayoutRequest: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsReady(true);
    };
    initAuth();
  }, [checkAuth]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="CampaignDetail"
              component={CampaignDetailScreen}
              options={{
                headerShown: true,
                title: 'Campaign Details',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Apply"
              component={ApplyScreen}
              options={{
                headerShown: true,
                title: 'Apply to Campaign',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="ContentUpload"
              component={ContentUploadScreen}
              options={{
                headerShown: true,
                title: 'Upload Content',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="ContentPreview"
              component={ContentPreviewScreen}
              options={{
                headerShown: true,
                title: 'Content Preview',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="PayoutRequest"
              component={PayoutRequestScreen}
              options={{
                headerShown: true,
                title: 'Request Payout',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: true,
                title: 'Edit Profile',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
