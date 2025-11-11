import React from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../../theme/colors'; // Import màu của bạn

const LoadingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Hoặc màu nền bạn muốn
  },
});

export default LoadingScreen;