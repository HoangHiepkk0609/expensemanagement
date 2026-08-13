import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/themeContext';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
}

const AppHeader = ({
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightComponent,
}: AppHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightComponent ? (
        rightComponent
      ) : rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
          <Icon name={rightIcon} size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppHeader;