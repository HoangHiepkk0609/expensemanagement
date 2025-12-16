import { Transaction } from '../hook/useTransactions';

export interface WeekPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface CategoryData {
  name: string;
  amount: number;
  percent: number;
  color: string;
}

export interface ReportData {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  categories: CategoryData[];
  trend: string;
  comparison: string;
}

// Màu cho các danh mục
const categoryColors: Record<string, string> = {
  'Ăn uống': '#EF4444',
  'Di chuyển': '#3B82F6',
  'Mua sắm': '#A855F7',
  'Giải trí': '#10B981',
  'Người thân': '#F59E0B',
  'Lương': '#10B981',
  'Kinh doanh': '#3B82F6',
  'Thưởng': '#F59E0B',
  'Khác': '#6B7280',
};

// Lấy màu cho danh mục
export const getCategoryColor = (category: string): string => {
  return categoryColors[category] || '#6B7280';
};

// Lấy danh sách các tuần gần đây
export const getRecentWeeks = (count: number = 4): WeekPeriod[] => {
  const weeks: WeekPeriod[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (i * 7));
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    const label = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
    
    weeks.push({ label, startDate, endDate });
  }
  
  return weeks;
};

// Lọc giao dịch trong khoảng thời gian
export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

// Tính tổng theo loại
export const calculateTotal = (
  transactions: Transaction[],
  type: 'expense' | 'income'
): number => {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
};

// Nhóm theo danh mục và tính phần trăm
export const calculateCategoryBreakdown = (
  transactions: Transaction[]
): CategoryData[] => {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  if (totalExpense === 0) {
    return [];
  }
  
  // Nhóm theo category
  const categoryMap: Record<string, number> = {};
  
  expenseTransactions.forEach((transaction) => {
    const category = transaction.category || 'Khác';
    categoryMap[category] = (categoryMap[category] || 0) + transaction.amount;
  });
  
  // Chuyển thành mảng và tính phần trăm
  const categories: CategoryData[] = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: Math.round((amount / totalExpense) * 100),
      color: getCategoryColor(name),
    }))
    .sort((a, b) => b.amount - a.amount); // Sắp xếp giảm dần
  
  return categories;
};

// Tính báo cáo cho một kỳ
export const calculateReport = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  previousStartDate?: Date,
  previousEndDate?: Date
): ReportData => {
  const periodTransactions = filterTransactionsByPeriod(transactions, startDate, endDate);
  
  const totalExpense = calculateTotal(periodTransactions, 'expense');
  const totalIncome = calculateTotal(periodTransactions, 'income');
  const balance = totalIncome - totalExpense;
  const categories = calculateCategoryBreakdown(periodTransactions);
  
  // So sánh với kỳ trước (nếu có)
  let trend = 'stable';
  let comparison = '0%';
  
  if (previousStartDate && previousEndDate) {
    const previousTransactions = filterTransactionsByPeriod(
      transactions,
      previousStartDate,
      previousEndDate
    );
    const previousExpense = calculateTotal(previousTransactions, 'expense');
    
    if (previousExpense > 0) {
      const change = ((totalExpense - previousExpense) / previousExpense) * 100;
      trend = change > 0 ? 'up' : 'down';
      comparison = `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
    }
  }
  
  return {
    totalExpense,
    totalIncome,
    balance,
    categories,
    trend,
    comparison,
  };
};