import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import styles from './styles'; // Import style từ file kế bên

// import Logo from '../../assets/logo.png'; 

const WelcomeScreen = ({ navigation} : any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* <Image source={Logo} style={styles.logo} /> */}
        <Text style={styles.title}>Chào mừng bạn!</Text>
        <Text style={styles.subtitle}>Quản lý chi tiêu cá nhân một cách thông minh.</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Tạo tài khoản mới</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;