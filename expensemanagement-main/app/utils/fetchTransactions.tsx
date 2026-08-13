// utils/fetchTransactions.ts

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface Transaction {
  userId: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  familyId: string | null;
  isFamily: boolean;
  source?: string;
  emotion?: string;      // nếu bạn có field này
  travelTag?: string;    // nếu bạn có field này
}

export interface FetchOptions {
  month?: 'current' | 'last' | 'both';
}

// Resolve userId → displayName (cache để tránh gọi lặp)
const userNameCache: Record<string, string> = {};
const resolveUserName = async (uid: string): Promise<string> => {
  if (userNameCache[uid]) return userNameCache[uid];
  try {
    const doc = await firestore().collection('users').doc(uid).get();
    const name = doc.data()?.displayName || doc.data()?.name || uid;
    userNameCache[uid] = name;
    return name;
  } catch {
    return uid;
  }
};

// Trả về { startDate, endDate, label } cho từng tháng
const getMonthRange = (offset: number) => {
  const now = new Date();
  const year = now.getMonth() + offset < 0
    ? now.getFullYear() - 1
    : now.getFullYear();
  const month = (now.getMonth() + offset + 12) % 12;

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: `Tháng ${month + 1}/${year}`,
    month: month + 1,
    year,
  };
};

// Query transactions theo range
const queryTransactions = async (
  userId: string,
  familyId: string | null,
  startDate: string,
  endDate: string,
) => {
  const personalQuery = firestore()
    .collection('transactions')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();

  const familyQuery = familyId
    ? firestore()
        .collection('transactions')
        .where('familyId', '==', familyId)
        .where('isFamily', '==', true)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
    : Promise.resolve(null);

  const [personalSnap, familySnap] = await Promise.all([personalQuery, familyQuery]);

  const personal: Transaction[] = personalSnap.docs.map(doc => ({
    ...(doc.data() as Transaction),
    source: 'personal',
  }));

  const family: Transaction[] = familySnap
    ? familySnap.docs.map(doc => ({
        ...(doc.data() as Transaction),
        source: 'family',
      }))
    : [];

  return { personal, family };
};

// Tổng hợp summary từ danh sách transaction
const summarize = async (
  personal: Transaction[],
  family: Transaction[],
  familyId: string | null,
) => {
  // --- Cá nhân ---
  const personalExpense = personal
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const personalIncome = personal
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const personalByCategory = personal.reduce((acc: Record<string, number>, t) => {
    if (t.type === 'expense') acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // --- Cảm xúc (nếu có field emotion) ---
  const emotionStats = personal.reduce((acc: Record<string, number>, t) => {
    if (t.emotion) acc[t.emotion] = (acc[t.emotion] || 0) + 1;
    return acc;
  }, {});

  // --- Travel / bay đi đâu (nếu note có chứa từ khóa) ---
  const travelNotes = personal
    .filter(t =>
      t.category?.toLowerCase().includes('du lịch') ||
      t.note?.toLowerCase().includes('bay') ||
      t.note?.toLowerCase().includes('vé máy bay') ||
      t.note?.toLowerCase().includes('chuyến bay') ||
      t.travelTag,
    )
    .map(t => ({ note: t.note, amount: t.amount, date: t.date }));

  // --- Gia đình ---
  const familyExpense = family
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const familyByCategory = family.reduce((acc: Record<string, number>, t) => {
    if (t.type === 'expense') acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // --- Theo thành viên (resolve tên) ---
  const byMemberRaw = family.reduce((acc: Record<string, number>, t) => {
    if (t.type === 'expense') acc[t.userId] = (acc[t.userId] || 0) + t.amount;
    return acc;
  }, {});

  const memberIds = Object.keys(byMemberRaw);
  const memberNames = await Promise.all(memberIds.map(resolveUserName));
  const byMemberNamed = memberIds.reduce((acc: Record<string, number>, uid, i) => {
    acc[memberNames[i]] = byMemberRaw[uid];
    return acc;
  }, {});

  return {
    personalExpense,
    personalIncome,
    personalByCategory,
    emotionStats,
    travelNotes,
    familyExpense,
    familyByCategory,
    byMember: byMemberNamed,
    personalCount: personal.length,
    familyCount: family.length,
    hasFamilyGroup: !!familyId,
  };
};

// -------------------------------------------------------
// HÀM CHÍNH — gọi từ NimoScreen
// -------------------------------------------------------
export const fetchUserTransactions = async (messageText: string) => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('Chưa đăng nhập');

  const userDoc = await firestore().collection('users').doc(userId).get();
  const familyId = userDoc.data()?.familyId ?? null;

  const isLastMonth = messageText.includes('tháng trước');
  const isBothMonths = messageText.includes('so sánh');

  if (isBothMonths) {
    // So sánh 2 tháng
    const current = getMonthRange(0);
    const last = getMonthRange(-1);

    const [currentData, lastData] = await Promise.all([
      queryTransactions(userId, familyId, current.startDate, current.endDate),
      queryTransactions(userId, familyId, last.startDate, last.endDate),
    ]);

    const [currentSummary, lastSummary] = await Promise.all([
      summarize(currentData.personal, currentData.family, familyId),
      summarize(lastData.personal, lastData.family, familyId),
    ]);

    return buildDataSummary({
      current: { ...current, summary: currentSummary },
      last: { ...last, summary: lastSummary },
      familyId,
      mode: 'compare',
    });
  }

  const range = isLastMonth ? getMonthRange(-1) : getMonthRange(0);
  const { personal, family } = await queryTransactions(
    userId, familyId, range.startDate, range.endDate,
  );
  const summary = await summarize(personal, family, familyId);

  return buildDataSummary({
    current: { ...range, summary },
    familyId,
    mode: 'single',
  });
};

// -------------------------------------------------------
// Build string truyền vào AI
// -------------------------------------------------------
const buildDataSummary = ({
  current,
  last,
  familyId,
  mode,
}: {
  current: any;
  last?: any;
  familyId: string | null;
  mode: 'single' | 'compare';
}): string => {
  const formatSection = (label: string, s: ReturnType<typeof summarize> extends Promise<infer T> ? T : never) => `
${label}:
- Tổng chi: ${s.personalExpense.toLocaleString('vi-VN')}đ
- Tổng thu: ${s.personalIncome.toLocaleString('vi-VN')}đ
- Chi theo danh mục: ${JSON.stringify(s.personalByCategory)}
- Số giao dịch cá nhân: ${s.personalCount}
${Object.keys(s.emotionStats).length > 0
  ? `- Cảm xúc khi chi tiêu: ${JSON.stringify(s.emotionStats)}`
  : '- Không có dữ liệu cảm xúc'}
${s.travelNotes.length > 0
  ? `- Giao dịch du lịch/bay: ${JSON.stringify(s.travelNotes)}`
  : '- Không có giao dịch du lịch/bay'}
${familyId ? `
GIA ĐÌNH (${label}):
- Tổng chi chung: ${s.familyExpense.toLocaleString('vi-VN')}đ
- Chi theo danh mục: ${JSON.stringify(s.familyByCategory)}
- Chi theo thành viên: ${JSON.stringify(s.byMember)}
- Số giao dịch chung: ${s.familyCount}
` : 'CHƯA CÓ NHÓM GIA ĐÌNH'}
`.trim();

  if (mode === 'compare' && last) {
    return `
DỮ LIỆU SO SÁNH:

${formatSection(current.label, current.summary)}

${formatSection(last.label, last.summary)}
    `.trim();
  }

  return `
DỮ LIỆU ${current.label.toUpperCase()}:

${formatSection(current.label, current.summary)}
  `.trim();
};