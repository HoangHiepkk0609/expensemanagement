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
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme } from '../theme/themeContext';
import auth from '@react-native-firebase/auth';
import { useCategories } from '../hook/useCategories';

const BudgetScreen = () => {
  const { categories } = useCategories(); 
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null); 
  const [limitAmount, setLimitAmount] = useState('');
  
  const user = auth().currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
       const firstExpense = categories.find(c => c.type === 'expense') || categories[0];
       setSelectedCategory(firstExpense);
    }
  }, [categories]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubBudget = firestore()
      .collection('budgets')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBudgets(list);
      });

    const unsubTrans = firestore()
      .collection('transactions')
      .where('userId', '==', userId)
      .where('type', '==', 'expense') 
      .onSnapshot(snapshot => {
        const now = new Date();
        const currentMonth = now.getMonth(); 
        const currentYear = now.getFullYear(); 

        const list = snapshot.docs
          .map(doc => doc.data())
          .filter((t: any) => {

            let tDate;
            if (t.date?.toDate) {
               tDate = t.date.toDate(); 
            } else {
               tDate = new Date(t.date); 
            }
            
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
          });

        console.log("Giao dịch chi tiêu tháng này:", list.length); 
        setTransactions(list);
        setLoading(false);
      });

    return () => {
      unsubBudget();
      unsubTrans();
    };
  }, [userId]);

  const calculateSpent = (categoryLabel: string) => {
    return transactions
      .filter((t: any) => t.category === categoryLabel)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  const handleSaveBudget = async () => {
    if (!limitAmount) {
        Alert.alert("Lỗi", "Vui lòng nhập số tiền");
        return;
    }
    if (!userId) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
    }

    try {
      const existingBudget = budgets.find((b: any) => b.category === selectedCategory?.label);

      if (existingBudget) {
        await firestore().collection('budgets').doc(existingBudget.id).update({
          limit: parseInt(limitAmount),
        });
      } else {
        await firestore().collection('budgets').add({
          userId: userId,
          category: selectedCategory?.label,
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

  const renderItem = ({ item }: any) => {
    // ✅ Tính toán thật sự thay vì để 0
    const spent = calculateSpent(item.category);
    
    const percent = item.limit > 0 ? Math.min((spent / item.limit) * 100, 100) : 0;
    
    const categoryInfo = categories.find(c => c.label === item.category) || { icon: 'cash', color: '#999' };
    
    let progressColor = '#4CAF50';
    if (percent >= 80) progressColor = '#FFC107';
    if (percent >= 100) progressColor = '#FF5252';

    const remaining = item.limit - spent;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.iconBox, { backgroundColor: categoryInfo.color + '20' }]}>
              <Icon name={categoryInfo.icon} size={24} color={categoryInfo.color} />
            </View>
            <View style={{marginLeft: 12}}>
              <Text style={[styles.catTitle, { color: colors.text }]}>{item.category}</Text>
              <Text style={[styles.limitText, { color: colors.textSecondary }]}>
                Hạn mức: {formatCurrency(item.limit)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteBudget(item.id)}>
            <Icon name="trash-can-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: progressColor }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.spentText, { color: progressColor }]}>
            Đã chi: {formatCurrency(spent)}
          </Text>
          <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
            {remaining >= 0 ? `Còn lại: ${formatCurrency(remaining)}` : `Vượt: ${formatCurrency(Math.abs(remaining))}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ngân sách tháng này</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có ngân sách nào được thiết lập.
            </Text>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => setModalVisible(true)}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Thiết lập ngân sách
            </Text>
            
            <Text style={[styles.label, { color: colors.textSecondary }]}>Chọn danh mục</Text>
            
            <View style={{height: 200}}> 
              <ScrollView nestedScrollEnabled={true}>
                <View style={styles.catSelector}>
                  {categories
                    .filter(c => c.type === 'expense' || !c.type) 
                    .map((cat, index) => ( 
                    <TouchableOpacity 
                      key={cat.id || index} 
                      style={[
                        styles.catItem,
                        { 
                          borderColor: colors.border,
                          backgroundColor: colors.background
                        },
                        selectedCategory?.label === cat.label && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '15'
                        }
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Icon 
                        name={cat.icon} 
                        size={24} 
                        color={selectedCategory?.label === cat.label ? colors.primary : cat.color} 
                      />
                      <Text 
                        numberOfLines={1} 
                        style={[
                          styles.catText,
                          { color: colors.text },
                          selectedCategory?.label === cat.label && { 
                            color: colors.primary, 
                            fontWeight: 'bold' 
                          }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền giới hạn</Text>
            <TextInput 
              style={[
                styles.input,
                { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background
                }
              ]}
              placeholder="Ví dụ: 2,000,000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={limitAmount}
              onChangeText={setLimitAmount}
            />

            <TouchableOpacity 
              style={[styles.btnSave, { backgroundColor: colors.primary }]} 
              onPress={handleSaveBudget}
            >
              <Text style={styles.btnSaveText}>Lưu ngân sách</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.textSecondary }}>Đóng</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
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
  },
  limitText: {
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    height: 8,
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
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
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
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  btnSave: {
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
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    gap: 10, 
  },
  catItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: '23%',
  },
  catItemSelected: {},
  catText: {
    fontSize: 11,
    marginTop: 5,
  },
});

export default BudgetScreen;