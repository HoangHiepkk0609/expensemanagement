import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import MainTabs from './MainTabs';

import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import IncomeExpenseTrend from '../screens/IncomeExpenseTrend';
import PeriodicExpenseReport from '../screens/PeriodicExpenseReport';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import TransactionEditScreen from '../screens/TransactionEditScreen';

import EditProfileScreen from '../screens/EditProfileScreen';
import CreateFamilyScreen from '../screens/family/CreateFamilyScreen';
import FamilyDashboardScreen from '../screens/family/FamilyDashboardScreen';
import FamilySetupScreen from '../screens/family/FamilySetupScreen';
import JoinFamilyScreen from '../screens/family/JoinFamilyScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ImageExtractScreen from '../screens/ImageExtractScreen';
import InvoiceScanner from '../screens/InvoiceScanner';
import OccupationScreen from '../screens/OccupationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SuggestionScreen from '../screens/SuggestionScreen';

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

  Profile: undefined;

  EditProfile: undefined;

  Settings: undefined;

  FamilyDashboard: undefined;

  FamilySetup: undefined;

  CreateFamily: undefined;

  JoinFamily: undefined;

  Goals: undefined;

  OccupationScreen: undefined;

  SuggestionScreen: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (user) {
        try {
          const key = `@onboarding_${user.uid}`;
          const value = await AsyncStorage.getItem(key);
          setIsFirstLaunch(value !== 'true');
        } catch (error) {
          console.log('Lỗi AsyncStorage:', error);
          setIsFirstLaunch(true);
        }
      } else {
        setIsFirstLaunch(null);
      }
    });

    return unsubscribe;
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }
  return (
    <RootStack.Navigator
      initialRouteName={isFirstLaunch ? 'OccupationScreen' : 'MainTabs'}
    >
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
          headerShown: false,
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

      <RootStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="FamilyDashboard"
        component={FamilyDashboardScreen}
        options={{
          title: 'Nhóm gia đình',
          headerShown: false,
        }}
      />

      <RootStack.Screen
        name="FamilySetup"
        component={FamilySetupScreen}
        options={{
          title: 'Tham gia nhóm gia đình',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="CreateFamily"
        component={CreateFamilyScreen}
        options={{
          title: 'Tạo nhóm gia đình mới',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="JoinFamily"
        component={JoinFamilyScreen}
        options={{
          title: 'Tham gia bằng mã mời',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: 'Góp tiền',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="OccupationScreen"
        component={OccupationScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="SuggestionScreen"
        component={SuggestionScreen}
        options={{
          title: 'Gợi ý mục tiêu',
          headerShown: true,
        }}
      />
    </RootStack.Navigator>
  );
}
