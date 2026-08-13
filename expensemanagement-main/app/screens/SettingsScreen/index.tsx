import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản? Tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth().currentUser;
              await user?.delete();
              Alert.alert('Thành công', 'Tài khoản đã được xóa');
              navigation.replace('Login');
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Yêu cầu đăng nhập lại',
                  'Để xóa tài khoản, bạn cần đăng xuất và đăng nhập lại, sau đó thử lại.',
                );
              } else {
                Alert.alert('Lỗi', error.message);
              }
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Cài đặt" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            GIAO DIỆN
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isDarkMode ? '#4A5568' : '#E2E8F0' },
                  ]}
                >
                  <Icon
                    name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                    size={24}
                    color={colors.text}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Chế độ tối
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {isDarkMode ? 'Đang bật' : 'Đang tắt'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: '#FF69B4' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            THÔNG BÁO
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="bell" size={24} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Thông báo giao dịch
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Nhận thông báo khi có giao dịch mới
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#FF69B4' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            BẢO MẬT
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="lock-reset" size={24} color="#F59E0B" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Đổi mật khẩu
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Cập nhật mật khẩu của bạn
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            VỀ ỨNG DỤNG
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                Alert.alert(
                  'Về Nimo',
                  'Nimo - Ứng dụng quản lý chi tiêu thông minh\n\nPhiên bản: 2.0.0\n\nPhát triển bởi Hiệp Gà\n\n© 2026 All rights reserved',
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
                  <Icon name="information" size={24} color="#EC4899" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Về Nimo
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Phiên bản 2.0.0
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
              onPress={() => {
                Alert.alert(
                  'Điều khoản sử dụng',
                  'Nội dung điều khoản sử dụng...',
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Icon name="file-document" size={24} color="#0EA5E9" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Điều khoản sử dụng
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
              onPress={() => {
                Alert.alert(
                  'Chính sách bảo mật',
                  'Nội dung chính sách bảo mật...',
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="shield-check" size={24} color="#A855F7" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Chính sách bảo mật
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            NGUY HIỂM
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="account-remove" size={24} color="#DC2626" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#DC2626' }]}>
                    Xóa tài khoản
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Xóa vĩnh viễn tài khoản và dữ liệu
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};



export default SettingsScreen;
