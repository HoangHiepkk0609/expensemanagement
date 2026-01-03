import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: string;
  recurrence: string;
  wallet: string;
  createdAt: string;
  updatedAt: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth().currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map((doc : any) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,

              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            };
          });
          setTransactions(docs);
          setLoading(false);
        },
        (error) => {
          console.error('Lỗi lấy transaction:', error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  return { transactions, loading, error };
};