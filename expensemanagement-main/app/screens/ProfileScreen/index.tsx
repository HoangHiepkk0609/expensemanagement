import auth from '@react-native-firebase/auth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [user, setUser] = useState(auth().currentUser);
  const [avatarData, setAvatarData] = useState<any>(null);

  const parseAvatar = (photoURL: string | null) => {
    if (!photoURL) return null;
    try {
      const parsed = JSON.parse(photoURL);
      if (parsed.emoji && parsed.color) {
        return parsed;
      }
    } catch {}
    return null;
  };

  useFocusEffect(
    React.useCallback(() => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        currentUser.reload().then(() => {
          setUser(auth().currentUser);
          setAvatarData(parseAvatar(auth().currentUser?.photoURL || null));
        });
      }
    }, []),
  );
  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await auth().signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <AppHeader
        title="Tài khoản"
        onBack={() => navigation.navigate('MainTabs')}
      />
      {/* User Info Card */}
      <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
        <View style={styles.avatar}>
          {avatarData ? (
            <View
              style={[
                styles.emojiAvatarSmall,
                { backgroundColor: avatarData.color },
              ]}
            >
              <Text style={styles.emojiTextSmall}>{avatarData.emoji}</Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.primary,
                width: 70,
                height: 70,
                borderRadius: 35,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="account" size={40} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || 'Người dùng'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'Chưa có email'}
          </Text>
          <Text style={[styles.userId, { color: colors.textSecondary }]}>
            ID: {user?.uid?.slice(0, 8)}...
          </Text>
        </View>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Goals')}
        >
          <Icon name="pig" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            Mục tiêu tiết kiệm
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('FamilyDashboard')}
        >
          <Icon name="home-group" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            Quản lý nhóm gia đình
          </Text>
        </TouchableOpacity>
      </View>
      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="account-edit" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            Chỉnh sửa thông tin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Cài đặt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={24} color="#FF6B6B" />
          <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
      {/* App Version */}
      <Text style={[styles.version, { color: colors.textSecondary }]}>
        Phiên bản 1.0.0
      </Text>
    </View>
  );
};


export default ProfileScreen;
