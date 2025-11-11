import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import styles from './styles'; // Import style từ file kế bên

// 1. Import Firebase Auth
import auth from '@react-native-firebase/auth';

// 2. Không cần import useAuth nữa vì AuthContext tự lắng nghe

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    // 3. Gọi hàm đăng nhập của Firebase
    auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Đăng nhập thành công!
        console.log('Người dùng đã đăng nhập:', userCredential.user.email);
        
        // KHÔNG CẦN GỌI login() ở đây.
        // AuthContext sẽ tự động phát hiện và chuyển màn hình.
      })
      .catch(error => {
        // 4. Xử lý lỗi đăng nhập
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng.');
        } else if (error.code === 'auth/user-not-found') {
          Alert.alert('Lỗi', 'Người dùng không tồn tại.');
        } else {
          Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
          console.error(error);
        }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.authTitle}>Đăng nhập</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email của bạn"
        keyboardType="email-address"
        autoCapitalize="none" // <-- Thêm vào để tránh lỗi gõ
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoginScreen;