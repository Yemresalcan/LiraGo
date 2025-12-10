import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { BillType } from '../types';

/**
 * Bill Reminder Service
 *
 * This service manages bill payment reminders by scheduling local notifications
 * for upcoming bill due dates.
 */

// Storage keys
const REMINDER_SETTINGS_KEY = '@bill_reminder_settings';
const SCHEDULED_REMINDERS_KEY = '@scheduled_bill_reminders';

// Reminder settings interface
export interface ReminderSettings {
  enabled: boolean;
  reminderDays: number[]; // Days before due date to remind (e.g., [1, 3, 7])
  reminderTime: { hour: number; minute: number }; // Time of day to send reminder
}

// Scheduled reminder interface
export interface ScheduledReminder {
  id: string;
  notificationId: string;
  billId: string;
  billType: BillType;
  dueDate: Date;
  amount: number;
  merchant?: string;
  scheduledFor: Date;
}

// Default settings
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  reminderDays: [1, 3, 7], // 1 day, 3 days, and 7 days before
  reminderTime: { hour: 9, minute: 0 }, // 9:00 AM
};

// Bill type display names for notifications
const BILL_TYPE_NAMES: Record<BillType, { tr: string; en: string }> = {
  electricity: { tr: 'Elektrik', en: 'Electricity' },
  water: { tr: 'Su', en: 'Water' },
  gas: { tr: 'Doğalgaz', en: 'Natural Gas' },
  naturalGas: { tr: 'Doğalgaz', en: 'Natural Gas' },
  internet: { tr: 'İnternet', en: 'Internet' },
  other: { tr: 'Diğer Fatura', en: 'Other Bill' },
};

/**
 * Get reminder settings from storage
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_REMINDER_SETTINGS;
  } catch (error) {
    console.error('Error getting reminder settings:', error);
    return DEFAULT_REMINDER_SETTINGS;
  }
}

/**
 * Save reminder settings to storage
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    throw error;
  }
}

/**
 * Get scheduled reminders from storage
 */
export async function getScheduledReminders(): Promise<ScheduledReminder[]> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_REMINDERS_KEY);
    if (stored) {
      const reminders = JSON.parse(stored);
      // Convert date strings back to Date objects
      return reminders.map((r: any) => ({
        ...r,
        dueDate: new Date(r.dueDate),
        scheduledFor: new Date(r.scheduledFor),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting scheduled reminders:', error);
    return [];
  }
}

/**
 * Save scheduled reminders to storage
 */
async function saveScheduledReminders(reminders: ScheduledReminder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving scheduled reminders:', error);
    throw error;
  }
}

/**
 * Get the device language (simple check)
 */
function getDeviceLanguage(): 'tr' | 'en' {
  // This is a simple check - in production, you'd use i18n.language
  return 'tr';
}

/**
 * Generate notification content for a bill reminder
 */
function generateNotificationContent(
  billType: BillType,
  amount: number,
  daysUntilDue: number,
  merchant?: string,
  language: 'tr' | 'en' = 'tr'
): { title: string; body: string } {
  const billName = BILL_TYPE_NAMES[billType]?.[language] || BILL_TYPE_NAMES.other[language];
  const formattedAmount = amount.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  });

  if (language === 'tr') {
    if (daysUntilDue === 0) {
      return {
        title: `⚠️ ${billName} Faturası Bugün Son Gün!`,
        body: merchant
          ? `${merchant} - ${formattedAmount} tutarındaki faturanızın son ödeme tarihi bugün!`
          : `${formattedAmount} tutarındaki faturanızın son ödeme tarihi bugün!`,
      };
    } else if (daysUntilDue === 1) {
      return {
        title: `🔔 ${billName} Faturası Yarın Son Gün`,
        body: merchant
          ? `${merchant} - ${formattedAmount} tutarındaki faturanızın son ödeme tarihi yarın.`
          : `${formattedAmount} tutarındaki faturanızın son ödeme tarihi yarın.`,
      };
    } else {
      return {
        title: `📋 ${billName} Faturası Hatırlatması`,
        body: merchant
          ? `${merchant} - ${formattedAmount} tutarındaki faturanızın son ödeme tarihine ${daysUntilDue} gün kaldı.`
          : `${formattedAmount} tutarındaki faturanızın son ödeme tarihine ${daysUntilDue} gün kaldı.`,
      };
    }
  } else {
    if (daysUntilDue === 0) {
      return {
        title: `⚠️ ${billName} Bill Due Today!`,
        body: merchant
          ? `${merchant} - Your ${formattedAmount} bill is due today!`
          : `Your ${formattedAmount} bill is due today!`,
      };
    } else if (daysUntilDue === 1) {
      return {
        title: `🔔 ${billName} Bill Due Tomorrow`,
        body: merchant
          ? `${merchant} - Your ${formattedAmount} bill is due tomorrow.`
          : `Your ${formattedAmount} bill is due tomorrow.`,
      };
    } else {
      return {
        title: `📋 ${billName} Bill Reminder`,
        body: merchant
          ? `${merchant} - Your ${formattedAmount} bill is due in ${daysUntilDue} days.`
          : `Your ${formattedAmount} bill is due in ${daysUntilDue} days.`,
      };
    }
  }
}

/**
 * Schedule a reminder notification for a specific bill
 */
