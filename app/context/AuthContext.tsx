import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
}

const defaultState: AuthContextType = {
  isLoggedIn: false,
  isAuthLoading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultState);
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setIsLoggedIn(!!user); 
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    });
    return subscriber;
  }, [isAuthLoading]);

  const value = { isLoggedIn, isAuthLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  return useContext(AuthContext);
};