import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useContext } from 'react';
import { AuthContext, AuthProvider } from './app/context/AuthContext';

import { BudgetProvider } from './app/context/BudgetContext';
import AppNavigator from './app/navigation/AppNavigator';
import AuthStack from './app/navigation/AuthStack';
import LoadingScreen from './app/screens/LoadingScreen';
import { ThemeProvider } from './app/theme/themeContext';

const RootStack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoggedIn, isAuthLoading } = useContext(AuthContext);

  if (isAuthLoading) return <LoadingScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <RootStack.Screen name="Auth" component={AuthStack} />
      ) : (
        <RootStack.Screen name="MainApp" component={AppNavigator} />
      )}
    </RootStack.Navigator>
  );
};
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BudgetProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </BudgetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;