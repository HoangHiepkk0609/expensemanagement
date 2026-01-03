import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './app/context/AuthContext'; 

import AuthStack from './app/navigation/AuthStack'; 
import AppNavigator from './app/navigation/AppNavigator';
import LoadingScreen from './app/screens/LoadingScreen'; 
import { ThemeProvider } from './app/theme/themeContext';

const RootStack = createNativeStackNavigator();

const RootNavigator = () => {
const { isLoggedIn, isAuthLoading } = useContext(AuthContext);

if (isAuthLoading) {
    return <LoadingScreen />;
    

  }

 return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <RootStack.Screen name="MainApp" component={AppNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
    
  );
};

export default App;