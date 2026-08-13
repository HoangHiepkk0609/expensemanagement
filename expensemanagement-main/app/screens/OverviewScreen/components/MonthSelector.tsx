import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

const MonthSelector = ({ currentMonth, changeMonth }: any) => {
  const { colors } = useTheme();

  return (
    <View style={styles.monthSelectorWrapper}>
      <TouchableOpacity
        onPress={() => changeMonth('prev')}
        style={styles.arrowBtn}
      >
        <Icon name="chevron-left" size={28} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Text style={[styles.monthText, { color: colors.text }]}>
         {currentMonth.toLocaleDateString('vi-VN', {      
          month: 'long',
          year: 'numeric',
         })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => changeMonth('next')}
        style={styles.arrowBtn}
      >
        <Icon name="chevron-right" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthSelector;