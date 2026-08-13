import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hook/useCategories';
import { useTheme } from '../../theme/themeContext';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './styles';

const BudgetScreen = () => {
  const { categories } = useCategories();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { userId, familyId, filterMode } = useAuth();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [limitAmount, setLimitAmount] = useState('');
  const MAX_AMOUNT = 1_000_000_000;

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const firstExpense =
        categories.find(c => c.type === 'expense') || categories[0];
      setSelectedCategory(firstExpense);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let budgetQuery = firestore().collection('budgets') as any;
    if (filterMode === 'family' && familyId) {
      budgetQuery = budgetQuery.where('familyId', '==', familyId);
    } else {
      budgetQuery = budgetQuery.where('userId', '==', userId);
    }

    const unsubBudget = budgetQuery.onSnapshot((snapshot: any) => {
      let list = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (filterMode === 'personal') {
        list = list.filter((b: any) => b.isFamily !== true);
      }
      setBudgets(list);
    });

    let transQuery = firestore()
      .collection('transactions')
      .where('type', '==', 'expense') as any;
    if (filterMode === 'family' && familyId) {
      transQuery = transQuery.where('familyId', '==', familyId);
    } else {
      transQuery = transQuery.where('userId', '==', userId);
    }

    const unsubTrans = transQuery.onSnapshot((snapshot: any) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let list = snapshot.docs.map((doc: any) => doc.data());

      if (filterMode === 'personal') {
        list = list.filter((t: any) => t.isFamily !== true);
      }

      list = list.filter((t: any) => {
        let tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return (
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      });

      setTransactions(list);
      setLoading(false);
    });

    return () => {
      unsubBudget();
      unsubTrans();
    };
  }, [userId, filterMode, familyId]);

  const calculateSpent = (categoryLabel: string) => {
    return transactions
      .filter((t: any) => t.category === categoryLabel)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  const handleSaveBudget = async () => {
    if (!limitAmount) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền');
      return;
    }
    if (!userId) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
      return;
    }

    if (parseInt(limitAmount) > MAX_AMOUNT) {
      Alert.alert('Lỗi', 'Số tiền không được vượt quá 1 tỷ đồng');
      return;
    }

    try {
      const existingBudget = budgets.find(
        (b: any) => b.category === selectedCategory?.label,
      );

      if (existingBudget) {
        await firestore()
          .collection('budgets')
          .doc(existingBudget.id)
          .update({
            limit: parseInt(limitAmount),
          });
      } else {
        await firestore()
          .collection('budgets')
          .add({
            userId: userId,
            category: selectedCategory?.label,
            limit: parseInt(limitAmount),

            familyId: filterMode === 'family' ? familyId : null,
            isFamily: filterMode === 'family',

            createdAt: new Date().toISOString(),
          });
      }

      setModalVisible(false);
      setLimitAmount('');
      Alert.alert('Thành công', 'Đã thiết lập ngân sách!');
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu ngân sách');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert('Xóa ngân sách', 'Bạn có chắc muốn xóa không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await firestore().collection('budgets').doc(id).delete();
          setBudgets(budgets.filter(b => b.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: any) => {
    const spent = calculateSpent(item.category);
    const percent =
      item.limit > 0 ? Math.min((spent / item.limit) * 100, 100) : 0;
    const categoryInfo = categories.find(c => c.label === item.category) || {
      icon: 'cash',
      color: '#999',
    };

    let progressColor = '#4CAF50';
    if (percent >= 80) progressColor = '#FFC107';
    if (percent >= 100) progressColor = '#FF5252';

    const remaining = item.limit - spent;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: categoryInfo.color + '20' },
              ]}
            >
              <Icon
                name={categoryInfo.icon}
                size={24}
                color={categoryInfo.color}
              />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.catTitle, { color: colors.text }]}>
                {item.category}
              </Text>
              <Text style={[styles.limitText, { color: colors.textSecondary }]}>
                Hạn mức: {formatCurrency(item.limit)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteBudget(item.id)}>
            <Icon
              name="trash-can-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.progressContainer, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressBar,
              { width: `${percent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.spentText, { color: progressColor }]}>
            Đã chi: {formatCurrency(spent)}
          </Text>
          <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
            {remaining >= 0
              ? `Còn lại: ${formatCurrency(remaining)}`
              : `Vượt: ${formatCurrency(Math.abs(remaining))}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={`Ngân sách chi tiêu ${
          filterMode === 'family' ? 'Gia đình' : 'Cá nhân'
        }`}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có ngân sách{' '}
              {filterMode === 'family' ? 'gia đình' : 'cá nhân'} nào.
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
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Thiết lập ngân sách{' '}
              {filterMode === 'family' ? 'Gia đình' : 'Cá nhân'}
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Chọn danh mục
            </Text>

            <View style={{ height: 200 }}>
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
                            backgroundColor: colors.background,
                          },
                          selectedCategory?.label === cat.label && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary + '15',
                          },
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <Icon
                          name={cat.icon}
                          size={24}
                          color={
                            selectedCategory?.label === cat.label
                              ? colors.primary
                              : cat.color
                          }
                        />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.catText,
                            { color: colors.text },
                            selectedCategory?.label === cat.label && {
                              color: colors.primary,
                              fontWeight: 'bold',
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Số tiền giới hạn
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Ví dụ: 2,000,000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={limitAmount}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (Number(numericValue) > MAX_AMOUNT) return;
                setLimitAmount(numericValue);
              }}
            />

            <TouchableOpacity
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={handleSaveBudget}
            >
              <Text style={styles.btnSaveText}>Lưu ngân sách</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: colors.textSecondary }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BudgetScreen;
