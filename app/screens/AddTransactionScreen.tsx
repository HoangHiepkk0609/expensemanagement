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
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Data giả cho danh mục
const categories = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife', color: '#ff69b4' },
  { label: 'Mua sắm', icon: 'cart-outline', color: '#fddb92' },
  { label: 'Người thân', icon: 'human-handsup', color: '#e0c3fc' },
  { label: 'Khác', icon: 'dots-grid', color: '#ccc' },
];

const allCategories = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife' },
  { label: 'Mua sắm', icon: 'cart-outline' },
  { label: 'Người thân', icon: 'human-handsup' },
  { label: 'Hóa đơn', icon: 'receipt' },
  { label: 'Nhà cửa', icon: 'home-outline' },
  { label: 'Giải trí', icon: 'movie-outline' },
  { label: 'Làm đẹp', icon: 'spa' },
  { label: 'Sức khỏe', icon: 'hospital-box' },
  { label: 'Từ thiện', icon: 'heart-outline' },
  { label: 'Học tập', icon: 'book-outline' },
  { label: 'Di chuyển', icon: 'car-outline' },
  { label: 'Đầu tư', icon: 'trending-up' },
];

const incomeCategories = [
  { label: 'Kinh doanh', icon: 'chart-line' },
  { label: 'Lương', icon: 'cash-marker' },
  { label: 'Thưởng', icon: 'wallet-giftcard' },
  { label: 'Khác', icon: 'dots-grid' },
  // ... (Bạn có thể thêm các danh mục thu nhập khác ở đây)
];

const AddTransactionScreen = ({ navigation, route }: any) => {
  const [transactionType, setTransactionType] = useState('expense');
  const [inputMode, setInputMode] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].label);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState('Không lặp lại');
  const [wallet, setWallet] = useState('Ngoài MoMo');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  
  // STATE CHO MODAL
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [categoriesToShow, setCategoriesToShow] = useState(allCategories);
 


  // Nhận dữ liệu từ InvoiceScanner
useEffect(() => {
  if (route.params?.invoiceData) {
    const data = route.params.invoiceData;
    
    // Điền dữ liệu vào form
    if (data.total) {
      setAmount(data.total);
    }
    
    if (data.storeName) {
      setNote(data.storeName + (data.address ? ' - ' + data.address : ''));
    }
    
    if (data.date) {
      // Parse ngày từ format dd/mm/yyyy
      const dateParts = data.date.split(/[\/\-\.]/);
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[2]);
        setTransactionDate(new Date(year, month, day));
      }
    }
    
    // Có thể tự động chọn danh mục dựa vào storeName
    if (data.storeName) {
      const lowerName = data.storeName.toLowerCase();
      if (lowerName.includes('shop') || lowerName.includes('store')) {
        setSelectedCategory('Mua sắm');
      } else if (lowerName.includes('food') || lowerName.includes('phở') || lowerName.includes('cơm')) {
        setSelectedCategory('Ăn uống');
      }
    }
    
    // Chuyển sang tab nhập thủ công để user xem/chỉnh sửa
    setInputMode('manual');
    
    Alert.alert('Thành công', 'Đã nhập thông tin từ hóa đơn. Vui lòng kiểm tra và điều chỉnh nếu cần!');
    
    // Clear params để tránh load lại khi quay về
    navigation.setParams({ invoiceData: undefined });
  }
}, [route.params?.invoiceData]);

