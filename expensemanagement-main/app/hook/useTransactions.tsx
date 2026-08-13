import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: string | Date;
  recurrence: string;
  wallet: string;
  createdAt: string;
  updatedAt: string;
  isFamily?: boolean;
  familyId?: string | null;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { familyId, filterMode } = useAuth();

  const user = auth().currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let query = firestore().collection('transactions') as any;

    if (filterMode === 'family' && familyId) {
      query = query.where('familyId', '==', familyId);
    } else {
      query = query.where('userId', '==', userId);
    }

    const unsubscribe = query.orderBy('date', 'desc').onSnapshot(
      (snapshot: any) => {
        let docs = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          };
        });

        if (filterMode === 'personal') {
          docs = docs.filter((item: any) => item.isFamily !== true);
        }

        setTransactions(docs);
        setLoading(false);
      },
      (err: any) => {
        console.error('Lỗi lấy transaction:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId, familyId, filterMode]);

  return { transactions, loading, error };
};
