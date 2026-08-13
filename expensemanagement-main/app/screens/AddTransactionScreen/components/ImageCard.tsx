import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

export const ImageCard = ({ title, statusIcon }: any) => {
  const { colors } = useTheme();

  const isSuccess = statusIcon === 'check-circle';
  const iconColor = isSuccess ? '#5cb85c' : '#dc3545';
  const borderColor = isSuccess ? '#e6f7e6' : '#f8e6e8';

  let content;
  if (title === 'Lịch sử giao dịch') {
    content = (
      <View>
        <Text style={[styles.cardDetailText, { color: colors.text }]}>
          ← Tiền chuyển ra <Text style={{ color: '#dc3545' }}>-40.000đ</Text>
        </Text>
        <Text style={[styles.cardDetailText, { color: colors.text }]}>
          ↗ Tiền chuyển vào <Text style={{ color: '#5cb85c' }}>+240.000đ</Text>
        </Text>
      </View>
    );
  } else if (title === 'Kết quả giao dịch') {
    content = (
      <View>
        <Text
          style={[
            styles.cardDetailText,
            { fontSize: 22, fontWeight: 'bold', color: '#dc3545' },
          ]}
        >
          -100.000đ
        </Text>
        <Text style={[styles.cardDetailText, { color: '#5cb85c' }]}>
          Thành công
        </Text>
      </View>
    );
  } else if (title === 'Ảnh QR') {
    content = (
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Icon name="qrcode-scan" size={40} color={colors.text} />
      </View>
    );
  } else if (title === 'Ảnh mờ') {
    content = (
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Icon name="blur" size={40} color="#5cb85c" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.imageCard,
        { backgroundColor: borderColor, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardStatusIcon}>
        <Icon name={statusIcon} size={18} color={iconColor} />
      </View>
      <View style={styles.cardContent}>{content}</View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};
