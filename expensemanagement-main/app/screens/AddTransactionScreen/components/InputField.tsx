import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

export const InputField = ({
  label,
  value,
  placeholder,
  onPress,
  iconName,
  isDropdown = false,
}: any) => {
  const { colors } = useTheme();

  if (!isDropdown) return null;

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}*</Text>
      <TouchableOpacity
        style={[styles.inputContainer, { borderBottomColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.inputDropdown,
            { color: colors.text },
            !value && { color: colors.textSecondary },
          ]}
        >
          {value || placeholder}
        </Text>
        <Icon
          name={iconName || 'chevron-down'}
          size={24}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
      </TouchableOpacity>
    </View>
  );
};