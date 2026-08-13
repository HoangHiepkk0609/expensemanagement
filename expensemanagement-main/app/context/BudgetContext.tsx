import firestore from '@react-native-firebase/firestore';
import React, { createContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export const BudgetContext = createContext<any>(null);

export const BudgetProvider = ({ children }: any) => {
  const { userId } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const subscriber = firestore()
      .collection('budgets')
      .where('userId', '==', userId)
      .onSnapshot(querySnapshot => {
        const fetchedBudgets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBudgets(fetchedBudgets);
      });

    return () => subscriber();
  }, [userId]);

  const getBudgetByCategory = (categoryLabel: string, isFamily: boolean) => {
    return budgets.find(
      b => b.category === categoryLabel && b.isFamily === isFamily,
    );
  };

  return (
    <BudgetContext.Provider value={{ budgets, getBudgetByCategory }}>
      {children}
    </BudgetContext.Provider>
  );
};
