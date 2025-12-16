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
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const { width } = Dimensions.get('window');

const categories = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife' },
  { label: 'Mua sắm', icon: 'cart-outline' },
  { label: 'Người thân', icon: 'human-handsup' },
  { label: 'Khác', icon: 'dots-grid' },
];

const categoryColors: any = {
  'Ăn uống': '#FF6B6B',
  'Mua sắm': '#FFD93D',
  'Di chuyển': '#6BCB77',
  'Người thân': '#4D96FF',
  'Khác': '#9D9D9D',
};

const ImageExtractScreen = ({ navigation, route }: any) => {
  // ✅ State Management
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
  const [ocrError, setOcrError] = useState<string | null>(null);

  const TEST_USER_ID = 'my-test-user-id-123';
  
  const GEMINI_API_KEY = "AIzaSyCpfAXfGmAvEosiOu5693ZH73NQDVZOGww";

  useEffect(() => {
    const shouldAutoSelect = route?.params?.autoSelect;
    
    if (shouldAutoSelect) {
      setTimeout(() => {
        handleAutoSelectAndOCR();
      }, 500);
      
      navigation.setParams({ autoSelect: undefined });
    }
  }, [route?.params?.autoSelect]);

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
        setOcrError(null);
        
        const asset = result.assets[0];
        const success = await performOCR(asset.uri!, asset.type || 'image/jpeg');
        
        setShowForm(true);
        setIsProcessing(false);

        // Hiển thị thông báo nếu OCR thất bại
        if (!success) {
          Alert.alert(
            'Thông báo',
            'Không thể trích xuất thông tin tự động. Vui lòng nhập thủ công.',
            [{ text: 'OK' }]
          );
        }
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Lỗi', 'Không thể xử lý ảnh');
      setIsProcessing(false);
      navigation.goBack();
    }
  };

  // ✅ Validate dữ liệu từ Gemini
  const validateOCRResponse = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Kiểm tra có ít nhất 1 trường hợp lệ
    const hasTotal = data.total && !isNaN(parseFloat(data.total));
    const hasStore = data.store_name && data.store_name.trim().length > 0;
    const hasDate = data.date && !isNaN(Date.parse(data.date));
    
    return hasTotal || hasStore || hasDate;
  };

  // ✅ Parse số tiền linh hoạt hơn
  const parseAmount = (amountStr: string): string => {
    if (!amountStr) return '';
    
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = amountStr.toString().replace(/[^0-9]/g, '');
    
    // Chuyển thành số và validate
    const parsed = parseInt(numericValue);
    if (isNaN(parsed) || parsed <= 0) return '';
    
    return parsed.toString();
  };

  // ✅ Parse ngày linh hoạt hơn
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return null;
      
      // Không cho phép ngày tương lai
      if (parsed > new Date()) return null;
      
      return parsed;
    } catch {
      return null;
    }
  };

  // ✅ Thực hiện OCR với Gemini AI
  const performOCR = async (imageUri: string, imageType: string): Promise<boolean> => {
    try {
      console.log("🔍 Đang gọi Gemini AI...");
      
      // 1. Đọc file ảnh thành Base64
      const base64Data = await RNFS.readFile(imageUri, 'base64');

      // 2. Khởi tạo Gemini - Thử nhiều model
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Danh sách model để thử (từ mới nhất đến cũ nhất)
      const modelsToTry = [
      
        "gemini-2.0-flash"
      ];

      let model;
      let lastError;

      // Thử từng model cho đến khi thành công
      for (const modelName of modelsToTry) {
        try {
          console.log(`Đang thử model: ${modelName}`);
          model = genAI.getGenerativeModel({ model: modelName });
          
          // Test xem model có hoạt động không
          const testResult = await model.generateContent(["test"]);
          await testResult.response;
          
          console.log(`✅ Model ${modelName} hoạt động!`);
          break;
        } catch (err: any) {
          console.log(`❌ Model ${modelName} thất bại:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!model) {
        throw new Error(`Không thể kết nối với bất kỳ model Gemini nào. Lỗi cuối: ${lastError?.message}`);
      }

      // 3. Tạo Prompt chi tiết hơn
      const prompt = `Bạn là trợ lý trích xuất thông tin hóa đơn. Phân tích ảnh này và trả về JSON:

      {
        "total": "tổng tiền (chỉ số, không có ký tự đặc biệt)",
        "store_name": "tên cửa hàng/địa điểm",
        "date": "ngày giao dịch (format: YYYY-MM-DD)"
      }

      Lưu ý:
      - Nếu không tìm thấy thông tin nào, để giá trị null
      - Total: chỉ lấy số cuối cùng (tổng tiền), bỏ qua thuế và phí
      - Date: ưu tiên ngày trên hóa đơn, không phải ngày hiện tại
      - Store_name: tên ngắn gọn, không cần địa chỉ đầy đủ

      Chỉ trả về JSON, không giải thích thêm.`;
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: imageType,
        },
      };

      // 4. Gửi yêu cầu đến Gemini
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log("📄 Gemini trả về:", text);

      // 5. Parse JSON an toàn
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsedData = JSON.parse(cleanText);

      // 6. Validate dữ liệu
      if (!validateOCRResponse(parsedData)) {
        console.warn("⚠️ OCR response không hợp lệ");
        setOcrError("Không thể đọc thông tin từ hóa đơn");
        return false;
      }

      // 7. Điền dữ liệu vào form
      let hasData = false;

      if (parsedData.total) {
        const parsedAmount = parseAmount(parsedData.total);
        if (parsedAmount) {
          setAmount(parsedAmount);
          hasData = true;
        }
      }

      if (parsedData.store_name && parsedData.store_name.trim()) {
        setNote(parsedData.store_name.trim());
        hasData = true;
      }

      if (parsedData.date) {
        const parsedDate = parseDate(parsedData.date);
        if (parsedDate) {
          setTransactionDate(parsedDate);
          hasData = true;
        }
      }

      console.log("✅ OCR thành công");
      return hasData;

    } catch (error: any) {
      console.error('❌ Lỗi Gemini:', error);
      
      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Không thể xử lý ảnh';
      
      if (error.message?.includes('API key')) {
        errorMessage = 'Lỗi xác thực API';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'Đã vượt quá giới hạn sử dụng';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Lỗi kết nối mạng';
      }
      
      setOcrError(errorMessage);
      return false;
    }
  };

  // ✅ Chọn ảnh thủ công
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
        setOcrError(null);
        
        // OCR từ ảnh đầu tiên
        if (result.assets[0].uri) {
          setLoading(true);
          const success = await performOCR(
            result.assets[0].uri,
            result.assets[0].type || 'image/jpeg'
          );
          setLoading(false);

          if (!success) {
            Alert.alert(
              'Thông báo',
              'Không thể trích xuất thông tin tự động. Vui lòng nhập thủ công.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // ✅ Xóa ảnh
  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    
    if (newImages.length === 0) {
      setShowForm(false);
      setAmount('');
      setNote('');
      setOcrError(null);
    }
  };

  // ✅ Format số tiền
  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + 'đ';
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  // ✅ Xử lý thay đổi ngày
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
  };

  // ✅ Lưu giao dịch
  const handleSaveTransaction = async () => {
    // Validate
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh');
      return;
    }

    setLoading(true);

    try {
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

      const docRef = await firestore()
        .collection('transactions')
        .add(newTransactionData);

      const finalTransactionObject = {
        id: docRef.id,
        ...newTransactionData,
      };

      setLoading(false);

      // Navigate về overview với ngày của giao dịch
      navigation.navigate('MainTabs', {
        screen: 'Tổng quan',
        params: {
          jumpToDate: transactionDate.toISOString(),
        },
      });

      // Navigate đến chi tiết giao dịch
      navigation.replace('TransactionDetail', {
        transaction: finalTransactionObject,
      });

    } catch (error: any) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Lỗi', `Không thể lưu: ${error.message}`);
    }
  };

  // ✅ Màn hình loading khi đang xử lý OCR
  if (isProcessing) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrapper}>
            <ActivityIndicator size="large" color="#FF69B4" />
          </View>
          <Text style={styles.loadingScreenText}>
            Đang trích xuất thông tin
          </Text>
          <Text style={styles.loadingScreenSubtext}>
            Hệ thống đang phân tích ảnh hóa đơn của bạn...
          </Text>
          <View style={styles.loadingBar}>
            <View style={styles.loadingBarFill} />
          </View>
        </View>
      </View>
    );
  }

  // ✅ Màn hình chọn ảnh
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
          <View style={styles.emptyIconWrapper}>
            <Icon name="image-outline" size={64} color="#FF69B4" />
          </View>
          <Text style={styles.emptyTitle}>Chọn ảnh hóa đơn</Text>
          <Text style={styles.emptyText}>
            Hệ thống sẽ tự động trích xuất thông tin từ ảnh hóa đơn, giúp bạn ghi chép giao dịch nhanh chóng
          </Text>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectImages}
          >
            <Icon name="plus" size={22} color="#fff" />
            <Text style={styles.selectButtonText}>Chọn ảnh</Text>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Mẹo:</Text>
            <Text style={styles.helpText}>Chọn ảnh rõ nét của hóa đơn hoặc biên lai để kết quả tốt nhất</Text>
          </View>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tab Chi tiêu / Thu nhập */}
        <View style={styles.tabSwitcherContainer}>
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
                name="arrow-up-bold-circle-outline"
                size={20}
                color={transactionType === 'expense' ? '#fff' : '#FF6B6B'}
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
                transactionType === 'income' && styles.activeTabIncome,
              ]}
              onPress={() => setTransactionType('income')}
            >
              <Icon
                name="arrow-down-bold-circle-outline"
                size={20}
                color={transactionType === 'income' ? '#fff' : '#4CAF50'}
              />
              <Text
                style={[
                  styles.tabText,
                  transactionType === 'income' && styles.activeTabTextIncome,
                ]}
              >
                Thu nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Hình ảnh */}
          <View style={styles.imagesSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionLabel}>
                Hình ảnh
              </Text>
              <Text style={styles.imageCount}>{selectedImages.length}/3</Text>
            </View>
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
                    <Icon name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                  <View style={styles.imageNumberWrapper}>
                    <Text style={styles.imageNumber}>{idx + 1}</Text>
                  </View>
                </View>
              ))}

              {selectedImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleSelectImages}
                  disabled={loading}
                >
                  <Icon name="plus" size={40} color="#FF69B4" />
                  <Text style={styles.addImageText}>Thêm ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF69B4" />
              <Text style={styles.loadingText}>Đang trích xuất thông tin...</Text>
            </View>
          )}

          {/* OCR Error */}
          {ocrError && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={22} color="#FF9800" />
              <Text style={styles.errorText}>{ocrError}</Text>
            </View>
          )}

          {/* Số tiền */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số tiền<Text style={styles.required}>*</Text></Text>
            <View style={styles.amountInputWrapper}>
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
            <Text style={styles.inputLabel}>Danh mục<Text style={styles.required}>*</Text></Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat, index) => {
                const catColor = categoryColors[cat.label] || '#9D9D9D';
                const isSelected = selectedCategory === cat.label;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.selectedCategory,
                      isSelected && { borderColor: catColor }
                    ]}
                    onPress={() => setSelectedCategory(cat.label)}
                    disabled={loading}
                  >
                    <View style={[
                      styles.categoryIconWrapper,
                      { backgroundColor: catColor + '20' }
                    ]}>
                      <Icon
                        name={cat.icon}
                        size={28}
                        color={isSelected ? catColor : '#999'}
                      />
                    </View>
                    <Text style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextActive,
                      isSelected && { color: catColor }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Ngày giao dịch */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày giao dịch<Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-outline" size={20} color="#999" />
              <Text style={styles.inputDropdown}>
                {transactionDate.toLocaleDateString('vi-VN')}
              </Text>
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
            <Text style={styles.inputLabel}>Nguồn tiền<Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <Icon name="wallet-outline" size={20} color="#4CAF50" />
              <Text style={styles.walletText}>{wallet}</Text>
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
          style={[
            styles.saveButton,
            transactionType === 'income' && styles.saveButtonIncome,
            loading && styles.saveButtonDisabled
          ]}
          onPress={handleSaveTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                Lưu giao dịch {transactionType === 'expense' ? 'chi' : 'thu'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingScreenText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingScreenSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FF69B4',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  helpSection: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 100,
    paddingTop: 15,
  },
  tabSwitcherContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
    borderColor: '#FF6B6B',
    backgroundColor: '#fff',
  },
  rightTab: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
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
    color: '#666',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  imagesSection: {
    marginBottom: 24,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  imageCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
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
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  imageNumberWrapper: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF69B4',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  imageNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF69B4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff0f5',
  },
  addImageText: {
    fontSize: 12,
    color: '#FF69B4',
    marginTop: 6,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
    marginBottom: 15,
    backgroundColor: '#f0fff5',
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  amountInputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#FF69B4',
    paddingVertical: 5,
  },
  inputDropdown: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  walletText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryGroup: {
    marginBottom: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  categoryButton: {
    width: (width - 40 - 36) / 4,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#fff',
    borderColor: '#FF69B4',
  },
  categoryText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryTextActive: {
    fontWeight: '700',
  },
  inputNote: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    minHeight: 80,
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonIncome: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  saveButtonDisabled: {
    backgroundColor: '#ffb3d9',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ImageExtractScreen;