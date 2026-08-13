export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: Date;
  wallet: string;
  recurrence: string;
  isFamily?: boolean;
}

export const parseAvatar = (photoURL: string | null) => {
  if (!photoURL) return null;
  try {
    const parsed = JSON.parse(photoURL);
    if (parsed.emoji && parsed.color) return parsed;
  } catch {}
  return null;
};