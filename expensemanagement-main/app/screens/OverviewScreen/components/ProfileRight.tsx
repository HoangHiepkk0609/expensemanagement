import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { parseAvatar } from '../../../screens/OverviewScreen/types';
import styles from '../styles';

const ProfileRight = () => {
  const user = auth().currentUser;
  const avatarData = parseAvatar(user?.photoURL || null);

  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.headerProfile}
      onPress={() => navigation.navigate('Profile')}
    >
      <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
        <Text style={{ fontSize: 10, color: '#fff' }}>Chào,</Text>
        <Text
          style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}
          numberOfLines={1}
        >
          {user?.displayName?.split(' ').pop() || 'Bạn'}
        </Text>
      </View>

      {avatarData ? (
        <View
          style={[styles.headerAvatar, { backgroundColor: avatarData.color }]}
        >
          <Text style={styles.headerAvatarEmoji}>{avatarData.emoji}</Text>
        </View>
      ) : (
        <Icon name="account-circle" size={35} color="#fff" />
      )}
    </TouchableOpacity>
  );
};

export default ProfileRight;