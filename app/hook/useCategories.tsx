import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const DEFAULT_CATEGORIES = [
  { id: 'default_1', label: 'Ăn uống', icon: 'silverware-fork-knife', color: '#FF6B6B', type: 'expense' },
  { id: 'default_2', label: 'Mua sắm', icon: 'cart-outline', color: '#FFD93D', type: 'expense' },
  { id: 'default_3', label: 'Di chuyển', icon: 'car', color: '#6BCB77', type: 'expense' },
  { id: 'default_4', label: 'Người thân', icon: 'human-handsup', color: '#4D96FF', type: 'expense' },
  { id: 'default_5', label: 'Lương', icon: 'cash-marker', color: '#4CAF50', type: 'income' },
  { id: 'default_6', label: 'Thưởng', icon: 'wallet-giftcard', color: '#FFC107', type: 'income' },
];

export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  
  const user = auth().currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (!userId) {
        setCategories(DEFAULT_CATEGORIES);
        setLoading(false);
        return;
    }

    const unsubscribe = firestore()
      .collection('user_categories')
      .where('userId', '==', userId)
      .onSnapshot(
        (snapshot) => {
          const userCats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setCategories([...DEFAULT_CATEGORIES, ...userCats]);
          setLoading(false);
        },
        (error) => {
          console.error('Lỗi lấy danh mục:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [userId]);

  return { categories, loading };
};