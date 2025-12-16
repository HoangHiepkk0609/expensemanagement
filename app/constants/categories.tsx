// /src/constants/categories.ts

// 1. Định nghĩa "Từ điển" icon và màu sắc
// Đây là nơi duy nhất bạn quyết định "Ăn uống" dùng icon gì
const CATEGORY_STYLES: { [key: string]: { icon: string; color: string } } = {
  // --- CHI TIÊU (EXPENSE) ---
  'Ăn uống':    { icon: 'silverware-fork-knife', color: '#FF6B6B' },
  'Mua sắm':    { icon: 'cart-outline',          color: '#FFD93D' },
  'Người thân': { icon: 'human-handsup',         color: '#4D96FF' },
  'Di chuyển':  { icon: 'car-outline',           color: '#6BCB77' },
  'Hóa đơn':   { icon: 'receipt',               color: '#FFA500' },
  'Nhà cửa':    { icon: 'home-outline',          color: '#A0522D' },
  'Giải trí':   { icon: 'movie-outline',         color: '#9B59B6' },
  'Làm đẹp':   { icon: 'spa',                   color: '#F08080' },
  'Sức khỏe':   { icon: 'hospital-box',          color: '#1ABC9C' },
  'Học tập':   { icon: 'book-outline',          color: '#3498DB' },
  'Đầu tư':    { icon: 'trending-up',           color: '#2ECC71' },

  // --- THU NHẬP (INCOME) ---
  'Lương':      { icon: 'cash-marker',     color: '#4CAF50' },
  'Kinh doanh': { icon: 'chart-line',      color: '#2196F3' },
  'Thưởng':     { icon: 'wallet-giftcard', color: '#FFC107' },

  // --- MẶC ĐỊNH / TÙY CHỈNH ---
  'Khác':       { icon: 'dots-grid',       color: '#9D9D9D' },
  'custom':     { icon: 'tag-outline',     color: '#8E44AD' }, // Dành cho danh mục bạn tự tạo
};

// 2. Hàm helper để lấy thông tin (Quan trọng nhất)
export const getCategoryIcon = (categoryName: string): string => {
  return CATEGORY_STYLES[categoryName]?.icon || CATEGORY_STYLES['custom'].icon;
};

export const getCategoryColor = (categoryName: string): string => {
  return CATEGORY_STYLES[categoryName]?.color || CATEGORY_STYLES['custom'].color;
};

// 3. Export mảng mặc định để dùng trong Modal "Chọn danh mục"
export const DEFAULT_EXPENSE_CATEGORIES = [
  { label: 'Ăn uống',    icon: CATEGORY_STYLES['Ăn uống'].icon },
  { label: 'Mua sắm',    icon: CATEGORY_STYLES['Mua sắm'].icon },
  { label: 'Người thân', icon: CATEGORY_STYLES['Người thân'].icon },
  { label: 'Hóa đơn',   icon: CATEGORY_STYLES['Hóa đơn'].icon },
  { label: 'Nhà cửa',    icon: CATEGORY_STYLES['Nhà cửa'].icon },
  { label: 'Giải trí',   icon: CATEGORY_STYLES['Giải trí'].icon },
  { label: 'Làm đẹp',   icon: CATEGORY_STYLES['Làm đẹp'].icon },
  { label: 'Sức khỏe',   icon: CATEGORY_STYLES['Sức khỏe'].icon },
  { label: 'Học tập',   icon: CATEGORY_STYLES['Học tập'].icon },
  { label: 'Di chuyển',  icon: CATEGORY_STYLES['Di chuyển'].icon },
  { label: 'Đầu tư',    icon: CATEGORY_STYLES['Đầu tư'].icon },
  { label: 'Khác',       icon: CATEGORY_STYLES['Khác'].icon },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { label: 'Lương',      icon: CATEGORY_STYLES['Lương'].icon },
  { label: 'Kinh doanh', icon: CATEGORY_STYLES['Kinh doanh'].icon },
  { label: 'Thưởng',     icon: CATEGORY_STYLES['Thưởng'].icon },
  { label: 'Khác',       icon: CATEGORY_STYLES['Khác'].icon },
];