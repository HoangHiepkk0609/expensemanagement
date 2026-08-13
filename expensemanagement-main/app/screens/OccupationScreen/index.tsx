import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { CommonActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { OCCUPATIONS } from '../../constants/onboardingData';
import styles from './styles';
import firestore from '@react-native-firebase/firestore';

export default function OccupationScreen() {
  const navigation = useNavigation<any>();

  const handleSkipOrComplete = async () => {
    const user = auth().currentUser;
    if (user) {
      await AsyncStorage.setItem(`@onboarding_${user.uid}`, 'true');
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    );
  };

  const handleSelect = async (occupationId: string) => {
  const user = auth().currentUser;

  if (user) {
    try {
      await AsyncStorage.setItem(`@onboarding_${user.uid}`, 'true');

      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          occupation: occupationId,
          onboardingCompleted: true,
        });

      if (occupationId === 'homemaker') {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'MainTabs' }, { name: 'CreateFamily' }],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'MainTabs' }, { name: 'Goals' }],
          }),
        );
      }
    } catch (error) {
      console.error('Lỗi khi lưu trạng thái:', error);
    }
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chào mừng bạn! 👋</Text>
      <Text style={styles.subHeader}>
        Để ứng dụng hỗ trợ tốt nhất, hãy cho biết hiện tại bạn là...
      </Text>

      {OCCUPATIONS.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => handleSelect(item.id)}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={handleSkipOrComplete}>
        <Text>Bỏ qua khảo sát</Text>
      </TouchableOpacity>
    </View>
  );
}
