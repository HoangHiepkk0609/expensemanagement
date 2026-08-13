import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';
import { InputField } from './InputField';
import { SelectModal } from './SelectModal';

const formatAmount = (text: string) => {
  const numericValue = text.replace(/[^0-9]/g, '');
  if (!numericValue) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + 'đ';
};

export const ManualInputForm = ({
  setInputMode,
  amount,
  handleAmountChange,
  categoriesToShow,
  selectedCategory,
  setSelectedCategory,
  showCategoryModal,
  setShowCategoryModal,
  handleDeleteCategory,
  transactionDate,
  showDatePicker,
  setShowDatePicker,
  handleDateChange,
  transactionType,
  recurrence,
  showRecurrenceModal,
  setShowRecurrenceModal,
  recurrenceOptions,
  setRecurrence,
  wallet,
  showWalletModal,
  setShowWalletModal,
  walletOptions,
  setWallet,
  note,
  setNote,
  familyId,
  isFamilyExpense,
  setIsFamilyExpense,
  loading,
}: any) => {
  const { colors } = useTheme();

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
      <View
        style={[styles.inputModeSelector, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => setInputMode('manual')}>
          <Text
            style={[
              styles.modeTextActive,
              { color: colors.primary, borderBottomColor: colors.primary },
            ]}
          >
            Nhập thủ công
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setInputMode('image')}>
          <Text
            style={[styles.modeTextInactive, { color: colors.textSecondary }]}
          >
            Nhập bằng ảnh
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Số tiền*
        </Text>
        <View
          style={[styles.inputContainer, { borderBottomColor: colors.border }]}
        >
          <TextInput
            style={[styles.input, { color: colors.primary }]}
            value={amount ? formatAmount(amount) : ''}
            onChangeText={handleAmountChange}
            placeholder="0đ"
            placeholderTextColor={colors.textSecondary}
            autoFocus={true}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.categoryGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Danh mục*
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {categoriesToShow.slice(0, 7).map((cat: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton,
                {
                  width: '25%',
                  marginHorizontal: '1%',
                  marginBottom: 12,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                selectedCategory === cat.label && {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedCategory(cat.label)}
              disabled={loading}
            >
              <View
                style={[
                  styles.categoryIconWrapper,
                  { backgroundColor: (cat.color || colors.primary) + '20' },
                ]}
              >
                <Icon
                  name={cat.icon}
                  size={24}
                  color={cat.color || colors.text}
                  style={{ marginBottom: 4 }}
                />
              </View>
              <Text
                style={[styles.categoryText, { color: colors.text }]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}

          {(() => {
            const isSelectedInTop = categoriesToShow
              .slice(0, 7)
              .some((c: any) => c.label === selectedCategory);
            const showSelectedCustom = selectedCategory && !isSelectedInTop;
            const currentCategoryObj = categoriesToShow.find(
              (c: any) => c.label === selectedCategory,
            );
            const displayLabel = showSelectedCustom
              ? selectedCategory
              : 'Xem thêm';
            const displayIcon = showSelectedCustom
              ? currentCategoryObj?.icon || 'tag-outline'
              : 'dots-horizontal';
            const displayColor = showSelectedCustom
              ? currentCategoryObj?.color || '#9D9D9D'
              : '#9D9D9D';

            return (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  {
                    width: '23%',
                    marginHorizontal: '1%',
                    marginBottom: 12,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  showSelectedCustom && {
                    backgroundColor: displayColor + '15',
                    borderColor: displayColor,
                  },
                ]}
                onPress={() => setShowCategoryModal(true)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.categoryIconWrapper,
                    { backgroundColor: displayColor + '20' },
                  ]}
                >
                  <Icon
                    name={displayIcon}
                    size={24}
                    color={displayColor}
                    style={{ marginBottom: 4 }}
                  />
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

      <InputField
        label="Ngày giao dịch"
        value={transactionDate.toLocaleDateString('vi-VN')}
        placeholder="Chọn ngày"
        isDropdown={true}
        iconName="calendar"
        onPress={() => setShowDatePicker(true)}
      />

      <InputField
        label="Nguồn tiền"
        value={wallet}
        placeholder="Chọn nguồn tiền"
        isDropdown={true}
        iconName="chevron-down"
        onPress={() => setShowWalletModal(true)}
      />

      <TouchableOpacity
        style={{
          paddingVertical: 16,
          marginTop: 8,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text
          style={{
            textAlign: 'center',
            color: colors.primary,
            fontWeight: '600',
          }}
        >
          {showAdvanced
            ? 'Thu gọn ▲'
            : 'Tùy chọn nâng cao (Lặp lại, Ghi chú) ▼'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View>
          {transactionType === 'expense' && (
            <InputField
              label="Tần suất lặp lại"
              value={recurrence}
              placeholder="Chọn tần suất"
              isDropdown={true}
              onPress={() => setShowRecurrenceModal(true)}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Ghi chú
            </Text>
            <TextInput
              style={[
                styles.inputNote,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Nhập mô tả giao dịch"
              placeholderTextColor={colors.textSecondary}
              multiline={true}
              editable={!loading}
            />
          </View>

          {familyId && (
            <View
              style={[
                styles.switchContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: colors.text }]}>
                  Chi tiêu gia đình
                </Text>
                <Text
                  style={[styles.switchSub, { color: colors.textSecondary }]}
                >
                  Khoản này sẽ được tính vào quỹ chung
                </Text>
              </View>
              <Switch
                value={isFamilyExpense}
                onValueChange={setIsFamilyExpense}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + '50',
                }}
                thumbColor={isFamilyExpense ? colors.primary : '#f3f4f6'}
              />
            </View>
          )}
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={transactionDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <SelectModal
        visible={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
        title="Tần suất lặp lại"
        options={recurrenceOptions}
        selectedValue={recurrence}
        onSelect={setRecurrence}
      />

      <SelectModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Nguồn tiền"
        options={walletOptions}
        selectedValue={wallet}
        onSelect={setWallet}
      />

      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Chọn danh mục
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categoriesToShow.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    selectedCategory === item.label && {
                      backgroundColor: colors.primary + '15',
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(item.label);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionIconWrapper,
                        {
                          backgroundColor:
                            (item.color || colors.primary) + '20',
                        },
                      ]}
                    >
                      <Icon
                        name={item.icon}
                        size={22}
                        color={item.color || colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        selectedCategory === item.label && {
                          color: colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.optionActions}>
                    {selectedCategory === item.label && (
                      <Icon
                        name="check"
                        size={20}
                        color={colors.primary}
                        style={{ marginRight: 15 }}
                      />
                    )}
                    {item.id && (
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteCategory(item.id, item.label)
                        }
                        style={styles.deleteButton}
                      >
                        <Icon
                          name="trash-can-outline"
                          size={22}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
