import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AuthorizationStatus,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

const REMINDER_KEY = 'daily-step-reminder-enabled';
const REMINDER_ID = 'daily-step-reminder';

// Serialize changes so startup scheduling cannot race with the Settings switch.
let pendingOperation: Promise<void> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingOperation.then(operation);
  pendingOperation = result.then(() => undefined, () => undefined);
  return result;
}

export const getDailyReminderEnabled = async (): Promise<boolean> => {
  // Preserve the existing reminder for users who have not changed the setting.
  return (await AsyncStorage.getItem(REMINDER_KEY)) !== 'false';
};

export const requestNotificationPermission = async () => {
  if (!(await getDailyReminderEnabled())) {
    return;
  }
  return notifee.requestPermission();
};

const createDailyReminder = async () => {
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0);
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
      id: REMINDER_ID,
      title: 'Keep your streak going 🔥',
      body: 'Keep moving toward your daily step goal!',
    },
    trigger,
  );
};

export const scheduleDailyReminder = () => serialize(async () => {
  if (!(await getDailyReminderEnabled())) {
    await notifee.cancelTriggerNotification(REMINDER_ID);
    return;
  }
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    await createDailyReminder();
  }
});

export const setDailyReminderEnabled = (enabled: boolean) => serialize(async () => {
  const previous = await getDailyReminderEnabled();
  if (enabled) {
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
      throw new Error('Allow notifications in iPhone Settings to enable the reminder.');
    }
  }
  await AsyncStorage.setItem(REMINDER_KEY, String(enabled));
  try {
    if (enabled) {
      await createDailyReminder();
    } else {
      await notifee.cancelTriggerNotification(REMINDER_ID);
    }
  } catch (error) {
    await AsyncStorage.setItem(REMINDER_KEY, String(previous));
    throw error;
  }
});
