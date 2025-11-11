import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DonutChart } from '../components/DonutChart';
import FinancialOverview from '../components/FinancialOverview';

const HomeScreen = () => {
  const [expenses] = useState(6667000);
  const [income] = useState(0);

  const formatCurrency = (amount: any) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Quản lý chi tiêu</Text>
          </View>
          <View style={styles.headerRight}>
            <Icon name="star-outline" size={24} color="#000" style={styles.headerIcon} />
            <Icon name="home" size={24} color="#000" />
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="plus" size={30} color="#4CD080" />
            <Text style={styles.menuText}>Nhập GD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="chart-line" size={30} color="#4CD080" />
            <Text style={styles.menuText}>Biến động</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="refresh" size={30} color="#4CD080" />
            <Text style={styles.menuText}>Giao dịch định kỳ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="dots-horizontal" size={30} color="#4CD080" />
            <Text style={styles.menuText}>Tiện ích khác</Text>
          </TouchableOpacity>
        </View>

        {/* Expense Overview */}
        <View style={styles.expenseContainer}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseTitle}>Tình hình thu chi</Text>
            <View style={styles.expenseActions}>
              <Icon name="eye" size={24} color="#FF69B4" />
              <Text style={styles.filterText}>Phân bổ</Text>
              <Icon name="chart-bar" size={24} color="#000" style={styles.chartIcon} />
            </View>
          </View>

          <View style={styles.monthSelector}>
            <Icon name="chevron-left" size={24} color="#000" />
            <Text style={styles.monthText}>Tháng này</Text>
            <Icon name="chevron-right" size={24} color="#000" />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Icon name="currency-usd" size={20} color="#FF69B4" />
                <Text style={styles.statLabel}>Chi tiêu</Text>
              </View>
              <Text style={styles.statAmount}>{formatCurrency(expenses)}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxRight]}>
              <View style={styles.statHeader}>
                <Icon name="currency-usd" size={20} color="#4CD080" />
                <Text style={styles.statLabel}>Thu nhập</Text>
              </View>
              <Text style={styles.statAmount}>{formatCurrency(income)}</Text>
            </View>
          </View>

          {/* Donut Chart Section */}
          <View style={styles.chartContainer}>
            <DonutChart percentage={100} />
            <Text style={styles.chartLabel}>Giải trí</Text>
          </View>
        </View>
        <FinancialOverview />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  expenseContainer: {
    flex: 1,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#FF69B4',
    marginLeft: 4,
  },
  chartIcon: {
    marginLeft: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  statBoxRight: {
    marginLeft: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  chartLabel: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#FF69B4',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    shadowColor: '#FF69B4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default HomeScreen;