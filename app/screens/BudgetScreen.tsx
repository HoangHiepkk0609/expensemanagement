import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../utils/formatCurrency'; 

const { width } = Dimensions.get('window');

// Danh sách danh mục để chọn
const CATEGORIES = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife', color: '#FF6B6B' },
  { label: 'Mua sắm', icon: 'cart-outline', color: '#FFD93D' },
  { label: 'Di chuyển', icon: 'car', color: '#6BCB77' },
  { label: 'Người thân', icon: 'human-handsup', color: '#4D96FF' },
  { label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const BudgetScreen = () => {
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal Thêm/Sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState('');

  const TEST_USER_ID = 'my-test-user-id-123'; 

  // 1. Lấy dữ liệu Ngân sách & Giao dịch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách ngân sách đã cài
        const budgetSnap = await firestore()
          .collection('budgets')
          .where('userId', '==', TEST_USER_ID)
          .get();
        
        const budgetList = budgetSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBudgets(budgetList);

        // Lấy giao dịch TRONG THÁNG NÀY để tính toán
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const transSnap = await firestore()
          .collection('transactions')
          .where('userId', '==', TEST_USER_ID)
          .where('type', '==', 'expense') // Chỉ lấy chi tiêu
          .where('date', '>=', startOfMonth)
          .where('date', '<=', endOfMonth)
          .get();

        const transList = transSnap.docs.map(doc => doc.data());
        setTransactions(transList);

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [modalVisible]); 

  // 2. Hàm tính toán số tiền đã tiêu cho 1 danh mục
  const calculateSpent = (categoryLabel: string) => {
    return transactions
      .filter((t: any) => t.category === categoryLabel)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  // 3. Lưu ngân sách lên Firebase
  const handleSaveBudget = async () => {
    if (!limitAmount) return;

    try {
      const existingBudget = budgets.find((b: any) => b.category === selectedCategory.label);

      if (existingBudget) {
        // Update
        await firestore().collection('budgets').doc(existingBudget.id).update({
          limit: parseInt(limitAmount),
        });
      } else {
        // Create new
        await firestore().collection('budgets').add({
          userId: TEST_USER_ID,
          category: selectedCategory.label,
          limit: parseInt(limitAmount),
          createdAt: new Date().toISOString(),
        });
      }

      setModalVisible(false);
      setLimitAmount('');
      Alert.alert("Thành công", "Đã thiết lập ngân sách!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu ngân sách");
    }
  };

  // 4. Xóa ngân sách
  const handleDeleteBudget = async (id: string) => {
    Alert.alert("Xóa ngân sách", "Bạn có chắc muốn xóa không?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: 'destructive',
        onPress: async () => {
          await firestore().collection('budgets').doc(id).delete();
          setBudgets(budgets.filter(b => b.id !== id));
        }
      }
    ]);
  };

  // Render từng item ngân sách
  const renderItem = ({ item }: any) => {
    const spent = calculateSpent(item.category);
    const percent = Math.min((spent / item.limit) * 100, 100);
    const categoryInfo = CATEGORIES.find(c => c.label === item.category) || { icon: 'cash', color: '#999' };
    
    // Màu sắc thanh progress
    let progressColor = '#4CAF50'; // Xanh (An toàn)
    if (percent >= 80) progressColor = '#FFC107'; // Vàng (Sắp hết)
    if (percent >= 100) progressColor = '#FF5252'; // Đỏ (Vỡ nợ)

    const remaining = item.limit - spent;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.iconBox, { backgroundColor: categoryInfo.color + '20' }]}>
              <Icon name={categoryInfo.icon} size={24} color={categoryInfo.color} />
            </View>
            <View style={{marginLeft: 12}}>
              <Text style={styles.catTitle}>{item.category}</Text>
              <Text style={styles.limitText}>Hạn mức: {formatCurrency(item.limit)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteBudget(item.id)}>
            <Icon name="trash-can-outline" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: progressColor }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.spentText, { color: progressColor }]}>
            Đã chi: {formatCurrency(spent)}
          </Text>
          <Text style={styles.remainingText}>
            {remaining >= 0 ? `Còn lại: ${formatCurrency(remaining)}` : `Vượt: ${formatCurrency(Math.abs(remaining))}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ngân sách tháng này</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có ngân sách nào được thiết lập.</Text>
          }
        />
      )}

      {/* Nút Thêm Ngân Sách */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal Thêm */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thiết lập ngân sách</Text>
            
            <Text style={styles.label}>Chọn danh mục</Text>
            <View style={styles.catSelector}>
              {CATEGORIES.slice(0, 4).map((cat, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.catItem, selectedCategory.label === cat.label && styles.catItemSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Icon name={cat.icon} size={24} color={selectedCategory.label === cat.label ? '#FF69B4' : '#666'} />
                  <Text style={[styles.catText, selectedCategory.label === cat.label && {color: '#FF69B4', fontWeight: 'bold'}]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Số tiền giới hạn</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ví dụ: 2,000,000"
              keyboardType="numeric"
              value={limitAmount}
              onChangeText={setLimitAmount}
            />

            <TouchableOpacity style={styles.btnSave} onPress={handleSaveBudget}>
              <Text style={styles.btnSaveText}>Lưu ngân sách</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
              <Text style={{color: '#666'}}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  limitText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 13,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 15,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  btnSave: {
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnClose: {
    alignItems: 'center',
    marginTop: 15,
  },
  catSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    width: '23%',
  },
  catItemSelected: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF0F5',
  },
  catText: {
    fontSize: 11,
    marginTop: 5,
    color: '#666',
  },
});

export default BudgetScreen;