// ✅ Tự động đổi danh mục khi chuyển tab
  useEffect(() => {
    if (transactionType === 'expense') {
      setCategoriesToShow(allCategories);
      // Đặt lại danh mục được chọn nếu nó không có trong danh sách mới
      if (!allCategories.find(c => c.label === selectedCategory)) {
        setSelectedCategory(allCategories[0].label);
      }
    } else { // Khi là 'income'
      setCategoriesToShow(incomeCategories);
      // Đặt lại danh mục được chọn nếu nó không có trong danh sách mới
      if (!incomeCategories.find(c => c.label === selectedCategory)) {
        setSelectedCategory(incomeCategories[0].label);
      }
    }
  }, [transactionType]); // Chạy lại khi transactionType thay đổi

  // OPTIONS
  const recurrenceOptions = [
    'Không lặp lại',
    'Hàng ngày',
    'Hàng tuần',
    'Hàng tháng',
    'Hàng năm'
  ];

  const walletOptions = [
    'Ngoài MoMo',
    'Ví MoMo',
    'Thẻ ngân hàng',
    'Tiền mặt',
    'Ví điện tử khác'
  ];

  const currentUser = auth().currentUser;
  const TEST_USER_ID = 'my-test-user-id-123';

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
  };

  // Hàm format số tiền
  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + 'đ';
  };

  // Hàm xử lý nhập số tiền
  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  // Hàm xử lý nút quay lại
  const handleGoBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  // ✅ Hàm tạo danh mục mới
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }
    
    const newCategory = {
      label: newCategoryName,
      icon: 'tag-outline'
    };
    
    setCustomCategories([...customCategories, newCategory]);
    setSelectedCategory(newCategoryName);
    setNewCategoryName('');
    setShowCreateCategory(false);
    setShowCategoryModal(false);
    Alert.alert('Thành công', `Đã tạo danh mục "${newCategoryName}" thành công!`);
  };

  // Hàm validate dữ liệu
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

  // ✅ Hàm thêm giao dịch vào Firebase (Đã sửa)
  const handleAddTransaction = async () => {
    if (!validateTransaction()) return;

    setLoading(true);
    try {
      // 1. Chuẩn bị dữ liệu
      const transactionData = {
        userId: TEST_USER_ID,
        type: transactionType, // Đã có
        amount: parseInt(amount),
        category: selectedCategory,
        note: note || '',
        date: transactionDate.toISOString(),
        recurrence: recurrence,
        wallet: wallet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Lưu lên Firestore
      const docRef = await firestore()
        .collection('transactions')
        .add(transactionData);

      console.log('✅ Transaction added with ID:', docRef.id);

      // 3. Tạo object đầy đủ để truyền đi
      const finalTransactionObject = {
        id: docRef.id,
        ...transactionData,
      };

      setLoading(false);

      // --- PHẦN SỬA ĐỔI QUAN TRỌNG ---
      // Bỏ Alert.alert() và thay bằng:

      // 4. Gửi tín hiệu về cho "Tổng quan" để nhảy tháng
      navigation.navigate('MainTabs', {
        screen: 'Tổng quan', // (Hoặc tên Tab 'Overview' của bạn)
        params: {
          jumpToDate: transactionDate.toISOString(),
        },
      });

      // 5. Chuyển thẳng sang màn hình "Chi tiết"
      navigation.navigate('TransactionDetail', {
        transaction: finalTransactionObject,
      });

    } catch (error: any) {
      setLoading(false);
      console.error('❌ Error adding transaction:', error);
      Alert.alert('Lỗi', `Không thể thêm giao dịch: ${error.message}`);
    }
  };

  // Hàm chọn ảnh từ thư viện
  const handleSelectImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 3,
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setSelectedImages(result.assets);
        Alert.alert('Thành công', `Đã chọn ${result.assets.length} ảnh`);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // COMPONENT: SelectModal (Dùng cho tần suất, nguồn tiền)
  const SelectModal = ({ visible, onClose, title, options, onSelect, selectedValue }: any) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#888" />
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
                    isSelected && styles.selectedOption
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText
                  ]}>
                    {optionValue}
                  </Text>
                  {isSelected && (
                    <Icon name="check" size={20} color="#ff69b4" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // COMPONENT: InputField
  const InputField = ({ 
    label, 
    value, 
    placeholder, 
    onPress, 
    iconName, 
    isDropdown = false,
  }: any) => {
    if (isDropdown) {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{label}*</Text>
          <TouchableOpacity 
            style={styles.inputContainer} 
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputDropdown, !value && {color: '#999'}]}>
              {value || placeholder}
            </Text>
            <Icon name={iconName || 'chevron-down'} size={24} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Component cho các thẻ chọn ảnh
  const ImageCard = ({ title, statusIcon }: any) => {
    const isSuccess = statusIcon === 'check-circle';
    const iconColor = isSuccess ? '#5cb85c' : '#dc3545';
    const borderColor = isSuccess ? '#e6f7e6' : '#f8e6e8';
    
    let content;
    if (title === "Lịch sử giao dịch") {
      content = (
        <View>
          <Text style={styles.cardDetailText}>← Tiền chuyển ra  <Text style={{color: '#dc3545'}}>-40.000đ</Text></Text>
          <Text style={styles.cardDetailText}>↗ Tiền chuyển vào  <Text style={{color: '#5cb85c'}}>+240.000đ</Text></Text>
          <Text style={styles.cardDetailText}>← Tiền chuyển ra  <Text style={{color: '#dc3545'}}>-100.000đ</Text></Text>
        </View>
      );
    } else if (title === "Kết quả giao dịch") {
      content = (
        <View>
          <Text style={[styles.cardDetailText, {fontSize: 22, fontWeight: 'bold', color: '#dc3545'}]}>-100.000đ</Text>
          <Text style={[styles.cardDetailText, {color: '#5cb85c'}]}>Thành công</Text>
          <Text style={styles.cardDetailTextSmall}>Mã giao dịch  XXX-XXX</Text>
          <Text style={styles.cardDetailTextSmall}>Người nhận  ABC</Text>
        </View>
      );
    } else if (title === "Ảnh QR") {
      content = (
        <View style={{alignItems: 'center', marginVertical: 10}}>
          <Icon name="qrcode-scan" size={40} color="#333" />
        </View>
      );
    } else if (title === "Ảnh mờ") {
      content = (
        <View style={{alignItems: 'center', marginVertical: 10}}>
          <Icon name="blur" size={40} color="#5cb85c" />
        </View>
      );
    }

    return (
      <TouchableOpacity style={[styles.imageCard, { backgroundColor: borderColor }]}>
        <View style={styles.cardStatusIcon}>
          <Icon name={statusIcon} size={18} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          {content}
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </TouchableOpacity>
    );
  };
  
  // Hiển thị giao diện Nhập Thủ Công
  const renderManualInput = () => (
    <>
      <View style={styles.formSection}>
        <View style={styles.inputModeSelector}>
          <TouchableOpacity onPress={() => setInputMode('manual')}>
            <Text style={styles.modeTextActive}>Nhập thủ công</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInputMode('image')}>
            <Text style={styles.modeTextInactive}>Nhập bằng ảnh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số tiền*</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount ? formatAmount(amount) : ''}
              onChangeText={handleAmountChange}
              placeholder="0đ"
              placeholderTextColor="#999"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>
        
        <View style={styles.categoryGroup}>
          <Text style={styles.inputLabel}>Danh mục*</Text>
          <View style={styles.categoryContainer}>
            {categoriesToShow.slice(0, 3).map((cat, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.categoryButton, 
                  selectedCategory === cat.label && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(cat.label)}
                disabled={loading}
              >
                <Icon 
                  name={cat.icon} 
                  size={24} 
                  color={selectedCategory === cat.label ? '#FF69B4' : '#333'} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.categoryText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
            {/* Nút Khác - Mở Modal */}
            <TouchableOpacity 
              style={[
                styles.categoryButton, 
                selectedCategory && !categoriesToShow.slice(0, 3).find(c => c.label === selectedCategory) && styles.selectedCategory
              ]}
              onPress={() => setShowCategoryModal(true)}
              disabled={loading}
            >
              <Icon 
                name="dots-grid" 
                size={24} 
                color={selectedCategory && !categoriesToShow.slice(0, 3).find(c => c.label === selectedCategory) ? '#FF69B4' : '#333'} 
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.categoryText}>{selectedCategory && !categoriesToShow.slice(0, 3).find(c => c.label === selectedCategory) ? selectedCategory : 'Khác'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ MODAL CHỌN DANH MỤC */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn danh mục</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Icon name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {categoriesToShow.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      selectedCategory === item.label && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedCategory(item.label);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Icon 
                        name={item.icon} 
                        size={20} 
                        color={selectedCategory === item.label ? '#FF69B4' : '#666'}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[
                        styles.optionText,
                        selectedCategory === item.label && styles.selectedOptionText
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                    {selectedCategory === item.label && (
                      <Icon name="check" size={20} color="#FF69B4" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* ✅ Danh mục tùy chỉnh */}
                {customCategories.map((item, index) => (
                  <TouchableOpacity
                    key={`custom-${index}`}
                    style={[
                      styles.optionItem,
                      selectedCategory === item.label && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedCategory(item.label);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Icon 
                        name={item.icon} 
                        size={20} 
                        color={selectedCategory === item.label ? '#FF69B4' : '#666'}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[
                        styles.optionText,
                        selectedCategory === item.label && styles.selectedOptionText
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                    {selectedCategory === item.label && (
                      <Icon name="check" size={20} color="#FF69B4" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* ✅ Nút Tạo mới */}
                <TouchableOpacity 
                  style={styles.createNewButton}
                  onPress={() => setShowCreateCategory(true)}
                >
                  <Icon name="plus" size={20} color="#FF69B4" style={{ marginRight: 12 }} />
                  <Text style={styles.createNewText}>Tạo danh mục mới</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ✅ MODAL TẠO DANH MỤC MỚI */}
        <Modal
          visible={showCreateCategory}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCreateCategory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '50%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo danh mục mới</Text>
                <TouchableOpacity onPress={() => setShowCreateCategory(false)}>
                  <Icon name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.createCategoryContent}>
                <Text style={styles.createCategoryLabel}>Tên danh mục*</Text>
                <TextInput
                  style={styles.createCategoryInput}
                  placeholder="Nhập tên danh mục"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholderTextColor="#999"
                />
                
                <TouchableOpacity 
                  style={styles.createCategoryButton}
                  onPress={handleCreateCategory}
                >
                  <Text style={styles.createCategoryButtonText}>Tạo danh mục</Text>
                </TouchableOpacity>
              </View>
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
          <Text style={styles.inputLabel}>Ghi chú</Text>
          <TextInput
            style={styles.inputNote}
            value={note}
            onChangeText={setNote}
            placeholder="Nhập mô tả giao dịch"
            placeholderTextColor="#999"
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
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.addButton, loading && styles.addButtonDisabled]} 
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

  // Hiển thị giao diện Nhập Bằng Ảnh
  // Hiển thị giao diện Nhập Bằng Ảnh
const renderImageInput = () => (
  <>
    <View style={styles.formSectionImage}>
      <View style={styles.inputModeSelector}>
        <TouchableOpacity onPress={() => setInputMode('manual')}>
          <Text style={styles.modeTextInactive}>Nhập thủ công</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setInputMode('image')}>
          <Text style={styles.modeTextActive}>Nhập bằng ảnh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.imageInputTitle}>Thêm giao dịch hàng loạt từ ảnh</Text>
      <Text style={styles.imageInputSubtitle}>
        Chọn tối đa 3 ảnh chụp màn hình <Text style={styles.highlightText}>Lịch sử</Text> hoặc <Text style={styles.highlightText}>Kết quả</Text> giao dịch ngân hàng, Grab, Shopee...
      </Text>

      <View style={styles.imageCardContainer}>
        <ImageCard title="Lịch sử giao dịch" statusIcon="check-circle" />
        <ImageCard title="Kết quả giao dịch" statusIcon="check-circle" />
        <ImageCard title="Ảnh QR" statusIcon="close-circle" />
        <ImageCard title="Ảnh mờ" statusIcon="close-circle" />
      </View>

      {selectedImages.length > 0 && (
        <View style={styles.selectedImagesInfo}>
          <Text style={styles.selectedImagesText}>
            Đã chọn {selectedImages.length} ảnh
          </Text>
        </View>
      )}

      <Text style={styles.imageInputHint}>
        Chọn tối đa 3 ảnh chụp màn hình <Text style={styles.highlightText}>Lịch sử</Text> hoặc <Text style={styles.highlightText}>Kết quả</Text> giao dịch ngân hàng, Grab, Shopee...
      </Text>
    </View>
    
    <View style={styles.footer}>
      <TouchableOpacity 
        style={[styles.addButton, loading && styles.addButtonDisabled]} 
        onPress={() => navigation.navigate('ImageExtract', { autoSelect: true })}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>
            Chọn ảnh ngay
          </Text>
        )}
      </TouchableOpacity>
    </View>
  </>
);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerIcon}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi chép GD</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="bell-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="home-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, styles.leftTab, transactionType === 'expense' && styles.activeTab]}
            onPress={() => setTransactionType('expense')}
            disabled={loading}
          >
            <Icon name="swap-horizontal-bold" size={18} color={transactionType === 'expense' ? '#FF69B4' : '#666'} />
            <Text style={[styles.tabText, transactionType === 'expense' && styles.activeTabText]}>Chi tiêu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, styles.rightTab, transactionType === 'income' && styles.activeTabIncome]}
            onPress={() => setTransactionType('income')}
            disabled={loading}
          >
            <Icon name="swap-horizontal-bold" size={18} color={transactionType === 'income' ? '#FF69B4' : '#666'} />
            <Text style={[styles.tabText, transactionType === 'income' && styles.activeTabTextIncome]}>Thu nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.addButton, 
              transactionType === 'income' && styles.addButtonIncome, // <-- Thêm dòng này
              loading && styles.addButtonDisabled
            ]} 
            onPress={handleAddTransaction}
            disabled={loading}
          >
          </TouchableOpacity>
        </View>

        {inputMode === 'manual' ? renderManualInput() : renderImageInput()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 100,
  },
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  leftTab: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
  },
  rightTab: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff0f5', 
    borderColor: '#FF69B4',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginLeft: 5,
  },
  activeTabText: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  formSectionImage: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  inputModeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  modeTextActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF69B4',
    paddingBottom: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#FF69B4',
    marginRight: 20,
  },
  modeTextInactive: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    paddingBottom: 8,
    marginRight: 20,
  },
  imageInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imageInputSubtitle: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  highlightText: {
    color: '#FF69B4',
    fontWeight: 'bold',
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
    padding: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  cardStatusIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    paddingTop: 5,
    marginBottom: 5,
    opacity: 0.9,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  cardDetailText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  cardDetailTextSmall: {
    fontSize: 10,
    color: '#666',
  },
  imageInputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  selectedImagesInfo: {
    backgroundColor: '#e6f7e6',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  selectedImagesText: {
    fontSize: 14,
    color: '#5cb85c',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 5,
  },
  inputDropdown: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  inputNote: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputIcon: {
    marginLeft: 10,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryButton: {
    width: (width - 40 - 30) / 4, 
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectedCategory: {
    backgroundColor: '#fff0f5', 
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  addButton: {
    backgroundColor: '#ff69b4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ffb3d9',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#fff0f5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#ff69b4',
    fontWeight: 'bold',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    marginTop: 10,
  },
  createNewText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '600',
  },
  createCategoryContent: {
    padding: 20,
  },
  createCategoryLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 12,
  },
  createCategoryInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  createCategoryButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createCategoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabIncome: {
  backgroundColor: '#f0fff5', // Màu xanh lá nhạt
  borderColor: '#4CAF50',
  },
  activeTabTextIncome: {
    color: '#4CAF50', // Màu xanh lá
    fontWeight: 'bold',
  },
  addButtonIncome: {
    backgroundColor: '#4CAF50', // Màu nút xanh lá
  },
});

export default AddTransactionScreen;