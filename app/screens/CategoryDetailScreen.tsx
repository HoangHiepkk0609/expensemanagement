import React, {useState, useCallback} from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import { useRoute, useNavigation, NavigationProp, RouteProp, useFocusEffect} from '@react-navigation/native';
import { formatCurrency } from '../utils/formatCurrency';
import firestore from '@react-native-firebase/firestore';

const SpendingTrendChart = () => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartTabs}>
        <TouchableOpacity style={styles.chartTab}>
          <Text style={styles.chartTabText}>Theo tuần</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chartTab, styles.chartTabActive]}>
          <Text style={styles.chartTabTextActive}>Theo tháng</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chartPlaceholder}>
        <View style={styles.chartBarWrapper}>
          <Text style={styles.chartLabel}>9</Text>
        </View>
        <View style={styles.chartBarWrapper}>
          <Text style={styles.chartAmountLabel}>100.000đ</Text>
          <View style={styles.chartBar} />
          <Text style={styles.chartLabel}>10</Text>
        </View>
      </View>
      <Text style={styles.chartSubText}>
        Trung bình 5 tháng gần nhất, chỉ tính tháng có chi tiêu
      </Text>
    </View>
  );
};

type Transaction = {
  id?: string | number;
  amount: number;
  date: any;
  note?: string;
  name?: string;
  wallet?: string;
  category?: string;
};

type RootStackParamList = {
  CategoryDetail: { 
    category: string; 
  };
  TransactionDetail: { 
    transaction: Transaction;  
  };
};

const groupTransactionsByDate = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) return [];

  const grouped = transactions.reduce((acc: Record<string, Transaction[]>, tx: Transaction) => {
    let dateObj;
    
    if (tx.date && typeof tx.date.toDate === 'function') {
      dateObj = tx.date.toDate();
    } else {
      dateObj = new Date(tx.date);
    }

    const date = dateObj.toLocaleDateString('vi-VN');
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(tx);
    return acc;
  }, {});

  return Object.keys(grouped)
    .sort((a, b) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .map(date => ({
      title: date,
      data: grouped[date],
    }));
};

// ✅ TÁCH ListHeader ra thành component riêng
const ListHeader: React.FC<{ category: string }> = ({ category }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity style={[styles.card, styles.budgetCard]}>
      <Text style={styles.budgetText}>Tạo ngân sách cho danh mục này? </Text>
      <Text style={[styles.budgetText, styles.budgetLink]}>Tạo ngay</Text>
    </TouchableOpacity>
    <View style={[styles.card, styles.trendCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Xu hướng chi tiêu</Text>
      </View>
      <SpendingTrendChart />
    </View>
    <View style={[styles.card, styles.analysisCard]}>
      <Text style={styles.analysisText}>🤔 Nên đặt ngân sách {category} bao nhiêu?</Text>
      <Text style={styles.analysisText}>🧐 100.000 đ cho {category} hợp lý chưa?</Text>
    </View>
    <Text style={styles.transactionTitle}>Giao dịch tháng 10</Text>
    <View style={styles.filterContainer}>
      <TouchableOpacity style={[styles.filterButton, styles.filterActive]}>
        <Text style={styles.filterTextActive}>Tất cả</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterText}>Top chi tiêu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterText}>Top người nhận</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const CategoryDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'CategoryDetail'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { category } = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const sections = groupTransactionsByDate(transactions);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const querySnapshot = await firestore()
            .collection("transactions")
            .where("category", "==", category)
            .orderBy("date", "desc")
            .get();
          
          const fetchedTransactions: Transaction[] = [];
          
          querySnapshot.forEach((doc) => {
            fetchedTransactions.push({
              id: doc.id,
              ...doc.data()
            } as Transaction);
          });
          
          setTransactions(fetchedTransactions);
        } catch (error) {
          console.error("Lỗi khi tải giao dịch: ", error);
          Alert.alert("Lỗi", "Không thể tải danh sách giao dịch.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [category])
  );

  const renderItem = ({ item }: { item: Transaction }) => {
    const handlePress = () => {
      navigation.navigate('TransactionDetail', { 
        transaction: item,
      }); 
    };
    
    return (
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.item}>
          <View style={styles.iconPlaceholder}>
            <Text>🛒</Text> 
          </View>
          <View style={styles.itemLeft}>
            <Text style={styles.name}>{item.note || item.name || 'Chi tiêu'}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category || category}</Text>
            </View>
          </View>
          <Text style={styles.amount}>-{formatCurrency(item.amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.dateHeader}>{title}</Text>
  );

  const renderEmpty = () => (
    <Text style={styles.empty}>Chưa có giao dịch nào</Text>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item, index) => (item.id || index).toString()} 
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={<ListHeader category={category} />}
      ListEmptyComponent={renderEmpty()}
      contentContainerStyle={styles.listContent}
      scrollEnabled={true}
    />
  );
};

export default CategoryDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  budgetCard: {
    backgroundColor: '#fdf0f7',
    flexDirection: 'row',
  },
  budgetText: {
    fontSize: 15,
  },
  budgetLink: {
    color: '#e83e8c',
    fontWeight: '600',
  },
  trendCard: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  analysisCard: {
    backgroundColor: '#f2f0fd',
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 22,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterActive: {
    backgroundColor: '#f2f0fd',
    borderColor: '#f2f0fd',
  },
  filterText: {
    fontSize: 14,
    color: '#555',
  },
  filterTextActive: {
    fontSize: 14,
    color: '#5e43da',
    fontWeight: '600',
  },
  dateHeader: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryTag: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#d48806',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
    fontSize: 15,
  },
  chartContainer: {
    marginTop: 12,
  },
  chartTabs: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
  },
  chartTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chartTabActive: {
    backgroundColor: '#fff',
  },
  chartTabText: {
    fontSize: 13,
    color: '#555',
  },
  chartTabTextActive: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chartBarWrapper: {
    alignItems: 'center',
  },
  chartBar: {
    width: 30,
    height: 100,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  chartAmountLabel: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 4,
  },
  chartSubText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
});