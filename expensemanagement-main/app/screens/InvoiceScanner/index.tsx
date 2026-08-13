import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import styles from './styles';

type RootStackParamList = {
  AddTransactionModal: {
    invoiceData?: any;
    imageUri?: string;
  };
  [key: string]: any;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InvoiceScannerProps {
  onDataExtracted?: (data: any, imageUri: string) => void;
  onCancel?: () => void;
}

const InvoiceScanner: React.FC<InvoiceScannerProps> = ({
  onDataExtracted,
  onCancel,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [rawText, setRawText] = useState('');

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

  const processImage = async (imageUri: string) => {
    setImage(imageUri);
    setLoading(true);
    setInvoiceData(null);
    setRawText('');

    try {
      const result = await TextRecognition.recognize(imageUri);

      setRawText(result.text);

      const parsed = parseInvoiceData(result.text);
      setInvoiceData(parsed);
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Lỗi', 'Không thể đọc ảnh. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

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

    if (lines.length > 0) {
      data.storeName = lines[0].trim();
    }

    const phoneRegex = /(?:0|\+84)[3|5|7|8|9][0-9]{8}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
    }

    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      data.date = dateMatch[1];
    }

    const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)/i;
    const timeMatch = text.match(timeRegex);
    if (timeMatch) {
      data.time = timeMatch[1];
    }

    const totalRegex =
      /(?:tổng|total|t.ng c.ng|thanh toán|amount)[\s:]*([0-9.,]+)/i;
    const totalMatch = text.match(totalRegex);
    if (totalMatch) {
      data.total = cleanNumber(totalMatch[1]);
    }

    const subtotalRegex = /(?:tiền hàng|subtotal|ti.n hàng)[\s:]*([0-9.,]+)/i;
    const subtotalMatch = text.match(subtotalRegex);
    if (subtotalMatch) {
      data.subtotal = cleanNumber(subtotalMatch[1]);
    }

    const taxRegex = /(?:thuế|tax|vat)[\s:]*([0-9.,]+)/i;
    const taxMatch = text.match(taxRegex);
    if (taxMatch) {
      data.tax = cleanNumber(taxMatch[1]);
    }

    const paymentRegex = /(?:tiền mặt|cash|chuyển khoản|transfer|card|thẻ)/i;
    const paymentMatch = text.match(paymentRegex);
    if (paymentMatch) {
      data.paymentMethod = paymentMatch[0];
    }

    const addressRegex = /(?:địa chỉ|address|đ\/c)[\s:]*([^\n]+)/i;
    const addressMatch = text.match(addressRegex);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

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

  const cleanNumber = (numStr: string): string => {
    return numStr.replace(/[.,\s]/g, '');
  };

  const formatCurrency = (amount: string | number): string => {
    if (!amount) return '';
    const num = typeof amount === 'string' ? parseInt(amount) : amount;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  const handleUseData = () => {
    if (!invoiceData) {
      Alert.alert('Lỗi', 'Chưa có dữ liệu để sử dụng');
      return;
    }

    if (onDataExtracted) {
      onDataExtracted(invoiceData, image || '');
    } else if (navigation.canGoBack()) {
      navigation.navigate('AddTransactionModal', {
        invoiceData: invoiceData,
        imageUri: image || undefined,
      });
    } else {
      Alert.alert('Thông báo', 'Dữ liệu đã sẵn sàng!');
    }
  };

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

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImageFromLibrary}>
          <Text style={styles.buttonText}>🖼️ Chọn ảnh hóa đơn</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang nhận dạng...</Text>
        </View>
      )}

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

          {invoiceData?.items && invoiceData.items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🛒 Danh sách món</Text>
              {invoiceData.items.map((item: any, index: any) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetail}>
                    {item.quantity} x {formatCurrency(item.price)}
                  </Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.divider} />

          {invoiceData?.subtotal && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tiền hàng:</Text>
              <Text style={styles.value}>
                {formatCurrency(invoiceData.subtotal)}
              </Text>
            </View>
          )}

          {invoiceData?.tax && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Thuế:</Text>
              <Text style={styles.value}>
                {formatCurrency(invoiceData.tax)}
              </Text>
            </View>
          )}

          {invoiceData?.total && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData.total)}
              </Text>
            </View>
          )}

          {invoiceData?.paymentMethod && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Thanh toán:</Text>
              <Text style={styles.value}>{invoiceData.paymentMethod}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.rawTextButton}
            onPress={() => Alert.alert('Text gốc', rawText)}
          >
            <Text style={styles.rawTextButtonText}>Xem text gốc</Text>
          </TouchableOpacity>

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



export default InvoiceScanner;