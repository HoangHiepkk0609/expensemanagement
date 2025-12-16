import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

const TEST_USER_ID = 'my-test-user-id-123';

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

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to transactions collection
    const unsubscribe = firestore()
      .collection('transactions')
      .where('userId', '==', TEST_USER_ID)
      .orderBy('date', 'desc')
      .onSnapshot(
        (snapshot) => {
          const fetchedTransactions: Transaction[] = [];
          
          snapshot.forEach((doc) => {
            fetchedTransactions.push({
              id: doc.id,
              ...doc.data(),
            } as Transaction);
          });
          
          setTransactions(fetchedTransactions);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching transactions:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return { transactions, loading, error };
};