import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import các màn hình dùng trong Tab
import CalendarScreen from '../screens/CalendarScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';
import NimoScreen from '../screens/NimoScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ImageInputScreen from '../screens/ImageExtractScreen';
import OverviewScreen from '../screens/OverviewScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';

// 1. Import Hook Theme
import { useTheme } from '../theme/themeContext'; // Đảm bảo đúng đường dẫn file ThemeContext

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ... (Giữ nguyên các hàm HomeStack, CalendarStack, AddTransactionStack) ...
// Stack cho tab Tổng quan
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Overview" component={OverviewScreen} />
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết danh mục' }}
      />
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết giao dịch' }}
      />
    </Stack.Navigator>
  );
}

// Stack cho tab Lịch
function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarView" component={CalendarScreen} />
    </Stack.Navigator>
  );
}

// Stack cho tab Ghi chép GD (AddTransaction + ImageInput)
function AddTransactionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddTransactionScreen" component={AddTransactionScreen} />
      <Stack.Screen name="ImageInput" component={ImageInputScreen} />
    </Stack.Navigator>
  );
}

// --- Component MainTabs (ĐÃ SỬA) ---
function MainTabs() {
  // 2. Lấy bộ màu từ Theme
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // 3. Cập nhật Style động theo màu Theme
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          backgroundColor: colors.surface, // ✅ Nền Tab đổi màu (Trắng/Đen xám)
          borderTopColor: colors.border,   // ✅ Viền trên đổi màu
        },
        tabBarActiveTintColor: colors.primary, // ✅ Màu icon khi chọn (Hồng)
        tabBarInactiveTintColor: colors.textSecondary, // ✅ Màu icon khi chưa chọn
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      {/* Tab Tổng quan */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab Lịch */}
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{
          tabBarLabel: 'Lịch',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />

      {/* Tab Nhập (Nút giữa nổi lên) */}
      <Tab.Screen
        name="AddTransactionTab"
        component={AddTransactionStack}
        options={{
          tabBarLabel: 'Nhập',
          tabBarStyle: { display: 'none' }, // Ẩn tab bar khi vào màn hình nhập
          tabBarIcon: () => (
            <View style={[
                styles.addButton, 
                // ✅ Đổi màu nút giữa (nếu muốn nó tối đi khi Dark mode, hoặc giữ nguyên màu hồng)
                { backgroundColor: colors.primary, shadowColor: colors.primary } 
            ]}>
              <Icon name="plus" size={30} color="#fff" />
            </View>
          ),
        }}
      />

      {/* Tab Nimo */}
      <Tab.Screen
        name="Nimo"
        component={NimoScreen}
        options={{
          tabBarLabel: 'Nimo',
          tabBarIcon: ({ color, size }) => (
            <Icon name="emoticon-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab Tiện ích */}
      <Tab.Screen
        name="Utilities"
        component={UtilitiesScreen}
        options={{
          tabBarLabel: 'Tiện ích',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dots-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- Styles tĩnh (Chỉ giữ lại những cái không đổi màu) ---
const styles = StyleSheet.create({
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // backgroundColor và shadowColor đã chuyển vào inline style ở trên để dùng Theme
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default MainTabs;