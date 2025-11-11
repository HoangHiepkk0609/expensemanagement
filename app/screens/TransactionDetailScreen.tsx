import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrency } from '../utils/formatCurrency'; 

import firestore from '@react-native-firebase/firestore';

// --- SỬA 1: Định nghĩa type Transaction đầy đủ ---
// (Dựa trên các trường bạn đang dùng bên dưới)
type Transaction = {
  id: string | number;
  amount: number;
  date: string | Date;
  wallet: string;
  category: string;
  note?: string; // Ghi chú có thể có hoặc không
};

// --- SỬA 2: Cập nhật RootStackParamList ---
type RootStackParamList = {
  CategoryDetail: { 
    category: string; 
  };
  TransactionDetail: { 
    transaction: Transaction;  
  };
  // Thêm màn hình Edit vào đây
  TransactionEdit: {
    transaction: Transaction;
  };
};

const formatTransactionDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Date(date).toLocaleDateString('vi-VN', options);
};

// --- Component InfoRow (để tái sử dụng) ---
const InfoRow = ({ label, value, icon, valueColor }: any) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        {icon && <Text style={styles.valueIcon}>{icon}</Text>}
        <Text style={[styles.value, valueColor && { color: valueColor }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};


// --- Màn hình chính ---
const TransactionDetailScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetail'>>();
  
  // --- SỬA 3: Bỏ ": any" và dùng type Transaction đã định nghĩa ---
  const { transaction } = route.params;

  // Giả sử transaction có các trường: amount, date, wallet, category, note
  const { amount, date, wallet, category, note } = transaction;

  const handleDeletePress = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá giao dịch này không?",
      [
        { text: "Huỷ", style: "cancel" },
        { 
          text: "Xoá", 
          onPress: async () => {
            try {
              await firestore()
                .collection('transactions')
                .doc(transaction.id.toString()) 
                .delete();
              
              navigation.goBack();

            } catch (error) {
              console.error("Lỗi khi xoá giao dịch: ", error);
              Alert.alert("Lỗi", "Không thể xoá giao dịch. Vui lòng thử lại.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // --- SỬA 4: Thêm hàm xử lý cho nút Chỉnh sửa ---
  const handleEditPress = () => {
    // Điều hướng đến màn hình Edit và truyền 'transaction' đi
    navigation.navigate('TransactionEdit', { transaction: transaction });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.mainIcon}>💰</Text> 
          </View>
          
          <Text style={styles.typeText}>Chi tiêu</Text>
          <Text style={styles.amountText}>
            -{formatCurrency(amount)}
          </Text>

          <View style={styles.divider} />
          
          <InfoRow 
            label="Nguồn tiền"
            value={wallet || 'Ngoài MoMo'}
            icon="💳"
          />
          <InfoRow 
            label="Thời gian"
            value={formatTransactionDate(date)}
          />
          <InfoRow 
            label="Danh mục"
            value={category || 'Di chuyển'}
            icon="🚗"
          />
          
          {note && (
             <InfoRow 
              label="Ghi chú"
              value={note}
            />
          )}
        </View>

       <View style={styles.footer}>
         <TouchableOpacity style={styles.button} onPress={handleDeletePress}>
           <Text style={styles.deleteText}>Xoá</Text>
         </TouchableOpacity>
         
         {/* --- SỬA 5: Gán hàm handleEditPress vào onPress --- */}
         <TouchableOpacity style={styles.button} onPress={handleEditPress}>
           <Text style={styles.editText}>Chỉnh sửa</Text>
         </TouchableOpacity>
       </View>
      </ScrollView>
    </View>
  );
};

export default TransactionDetailScreen;

// --- Styles (Giữ nguyên) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  headerBackground: {
    backgroundColor: '#f3f0fd',
    height: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainIcon: {
    fontSize: 28,
  },
  typeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    color: '#888',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  valueIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  deleteText: {
    color: 'red',
    fontSize: 16,
  },
  editText: {
    color: 'blue',
    fontSize: 16,
  }
});