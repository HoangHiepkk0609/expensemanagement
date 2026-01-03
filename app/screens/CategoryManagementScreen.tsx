import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

const { height } = Dimensions.get('window');

const DEFAULT_EXPENSE = [
  { label: 'Ăn uống', icon: 'silverware-fork-knife', color: '#FF6B6B' },
  { label: 'Mua sắm', icon: 'cart-outline', color: '#FFD93D' },
  { label: 'Di chuyển', icon: 'car', color: '#6BCB77' },
  { label: 'Người thân', icon: 'human-handsup', color: '#4D96FF' },
  { label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const DEFAULT_INCOME = [
  { label: 'Lương', icon: 'cash-marker', color: '#4CAF50' },
  { label: 'Thưởng', icon: 'wallet-giftcard', color: '#FFC107' },
  { label: 'Kinh doanh', icon: 'chart-line', color: '#2196F3' },
  { label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];

const ICON_PICKER = [
  'star', 'heart', 'gamepad-variant', 'book-open-variant', 
  'medical-bag', 'paw', 'tshirt-crew', 'glass-cocktail', 
  'basketball', 'airplane', 'gift', 'headphones',
  'baby-carriage', 'school', 'hammer-wrench', 'fuel'
];

const COLOR_PICKER = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', 
  '#9D9D9D', '#FF9F43', '#A3CB38', '#D980FA'
];

const CategoryManagementScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_PICKER[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PICKER[0]);

  const userId = auth().currentUser?.uid;
  if (!userId) {
    return <Text>Vui lòng đăng nhập</Text>; 
  } 

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('user_categories')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const list: any[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data(), isCustom: true });
        });
        setCustomCategories(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên danh mục');
      return;
    }

    try {
      await firestore().collection('user_categories').add({
        userId: userId,
        label: newCatName,
        icon: selectedIcon,
        color: selectedColor,
        type: activeTab, 
        createdAt: new Date().toISOString(),
      });

      setModalVisible(false);
      setNewCatName('');
      setSelectedIcon(ICON_PICKER[0]);
      Alert.alert('Thành công', 'Đã thêm danh mục mới');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể thêm danh mục');
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Xóa danh mục',
      `Bạn có chắc muốn xóa "${name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            await firestore().collection('user_categories').doc(id).delete();
          }
        }
      ]
    );
  };

  const getDisplayList = () => {
    const defaults = activeTab === 'expense' ? DEFAULT_EXPENSE : DEFAULT_INCOME;
    const customs = customCategories.filter(c => c.type === activeTab || (!c.type && activeTab === 'expense'));
    return [...defaults, ...customs];
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: (item.color || '#999') + '20' }]}>
          <Icon name={item.icon} size={24} color={item.color || '#999'} />
        </View>
        <Text style={styles.itemText}>{item.label}</Text>
      </View>
      
      {item.isCustom && (
        <TouchableOpacity onPress={() => handleDeleteCategory(item.id, item.label)} style={styles.deleteBtn}>
          <Icon name="trash-can-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý danh mục</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expense' && styles.activeTabExpense]} 
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Chi tiêu</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'income' && styles.activeTabIncome]} 
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Thu nhập</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={getDisplayList()}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo danh mục {activeTab === 'expense' ? 'chi' : 'thu'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                
                <Text style={styles.label}>Tên danh mục</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ví dụ: Trà sữa, Tiền nhà..." 
                  value={newCatName}
                  onChangeText={setNewCatName}
                />

                <Text style={styles.label}>Chọn biểu tượng</Text>
                <View style={styles.gridContainer}>
                  {ICON_PICKER.map((icon, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.iconOption, selectedIcon === icon && styles.selectedOption]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Icon name={icon} size={24} color={selectedIcon === icon ? '#fff' : '#666'} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Chọn màu sắc</Text>
                <View style={styles.gridContainer}>
                  {COLOR_PICKER.map((color, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.selectedColorOption]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && <Icon name="check" size={16} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                  <Text style={styles.saveButtonText}>Tạo danh mục</Text>
                </TouchableOpacity>
                
                <View style={{height: 20}} /> 
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabExpense: {
    backgroundColor: '#FF69B4',
  },
  activeTabIncome: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deleteBtn: {
    padding: 8,
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 0,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#FF69B4',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryManagementScreen;