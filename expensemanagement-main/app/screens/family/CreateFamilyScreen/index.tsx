import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { createFamily } from '../../../services/familyService';
import styles from './styles';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CreateFamilyScreen({ navigation }: Props) {
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshFamilyId } = useAuth();

  const handleCreate = async () => {
    if (loading) return;
    if (!familyName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm gia đình!');
      return;
    }
    setLoading(true);
    try {
      const { inviteCode } = await createFamily(familyName);
      Alert.alert(
        '🎉 Tạo nhóm thành công!',
        `Mã mời của nhóm:\n\n${inviteCode}\n\nHãy chia sẻ mã này cho các thành viên.`,
        [
          {
            text: 'Tiếp tục',
            onPress: async () => {
              await refreshFamilyId();
              navigation.replace('FamilyDashboard');
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.title}>Tạo nhóm gia đình</Text>
        <Text style={styles.subtitle}>
          Tạo nhóm để quản lý chi tiêu cùng gia đình bạn
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Tên nhóm gia đình</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Gia đình Nguyễn"
          value={familyName}
          onChangeText={setFamilyName}
          maxLength={50}
          autoFocus
        />
        <Text style={styles.hint}>{familyName.length}/50 ký tự</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Sau khi tạo nhóm, bạn có thể:</Text>
        <Text style={styles.infoItem}>✅ Chia sẻ mã mời cho thành viên</Text>
        <Text style={styles.infoItem}>✅ Theo dõi chi tiêu chung gia đình</Text>
        <Text style={styles.infoItem}>✅ Đặt ngân sách chung theo tháng</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tạo nhóm</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('JoinFamily')}
      >
        <Text style={styles.linkText}>
          Đã có mã mời? <Text style={styles.linkHighlight}>Tham gia nhóm</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}