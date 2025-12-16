import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './app/context/AuthContext'; 

import AuthStack from './app/navigation/AuthStack'; 
import AppNavigator from './app/navigation/AppNavigator';
import LoadingScreen from './app/screens/LoadingScreen'; 
import { ThemeProvider } from './app/theme/themeContext';

const RootStack = createNativeStackNavigator();

// Component điều hướng cấp cao nhất
const RootNavigator = () => {
  // Lấy trạng thái đăng nhập từ Context
const { isLoggedIn, isAuthLoading } = useContext(AuthContext);

if (isAuthLoading) {
    return <LoadingScreen />; // Hiển thị màn hình Loading
  }

 return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // Đã đăng nhập -> App
        <RootStack.Screen name="MainApp" component={AppNavigator} />
      ) : (
        // Chưa đăng nhập -> Auth
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
};

// Component App chính
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* 2. Bọc bằng NavigationContainer */}
        <NavigationContainer>
          {/* 3. Hiển thị Bộ điều hướng gốc */}
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
    
  );
};

export default App;