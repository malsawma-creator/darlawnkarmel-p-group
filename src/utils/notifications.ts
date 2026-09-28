import { AppNotification, Member, isDeveloperUser, isOBRole } from '../types';
import { addToFirestore, updateInFirestore, deleteFromFirestore, COLLECTIONS } from './firebaseService';

const NOTIFICATIONS_KEY = 'kpg_notifications_v1';

export const NotificationService = {
  // Request Web Browser Push Permission
  requestPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    } catch (e) {
      console.warn('Notification permission request error:', e);
    }
    return false;
  },

  hasPermission: (): boolean => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  // Display browser push notification
  showBrowserNotification: (title: string, body: string, icon = '/icon.svg') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  },

  // Retrieve stored in-app notifications
  getNotifications: (): AppNotification[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading notifications', e);
    }
    return [];
  },

  // Filter notifications for current user
  getUserNotifications: (currentUser: Member | null): AppNotification[] => {
    const all = NotificationService.getNotifications();
    const isDev = isDeveloperUser(currentUser);
    const isOB = (currentUser && isOBRole(currentUser.role)) || isDev;

    return all.filter((n) => {
      if (n.forDeveloperOnly) {
        return isDev;
      }
      if (n.forOBOnly) {
        return isOB;
      }
      return true;
    });
  },

  // Get unread notification count
  getUnreadCount: (currentUser: Member | null): number => {
    const list = NotificationService.getUserNotifications(currentUser);
    const userId = currentUser?.id || 'guest';
    return list.filter((n) => !n.readBy.includes(userId)).length;
  },

  // Mark all notifications as read for current user
  markAllAsRead: (currentUser: Member | null) => {
    const all = NotificationService.getNotifications();
    const userId = currentUser?.id || 'guest';
    const updated = all.map((n) => {
      if (!n.readBy.includes(userId)) {
        const updatedN = { ...n, readBy: [...n.readBy, userId] };
        updateInFirestore(COLLECTIONS.APP_NOTIFICATIONS, n.id, { readBy: updatedN.readBy });
        return updatedN;
      }
      return n;
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // Delete a specific notification
  deleteNotification: (id: string) => {
    const all = NotificationService.getNotifications();
    const filtered = all.filter((n) => n.id !== id);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    deleteFromFirestore(COLLECTIONS.APP_NOTIFICATIONS, id);
  },

  // Clear all notifications
  clearAllNotifications: () => {
    const all = NotificationService.getNotifications();
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    all.forEach((n) => {
      deleteFromFirestore(COLLECTIONS.APP_NOTIFICATIONS, n.id);
    });
  },

  // Trigger when a new person registers (ONLY Developer gets notified)
  notifyNewMemberRegistered: (hming: string, veng: string, phone: string) => {
    const all = NotificationService.getNotifications();
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Member registration request',
      message: `${hming} (${veng}, Ph: ${phone}) in inziahluhna a thehlut a, Developer approval a nghak mek e.`,
      timestamp: new Date().toISOString(),
      type: 'member_registration',
      readBy: [],
      forDeveloperOnly: true,
    };
    const updated = [notif, ...all].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    addToFirestore(COLLECTIONS.APP_NOTIFICATIONS, notif.id, notif);

    NotificationService.showBrowserNotification(
      'P Group Darlawn',
      `New member request needs approval: ${hming}`
    );
  },

  // Trigger when a user posts a suggestion / thurawn (OBs & Developer notified)
  notifyNewSuggestion: (senderHming: string, isAnonymous: boolean) => {
    const all = NotificationService.getNotifications();
    const displayName = isAnonymous ? 'Member pakhat (Anonymous)' : senderHming;
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Thurawn Bawm: Suggestion thar a awm',
      message: `${displayName} hnen atangin Thurawn/Suggestion thar a awm e. Form hruaituten lo en rawh u.`,
      timestamp: new Date().toISOString(),
      type: 'suggestion',
      readBy: [],
      forOBOnly: true,
    };
    const updated = [notif, ...all].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    addToFirestore(COLLECTIONS.APP_NOTIFICATIONS, notif.id, notif);

    NotificationService.showBrowserNotification(
      'P Group Darlawn: Thurawn Thar',
      `${displayName} in thurawn thar a thehlut e.`
    );
  },

  // Trigger when new post/record/photo is added (all approved members get notification)
  notifyNewUpdate: (title: string, details?: string) => {
    const all = NotificationService.getNotifications();
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'P Group Darlawn: New update',
      message: details ? `${title} - ${details}` : title,
      timestamp: new Date().toISOString(),
      type: 'update',
      readBy: [],
      forDeveloperOnly: false,
    };
    const updated = [notif, ...all].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    addToFirestore(COLLECTIONS.APP_NOTIFICATIONS, notif.id, notif);

    NotificationService.showBrowserNotification('P Group Darlawn: New update', title);
  },
};
