import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Type cho navigation
type RootStackParamList = {
  AddTransactionModal: {
    invoiceData?: any;
    imageUri?: string;
  };
  [key: string]: any;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Props interface
interface InvoiceScannerProps {
  onDataExtracted?: (data: any, imageUri: string) => void;
  onCancel?: () => void;
}

const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ onDataExtracted, onCancel }) => {
  const navigation = useNavigation<NavigationProp>();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [rawText, setRawText] = useState('');

  // Chọn ảnh từ thư viện
  const pickImageFromLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
        return;
      }

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // Xử lý ảnh với ML Kit
  const processImage = async (imageUri: string) => {
    setImage(imageUri);
    setLoading(true);
    setInvoiceData(null);
    setRawText('');

    try {
      // Nhận dạng text từ ảnh
      const result = await TextRecognition.recognize(imageUri);
      
      setRawText(result.text);
      
      // Parse thông tin hóa đơn
      const parsed = parseInvoiceData(result.text);
      setInvoiceData(parsed);
      
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Lỗi', 'Không thể đọc ảnh. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Phân tích text để lấy thông tin hóa đơn
  const parseInvoiceData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    const items: any[] = [];
    
    const data = {
      storeName: '',
      address: '',
      phone: '',
      date: '',
      time: '',
      items: items,
      subtotal: '',
      tax: '',
      total: '',
      paymentMethod: '',
    };

    // Lấy tên cửa hàng (thường ở dòng đầu tiên)
    if (lines.length > 0) {
      data.storeName = lines[0].trim();
    }

    // Tìm số điện thoại
    const phoneRegex = /(?:0|\+84)[3|5|7|8|9][0-9]{8}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
    }

    // Tìm ngày tháng
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      data.date = dateMatch[1];
    }

    // Tìm giờ
    const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)/i;
    const timeMatch = text.match(timeRegex);
    if (timeMatch) {
      data.time = timeMatch[1];
    }

    // Tìm tổng tiền
    const totalRegex = /(?:tổng|total|t.ng c.ng|thanh toán|amount)[\s:]*([0-9.,]+)/i;
    const totalMatch = text.match(totalRegex);
    if (totalMatch) {
      data.total = cleanNumber(totalMatch[1]);
    }

    // Tìm tiền hàng
    const subtotalRegex = /(?:tiền hàng|subtotal|ti.n hàng)[\s:]*([0-9.,]+)/i;
    const subtotalMatch = text.match(subtotalRegex);
    if (subtotalMatch) {
      data.subtotal = cleanNumber(subtotalMatch[1]);
    }

    // Tìm thuế/VAT
    const taxRegex = /(?:thuế|tax|vat)[\s:]*([0-9.,]+)/i;
    const taxMatch = text.match(taxRegex);
    if (taxMatch) {
      data.tax = cleanNumber(taxMatch[1]);
    }

    // Tìm phương thức thanh toán
    const paymentRegex = /(?:tiền mặt|cash|chuyển khoản|transfer|card|thẻ)/i;
    const paymentMatch = text.match(paymentRegex);
    if (paymentMatch) {
      data.paymentMethod = paymentMatch[0];
    }

    // Tìm địa chỉ
    const addressRegex = /(?:địa chỉ|address|đ\/c)[\s:]*([^\n]+)/i;
    const addressMatch = text.match(addressRegex);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Tìm các món hàng
    const itemRegex = /^(.+?)\s+(\d+)\s*x?\s*([0-9.,]+)/gm;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(text)) !== null) {
      items.push({
        name: itemMatch[1].trim(),
        quantity: itemMatch[2],
        price: cleanNumber(itemMatch[3]),
      });
    }

    return data;
  };

  // Làm sạch số
  const cleanNumber = (numStr: string): string => {
    return numStr.replace(/[.,\s]/g, '');
  };

  // Format số tiền
  const formatCurrency = (amount: string | number): string => {
    if (!amount) return '';
    const num = typeof amount === 'string' ? parseInt(amount) : amount;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  // Xử lý sử dụng dữ liệu
  const handleUseData = () => {
    if (!invoiceData) {
      Alert.alert('Lỗi', 'Chưa có dữ liệu để sử dụng');
      return;
    }

    if (onDataExtracted) {
      // Nếu được gọi từ Modal/Component
      onDataExtracted(invoiceData, image || '');
    } else if (navigation.canGoBack()) {
      // Nếu được gọi từ Navigation
      navigation.navigate('AddTransactionModal', {
        invoiceData: invoiceData,
        imageUri: image || undefined,
      });
    } else {
      Alert.alert('Thông báo', 'Dữ liệu đã sẵn sàng!');
      console.log('Invoice data:', invoiceData);
    }
  };

  // Hủy và quay lại
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quét Hóa Đơn</Text>
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickImageFromLibrary}
        >
          <Text style={styles.buttonText}>🖼️ Chọn ảnh hóa đơn</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang nhận dạng...</Text>
        </View>
      )}

      {/* Results */}
      {invoiceData && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>📋 Thông tin hóa đơn</Text>

          {invoiceData?.storeName && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cửa hàng:</Text>
              <Text style={styles.value}>{invoiceData.storeName}</Text>
            </View>
          )}

          {invoiceData?.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Địa chỉ:</Text>
              <Text style={styles.value}>{invoiceData.address}</Text>
            </View>
          )}

          {invoiceData?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Số ĐT:</Text>
              <Text style={styles.value}>{invoiceData.phone}</Text>
            </View>
          )}

          {invoiceData?.date && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày:</Text>
              <Text style={styles.value}>{invoiceData.date}</Text>
            </View>
          )}

          {invoiceData?.time && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Giờ:</Text>
              <Text style={styles.value}>{invoiceData.time}</Text>
            </View>
          )}

          {/* Items */}
          {invoiceData?.items && invoiceData.items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🛒 Danh sách món</Text>
              {invoiceData.items.map((item : any, index : any) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetail}>
                    {item.quantity} x {formatCurrency(item.price)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Totals */}
          <View style={styles.divider} />

          {invoiceData?.subtotal && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tiền hàng:</Text>
              <Text style={styles.value}>{formatCurrency(invoiceData.subtotal)}</Text>
            </View>
          )}

          {invoiceData?.tax && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Thuế:</Text>
              <Text style={styles.value}>{formatCurrency(invoiceData.tax)}</Text>
            </View>
          )}

          {invoiceData?.total && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoiceData.total)}</Text>
            </View>
          )}

          {invoiceData?.paymentMethod && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Thanh toán:</Text>
              <Text style={styles.value}>{invoiceData.paymentMethod}</Text>
            </View>
          )}

          {/* Raw Text */}
          <TouchableOpacity 
            style={styles.rawTextButton}
            onPress={() => Alert.alert('Text gốc', rawText)}
          >
            <Text style={styles.rawTextButtonText}>Xem text gốc</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.actionButtonText}>❌ Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.useButton]}
              onPress={handleUseData}
            >
              <Text style={styles.actionButtonText}>✅ Sử dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  divider: {
    height: 2,
    backgroundColor: '#007AFF',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rawTextButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  rawTextButtonText: {
    color: '#666',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  useButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoiceScanner;