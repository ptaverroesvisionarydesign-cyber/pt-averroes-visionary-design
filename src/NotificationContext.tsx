import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, UserRole } from './types';
import { useAuth } from './AuthContext';
import { dataService } from './services/dataService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('satdapus_notifications');
    if (saved) return JSON.parse(saved);
    
    // Initial notifications if localStorage is empty
    return dataService.getNotifications().map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: new Date().toISOString(), // Mocking fresh timestamps
      read: n.isRead,
      type: n.type === 'system' ? 'PROSES_DATA' : 'INPUT_DATA',
      userId: 'system',
      targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT]
    }));
  });

  const [broadcast] = useState(() => new BroadcastChannel('notifications_channel'));

  useEffect(() => {
    localStorage.setItem('satdapus_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    broadcast.onmessage = (event) => {
      if (event.data.type === 'NEW_NOTIFICATION') {
        const newNotif = event.data.notification;
        // Only add if not already in list (for multi-tab sync)
        setNotifications(prev => {
          if (prev.find(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      } else if (event.data.type === 'MARK_READ') {
        setNotifications(prev => prev.map(n => n.id === event.data.id ? { ...n, read: true } : n));
      } else if (event.data.type === 'MARK_ALL_READ') {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    };
    return () => {
      // broadcast.close(); // Don't close on every render
    };
  }, [broadcast]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    broadcast.postMessage({ type: 'NEW_NOTIFICATION', notification: newNotification });
  }, [broadcast]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    broadcast.postMessage({ type: 'MARK_READ', id });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    broadcast.postMessage({ type: 'MARK_ALL_READ' });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('satdapus_notifications');
  };

  // All notifications are global and apply to all accounts
  const filteredNotifications = notifications;

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications: filteredNotifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
