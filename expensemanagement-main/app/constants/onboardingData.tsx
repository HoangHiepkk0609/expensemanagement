export const OCCUPATIONS = [
  { id: 'student', label: 'Sinh viên', icon: '🎓' },
  { id: 'working', label: 'Người đi làm / Tự do', icon: '💼' },
  { id: 'homemaker', label: 'Nội trợ / Gia đình', icon: '🏠' },
];

export const SUGGESTIONS = {
  student: {
    title: 'Gợi ý cho Sinh viên',
    description:
      'Việc lập Quỹ cá nhân để quản lý tiền tiêu vặt hoặc mua sắm thiết bị học tập là rất cần thiết.',
    targetScreen: 'Goals',
    buttonText: 'Tạo Mục Tiêu Cá Nhân',
  },
  working: {
    title: 'Gợi ý cho Người đi làm',
    description:
      'Bạn nên bắt đầu xây dựng Quỹ dự phòng cá nhân hoặc lập kế hoạch mua xe, đầu tư.',
    targetScreen: 'Goals',
    buttonText: 'Xem Các Lựa Chọn',
  },
  homemaker: {
    title: 'Gợi ý Quản lý Gia đình',
    description:
      'Tạo Quỹ chung gia đình sẽ giúp bạn dễ dàng theo dõi chi phí sinh hoạt và chia sẻ cùng người thân.',
    targetScreen: 'CreateFamily',
    buttonText: 'Tạo Quỹ Gia Đình Ngay',
  },
};
