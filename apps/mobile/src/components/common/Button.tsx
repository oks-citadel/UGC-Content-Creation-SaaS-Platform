import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#374151' : '#d1d5db';

    switch (variant) {
      case 'primary':
        return '#4f46e5';
      case 'secondary':
        return isDark ? '#374151' : '#f3f4f6';
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return '#ef4444';
      default:
        return '#4f46e5';
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? '#6b7280' : '#9ca3af';

    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return isDark ? '#f9fafb' : '#111827';
      case 'outline':
        return '#4f46e5';
      case 'ghost':
        return isDark ? '#f9fafb' : '#111827';
      case 'danger':
        return '#ffffff';
      default:
        return '#ffffff';
    }
  };

  const getBorderStyle = (): ViewStyle => {
    if (variant === 'outline') {
      return {
        borderWidth: 2,
        borderColor: disabled ? (isDark ? '#4b5563' : '#d1d5db') : '#4f46e5',
      };
    }
    return {};
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'md':
        return 16;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...getPadding(),
          ...getBorderStyle(),
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: '600',
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
