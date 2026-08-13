import NimoScreen from '../screens/NimoScreen';

export interface NimoTransactionResponse {
  isTransaction: true;
  reply: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  date?: string; 
  note?: string; 
  wallet?: string;
}

export interface NimoConversationResponse {
  isTransaction: false;
  reply: string;
}

export type NimoResponse = NimoTransactionResponse | NimoConversationResponse;

export function validateNimoResponse(data: unknown): NimoResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Response không phải object');
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.isTransaction !== 'boolean') {
    throw new Error('isTransaction phải là boolean');
  }

  const reply =
    typeof obj.reply === 'string' && obj.reply.trim()
      ? obj.reply.trim()
      : 'Nimo chưa hiểu ý bạn, thử nói lại nhé!';

  if (!obj.isTransaction) {
    return { isTransaction: false, reply };
  }

  let amount = Number(obj.amount);
  if (isNaN(amount) || amount <= 0 || typeof obj.amount === 'string') {
    amount = parseVietnameseCurrency(obj.amount as string);
    if (amount <= 0) throw new Error('amount không hợp lệ');
  }

  const validTypes = ['expense', 'income'];
  const type = validTypes.includes(obj.type as string)
    ? (obj.type as 'expense' | 'income')
    : 'expense';

  const category =
    typeof obj.category === 'string' && obj.category.trim()
      ? obj.category.trim()
      : 'Khác';

  return {
    isTransaction: true,
    reply,
    amount,
    category,
    type,
    date: typeof obj.date === 'string' ? obj.date : undefined,
    note: typeof obj.note === 'string' ? obj.note : undefined,
    wallet: typeof obj.wallet === 'string' ? obj.wallet : undefined,
  };
}

export function parseVietnameseCurrency(raw: unknown): number {
  if (typeof raw !== 'string') return -1;
  const s = raw.toLowerCase().replace(/\s/g, '');
  if (s.includes('tr')) {
    return parseFloat(s.replace('tr', '').replace(',', '.')) * 1_000_000;
  }
  if (s.includes('k')) {
    return parseFloat(s.replace('k', '')) * 1_000;
  }
  return parseFloat(s) || -1;
}

export default NimoScreen;
