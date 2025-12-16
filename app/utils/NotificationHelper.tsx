import notifee, { 
  AndroidImportance, 
  TimestampTrigger, 
  TriggerType, 
  RepeatFrequency 
} from '@notifee/react-native';

// ID để quản lý thông báo này (để sau này còn hủy được)
const REMINDER_CHANNEL_ID = 'daily-reminder';
const REMINDER_NOTIFICATION_ID = 'daily-expense-reminder';

class NotificationHelper {
  
  // 1. Xin quyền thông báo (Quan trọng cho iOS và Android 13+)
  async requestPermission() {
    await notifee.requestPermission();
  }

  // 2. Hàm tính toán thời gian cho 21:00 sắp tới
  getNextNinePM() {
    const now = new Date();
    const target = new Date();
    
    // Đặt giờ là 21:00:00
    target.setHours(21, 0, 0, 0);
    // Chỉnh giờ để test
    return Date.now() + 10000;

  }

  // 3. Lên lịch thông báo
  async scheduleDailyReminder() {
    // Xin quyền trước
    await this.requestPermission();

    // Tạo kênh thông báo cho Android (Bắt buộc)
    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Nhắc nhở ghi chép',
      importance: AndroidImportance.HIGH,
      sound: 'default', // Có thể đổi âm thanh khác nếu muốn
    });

    // Cấu hình thời gian (Trigger)
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: this.getNextNinePM(), // Thời điểm 21:00
      repeatFrequency: RepeatFrequency.DAILY, // Lặp lại hàng ngày
      alarmManager: true, // Đảm bảo chạy chính xác trên Android kể cả khi tắt máy
    };

    // Tạo thông báo
    await notifee.createTriggerNotification(
      {
        id: REMINDER_NOTIFICATION_ID, // ID cố định để quản lý
        title: '🔔 Nhắc nhở chi tiêu',
        body: 'Bạn ơi, hôm nay bạn chưa ghi chép chi tiêu nè! Vào app ngay nhé 💸',
        android: {
          channelId: REMINDER_CHANNEL_ID,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher', // Đảm bảo icon này có trong android/app/src/main/res/mipmap...
        },
      },
      trigger,
    );
    
    console.log('Đã lên lịch nhắc nhở lúc 21:00 hàng ngày!');
  }

  // 4. Hủy thông báo (Khi tắt switch)
  async cancelDailyReminder() {
    await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);
    console.log('Đã hủy nhắc nhở.');
  }
}

export default new NotificationHelper();