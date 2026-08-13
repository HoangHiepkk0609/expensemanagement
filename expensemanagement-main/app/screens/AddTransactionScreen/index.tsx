import auth from '@react-native-firebase/auth';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/themeContext';
import { ImageInputForm } from './components/ImageInputForm';
import { ManualInputForm } from './components/ManualInputForm';
import styles from './styles';

import { useTransactions } from '../../hook/useTransactions';
import { useImageAnalyzer } from './hooks/useImageAnalyzer';
import { useTransactionForm } from './hooks/useTransactionForm';

const RECURRENCE_OPTIONS = [
  'Không lặp lại',
  'Hàng ngày',
  'Hàng tuần',
  'Hàng tháng',
  'Hàng năm',
];
const WALLET_OPTIONS = [
  'Ví MoMo',
  'Thẻ ngân hàng',
  'Tiền mặt',
  'Ví điện tử khác',
];

const AddTransactionScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { familyId } = useAuth();
  const { transactions } = useTransactions();
  const userId = auth().currentUser?.uid;


  const [uiState, setUiState] = useState({
    inputMode: 'manual',
    showDatePicker: false,
    showRecurrenceModal: false,
    showWalletModal: false,
    showCategoryModal: false,
  });

  const updateUI = useCallback((key: string, value: any) => {
    setUiState(prev => ({ ...prev, [key]: value }));
  }, []);

  const {
    formState,
    updateForm,
    loading,
    handleAddTransaction,
    handleDeleteCategory,
    categoriesToShow,
  } = useTransactionForm(
    userId,
    familyId,
    navigation,
    transactions,
    route,
    updateUI,
  );

  const {
    selectedImages,
    setSelectedImages,
    loadingAI,
    handlePickImage,
    handleAnalyzeImages,
  } = useImageAnalyzer(navigation);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    updateUI('showDatePicker', false); 
    if (selectedDate) updateForm('transactionDate', selectedDate);
  };


  const MAX_AMOUNT = 1_000_000_000;
  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (Number(numericValue) > MAX_AMOUNT) return; 
    updateForm('amount', numericValue);
  };

  if (!userId) {
    return (
      <Text style={{ marginTop: 50, textAlign: 'center' }}>
        Vui lòng đăng nhập
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, flex: 1},
      ]}
    >
      <AppHeader
        title="Ghi chép giao dịch"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {uiState.inputMode === 'manual' && (
          <View style={styles.tabSwitcherContainer}>
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  styles.leftTab,
                  { borderColor: '#FF6B6B', backgroundColor: colors.surface },
                  formState.transactionType === 'expense' && styles.activeTab,
                ]}
                onPress={() => updateForm('transactionType', 'expense')}
                disabled={loading}
              >
                <Icon
                  name="arrow-up-bold-circle-outline"
                  size={20}
                  color={
                    formState.transactionType === 'expense' ? '#fff' : '#FF6B6B'
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.text },
                    formState.transactionType === 'expense' &&
                      styles.activeTabText,
                  ]}
                >
                  Chi tiêu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  styles.rightTab,
                  { borderColor: '#4CAF50', backgroundColor: colors.surface },
                  formState.transactionType === 'income' &&
                    styles.activeTabIncome,
                ]}
                onPress={() => updateForm('transactionType', 'income')}
                disabled={loading}
              >
                <Icon
                  name="arrow-down-bold-circle-outline"
                  size={20}
                  color={
                    formState.transactionType === 'income' ? '#fff' : '#4CAF50'
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.text },
                    formState.transactionType === 'income' &&
                      styles.activeTabTextIncome,
                  ]}
                >
                  Thu nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {uiState.inputMode === 'manual' ? (
          <ManualInputForm
            setInputMode={(mode: any) => updateUI('inputMode', mode)}
            showCategoryModal={uiState.showCategoryModal}
            setShowCategoryModal={(show: any) =>
              updateUI('showCategoryModal', show)
            }
            showDatePicker={uiState.showDatePicker}
            setShowDatePicker={(show: any) => updateUI('showDatePicker', show)}
            showRecurrenceModal={uiState.showRecurrenceModal}
            setShowRecurrenceModal={(show: any) =>
              updateUI('showRecurrenceModal', show)
            }
            showWalletModal={uiState.showWalletModal}
            setShowWalletModal={(show: any) =>
              updateUI('showWalletModal', show)
            }
            amount={formState.amount}
            handleAmountChange={handleAmountChange}
            categoriesToShow={categoriesToShow}
            selectedCategory={formState.selectedCategory}
            setSelectedCategory={(cat: any) =>
              updateForm('selectedCategory', cat)
            }
            transactionDate={formState.transactionDate}
            handleDateChange={handleDateChange}
            transactionType={formState.transactionType}
            recurrence={formState.recurrence}
            recurrenceOptions={RECURRENCE_OPTIONS}
            setRecurrence={(val: any) => updateForm('recurrence', val)}
            wallet={formState.wallet}
            walletOptions={WALLET_OPTIONS}
            setWallet={(val: any) => updateForm('wallet', val)}
            note={formState.note}
            setNote={(text: any) => updateForm('note', text)}
            familyId={familyId}
            isFamilyExpense={formState.isFamilyExpense}
            setIsFamilyExpense={(isFamily: any) =>
              updateForm('isFamilyExpense', isFamily)
            }
            handleDeleteCategory={handleDeleteCategory}
            loading={loading}
            handleAddTransaction={handleAddTransaction}
          />
        ) : (
          <ImageInputForm
            setInputMode={(mode: any) => updateUI('inputMode', mode)}
            loading={loadingAI}
            onSelectImage={handlePickImage}
            onAnalyze={handleAnalyzeImages}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
          />
        )}
      </ScrollView>

      {uiState.inputMode === 'manual' && (
        <View
          style={{
            padding: 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderColor: '#E0E0E0',
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor:
                formState.transactionType === 'expense' ? '#E53935' : '#4CAF50',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleAddTransaction}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {loading
                ? 'Đang xử lý...'
                : `THÊM GIAO DỊCH ${
                    formState.transactionType === 'expense' ? 'CHI' : 'THU'
                  }`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AddTransactionScreen;