export async function scheduleBillReminder(
  billId: string,
  billType: BillType,
  dueDate: Date,
  amount: number,
  merchant?: string
): Promise<string[]> {
  const settings = await getReminderSettings();

  if (!settings.enabled) {
    console.log('Bill reminders are disabled');
    return [];
  }

  const scheduledNotificationIds: string[] = [];
  const scheduledReminders = await getScheduledReminders();
  const language = getDeviceLanguage();
  const now = new Date();

  // Schedule notifications for each reminder day
  for (const daysBeforeDue of settings.reminderDays) {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeDue);
    reminderDate.setHours(settings.reminderTime.hour, settings.reminderTime.minute, 0, 0);

    // Only schedule if the reminder date is in the future
    if (reminderDate > now) {
      const daysUntilDue = daysBeforeDue;
      const { title, body } = generateNotificationContent(
        billType,
        amount,
        daysUntilDue,
        merchant,
        language
      );

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { billId, billType, dueDate: dueDate.toISOString() },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          } as Notifications.DateTriggerInput,
        });

        scheduledNotificationIds.push(notificationId);

        // Save to storage
        const reminder: ScheduledReminder = {
          id: `${billId}_${daysBeforeDue}`,
          notificationId,
          billId,
          billType,
          dueDate,
          amount,
          merchant,
          scheduledFor: reminderDate,
        };

        scheduledReminders.push(reminder);

        console.log(
          `Scheduled reminder for ${billType} bill: ${daysBeforeDue} day(s) before due date`
        );
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }
  }

  // Also schedule a reminder for the due date itself (day 0)
  const dueDateReminder = new Date(dueDate);
  dueDateReminder.setHours(settings.reminderTime.hour, settings.reminderTime.minute, 0, 0);

  if (dueDateReminder > now) {
    const { title, body } = generateNotificationContent(billType, amount, 0, merchant, language);

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { billId, billType, dueDate: dueDate.toISOString() },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDateReminder,
        } as Notifications.DateTriggerInput,
      });

      scheduledNotificationIds.push(notificationId);

      const reminder: ScheduledReminder = {
        id: `${billId}_0`,
        notificationId,
        billId,
        billType,
        dueDate,
        amount,
        merchant,
        scheduledFor: dueDateReminder,
      };

      scheduledReminders.push(reminder);

      console.log(`Scheduled due date reminder for ${billType} bill`);
    } catch (error) {
      console.error('Error scheduling due date notification:', error);
    }
  }

  await saveScheduledReminders(scheduledReminders);
  return scheduledNotificationIds;
}

/**
 * Cancel all reminders for a specific bill
 */
export async function cancelBillReminders(billId: string): Promise<void> {
  const reminders = await getScheduledReminders();
  const billReminders = reminders.filter(r => r.billId === billId);
  const remainingReminders = reminders.filter(r => r.billId !== billId);

  for (const reminder of billReminders) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  await saveScheduledReminders(remainingReminders);
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllBillReminders(): Promise<void> {
  const reminders = await getScheduledReminders();

  for (const reminder of reminders) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  await saveScheduledReminders([]);
}

/**
 * Refresh all bill reminders (re-schedule based on current settings)
 * Useful when settings change or app starts
 */
export async function refreshBillReminders(userId: string): Promise<void> {
  const settings = await getReminderSettings();

  if (!settings.enabled) {
    await cancelAllBillReminders();
    return;
  }

  // Cancel existing reminders
  await cancelAllBillReminders();

  const now = new Date();
  const billCollections = [
    'electricity_bills',
    'water_bills',
    'gas_bills',
    'naturalGas_bills',
    'internet_bills',
    'other_bills',
  ];

  // Query all bills for the user with future due dates
  for (const collectionName of billCollections) {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(now))
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const dueDate = data.date?.toDate();

        if (dueDate && dueDate > now) {
          const billType =
            (data.type as BillType) ||
            (collectionName.replace('_bills', '').replace('gas', 'naturalGas') as BillType);

          await scheduleBillReminder(doc.id, billType, dueDate, data.cost || 0, data.merchant);
        }
      }
    } catch (error) {
      console.error(`Error refreshing reminders for ${collectionName}:`, error);
    }
  }
}

/**
 * Get count of upcoming bills in the next N days
 */
export async function getUpcomingBillsCount(userId: string, days: number = 7): Promise<number> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const billCollections = [
    'electricity_bills',
    'water_bills',
    'gas_bills',
    'naturalGas_bills',
    'internet_bills',
    'other_bills',
  ];

  let count = 0;

  for (const collectionName of billCollections) {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(now)),
        where('date', '<=', Timestamp.fromDate(futureDate))
      );

      const snapshot = await getDocs(q);
      count += snapshot.size;
    } catch (error) {
      console.error(`Error counting bills in ${collectionName}:`, error);
    }
  }

  return count;
}

/**
 * Get upcoming bills
 */
export interface UpcomingBill {
  id: string;
  type: BillType;
  cost: number;
  dueDate: Date;
  merchant?: string;
  daysUntilDue: number;
}

export async function getUpcomingBills(userId: string, days: number = 30): Promise<UpcomingBill[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const billCollections = [
    'electricity_bills',
    'water_bills',
    'gas_bills',
    'naturalGas_bills',
    'internet_bills',
    'other_bills',
  ];

  const bills: UpcomingBill[] = [];

  for (const collectionName of billCollections) {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(now)),
        where('date', '<=', Timestamp.fromDate(futureDate))
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const dueDate = data.date?.toDate();

        if (dueDate) {
          const billType =
            (data.type as BillType) ||
            (collectionName.replace('_bills', '').replace('gas', 'naturalGas') as BillType);

          const diffTime = dueDate.getTime() - now.getTime();
          const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          bills.push({
            id: doc.id,
            type: billType,
            cost: data.cost || 0,
            dueDate,
            merchant: data.merchant,
            daysUntilDue,
          });
        }
      }
    } catch (error) {
      console.error(`Error getting upcoming bills from ${collectionName}:`, error);
    }
  }

  // Sort by due date (closest first)
  return bills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
