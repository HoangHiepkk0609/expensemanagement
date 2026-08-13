import { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';

export const useBudgets = () => {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error(
      'useBudgets phải được đặt bên trong BudgetProvider!',
    );
  }

  return context;
};
