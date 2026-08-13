import firestore from '@react-native-firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../../../constants/categories';
import { useCategories } from '../../../hook/useCategories';
import {
  createTransactionAPI,
  deleteCategoryAPI,
} from '../../../services/transactionService';
import NotificationHelper from '../../../utils/NotificationHelper';
import { TRANSACTION_LIMITS } from '../constants';

export const useTransactionForm = (
  userId: string | undefined,
  familyId: string | null,
  navigation: any,
  transactions: any[],
  route: any,
  updateUI: (key: string, value: any) => void,
) => {
  const [formState, setFormState] = useState({
    transactionType: 'expense',
    type: 'expense',
    amount: '',
    note: '',
    transactionDate: new Date(),
    recurrence: 'Không lặp lại',
    wallet: 'Ví MoMo',
    isFamilyExpense: false,
    selectedCategory: DEFAULT_EXPENSE_CATEGORIES[0].label,
  });

  const [loading, setLoading] = useState(false);
  const { categories } = useCategories();

  const expenseCategoriesList = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories],
  );

  const incomeCategoriesList = useMemo(
    () => categories.filter(c => c.type === 'income'),
    [categories],
  );
  const [categoriesToShow, setCategoriesToShow] = useState<any[]>(
    DEFAULT_EXPENSE_CATEGORIES,
  );

  useEffect(() => {
    if (route.params?.invoiceData) {
      const data = route.params.invoiceData;

      let formUpdates: any = {};

      if (data.total) formUpdates.amount = data.total;

      if (data.storeName) {
        formUpdates.note =
          data.storeName + (data.address ? ' - ' + data.address : '');
      }

      if (data.date) {
        const dateParts = data.date.split(/[\/\-\.]/);
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const year = parseInt(dateParts[2]);
          formUpdates.transactionDate = new Date(year, month, day);
        }
      }

      if (data.storeName) {
        const lowerName = data.storeName.toLowerCase();
        if (lowerName.includes('shop') || lowerName.includes('store')) {
          formUpdates.selectedCategory = 'Mua sắm';
        } else if (
          lowerName.includes('food') ||
          lowerName.includes('phở') ||
          lowerName.includes('cơm')
        ) {
          formUpdates.selectedCategory = 'Ăn uống';
        }
      }

      if (Object.keys(formUpdates).length > 0) {
        setFormState(prev => ({ ...prev, ...formUpdates }));
      }

      updateUI('inputMode', 'manual');

      Alert.alert(
        'Thành công',
        'Đã nhập thông tin từ hóa đơn. Vui lòng kiểm tra và điều chỉnh nếu cần!',
      );
      navigation.setParams({ invoiceData: undefined });
    }
  }, [route.params?.invoiceData, navigation, updateUI]);

  useEffect(() => {
    const currentType = formState.transactionType;
    const currentCategory = formState.selectedCategory;

    if (currentType === 'expense') {
      setCategoriesToShow(expenseCategoriesList);

      const isExist = expenseCategoriesList.find(
        c => c.label === currentCategory,
      );
      if (!isExist && expenseCategoriesList.length > 0) {
        updateForm('selectedCategory', expenseCategoriesList[0].label);
      }
    } else {
      setCategoriesToShow(incomeCategoriesList);

      const isExist = incomeCategoriesList.find(
        c => c.label === currentCategory,
      );
      if (!isExist && incomeCategoriesList.length > 0) {
        updateForm('selectedCategory', incomeCategoriesList[0].label);
      }
    }
  }, [
    formState.transactionType,
    formState.selectedCategory,
    expenseCategoriesList,
    incomeCategoriesList,
  ]);

  useEffect(() => {
    if (route.params?.nimo) {
      const data = route.params.nimo;

      let formUpdates: any = {};

      if (data.amount) formUpdates.amount = data.amount.toString();

      if (data.type) {
        formUpdates.transactionType = data.type;
        formUpdates.type = data.type;
      }

      if (data.date) {
        formUpdates.transactionDate = new Date(data.date);
      }

      if (data.note) {
        formUpdates.note = data.note;
      }

      if (data.wallet) {
        formUpdates.wallet = data.wallet;
      }

      if (data.category) {
        const allCategories = [
          ...expenseCategoriesList,
          ...incomeCategoriesList,
        ];
        const match = allCategories.find(
          c => c.label.toLowerCase() === data.category.toLowerCase(),
        );

        if (match) {
          formUpdates.selectedCategory = match.label;
        } else {
          formUpdates.selectedCategory = data.category;
        }
      }

      if (Object.keys(formUpdates).length > 0) {
        setFormState(prev => ({ ...prev, ...formUpdates }));
      }

      updateUI('inputMode', 'manual');
      navigation.setParams({ nimo: undefined });
    }
  }, [
    route.params?.nimo,
    expenseCategoriesList,
    incomeCategoriesList,
    navigation,
    updateUI,
  ]);

  const updateForm = (key: string, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const resetFields = () => {
    const defaultCategory =
      formState.transactionType === 'expense'
        ? DEFAULT_EXPENSE_CATEGORIES[0].label
        : DEFAULT_INCOME_CATEGORIES[0].label;

    setFormState(prev => ({
      ...prev,
      amount: '',
      note: '',
      transactionDate: new Date(),
      recurrence: 'Không lặp lại',
      wallet: 'Ví MoMo',
      isFamilyExpense: false,
      selectedCategory: defaultCategory,
    }));
  };

  const validateTransaction = () => {
    const amountValue = parseInt(formState.amount);

    if (!formState.amount || isNaN(amountValue)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền');
      return false;
    }
    if (amountValue <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return false;
    }
    if (amountValue < TRANSACTION_LIMITS.MIN_AMOUNT) {
      Alert.alert(
        'Lỗi',
        `Số tiền phải ít nhất ${TRANSACTION_LIMITS.MIN_AMOUNT.toLocaleString(
          'vi-VN',
        )} đồng`,
      );
      return false;
    }
    if (amountValue > TRANSACTION_LIMITS.WARNING_AMOUNT) {
      Alert.alert(
        'Cảnh báo',
        `Số tiền ${amountValue.toLocaleString(
          'vi-VN',
        )} đồng khá lớn. Bạn có chắc chắn không?`,
        [
          { text: 'Hủy', style: 'cancel', onPress: () => false },
          { text: 'Tiếp tục', onPress: () => true },
        ],
      );
    }
    if (!formState.selectedCategory) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return false;
    }
    return true;
  };

  const saveToFirestore = async () => {
    setLoading(true);

    try {
      const {
        transactionType,
        amount,
        selectedCategory,
        note,
        transactionDate,
        recurrence,
        wallet,
        isFamilyExpense,
      } = formState;

      const transactionData = {
        userId: userId,
        type: transactionType,
        amount: parseInt(amount),
        category: selectedCategory,
        note: note || '',
        date: transactionDate.toISOString(),
        recurrence: recurrence,
        wallet: wallet,
        familyId: isFamilyExpense ? familyId : null,
        isFamily: isFamilyExpense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createTransactionAPI(transactionData);

      if (isFamilyExpense && familyId && userId) {
        const memberRef = firestore()
          .collection('families')
          .doc(familyId)
          .collection('members')
          .doc(userId);

        if (transactionType === 'expense') {
          await memberRef.update({
            totalSpent: firestore.FieldValue.increment(parseInt(amount)),
          });
        } else if (transactionType === 'income') {
          await memberRef.update({
            totalContributed: firestore.FieldValue.increment(parseInt(amount)),
          });
        }
      }

      if (transactionType === 'expense') {
        try {
          let query = firestore()
            .collection('budgets')
            .where('category', '==', selectedCategory);

          if (isFamilyExpense && familyId) {
            query = query
              .where('familyId', '==', familyId)
              .where('isFamily', '==', true);
          } else {
            query = query
              .where('userId', '==', userId)
              .where('isFamily', '==', false);
          }

          const budgetSnapshot = await query.get();

          if (!budgetSnapshot.empty) {
            const categoryBudget = budgetSnapshot.docs[0].data();
            const currentSpent = transactions
              .filter(
                (tx: any) =>
                  tx.category === selectedCategory && tx.type === 'expense',
              )
              .reduce((total: number, tx: any) => total + tx.amount, 0);

            const totalAfterThisTx = currentSpent + parseInt(amount);
            const spentPercentage =
              (totalAfterThisTx / categoryBudget.limit) * 100;

            if (spentPercentage >= 80) {
              NotificationHelper.showBudgetWarning(spentPercentage.toFixed(0));
            }
          }
        } catch (e) {
          console.log('Lỗi ngân sách: ', e);
        }
      }

      resetFields();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể thêm giao dịch: ${error.message}`);
    } finally {
      console.log('Lỗi loading');
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!validateTransaction()) return;

    const amountValue = parseInt(formState.amount);
    if (amountValue > TRANSACTION_LIMITS.WARNING_AMOUNT) {
      Alert.alert('Cảnh báo', `Số tiền khá lớn. Bạn có chắc chắn không?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tiếp tục', onPress: () => saveToFirestore() },
      ]);
      return;
    }
    saveToFirestore();
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string,
  ) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa danh mục "${categoryName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategoryAPI(categoryId);
              if (formState.selectedCategory === categoryName) {
                updateForm('selectedCategory', categoriesToShow[0].label);
              }
              Alert.alert('Đã xóa', `Đã xóa danh mục "${categoryName}".`);
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa danh mục này.');
            }
          },
        },
      ],
    );
  };

  return {
    formState,
    setFormState,
    updateForm,
    loading,
    handleAddTransaction,
    handleDeleteCategory,
    categoriesToShow,
    expenseCategoriesList,
  };
};
