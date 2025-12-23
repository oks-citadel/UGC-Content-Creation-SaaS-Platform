import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  useColorScheme,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  const getBorderColor = () => {
    if (error) return '#ef4444';
    if (isFocused) return '#4f46e5';
    return isDark ? '#374151' : '#d1d5db';
  };

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: isDark ? '#f3f4f6' : '#374151',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: 1,
          borderColor: getBorderColor(),
          borderRadius: 12,
          paddingHorizontal: 12,
        }}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          {...props}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          style={[
            {
              flex: 1,
              paddingVertical: 14,
              fontSize: 16,
              color: isDark ? '#f9fafb' : '#111827',
            },
            props.style,
          ]}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="alert-circle" size={14} color="#ef4444" />
          <Text
            style={{
              fontSize: 12,
              color: '#ef4444',
              marginLeft: 4,
            }}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
