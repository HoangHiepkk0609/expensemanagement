import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import styles from './styles'; // Import style từ file kế bên

// 1. Import Firebase Auth
import auth from '@react-native-firebase/auth';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    // 2. Gọi hàm tạo user của Firebase
    auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Đăng ký thành công!
        console.log('Người dùng đã được tạo:', userCredential.user.email);
        
        // KHÔNG CẦN GỌI login() ở đây nữa.
        // AuthContext sẽ tự động phát hiện và chuyển màn hình.
      })
      .catch(error => {
        // Xử lý lỗi
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Lỗi', 'Email này đã được sử dụng.');
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('Lỗi', 'Email không hợp lệ.');
        } else if (error.code === 'auth/weak-password') {
          Alert.alert('Lỗi', 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).');
        } else {
          Alert.alert('Lỗi', 'Đã có lỗi xảy ra.');
          console.error(error);
        }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.authTitle}>Tạo tài khoản</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email của bạn"
        keyboardType="email-address"
        autoCapitalize="none" // Rất quan trọng
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryButtonText}>Đăng ký</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryText}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default RegisterScreen;