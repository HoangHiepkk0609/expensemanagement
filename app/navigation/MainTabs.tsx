import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CalendarScreen from '../screens/CalendarScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';
import NimoScreen from '../screens/NimoScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ImageInputScreen from '../screens/ImageExtractScreen';
import OverviewScreen from '../screens/OverviewScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import { useTheme } from '../theme/themeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarView" component={CalendarScreen} />
    </Stack.Navigator>
  );
}

function AddTransactionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddTransactionScreen" component={AddTransactionScreen} />
      <Stack.Screen name="ImageInput" component={ImageInputScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          backgroundColor: colors.surface, 
          borderTopColor: colors.border, 
        },
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
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

      <Tab.Screen
        name="AddTransactionTab"
        component={AddTransactionStack}
        options={{
          tabBarLabel: 'Nhập',
          tabBarStyle: { display: 'none' }, 
          tabBarIcon: () => (
            <View style={[
                styles.addButton, 
                { backgroundColor: colors.primary, shadowColor: colors.primary } 
            ]}>
              <Icon name="plus" size={30} color="#fff" />
            </View>
          ),
        }}
      />

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

const styles = StyleSheet.create({
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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