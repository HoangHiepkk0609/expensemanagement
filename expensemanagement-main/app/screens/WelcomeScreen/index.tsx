import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const FEATURES = [
  { icon: 'chart-donut', label: 'Theo dõi chi tiêu' },
  { icon: 'home-heart', label: 'Quản lý gia đình' },
  { icon: 'robot-happy-outline', label: 'Trợ lý AI Nimo' },
];

const WelcomeScreen = ({ navigation }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim,scaleAnim,slideAnim]);

  return (
    <View style={styles.container}>
      {/* Background decorations */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Logo & Title */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Icon name="wallet" size={48} color="#fff" />
        </View>
        <Text style={styles.appName}>Nimo</Text>
        <Text style={styles.tagline}>
          Quản lý tài chính{'\n'}thông minh hơn mỗi ngày
        </Text>
      </Animated.View>

      {/* Features */}
      <Animated.View
        style={[
          styles.featuresRow,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Icon name={f.icon} size={22} color="#E91E63" />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        style={[styles.buttonContainer, { opacity: fadeAnim }]}
      >
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.registerButtonText}>Tạo tài khoản mới</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default WelcomeScreen;