import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FinancialOverview = () => {
  const formatCurrency = (amount: any) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <View style={styles.container}>
      {/* MoMo Payment Banner */}
      <View style={styles.momoBanner}>
        <View style={styles.momoIcon}>
          <Icon name="wallet" size={24} color="#B5179E" />
        </View>
        <Text style={styles.momoText}>
          <Text style={styles.momoBold}>Thanh toán bằng MoMo</Text> để bảo cáo chính xác hơn
        </Text>
      </View>

      {/* Financial Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bức tranh tài chính</Text>

        {/* Financial Center Card */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={styles.iconContainer}>
              <Icon name="chart-box" size={24} color="#4CD080" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Trung tâm Tài chính</Text>
              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tổng tài sản</Text>
                  <Text style={styles.statValue}>{formatCurrency(52765)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Khoản cần trả</Text>
                  <Text style={styles.statValue}>{formatCurrency(0)}</Text>
                </View>
              </View>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Savings Card */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, styles.iconPink]}>
              <Icon name="piggy-bank" size={24} color="#FF69B4" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Tiết kiệm tự ưu đãi</Text>
              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tính từ đầu năm</Text>
                  <Text style={[styles.statValue, styles.greenText]}>
                    {formatCurrency(90686)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tháng này</Text>
                  <Text style={styles.statValue}>+{formatCurrency(0)}</Text>
                </View>
              </View>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon name="information-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          Số liệu chi tiêu khác với mức giao dịch mà ngân hàng nhà nước quy định.{' '}
          <Text style={styles.infoLink}>Xem chi tiết</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
  },
  momoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F8',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  momoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  momoText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  momoBold: {
    fontWeight: 'bold',
    color: '#B5179E',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPink: {
    backgroundColor: '#FFE4F0',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  greenText: {
    color: '#4CD080',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  savingsIcon: {
    position: 'absolute',
    right: 40,
    top: 8,
  },
  piggyImage: {
    width: 60,
    height: 60,
    opacity: 0.3,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  infoLink: {
    color: '#FF69B4',
    fontWeight: '600',
  },
});

export default FinancialOverview;