import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

const REMINDER_CHANNEL_ID = 'daily-reminder';
const REMINDER_NOTIFICATION_ID = 'daily-expense-reminder';

class NotificationHelper {
  async requestPermission() {
    await notifee.requestPermission();
  }

  getNextNinePM() {
    const target = new Date();
    target.setHours(21, 0, 0, 0);

    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime();
  }

  async scheduleDailyReminder() {
    await this.requestPermission();

    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Nhắc nhở ghi chép',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: this.getNextNinePM(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: true,
    };

    await notifee.createTriggerNotification(
      {
        id: REMINDER_NOTIFICATION_ID,
        title: '🔔 Nhắc nhở chi tiêu',
        body: 'Bạn ơi, hôm nay bạn chưa ghi chép chi tiêu nè! Vào app ngay nhé 💸',
        android: {
          channelId: REMINDER_CHANNEL_ID,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher',
        },
      },
      trigger,
    );

    console.log('Đã lên lịch nhắc nhở lúc 21:00 hàng ngày!');
  }

  async showBudgetWarning(percentage: any) {
    await notifee.displayNotification({
      id: 'budget-warning',
      title: '🚨 Báo động đỏ bạn ơi!',
      body: `Tháng này bạn đã tiêu gần hết ${percentage}% ngân sách rồi đó! Tém tém lại nha 💸`,
      android: {
        channelId: REMINDER_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        color: '#EF4444',
      },
    });
  }

  async cancelDailyReminder() {
    await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);
    console.log('Đã hủy nhắc nhở.');
  }
}

export default new NotificationHelper();
