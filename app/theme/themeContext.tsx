// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './Colors';

// Định nghĩa kiểu dữ liệu cho Context
type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof lightColors; // Tự động lấy kiểu dữ liệu từ lightColors
  toggleTheme: () => void;
};

// Tạo Context
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
});

// Tạo Provider để bao bọc App
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // Lấy chế độ mặc định của điện thoại
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load cài đặt từ bộ nhớ khi mở app
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('THEME_MODE');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Nếu chưa cài đặt gì thì theo hệ thống điện thoại
        setIsDarkMode(systemScheme === 'dark');
      }
    };
    loadTheme();
  }, []);

  // Hàm đổi theme
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('THEME_MODE', newMode ? 'dark' : 'light');
  };

  // Chọn bộ màu tương ứng
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook để dùng nhanh trong các màn hình
export const useTheme = () => useContext(ThemeContext);