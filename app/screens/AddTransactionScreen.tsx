import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/themeContext';
import { useCategories } from '../hook/useCategories';
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES,
} from '../constants/categories'; 

const { width } = Dimensions.get('window');

const AddTransactionScreen = ({ navigation, route }: any) => {
  const { categories } = useCategories();
  const { colors, isDarkMode } = useTheme();
  const [transactionType, setTransactionType] = useState('expense');
  const [inputMode, setInputMode] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].label);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState('Không lặp lại');
  const [wallet, setWallet] = useState('Ngoài MoMo');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  
  const [expenseCategoriesList, setExpenseCategoriesList] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategoriesList, setIncomeCategoriesList] = useState(DEFAULT_INCOME_CATEGORIES);
  const [categoriesToShow, setCategoriesToShow] = useState(DEFAULT_EXPENSE_CATEGORIES);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const filteredCategories = categories.filter(c => c.type === type);

 
  
  const userId = auth().currentUser?.uid;

  if (!userId) {
    return <Text>Vui lòng đăng nhập</Text>; 
  }

  const resetFields = () => {
    setAmount('');              
    setNote('');                
    setTransactionDate(new Date()); 
    setRecurrence('Không lặp lại');
    setWallet('Ngoài MoMo');
    setSelectedImages([]); 
    
    if (transactionType === 'expense') {
      setSelectedCategory(expenseCategoriesList[0]?.label || DEFAULT_EXPENSE_CATEGORIES[0].label);
    } else {
      setSelectedCategory(incomeCategoriesList[0]?.label || DEFAULT_INCOME_CATEGORIES[0].label);
    }
  };

  useEffect(() => {
    if (route.params?.invoiceData) {
      const data = route.params.invoiceData;
      
      if (data.total) setAmount(data.total);
      
      if (data.storeName) {
        setNote(data.storeName + (data.address ? ' - ' + data.address : ''));
      }
      
      if (data.date) {
        const dateParts = data.date.split(/[\/\-\.]/);
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const year = parseInt(dateParts[2]);
          setTransactionDate(new Date(year, month, day));
        }
      }
      
      if (data.storeName) {
        const lowerName = data.storeName.toLowerCase();
        if (lowerName.includes('shop') || lowerName.includes('store')) {
          setSelectedCategory('Mua sắm');
        } else if (lowerName.includes('food') || lowerName.includes('phở') || lowerName.includes('cơm')) {
          setSelectedCategory('Ăn uống');
        }
      }
      
      setInputMode('manual');
      Alert.alert('Thành công', 'Đã nhập thông tin từ hóa đơn. Vui lòng kiểm tra và điều chỉnh nếu cần!');
      navigation.setParams({ invoiceData: undefined });
    }
  }, [route.params?.invoiceData]);

  useEffect(() => {
    const subscriber = firestore()
      .collection('user_categories')
      .where('userId', '==', userId)
      .onSnapshot(querySnapshot => {
        const customExpense: any[] = [];
        const customIncome: any[] = []; 

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const item = { id: doc.id, ...data };

          if (data.type === 'income') {
            customIncome.push(item);
          } else {
            customExpense.push(item);
          }
        });

        // 3. Cập nhật cả 2 danh sách
        setExpenseCategoriesList([...DEFAULT_EXPENSE_CATEGORIES, ...customExpense]);
        setIncomeCategoriesList([...DEFAULT_INCOME_CATEGORIES, ...customIncome]); 
      });
      
    return () => subscriber();
  }, []);

  useEffect(() => {
    if (transactionType === 'expense') {
      setCategoriesToShow(expenseCategoriesList);
      if (!expenseCategoriesList.find(c => c.label === selectedCategory)) {
        setSelectedCategory(expenseCategoriesList[0].label);
      }
    } else { 
      setCategoriesToShow(incomeCategoriesList);
      if (!incomeCategoriesList.find(c => c.label === selectedCategory)) {
        setSelectedCategory(incomeCategoriesList[0].label);
      }
    }
  }, [transactionType, expenseCategoriesList, incomeCategoriesList]);

  useEffect(() => {
    if (route.params?.nimoData) {
      const data = route.params.nimoData;
      console.log("Dữ liệu từ Nimo:", data);

      if (data.amount) setAmount(data.amount.toString());
      if (data.note) setNote(data.note);
      if (data.date) {
        setTransactionDate(new Date(data.date));
      }

      if (data.category) {
        const allCategories = [...expenseCategoriesList, ...incomeCategoriesList];
        const match = allCategories.find(c => 
          c.label.toLowerCase() === data.category.toLowerCase()
        );
        
        if (match) {
          setSelectedCategory(match.label);
        } else {
          setSelectedCategory(data.category);
        }
      }

      setInputMode('manual');
      navigation.setParams({ nimoData: undefined });
    }
  }, [route.params?.nimoData, expenseCategoriesList, incomeCategoriesList]);

  const recurrenceOptions = ['Không lặp lại', 'Hàng ngày', 'Hàng tuần', 'Hàng tháng', 'Hàng năm'];
  const walletOptions = ['Ngoài MoMo', 'Ví MoMo', 'Thẻ ngân hàng', 'Tiền mặt', 'Ví điện tử khác'];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setTransactionDate(selectedDate);
  };

  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + 'đ';
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const handleGoBack = () => {
    if (navigation && navigation.goBack) navigation.goBack();
  };

  const handleCreateCategory = async () => {
    const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    const newCategory = {
      label: newCategoryName,
      icon: 'tag-outline',
      color: randomColor,
      type: transactionType,
      userId: userId,
      createdAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const docRef = await firestore().collection('categories').add(newCategory);
      const createdCategory = {
        label: newCategoryName,
        icon: 'tag-outline',
        color: randomColor,
        type: transactionType,
        userId: userId,
        createdAt: new Date().toISOString(),
        id: docRef.id,
      };
      setSelectedCategory(docRef.id);
      setNewCategoryName('');
      setShowCreateCategory(false);
      setShowCategoryModal(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Lỗi tạo danh mục:", error);
      Alert.alert('Lỗi', 'Không thể tạo danh mục mới.');
    }
  };

  const validateTransaction = () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return false;
    }
    return true;
  };

  const handleAddTransaction = async () => {
    if (!validateTransaction()) return;

    setLoading(true);
    try {
      const transactionData = {
        userId: userId,
        type: transactionType,
        amount: parseInt(amount),
        category: selectedCategory,
        note: note || '',
        date: transactionDate.toISOString(),
        recurrence: recurrence,
        wallet: wallet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await firestore()
        .collection('transactions')
        .add(transactionData);

      console.log('✅ Transaction added with ID:', docRef.id);

      const finalTransactionObject = {
        id: docRef.id,
        ...transactionData,
      };

      setLoading(false);
      resetFields(); 

      navigation.navigate('MainTabs', {
        screen: 'Tổng quan',
        params: {
          jumpToDate: transactionDate.toISOString(),
        },
      });

      navigation.navigate('TransactionDetail', {
        transaction: finalTransactionObject,
      });

    } catch (error: any) {
      setLoading(false);
      console.error('❌ Error adding transaction:', error);
      Alert.alert('Lỗi', `Không thể thêm giao dịch: ${error.message}`);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa danh mục "${categoryName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('user_categories').doc(categoryId).delete();
              if (selectedCategory === categoryName) {
                setSelectedCategory(categoriesToShow[0].label);
              }
              Alert.alert('Đã xóa', `Đã xóa danh mục "${categoryName}".`);
            } catch (error) {
              console.error("Lỗi xóa danh mục:", error);
              Alert.alert('Lỗi', 'Không thể xóa danh mục này.');
            }
          } 
        }
      ]
    );
  };

  const SelectModal = ({ visible, onClose, title, options, onSelect, selectedValue }: any) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((item: any, index: number) => {
              const optionValue = typeof item === 'string' ? item : item.label;
              const isSelected = selectedValue === optionValue;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.primary + '15' }
                  ]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[
                    styles.optionText,
                    { color: colors.text },
                    isSelected && { color: colors.primary, fontWeight: '700' }
                  ]}>
                    {optionValue}
                  </Text>
                  {isSelected && <Icon name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const InputField = ({ label, value, placeholder, onPress, iconName, isDropdown = false }: any) => {
    if (isDropdown) {
      return (
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>{label}*</Text>
          <TouchableOpacity style={[styles.inputContainer, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
            <Text style={[
              styles.inputDropdown,
              { color: colors.text },
              !value && { color: colors.textSecondary }
            ]}>
              {value || placeholder}
            </Text>
            <Icon name={iconName || 'chevron-down'} size={24} color={colors.textSecondary} style={styles.inputIcon} />
          </TouchableOpacity>
        </View>
      );
    }
    return null; 
  };

  const ImageCard = ({ title, statusIcon }: any) => {
    const isSuccess = statusIcon === 'check-circle';
    const iconColor = isSuccess ? '#5cb85c' : '#dc3545';
    const borderColor = isSuccess ? '#e6f7e6' : '#f8e6e8';
    
    let content;
    if (title === "Lịch sử giao dịch") {
      content = (
        <View>
          <Text style={[styles.cardDetailText, { color: colors.text }]}>
            ← Tiền chuyển ra  <Text style={{color: '#dc3545'}}>-40.000đ</Text>
          </Text>
          <Text style={[styles.cardDetailText, { color: colors.text }]}>
            ↗ Tiền chuyển vào  <Text style={{color: '#5cb85c'}}>+240.000đ</Text>
          </Text>
        </View>
      );
    } else if (title === "Kết quả giao dịch") {
      content = (
        <View>
          <Text style={[styles.cardDetailText, {fontSize: 22, fontWeight: 'bold', color: '#dc3545'}]}>-100.000đ</Text>
          <Text style={[styles.cardDetailText, {color: '#5cb85c'}]}>Thành công</Text>
        </View>
      );
    } else if (title === "Ảnh QR") {
      content = <View style={{alignItems: 'center', marginVertical: 10}}><Icon name="qrcode-scan" size={40} color={colors.text} /></View>;
    } else if (title === "Ảnh mờ") {
      content = <View style={{alignItems: 'center', marginVertical: 10}}><Icon name="blur" size={40} color="#5cb85c" /></View>;
    }

    

    return (
      <TouchableOpacity style={[styles.imageCard, { backgroundColor: borderColor, borderColor: colors.border }]}>
        <View style={styles.cardStatusIcon}><Icon name={statusIcon} size={18} color={iconColor} /></View>
        <View style={styles.cardContent}>{content}</View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </TouchableOpacity>
    );
  };
  
  const renderManualInput = () => (
    <>
      <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
        <View style={[styles.inputModeSelector, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setInputMode('manual')}>
            <Text style={[styles.modeTextActive, { color: colors.primary, borderBottomColor: colors.primary }]}>Nhập thủ công</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInputMode('image')}>
            <Text style={[styles.modeTextInactive, { color: colors.textSecondary }]}>Nhập bằng ảnh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Số tiền*</Text>
          <View style={[styles.inputContainer, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={amount ? formatAmount(amount) : ''}
              onChangeText={handleAmountChange}
              placeholder="0đ"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>
        
        <View style={styles.categoryGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Danh mục*</Text>
          <View style={styles.categoryContainer}>
            {categoriesToShow.slice(0, 3).map((cat, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.categoryButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedCategory === cat.label && { 
                    backgroundColor: colors.primary + '15',
                    borderColor: colors.primary 
                  }
                ]}
                onPress={() => setSelectedCategory(cat.label)}
                disabled={loading}
              >
               <View style={[styles.categoryIconWrapper, { backgroundColor: (cat.color || colors.primary) + '20' }]}>
                <Icon name={cat.icon} size={24} color={cat.color || colors.text} style={{ marginBottom: 4 }} />
              </View>
                <Text style={[styles.categoryText, { color: colors.text }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
            {(() => {
                  const isSelectedInTop3 = categoriesToShow.slice(0, 3).some(c => c.label === selectedCategory);
                  const showSelectedCustom = selectedCategory && !isSelectedInTop3;
                  
                  const currentCategoryObj = categoriesToShow.find(c => c.label === selectedCategory);

                  const displayLabel = showSelectedCustom ? selectedCategory : 'Khác';
                  const displayIcon = showSelectedCustom ? (currentCategoryObj?.icon || 'tag-outline') : 'dots-grid';
                  const displayColor = showSelectedCustom ? (currentCategoryObj?.color || '#9D9D9D') : '#9D9D9D';
                  
                  return (
                    <TouchableOpacity 
                      style={[
                        styles.categoryButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        showSelectedCustom && {
                          backgroundColor: displayColor + '15', 
                          borderColor: displayColor
                        }
                      ]}
                      onPress={() => setShowCategoryModal(true)}
                      disabled={loading}
                    >
                      <View style={[styles.categoryIconWrapper, { backgroundColor: displayColor + '20' }]}>
                        <Icon name={displayIcon} size={24} color={displayColor} style={{ marginBottom: 4 }} />
                      </View>

                      <Text 
                        style={[
                            styles.categoryText, 
                            { color: colors.text },
                            showSelectedCustom && { fontWeight: '700', color: displayColor }
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

        {/* MODAL CHỌN DANH MỤC */}
        <Modal visible={showCategoryModal} transparent={true} animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn danh mục</Text>
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
                      selectedCategory === item.label && { backgroundColor: colors.primary + '15' }
                    ]}
                    onPress={() => { setSelectedCategory(item.label); setShowCategoryModal(false); }}
                  >
                   <View style={styles.optionContent}>
                      <View style={[
                        styles.optionIconWrapper, 
                        { backgroundColor: (item.color || colors.primary) + '20' } 
                      ]}>
                        <Icon 
                          name={item.icon} 
                          size={22} 
                          color={item.color || colors.textSecondary} 
                        />
                      </View>
                      
                      <Text style={[
                        styles.optionText,
                        { color: colors.text },
                        selectedCategory === item.label && { color: colors.primary, fontWeight: '700' }
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.optionActions}>
                      {selectedCategory === item.label && (
                        <Icon name="check" size={20} color={colors.primary} style={{ marginRight: 15 }} />
                      )}
                      {item.id && ( 
                        <TouchableOpacity onPress={() => handleDeleteCategory(item.id, item.label)} style={styles.deleteButton}>
                          <Icon name="trash-can-outline" size={22} color="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}           
              </ScrollView>
            </View>
          </View>
        </Modal>

       

        <InputField 
          label="Ngày giao dịch" 
          value={transactionDate.toLocaleDateString('vi-VN')} 
          placeholder="Chọn ngày" 
          isDropdown={true} 
          iconName="calendar" 
          onPress={() => setShowDatePicker(true)} 
        />

        {showDatePicker && (
          <DateTimePicker
            value={transactionDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
                
        {transactionType === 'expense' && (
          <InputField 
            label="Tần suất lặp lại" 
            value={recurrence} 
            placeholder="Chọn tần suất" 
            isDropdown={true} 
            onPress={() => setShowRecurrenceModal(true)} 
          />
        )}
        <InputField 
          label="Nguồn tiền" 
          value={wallet} 
          placeholder="Chọn nguồn tiền" 
          isDropdown={true} 
          iconName="chevron-down" 
          onPress={() => setShowWalletModal(true)} 
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Ghi chú</Text>
          <TextInput
            style={[
              styles.inputNote,
              { 
                color: colors.text,
                borderBottomColor: colors.border
              }
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Nhập mô tả giao dịch"
            placeholderTextColor={colors.textSecondary}
            multiline={true}
            editable={!loading}
          />
        </View>

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
      </View>
      
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            loading && styles.addButtonDisabled
          ]} 
          onPress={handleAddTransaction} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              Thêm giao dịch {transactionType === 'expense' ? 'chi' : 'thu'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderImageInput = () => (
    <>
      <View style={[styles.formSectionImage, { backgroundColor: colors.surface }]}>
        <View style={[styles.inputModeSelector, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setInputMode('manual')}>
            <Text style={[styles.modeTextInactive, { color: colors.textSecondary }]}>Nhập thủ công</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInputMode('image')}>
            <Text style={[styles.modeTextActive, { color: colors.primary, borderBottomColor: colors.primary }]}>Nhập bằng ảnh</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.imageInputTitle, { color: colors.text }]}>Thêm giao dịch hàng loạt từ ảnh</Text>
        <Text style={[styles.imageInputSubtitle, { color: colors.textSecondary }]}>
          Chọn tối đa 3 ảnh chụp màn hình <Text style={[styles.highlightText, { color: colors.primary }]}>Lịch sử</Text> hoặc <Text style={[styles.highlightText, { color: colors.primary }]}>Kết quả</Text> giao dịch ngân hàng...
        </Text>

        <View style={styles.imageCardContainer}>
          <ImageCard title="Lịch sử giao dịch" statusIcon="check-circle" />
          <ImageCard title="Kết quả giao dịch" statusIcon="check-circle" />
          <ImageCard title="Ảnh QR" statusIcon="close-circle" />
          <ImageCard title="Ảnh mờ" statusIcon="close-circle" />
        </View>
        <Text style={[styles.imageInputHint, { color: colors.textSecondary }]}>Chọn tối đa 3 ảnh...</Text>
      </View>
      
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            loading && styles.addButtonDisabled
          ]} 
          onPress={() => navigation.navigate('ImageExtract', { autoSelect: true })} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Chọn ảnh ngay</Text>}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.surface : '#FFD6E8'}]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerIcon}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ghi chép giao dịch</Text>
        <View style={styles.headerIcons}>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabSwitcherContainer}>
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabButton, 
                styles.leftTab,
                { borderColor: '#FF6B6B', backgroundColor: colors.surface },
                transactionType === 'expense' && styles.activeTab
              ]}
              onPress={() => setTransactionType('expense')}
              disabled={loading}
            >
              <Icon name="arrow-up-bold-circle-outline" size={20} color={transactionType === 'expense' ? '#fff' : '#FF6B6B'} />
              <Text style={[
                styles.tabText,
                { color: colors.text },
                transactionType === 'expense' && styles.activeTabText
              ]}>
                Chi tiêu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton, 
                styles.rightTab,
                { borderColor: '#4CAF50', backgroundColor: colors.surface },
                transactionType === 'income' && styles.activeTabIncome
              ]}
              onPress={() => setTransactionType('income')}
              disabled={loading}
            >
              <Icon name="arrow-down-bold-circle-outline" size={20} color={transactionType === 'income' ? '#fff' : '#4CAF50'} />
              <Text style={[
                styles.tabText,
                { color: colors.text },
                transactionType === 'income' && styles.activeTabTextIncome
              ]}>
                Thu nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {inputMode === 'manual' ? renderManualInput() : renderImageInput()}
      </ScrollView>
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
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 120,
    paddingTop: 15,
  },
  tabSwitcherContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    gap: 8,
  },
  leftTab: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 0,
  },
  rightTab: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  activeTabIncome: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  activeTabTextIncome: {
    color: '#fff',
    fontWeight: '700',
  },
  formSection: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  formSectionImage: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  inputModeSelector: {
    flexDirection: 'row',
    marginBottom: 25,
    borderBottomWidth: 2,
    gap: 30,
  },
  modeTextActive: {
    fontSize: 16,
    fontWeight: '700',
    paddingBottom: 10,
    borderBottomWidth: 3,
  },
  modeTextInactive: {
    fontSize: 16,
    fontWeight: '500',
    paddingBottom: 10,
  },
  imageInputTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  imageInputSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  highlightText: {
    fontWeight: '700',
  },
  imageCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    width: (width - 40 - 30) / 2,
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
    padding: 12,
    position: 'relative',
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardStatusIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 10,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: 5,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  cardDetailText: {
    fontSize: 11,
    marginBottom: 2,
  },
  imageInputHint: {
    fontSize: 12,
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 8,
  },
  inputDropdown: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    fontWeight: '500',
  },
  inputNote: {
    fontSize: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    fontWeight: '500',
  },
  inputIcon: {
    marginLeft: 12,
  },
  categoryGroup: {
    marginBottom: 25,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  categoryButton: {
    width: (width - 40 - 30) / 4,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedCategory: {
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectedOption: {
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedOptionText: {
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    marginTop: 10,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  createCategoryContent: {
    padding: 20,
  },
  createCategoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  createCategoryInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500',
  },
  createCategoryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  createCategoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddTransactionScreen;