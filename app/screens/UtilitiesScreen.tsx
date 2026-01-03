import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTransactions } from '../hook/useTransactions'; 
import { getRecentWeeks, calculateReport } from '../utils/reportUtils';
import NotificationHelper from '../utils/NotificationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useTheme } from '../theme/themeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const UtilitiesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const [weekReports, setWeekReports] = useState<any[]>([]);
  const { isDarkMode, toggleTheme, colors } = useTheme();

  useEffect(() => {
    if (transactions.length > 0) {
      const weeks = getRecentWeeks(2);
      const reports = weeks.map((week, index) => {
        const previousWeek = weeks[index + 1];
        const report = calculateReport(
          transactions,
          week.startDate,
          week.endDate,
          previousWeek?.startDate,
          previousWeek?.endDate
        );
        return {
          label: week.label,
          ...report,
        };
      });
      setWeekReports(reports);
    }
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedState = await AsyncStorage.getItem('DAILY_REMINDER_ENABLED');
      setIsEnabled(savedState === 'true');
    } catch (e) {
      console.log(e);
    }
  };

  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    await AsyncStorage.setItem('DAILY_REMINDER_ENABLED', String(newState));

    if (newState) {
      await NotificationHelper.scheduleDailyReminder();
    } else {
      await NotificationHelper.cancelDailyReminder();
    }
  };

  const handleItemPress = (item: any) => {
    if (item.id === 'logout') {
      handleLogout();
    } else if (item.id === 1) {
      navigation.navigate('IncomeExpenseTrend');
    } else if (item.id === 2) { 
      navigation.navigate('PeriodicExpenseReport');
    } else if (item.id === 3) { 
      navigation.navigate('BudgetScreen'); 
    }else if (item.id === 4) { 
      navigation.navigate('CategoryManagementScreen'); 
    }  else {
      console.log('Bấm vào:', item.title);
      Alert.alert("Thông báo", "Tính năng đang được phát triển");
    }
  };

  const utilityItems = [
    {
      id: 1,
      icon: 'chart-line',
      title: 'Biến động\nthu chi',
      color: '#4DD0E1',
    },
    {
      id: 2,
      icon: 'calendar-refresh',
      title: 'Giao dịch\nđịnh kỳ',
      color: '#4DD0E1',
      badge: 'Mới',
    },
    {
      id: 3,
      icon: 'wallet',
      title: 'Ngân sách\nchi tiêu',
      color: '#4DD0E1',
    },
    {
      id: 4,
      icon: 'folder',
      title: 'Quản lý\ndanh mục',
      color: '#4DD0E1',
    },
    {
      id: 'logout',
      icon: 'logout',
      title: 'Đăng xuất',
      color: '#FF5252',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.surface : '#FFD6E8' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tiện ích</Text>       
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={[styles.reportSection, { backgroundColor: colors.surface }]}>
           <View style={styles.row}>
              <View style={styles.left}>
                 <Icon name="theme-light-dark" size={24} color={colors.primary} />
                 <View style={{marginLeft: 12}}>
                    <Text style={[styles.title, { color: colors.text }]}>Chế độ tối</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                       Giao diện tối giúp bảo vệ mắt
                    </Text>
                 </View>
              </View>
              <Switch
                 value={isDarkMode}
                 onValueChange={toggleTheme}
                 trackColor={{ false: "#767577", true: colors.primary }}
                 thumbColor={"#fff"}
              />
           </View>
        </View>

        <View style={[styles.reportSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Báo cáo chi tiêu định kỳ</Text>
          
          {transactionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <>
              <View style={styles.reportCards}>
                {weekReports.length > 0 ? (
                  <>
                    {weekReports.map((report, index) => (
                        <TouchableOpacity 
                          key={index}
                          style={[
                              styles.reportCard, 
                              index === 1 && styles.reportCardRight,
                              { 
                                  backgroundColor: isDarkMode ? colors.background : '#FFF5F8',
                                  borderColor: isDarkMode ? colors.border : '#FFE0ED'
                              }
                          ]}
                          onPress={() => navigation.navigate('PeriodicExpenseReport')}
                        >
                          {index === 0 && (
                              <View style={styles.reportBadge}>
                                <View style={styles.redDot} />
                              </View>
                          )}
                          <Text style={styles.reportLabel}>Tuần:</Text>
                          <Text style={[styles.reportDate, { color: colors.text }]}>{report.label || 'N/A'}</Text>
                          <Text style={styles.reportAmount}>
                            {report ? formatCurrency(report.totalExpense) : '0đ'}
                          </Text>
                          <Text style={[
                            styles.reportTrend,
                            report.trend === 'up' ? styles.trendUp : styles.trendDown
                          ]}>
                            {report.comparison}
                          </Text>
                        </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyReport}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có giao dịch nào</Text>
                  </View>
                )}
              </View>

              <View style={[styles.notificationRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.notificationText, { color: colors.text }]}>Nhận thông báo khi có báo cáo chi tiêu</Text>
                <Switch
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                />
            </View>
            </>
          )}
        </View>

        <View style={[styles.utilitiesSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tiện ích nâng cao</Text>
          
          <View style={styles.utilitiesGrid}>
            {utilityItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.utilityItem}
                onPress={() => handleItemPress(item)}
              >
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <View style={[styles.utilityIcon, { backgroundColor: item.color + '20' }]}>
                  <Icon name={item.icon} size={32} color={item.color} />
                </View>
                <Text style={[styles.utilityTitle, { color: colors.text }]}>{item.title}</Text>
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
    marginBottom: 4,
  },
  reportAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  reportTrend: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendUp: {
    color: '#FF6B6B',
  },
  trendDown: {
    color: '#4CAF50',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  emptyReport: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  card: {
     borderRadius: 12, 
     padding: 16, 
     marginBottom: 12,
     elevation: 2, 
     shadowColor: '#000', 
     shadowOpacity: 0.1, 
     shadowOffset: {width:0, height:2}
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
   },
  left: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600'
   },
  subtitle: { 
    fontSize: 12,
     marginTop: 2 
    }
});

export default UtilitiesScreen;