import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs from './MainTabs';

import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionEditScreen from '../screens/TransactionEditScreen';
import PeriodicExpenseReport from '../screens/PeriodicExpenseReport';
import IncomeExpenseTrend from '../screens/IncomeExpenseTrend';
import BudgetScreen from '../screens/BudgetScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';

import ImageExtractScreen from '../screens/ImageExtractScreen';
import InvoiceScanner from '../screens/InvoiceScanner';

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
  
  ImageExtract: {
    autoSelect?: boolean;
    invoiceData?: any;
  };
  InvoiceScanner: undefined;

  PeriodicExpenseReport: undefined;

  IncomeExpenseTrend: undefined;

  BudgetScreen: undefined;

  CategoryManagementScreen: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
      <RootStack.Navigator>
        
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />

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

        <RootStack.Screen
          name="ImageExtract"
          component={ImageExtractScreen}
          options={{
            title: 'Nhập bằng ảnh',
            headerShown: false,
          }}
        />

        <RootStack.Screen
          name="InvoiceScanner"
          component={InvoiceScanner}
          options={{
            title: 'Quét hóa đơn',
            headerShown: true,
            presentation: 'modal',
          }}
        />

        <RootStack.Screen
          name="PeriodicExpenseReport"
          component={PeriodicExpenseReport}
          options={{
            title: 'Báo cáo chi tiêu định kỳ',
            headerShown: true,
          }}
        />

        <RootStack.Screen
          name="IncomeExpenseTrend"
          component={IncomeExpenseTrend}
          options={{
            title: 'Biến động thu chi',
            headerShown: false,
          }}
        />

        <RootStack.Screen
          name="BudgetScreen"
          component={BudgetScreen}
          options={{
            title: 'Ngân sách chi tiêu',
            headerShown: false,
          }}
        />

        <RootStack.Screen
          name="CategoryManagementScreen"
          component={CategoryManagementScreen}
          options={{
            title: 'Quản lý danh mục',
            headerShown: false,
          }}
        />

      </RootStack.Navigator>
  );
}