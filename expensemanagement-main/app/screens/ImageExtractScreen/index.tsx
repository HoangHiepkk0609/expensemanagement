import { GoogleGenerativeAI } from '@google/generative-ai';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useCallback ,useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useCategories } from '../../hook/useCategories';
import styles from './styles';

  const validateOCRResponse = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;

    const hasTotal = data.total && !isNaN(parseFloat(data.total));
    const hasStore = data.store_name && data.store_name.trim().length > 0;
    const hasDate = data.date && !isNaN(Date.parse(data.date));

    return hasTotal || hasStore || hasDate;
  };

  const parseAmount = (amountStr: string): string => {
    if (!amountStr) return '';

    const numericValue = amountStr.toString().replace(/[^0-9]/g, '');

    const parsed = parseInt(numericValue, 10);
    if (isNaN(parsed) || parsed <= 0) return '';

    return parsed.toString();
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return null;

      if (parsed > new Date()) return null;

      return parsed;
    } catch {
      return null;
    }
  };


const ImageExtractScreen = ({ navigation, route }: any) => {
  const { images, aiData } = route.params || {};
  const { categories } = useCategories();
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedImages, setSelectedImages] = useState<any[]>(images || []);
  const [selectedCategory, setSelectedCategory] = useState('Khác');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [wallet] = useState('Ngoài MoMo');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const userId = auth().currentUser?.uid;

  const categoriesToShow = useMemo(() => {
    return categories.filter(cat =>
      transactionType === 'income'
        ? cat.type === 'income'
        : cat.type === 'expense' || !cat.type,
    );
  }, [categories, transactionType]);

  useEffect(() => {
    if (aiData && categoriesToShow.length > 0) {
      setAmount(aiData.amount ? String(aiData.amount) : '');
      if (aiData.type) setTransactionType(aiData.type);
      if (aiData.note) setNote(aiData.note);

      if (aiData.date) {
        setTransactionDate(new Date(aiData.date));
      }

      if (aiData.category) {
        const matched = categoriesToShow.find(
          (c: any) =>
            c.id === aiData.category ||
            c.label.toLowerCase() === aiData.category.toLowerCase(),
        );
        setSelectedCategory(matched ? matched.label : 'Khác');
      }
    }
  }, [aiData, categoriesToShow, images]);


    const  performOCR = useCallback(async (
    imageUri: string,
    imageType: string,
  ): Promise<boolean> => {
    try {
      console.log('🔍 Đang gọi Gemini AI...');

      const base64Data = await RNFS.readFile(imageUri, 'base64');

      const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

      const modelsToTry = ['gemini-2.5-flash'];

      let model;
      let lastError;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Đang thử model: ${modelName}`);
          model = genAI.getGenerativeModel({ model: modelName });

          const testResult = await model.generateContent(['test']);
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
        throw new Error(
          `Không thể kết nối với bất kỳ model Gemini nào. Lỗi cuối: ${lastError?.message}`,
        );
      }

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

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Gemini trả về:', text);

      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanText);

      if (!validateOCRResponse(parsedData)) {
        console.warn('⚠️ OCR response không hợp lệ');
        setOcrError('Không thể đọc thông tin từ hóa đơn');
        return false;
      }

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

      console.log('✅ OCR thành công');
      return hasData;
    } catch (error: any) {
      console.error('❌ Lỗi Gemini:', error);

      let errorMessage = 'Không thể xử lý ảnh';

      if (error.message?.includes('API key')) {
        errorMessage = 'Lỗi xác thực API';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'Đã vượt quá giới hạn sử dụng';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('fetch')
      ) {
        errorMessage = 'Lỗi kết nối mạng';
      }

      setOcrError(errorMessage);
      return false;
    }
  }, []);

  const handleAutoSelectAndOCR = useCallback(async () => {
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
        const success = await performOCR(
          asset.uri!,
          asset.type || 'image/jpeg',
        );

        setIsProcessing(false);

        if (!success) {
          Alert.alert(
            'Thông báo',
            'Không thể trích xuất thông tin tự động. Vui lòng nhập thủ công.',
            [{ text: 'OK' }],
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
  }, [navigation,performOCR]);




  useEffect(() => {
    const shouldAutoSelect = route?.params?.autoSelect;
    if (!shouldAutoSelect) {
      return;
    }

    const timer = setTimeout(() => {
      handleAutoSelectAndOCR();
    }, 500);

    navigation.setParams({ autoSelect: undefined });

    return () => clearTimeout(timer);
  }, [navigation, route?.params?.autoSelect, handleAutoSelectAndOCR]);

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);

    if (newImages.length === 0) {
      setAmount('');
      setNote('');
      setOcrError(null);
    }
  };

  const formatAmount = (text: any) => {
    if (!text) return '';
    const safeText = String(text);

    return safeText.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

  const handleSaveTransaction = async () => {
    if (!amount || parseInt(amount, 10) <= 0) {
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
        userId: userId,
        type: transactionType,
        amount: parseInt(amount, 10),
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

      navigation.navigate('MainTabs', {
        screen: 'Tổng quan',
        params: {
          jumpToDate: transactionDate.toISOString(),
        },
      });

      navigation.replace('TransactionDetail', {
        transaction: finalTransactionObject,
      });
    } catch (error: any) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Lỗi', `Không thể lưu: ${error.message}`);
    }
  };

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

  if (!userId) {
    return <Text>Vui lòng đăng nhập</Text>;
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Xác nhận giao dịch"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.formSection}>
          <View style={styles.imagesSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionLabel}>Hình ảnh</Text>
              <Text style={styles.imageCount}>{selectedImages.length}/3</Text>
            </View>
            <View style={styles.imagesList}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentImageUrl(img.uri);
                      setImageModalVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.imageThumbnail}
                    />
                  </TouchableOpacity>

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
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF69B4" />
              <Text style={styles.loadingText}>
                Đang trích xuất thông tin...
              </Text>
            </View>
          )}

          {ocrError && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={22} color="#FF9800" />
              <Text style={styles.errorText}>{ocrError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Số tiền<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.input}
                value={amount ? `${formatAmount(amount)}đ` : ''}
                onChangeText={handleAmountChange}
                placeholder="0đ"
                placeholderTextColor="#999"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.categoryGroup}>
            <Text style={styles.inputLabel}>
              Danh mục<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryContainer}>
              {categoriesToShow.map(cat => {
                const catColor = cat.color || '#9D9D9D';
                const isSelected = selectedCategory === cat.label;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.selectedCategory,
                      isSelected && { borderColor: catColor },
                    ]}
                    onPress={() => setSelectedCategory(cat.label)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.categoryIconWrapper,
                        { backgroundColor: catColor + '20' },
                      ]}
                    >
                      <Icon
                        name={cat.icon}
                        size={28}
                        color={isSelected ? catColor : '#999'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                        isSelected && { color: catColor },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Ngày giao dịch<Text style={styles.required}>*</Text>
            </Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nguồn tiền<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="wallet-outline" size={20} color="#4CAF50" />
              <Text style={styles.walletText}>{wallet}</Text>
            </View>
          </View>

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

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            transactionType === 'income' && styles.saveButtonIncome,
            loading && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon
                name="check"
                size={20}
                color="#fff"
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>
                Lưu giao dịch {transactionType === 'expense' ? 'chi' : 'thu'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Icon name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.imageModalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

export default ImageExtractScreen;