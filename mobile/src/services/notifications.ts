import notifee, {
    RepeatFrequency,
    TimestampTrigger,
    TriggerType,
  } from '@notifee/react-native';
  
  export const requestNotificationPermission = async () => {
    const settings = await notifee.requestPermission();
  
    console.log('Notification permission:', settings.authorizationStatus);
  };
  
  export const scheduleDailyReminder = async () => {
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0);
  
    // If 8 PM has already passed, schedule the first reminder for tomorrow.
    if (reminderTime.getTime() <= Date.now()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
  
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };
  
    await notifee.createTriggerNotification(
      {
        id: 'daily-step-reminder',
        title: 'Keep your streak going 🔥',
        body: 'Keep moving toward your daily step goal!',
      },
      trigger,
    );
  
    const triggerIds = await notifee.getTriggerNotificationIds();
    console.log('Scheduled notification IDs:', triggerIds);
  
    console.log('Daily reminder scheduled for 8:00 PM');
  };