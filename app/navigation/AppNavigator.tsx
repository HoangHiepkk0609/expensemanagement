import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Bộ Tab
import MainTabs from './MainTabs';

// Import các màn hình "ngoài Tab"
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionEditScreen from '../screens/TransactionEditScreen';

// ✅ IMPORT CẢ HAI MÀN HÌNH
import ImageExtractScreen from '../screens/ImageExtractScreen';
import InvoiceScanner from '../screens/InvoiceScanner';

// --- CẬP NHẬT TYPE LIST ---
export type RootStackParamList = {
  MainTabs: undefined;
  CategoryDetail: undefined;
  TransactionDetail: { transaction: any };
  AddTransactionModal: { 
    invoiceData?: any;
    imageUri?: string;
  };
  TransactionEdit: { 
    transaction: any;
    onSave?: (updatedTransaction: any) => void;
  };
  
  // ✅ THÊM TYPE CHO CẢ 2 MÀN HÌNH
  ImageExtract: {
    autoSelect?: boolean;
    invoiceData?: any;
  };
  InvoiceScanner: undefined;
};

// Tạo Root Stack
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Component Navigator chính
export default function AppNavigator() {
  return (
      <RootStack.Navigator>
        
        {/* Màn hình chính */}
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Các màn hình phụ */}
        <RootStack.Screen
          name="CategoryDetail"
          component={CategoryDetailScreen}
          options={{ title: 'Chi tiết danh mục', headerShown: true }} 
        />

        <RootStack.Screen
          name="TransactionDetail"
          component={TransactionDetailScreen}
          options={{ title: 'Chi tiết giao dịch', headerShown: true }}
        />

        <RootStack.Screen
          name="AddTransactionModal"
          component={AddTransactionScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />

        <RootStack.Screen
          name="TransactionEdit"
          component={TransactionEditScreen}
          options={{
            title: 'Chỉnh sửa giao dịch',
            headerShown: true,
          }}
        />

        {/* ✅ MÀN HÌNH NHẬP BẰNG ẢNH - OCR NHIỀU ẢNH */}
        <RootStack.Screen
          name="ImageExtract"
          component={ImageExtractScreen}
          options={{
            title: 'Nhập bằng ảnh',
            headerShown: false,
          }}
        />

        {/* ✅ MÀN HÌNH QUÉT HÓA ĐƠN - OCR 1 ẢNH */}
        <RootStack.Screen
          name="InvoiceScanner"
          component={InvoiceScanner}
          options={{
            title: 'Quét hóa đơn',
            headerShown: true,
            presentation: 'modal',
          }}
        />

      </RootStack.Navigator>
  );
}