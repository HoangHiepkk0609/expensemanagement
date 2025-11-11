import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const categories = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife' },
  { label: 'Mua sắm', icon: 'cart-outline' },
  { label: 'Người thân', icon: 'human-handsup' },
  { label: 'Khác', icon: 'dots-grid' },
];

const ImageExtractScreen = ({ navigation, route }: any) => {
  // ✅ ALL HOOKS AT THE TOP
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].label);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [wallet, setWallet] = useState('Ngoài MoMo');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const TEST_USER_ID = 'my-test-user-id-123';

  // ✅ Tự động chọn ảnh và OCR khi autoSelect = true
  useEffect(() => {
    const shouldAutoSelect = route?.params?.autoSelect;
    
    if (shouldAutoSelect) {
      
      setTimeout(() => {
        handleAutoSelectAndOCR();
      }, 500);
      
      navigation.setParams({ autoSelect: undefined });
    }
  }, [route?.params?.autoSelect]);

   // ✅ Hàm parse thông tin hóa đơn từ text OCR (phiên bản v2)
  const parseInvoiceData = (text: string) => {
    const data = {
      storeName: '',
      total: '',
      date: '',
    };

    const lines = text.split('\n').filter(line => line.trim());

    // 1. Lấy Tên cửa hàng (cố gắng tìm tên tốt hơn)
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        // Bỏ qua các dòng địa chỉ, SĐT
        if (line.length > 3 && !line.toLowerCase().includes('đ/c:') && !line.toLowerCase().includes('tel:') && !line.toLowerCase().includes('sdt:')) {
          data.storeName = line; // Lấy dòng này làm tên
          break;
        }
      }
      // Nếu không tìm thấy, quay về cách cũ là lấy dòng 1
      if (!data.storeName) {
        data.storeName = lines[0]?.trim() || '';
      }
    }

    // 2. Lấy Ngày (Regex của bạn đã tốt)
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      data.date = dateMatch[0]; // Lấy kết quả đầu tiên tìm thấy
    }

    // --- 3. Lấy Tổng tiền (Cách làm mạnh mẽ hơn v2) ---
    const totalKeywords = [
      'thanh toán', // Ưu tiên 1
      'tổng cộng',   // Ưu tiên 2
      'total',
      'tổng',
      't.ng c.ng',
      'thanhtoan',
    ];
    
    const amountRegex = /([\d.,]+)/g;
    
    // Hàm dọn dẹp số
    const cleanAmount = (amountStr: string) => {
      return amountStr.replace(/[^0-9]/g, '');
    };

    // Hàm tìm số lớn nhất trên 1 dòng
    const findLargestNumberOnLine = (line: string): string | null => {
      const numberMatches = line.match(amountRegex);
      if (!numberMatches) return null;

      let largestNum = 0;
      for (const match of numberMatches) {
        const num = parseInt(cleanAmount(match), 10);
        if (num > largestNum) {
          largestNum = num;
        }
      }
      return largestNum > 0 ? largestNum.toString() : null;
    };

    let foundTotal = false;
    // Đi từ dưới lên trên
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineText = lines[i];
      const lineLower = lineText.toLowerCase();

      for (const keyword of totalKeywords) {
        if (lineLower.includes(keyword)) {
          
          // Case 1: Keyword và số tiền trên CÙNG MỘT DÒNG
          let total = findLargestNumberOnLine(lineText);
          if (total) {
            data.total = total;
            foundTotal = true;
            break;
          }

          // Case 2: Keyword ở dòng này, số tiền ở DÒNG TIẾP THEO
          if (i + 1 < lines.length) {
            total = findLargestNumberOnLine(lines[i + 1]);
            if (total) {
              data.total = total;
              foundTotal = true;
              break;
            }
          }
        }
      }
      if (foundTotal) break;
    }
    
    // Case 3: (Dự phòng) Nếu không tìm thấy, tìm số tiền lớn nhất ở 3 dòng cuối
    if (!foundTotal) {
      let maxAmount = 0;
      const startIdx = Math.max(0, lines.length - 3);
      for (let i = lines.length - 1; i >= startIdx; i--) {
        const totalStr = findLargestNumberOnLine(lines[i]);
        if (totalStr) {
          const totalNum = parseInt(totalStr, 10);
          if (totalNum > maxAmount) {
            maxAmount = totalNum;
          }
        }
      }
      if (maxAmount > 0) {
        data.total = maxAmount.toString();
      }
    }
    // --- Kết thúc phần lấy Tổng tiền ---

    return data;
  };

   
  // ✅ Tự động chọn ảnh và OCR
  const handleAutoSelectAndOCR = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) {
        navigation.goBack();
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
        navigation.goBack();
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setSelectedImages(result.assets);

        setIsProcessing(true);
        
        // Thực hiện OCR
        await performOCR(result.assets[0].uri);
        
        // Hiển thị form sau khi OCR xong
        setShowForm(true);
        setIsProcessing(false);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Lỗi', 'Không thể xử lý ảnh');
      navigation.goBack();
    }
  };

  // ✅ Thực hiện OCR
  const performOCR = async (imageUri: string) => {
    try {
      const result = await TextRecognition.recognize(imageUri);
      const parsedData = parseInvoiceData(result.text);

      // Tự động điền vào form
      if (parsedData.total) {
        setAmount(parsedData.total);
      }

      if (parsedData.storeName) {
        setNote(parsedData.storeName);
      }

      if (parsedData.date) {
        try {
          const dateParts = parsedData.date.split(/[\/\-\.]/);
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            let year = parseInt(dateParts[2]);
            if (year < 100) year += 2000;
            
            const parsedDate = new Date(year, month, day);
            if (!isNaN(parsedDate.getTime())) {
              setTransactionDate(parsedDate);
            }
          }
        } catch (error) {
          console.error('Error parsing date:', error);
        }
      }

      console.log('✅ OCR hoàn tất:', parsedData);
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Cảnh báo', 'Không thể đọc thông tin từ ảnh. Vui lòng nhập thủ công.');
    }
  };

  // ✅ Chọn ảnh thủ công (khi nhấn nút +)
  const handleSelectImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 3,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setSelectedImages(result.assets);
        setShowForm(true);
        
        // OCR từ ảnh đầu tiên
        if (result.assets[0].uri) {
          setLoading(true);
          await performOCR(result.assets[0].uri);
          setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // ✅ Xóa ảnh
  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  // Format số tiền
  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + 'đ';
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
  };

    // ✅ Lưu giao dịch (phiên bản MỚI)
  const handleSaveTransaction = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);

    try {
      // 1. Chuẩn bị dữ liệu để lưu
      const newTransactionData = {
        userId: TEST_USER_ID,
        type: transactionType,
        amount: parseInt(amount),
        category: selectedCategory,
        note: note || '',
        date: transactionDate.toISOString(),
        recurrence: 'Không lặp lại',
        wallet: wallet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Lưu lên Firestore và lấy về tham chiếu
      const docRef = await firestore()
        .collection('transactions')
        .add(newTransactionData);

      // 3. Tạo đối tượng đầy đủ (bao gồm ID mới)
      const finalTransactionObject = {
        id: docRef.id,
        ...newTransactionData,
      };

      setLoading(false);

      // 1. GỬI TÍN HIỆU VỀ CHO TAB TỔNG QUAN
      navigation.navigate('MainTabs', { // (Hoặc tên Root Stack của Tab)
        screen: 'Tổng quan', // <-- TÊN TAB TỔNG QUAN CỦA BẠN
        params: {
          // Gửi ngày của giao dịch vừa tạo
          jumpToDate: transactionDate.toISOString(), 
        },
      });

  
      navigation.replace('TransactionDetail', {
        transaction: finalTransactionObject,
      });

    } catch (error: any) {
      setLoading(false);
      Alert.alert('Lỗi', `Không thể lưu: ${error.message}`);
    }
  };

  // ✅ Màn hình loading khi đang xử lý OCR
  if (isProcessing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingScreenText}>Đang trích xuất thông tin từ hóa đơn...</Text>
        <Text style={styles.loadingScreenSubtext}>Vui lòng đợi trong giây lát</Text>
      </View>
    );
  }

  // ✅ Màn hình chọn ảnh (khi không có autoSelect)
  if (!showForm && selectedImages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nhập bằng ảnh</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Icon name="bell-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 15 }}>
              <Icon name="home-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Icon name="image-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Chọn ảnh hóa đơn</Text>
          <Text style={styles.emptyText}>
            Hệ thống sẽ tự động trích xuất thông tin từ ảnh
          </Text>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectImages}
          >
            <Icon name="plus" size={24} color="#fff" />
            <Text style={styles.selectButtonText}>Chọn ảnh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ Màn hình form chính
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhập bằng ảnh</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="bell-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Icon name="home-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tab Chi tiêu / Thu nhập */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.leftTab,
              transactionType === 'expense' && styles.activeTab,
            ]}
            onPress={() => setTransactionType('expense')}
          >
            <Icon
              name="swap-horizontal-bold"
              size={18}
              color={transactionType === 'expense' ? '#FF69B4' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                transactionType === 'expense' && styles.activeTabText,
              ]}
            >
              Chi tiêu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.rightTab,
              transactionType === 'income' && styles.activeTab,
            ]}
            onPress={() => setTransactionType('income')}
          >
            <Icon
              name="swap-horizontal-bold"
              size={18}
              color={transactionType === 'income' ? '#FF69B4' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                transactionType === 'income' && styles.activeTabText,
              ]}
            >
              Thu nhập
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Hình ảnh */}
          <View style={styles.imagesSection}>
            <Text style={styles.sectionLabel}>
              Hình ảnh ({selectedImages.length}/3)
            </Text>
            <View style={styles.imagesList}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.imageThumbnail}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Icon name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                  <Text style={styles.imageNumber}>{idx + 1}</Text>
                </View>
              ))}

              {selectedImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleSelectImages}
                  disabled={loading}
                >
                  <Icon name="plus" size={32} color="#ccc" />
                  <Text style={styles.addImageText}>Thêm hình</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF69B4" />
              <Text style={styles.loadingText}>Đang trích xuất...</Text>
            </View>
          )}

          {/* Số tiền */}
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

          {/* Danh mục */}
          <View style={styles.categoryGroup}>
            <Text style={styles.inputLabel}>Danh mục*</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.label && styles.selectedCategory,
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
            </View>
          </View>

          {/* Ngày giao dịch */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày giao dịch*</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputDropdown}>
                {transactionDate.toLocaleDateString('vi-VN')}
              </Text>
              <Icon name="calendar" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={transactionDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Nguồn tiền */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nguồn tiền*</Text>
            <View style={styles.inputContainer}>
              <Icon name="wallet" size={24} color="#4CAF50" />
              <Text style={styles.walletText}>{wallet}</Text>
              <Icon name="chevron-down" size={24} color="#888" />
            </View>
          </View>

          {/* Ghi chú */}
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
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Thêm giao dịch {transactionType === 'expense' ? 'chi' : 'thu'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 40,
  },
  loadingScreenText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingScreenSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    gap: 10,
    marginTop: 30,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  imagesSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 10,
  },
  imagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF69B4',
    color: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  addImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
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
  walletText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  inputNote: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 50,
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
  },
  saveButton: {
    backgroundColor: '#ff69b4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ffb3d9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ImageExtractScreen;