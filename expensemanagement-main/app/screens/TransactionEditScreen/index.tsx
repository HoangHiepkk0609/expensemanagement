import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';
import { useCategories } from '../../hook/useCategories';

type Category = {
  id: string;
  name: string;
  label: string;
  icon: string;
  color?: string;
  type?: string;
};

type Source = { id: string; name: string; icon: string };
type Props = NativeStackScreenProps<RootStackParamList, 'TransactionEdit'>;

const sources: Source[] = [
  { id: 'momo', name: 'Ví MoMo', icon: '💳' },
  { id: 'cash', name: 'Tiền mặt', icon: '💵' },
  { id: 'bank', name: 'Thẻ ngân hàng', icon: '🏦' },
];

const categoryColors: any = {
  'Ăn uống': '#FF6B6B',
  'Mua sắm': '#FFD93D',
  'Di chuyển': '#6BCB77',
  'Người thân': '#4D96FF',
  Khác: '#9D9D9D',
  Lương: '#4CAF50',
  'Kinh doanh': '#2196F3',
  Thưởng: '#FFC107',
};

const TransactionEditScreen = ({ route, navigation }: Props) => {
  const { colors } = useTheme();
  const { transaction } = route.params;
  const { categories } = useCategories();
  const expenseCategoriesList = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories],
  );

  const incomeCategoriesList = useMemo(
    () => categories.filter(c => c.type === 'income'),
    [categories],
  );
  const [showNotification, setShowNotification] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoriesToShow, setCategoriesToShow] = useState<Category[]>(
    transaction.type === 'expense'
      ? expenseCategoriesList
      : incomeCategoriesList,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [editData, setEditData] = useState({
    id: transaction.id,
    amount: transaction.amount.toString(),
    category: transaction.category,
    categoryIcon: transaction.categoryIcon || 'food-fork-drink',
    date: transaction.date
      ? transaction.date.split('T')[0]
      : new Date().toISOString().split('T')[0],
    wallet: transaction.wallet,
    sourceIcon: transaction.sourceIcon || '💳',
    note: transaction.note || '',
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date(editData.date + 'T00:00:00'),
  );

  const formatDisplayDate = (isoDateString: string) => {
    if (!isoDateString || isNaN(new Date(isoDateString).getTime())) {
      isoDateString = new Date().toISOString();
    }

    const date = new Date(
      isoDateString.includes('T') ? isoDateString : isoDateString + 'T00:00:00',
    );
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('vi-VN', options);

    if (isSameDay(date, today)) return `Hôm nay, ${formattedDate}`;
    if (isSameDay(date, yesterday)) return `Hôm qua, ${formattedDate}`;

    return formattedDate;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setEditData({
        ...editData,
        date: date.toISOString().split('T')[0],
      });
    }
  };

  useEffect(() => {
    const type = transaction.type || 'expense';
    if (type === 'income') {
      setCategoriesToShow(incomeCategoriesList);
    } else {
      setCategoriesToShow(expenseCategoriesList);
    }
  }, [transaction, expenseCategoriesList, incomeCategoriesList]);

  const handleSaveEdit = async () => {
    const amountAsNumber = parseFloat(editData.amount.replace(/\./g, ''));
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ.');
      return;
    }

    const dataToSave: any = {
      ...editData,
      amount: amountAsNumber,
      date: new Date(editData.date + 'T00:00:00').toISOString(),
    };

    delete dataToSave.id;
    delete dataToSave.categoryIcon;
    delete dataToSave.sourceIcon;

    try {
      await firestore()
        .collection('transactions')
        .doc(transaction.id.toString())
        .update(dataToSave);

      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        navigation.navigate('MainTabs');
      }, 1500);
    } catch (error) {
      console.error('Lỗi khi cập nhật giao dịch: ', error);
      Alert.alert('Lỗi', 'Không thể cập nhật giao dịch. Vui lòng thử lại.');
    }
  };

  const handleCategorySelect = (category: Category) => {
    setEditData({
      ...editData,
      category: category.label || category.name,
      categoryIcon: category.icon,
    });
    setShowCategoryModal(false);
  };

  const handleSourceSelect = (source: Source) => {
    setEditData({
      ...editData,
      wallet: source.name,
      sourceIcon: source.icon,
    });
  };

  const formatAmountInput = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (!cleanedText) return '';
    return cleanedText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Số tiền */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Số tiền<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={[
                  styles.inputAmount,
                  {
                    color: colors.primary,
                    borderBottomColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                value={formatAmountInput(editData.amount)}
                onChangeText={text =>
                  setEditData({ ...editData, amount: text.replace(/\./g, '') })
                }
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text
                style={[styles.currencySymbol, { color: colors.textSecondary }]}
              >
                ₫
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Danh mục<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryContainer}>
              {categoriesToShow.slice(0, 3).map((cat, index) => {
                const catColor =
                  cat.color || categoryColors[cat.name] || '#9D9D9D';
                const catLabel = cat.label || cat.name;
                const isSelected = editData.category === catLabel;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCategorySelect(cat)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      isSelected && {
                        backgroundColor: catColor + '15',
                        borderColor: catColor,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIconWrapper,
                        { backgroundColor: catColor + '20' },
                      ]}
                    >
                      <Icon name={cat.icon} size={24} color={catColor} />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.text },
                        isSelected && { fontWeight: '700', color: catColor },
                      ]}
                      numberOfLines={1}
                    >
                      {catLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {(() => {
                const top3Labels = categoriesToShow
                  .slice(0, 3)
                  .map(c => c.label || c.name);
                const isSelectedInTop3 = top3Labels.includes(editData.category);
                const showSelectedCustom =
                  editData.category && !isSelectedInTop3;

                const currentCategoryObj = categoriesToShow.find(
                  c => (c.label || c.name) === editData.category,
                );

                const displayLabel = showSelectedCustom
                  ? editData.category
                  : 'Xem thêm';
                const displayIcon = showSelectedCustom
                  ? currentCategoryObj?.icon || 'tag-outline'
                  : 'dots-grid';
                const displayColor = showSelectedCustom
                  ? currentCategoryObj?.color || '#9D9D9D'
                  : '#9D9D9D';

                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      showSelectedCustom && {
                        backgroundColor: displayColor + '15',
                        borderColor: displayColor,
                      },
                    ]}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <View
                      style={[
                        styles.categoryIconWrapper,
                        { backgroundColor: displayColor + '20' },
                      ]}
                    >
                      <Icon name={displayIcon} size={24} color={displayColor} />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.text },
                        showSelectedCustom && {
                          fontWeight: '700',
                          color: displayColor,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {displayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Chọn danh mục
                  </Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Icon name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {categoriesToShow.map((cat, index) => {
                    const catLabel = cat.label || cat.name;
                    const isSelected = editData.category === catLabel;
                    const catColor =
                      cat.color || categoryColors[cat.name] || '#9D9D9D';

                    return (
                      <TouchableOpacity
                        key={cat.id || index}
                        style={[
                          styles.optionItem,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: catColor + '10' },
                        ]}
                        onPress={() => handleCategorySelect(cat)}
                      >
                        <View style={styles.optionContent}>
                          <View
                            style={[
                              styles.optionIconWrapper,
                              { backgroundColor: catColor + '20' },
                            ]}
                          >
                            <Icon name={cat.icon} size={22} color={catColor} />
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              { color: colors.text },
                              isSelected && {
                                color: catColor,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {catLabel}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon name="check" size={20} color={catColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Ngày giao dịch<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.inputWithIcon,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.inputDate, { color: colors.text }]}>
                {formatDisplayDate(editData.date)}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Nguồn tiền<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.inputWithIcon,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setShowWalletModal(true)}
            >
              <Icon name="credit-card" size={20} color={colors.textSecondary} />
              <Text style={[styles.inputDate, { color: colors.text }]}>
                {editData.wallet}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Modal
            visible={showWalletModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowWalletModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Nguồn tiền
                  </Text>
                  <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                    <Icon name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {sources.map((src, index) => {
                    const isSelected = editData.wallet === src.name;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionItem,
                          { borderBottomColor: colors.border },
                          isSelected && {
                            backgroundColor: colors.primary + '15',
                          },
                        ]}
                        onPress={() => {
                          handleSourceSelect(src);
                          setShowWalletModal(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: colors.text },
                            isSelected && {
                              color: colors.primary,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {src.name}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Ghi chú
            </Text>
            <TextInput
              style={[
                styles.inputNote,
                {
                  color: colors.text,
                  borderBottomColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={editData.note}
              onChangeText={text => setEditData({ ...editData, note: text })}
              placeholder="Thêm ghi chú..."
              placeholderTextColor={colors.textSecondary}
              multiline={true}
            />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            transaction.type === 'income' && styles.saveButtonIncome,
          ]}
          onPress={handleSaveEdit}
        >
          <Icon
            name="check"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>

      {showNotification && (
        <View style={styles.notification}>
          <Icon
            name="check-circle"
            size={24}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.notificationText}>Cập nhật thành công!</Text>
        </View>
      )}
    </View>
  );
};

export default TransactionEditScreen;
