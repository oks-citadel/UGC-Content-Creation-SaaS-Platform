import React from 'react';
import { View, TouchableOpacity, useColorScheme, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export default function Card({
  children,
  onPress,
  style,
  padding = 'md',
  shadow = true,
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return 8;
      case 'md':
        return 16;
      case 'lg':
        return 24;
      default:
        return 16;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderRadius: 16,
    padding: getPadding(),
    ...(shadow && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: 12,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingTop: 12,
          marginTop: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
