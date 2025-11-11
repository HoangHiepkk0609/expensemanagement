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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AddTransactionScreen" 
        component={AddTransactionScreen}
      />
      <Stack.Screen 
        name="ImageInput" 
        component={ImageInputScreen}
      />
    </Stack.Navigator>
  );
}

// Component chứa bộ Tab chính
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
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

      {/* Tab Ghi chép GD (nút giữa) */}
      <Tab.Screen
        name="AddTransactionTab"
        component={AddTransactionStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.addButton}>
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

// --- Styles cho Tab ---
const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    shadowColor: '#FF69B4',
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