import { create } from 'zustand';

export interface EventLog {
  id: string;
  type: string;
  sourceModule: string;
  payload: any;
  userId?: string;
  user?: { name: string; email: string };
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: string;
  message: string;
  status: string;
  eventLogId: string;
  eventLog: { type: string; severity: string; sourceModule: string };
  createdAt: string;
}

interface EventState {
  events: EventLog[];
  notifications: Notification[];
  addEvent: (event: EventLog) => void;
  addNotification: (notification: Notification) => void;
  setEvents: (events: EventLog[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  clearAll: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  notifications: [],
  addEvent: (event) => set((state) => {
    const exists = state.events.some((e) => e.id === event.id);
    if (exists) return state;

    const newEvents = [event, ...state.events];
    if (newEvents.length > 50) {
      newEvents.pop();
    }
    return { events: newEvents };
  }),
  addNotification: (notification) => set((state) => {
    const exists = state.notifications.some((n) => n.id === notification.id);
    if (exists) return state;

    const newNotifications = [notification, ...state.notifications];
    if (newNotifications.length > 30) {
      newNotifications.pop();
    }
    return { notifications: newNotifications };
  }),
  setEvents: (events) => set({ events }),
  setNotifications: (notifications) => set({ notifications }),
  clearAll: () => set({ events: [], notifications: [] }),
}));
