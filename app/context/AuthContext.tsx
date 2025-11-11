import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import auth from '@react-native-firebase/auth'; // 1. Import Auth

// 1. Định nghĩa Type cho giá trị mà Context sẽ cung cấp
interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
}

// 2. Tạo giá trị mặc định (phù hợp với Type ở trên)
// Đây chính là phần code bị thiếu
const defaultState: AuthContextType = {
  isLoggedIn: false,
  isAuthLoading: true,
};

// 3. Sửa lỗi: Truyền defaultState vào createContext
//    Chúng ta cũng truyền <AuthContextType> để TypeScript hiểu
export const AuthContext = createContext<AuthContextType>(defaultState);
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 3. TẠO STATE CHO VIỆC LOADING AUTH
  const [isAuthLoading, setIsAuthLoading] = useState(true); // <-- Bắt đầu bằng true

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setIsLoggedIn(!!user); 
      
      // 4. KHI KIỂM TRA XONG, SET THÀNH FALSE
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    });
    return subscriber;
  }, [isAuthLoading]); // Thêm dependency

  // 5. CUNG CẤP GIÁ TRỊ MỚI
  const value = { isLoggedIn, isAuthLoading }; // <-- Thêm isAuthLoading

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// 5. Tạo hook (để dùng cho tiện)
export const useAuth = () => {
  return useContext(AuthContext);
};