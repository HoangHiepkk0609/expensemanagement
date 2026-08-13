import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
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
import { joinFamilyByCode } from '../../../services/familyService';
import styles from './styles';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function JoinFamilyScreen({ navigation }: Props) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { refreshFamilyId } = useAuth();

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(newCode);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 ký tự mã mời!');
      return;
    }
    setLoading(true);
    try {
      const { familyName } = await joinFamilyByCode(fullCode);
      Alert.alert(
        '🎉 Tham gia thành công!',
        `Bạn đã tham gia nhóm "${familyName}"`,
        [
          {
            text: 'Tiếp tục',
            onPress: async () => {
              await refreshFamilyId();

              navigation.navigate('FamilyDashboard');
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Không thể tham gia', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every(c => c !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>Nhập mã mời</Text>
        <Text style={styles.subtitle}>
          Nhập mã 6 ký tự được chia sẻ bởi chủ hộ
        </Text>
      </View>

      <View style={styles.codeContainer}>
        {code.map((char, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputs.current[index] = ref;
            }}
            style={[styles.codeInput, char ? styles.codeInputFilled : null]}
            value={char}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            maxLength={1}
            autoCapitalize="characters"
            autoFocus={index === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      <Text style={styles.hint}>Mã không phân biệt chữ hoa/thường</Text>

      <TouchableOpacity
        style={[
          styles.button,
          (!isComplete || loading) && styles.buttonDisabled,
        ]}
        onPress={handleJoin}
        disabled={!isComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tham gia nhóm</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('CreateFamily')}
      >
        <Text style={styles.linkText}>
          Chưa có nhóm? <Text style={styles.linkHighlight}>Tạo nhóm mới</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}


