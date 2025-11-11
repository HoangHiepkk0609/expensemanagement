import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';

const UtilitiesScreen = () => {
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // 2. HÀM XỬ LÝ ĐĂNG XUẤT
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: 'destructive',
          onPress: () => {
            auth()
              .signOut()
              .catch(error => console.error('Lỗi đăng xuất: ', error));
          } 
        }
      ]
    );
  };

  // 3. HÀM XỬ LÝ KHI BẤM VÀO TIỆN ÍCH
  const handleItemPress = (item : any) => {
    if (item.id === 'logout') { // Kiểm tra ID đặc biệt
      handleLogout();
    } else {
      // Xử lý các tiện ích khác (ví dụ: navigation.navigate(item.screen))
      console.log('Bấm vào:', item.title);
    }
  };

  const utilityItems = [
    {
      id: 1,
      icon: 'file-plus',
      title: 'Nhập GD\nbằng ảnh',
      color: '#4DD0E1',
    },
    {
      id: 2,
      icon: 'chart-line',
      title: 'Biến động\nthu chi',
      color: '#4DD0E1',
    },
    {
      id: 3,
      icon: 'calendar-refresh',
      title: 'Giao dịch\nđịnh kỳ',
      color: '#4DD0E1',
      badge: 'Mới',
    },
    {
      id: 4,
      icon: 'wallet',
      title: 'Ngân sách\nchi tiêu',
      color: '#4DD0E1',
    },
    {
      id: 5,
      icon: 'cellphone-link',
      title: 'Thêm vào\nthiết bị',
      color: '#4DD0E1',
    },
    {
      id: 6,
      icon: 'folder',
      title: 'Quản lý\ndanh mục',
      color: '#4DD0E1',
    },
    {
      id: 7,
      icon: 'tag',
      title: 'Phân loại\ngiao dịch',
      color: '#4DD0E1',
    },
    {
      id: 8,
      icon: 'credit-card-multiple',
      title: 'Cộng đồng\nchi tiêu',
      color: '#4DD0E1',
    },
    {
      id: 9,
      icon: 'calendar-month',
      title: 'Nhìn lại\ntháng 9',
      color: '#4DD0E1',
    },
    {
      id: 10,
      icon: 'star-circle',
      title: 'Gỡ khỏi\ntrang chủ',
      color: '#4DD0E1',
    },
    {
      id: 11,
      icon: 'calculator',
      title: 'Hạn mức\ngiao dịch',
      color: '#4DD0E1',
    },
    {
      id: 'logout', // ID đặc biệt để dễ kiểm tra
      icon: 'logout',
      title: 'Đăng xuất',
      color: '#FF5252', // Màu đỏ nổi bật
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tiện ích</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="wallet-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="home-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Spending Report Section */}
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Báo cáo chi tiêu định kỳ</Text>
          
          <View style={styles.reportCards}>
            {/* Weekly Report Card */}
            <View style={styles.reportCard}>
              <View style={styles.reportBadge}>
                <View style={styles.redDot} />
              </View>
              <Text style={styles.reportLabel}>Tuần:</Text>
              <Text style={styles.reportDate}>13/10 - 19/10</Text>
              <Text style={styles.reportEmoji}>💊</Text>
            </View>

            {/* Monthly Report Card */}
            <View style={[styles.reportCard, styles.reportCardRight]}>
              <Text style={styles.reportLabel}>Tuần:</Text>
              <Text style={styles.reportDate}>15/9 - 21/9</Text>
              <Text style={styles.reportEmoji}>💊</Text>
            </View>
          </View>

          {/* Notification Toggle */}
          <View style={styles.notificationRow}>
            <Text style={styles.notificationText}>
              Nhận thông báo khi có báo cáo chi tiêu
            </Text>
            <Switch
              value={notificationEnabled}
              onValueChange={setNotificationEnabled}
              trackColor={{ false: '#D1D1D1', true: '#4CD080' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Advanced Utilities Section */}
        <View style={styles.utilitiesSection}>
          <Text style={styles.sectionTitle}>Tiện ích nâng cao</Text>
          
          <View style={styles.utilitiesGrid}>
            {utilityItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.utilityItem}
                onPress={() => handleItemPress(item)} // <-- THÊM SỰ KIỆN ONPRESS
              >
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <View style={[styles.utilityIcon, { backgroundColor: item.color + '20' }]}>
                  <Icon name={item.icon} size={32} color={item.color} />
                </View>
                <Text style={styles.utilityTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE4F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFD6E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
  },
  reportSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reportCards: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  reportCard: {
    flex: 1,
    backgroundColor: '#FFF5F8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0ED',
    position: 'relative',
  },
  reportCardRight: {
    marginLeft: 12,
  },
  reportBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  reportLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reportEmoji: {
    fontSize: 24,
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  utilitiesSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  utilityItem: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  utilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilityTitle: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#FF69B4',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 9,
    color: '#fff',
    marginTop: 2,
    fontWeight: '600',
  },
});

export default UtilitiesScreen;