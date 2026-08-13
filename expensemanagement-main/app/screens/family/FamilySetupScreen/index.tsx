import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './styles';
type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function FamilySetupScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.title}>Quản lý gia đình</Text>
        <Text style={styles.subtitle}>
          Bắt đầu theo dõi chi tiêu cùng cả gia đình
        </Text>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CreateFamily')}
      >
        <Text style={styles.cardEmoji}>🏠</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Tạo nhóm mới</Text>
          <Text style={styles.cardDesc}>
            Tạo nhóm gia đình và mời thành viên tham gia
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('JoinFamily')}
      >
        <Text style={styles.cardEmoji}>🔑</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Tham gia nhóm</Text>
          <Text style={styles.cardDesc}>
            Nhập mã mời từ chủ hộ để tham gia nhóm có sẵn
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('MainTabs')}
      >
        <Text style={styles.skipText}>Để sau</Text>
      </TouchableOpacity>
    </View>
  );
}

