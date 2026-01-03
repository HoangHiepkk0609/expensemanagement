const CATEGORY_STYLES: { [key: string]: { icon: string; color: string } } = {
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
  'Lương':      { icon: 'cash-marker',     color: '#4CAF50' },
  'Kinh doanh': { icon: 'chart-line',      color: '#2196F3' },
  'Thưởng':     { icon: 'wallet-giftcard', color: '#FFC107' },
  'Khác':       { icon: 'dots-grid',       color: '#9D9D9D' },
  'custom':     { icon: 'tag-outline',     color: '#8E44AD' }, 
};

export const getCategoryIcon = (categoryName: string): string => {
  return CATEGORY_STYLES[categoryName]?.icon || CATEGORY_STYLES['custom'].icon;
};

export const getCategoryColor = (categoryName: string): string => {
  return CATEGORY_STYLES[categoryName]?.color || CATEGORY_STYLES['custom'].color;
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Ăn uống', label: 'Ăn uống', icon: 'food-fork-drink', color: '#FF6B6B' },
  { id: 'shopping', name: 'Mua sắm', label: 'Mua sắm', icon: 'cart', color: '#FFD93D' },
  { id: 'transport', name: 'Di chuyển', label: 'Di chuyển', icon: 'car', color: '#6BCB77' },
  { id: 'friend', name: 'Người thân', label: 'Người thân', icon: 'account-group', color: '#4D96FF' },
  { id: 'other', name: 'Khác', label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'salary', name: 'Lương', label: 'Lương', icon: 'cash', color: '#4CAF50' },
  { id: 'business', name: 'Kinh doanh', label: 'Kinh doanh', icon: 'chart-line', color: '#2196F3' },
  { id: 'bonus', name: 'Thưởng', label: 'Thưởng', icon: 'gift', color: '#FFC107' },
  { id: 'other_income', name: 'Khác', label: 'Khác', icon: 'dots-grid', color: '#9D9D9D' },
];