import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'sale' | 'order' | 'stock' | 'system';
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const notifs: Notification[] = [];

      // 1. Notificações normais da tabela notifications
      try {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (dbNotifs) {
          notifs.push(...dbNotifs);
        }
      } catch (err) {
        // Silencioso se tabela tiver restrição RLS
      }

      // 2. Se for admin, gestor ou dono, carregar os Alertas Internos de Fraude
      const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';
      if (isAdminOrOwner) {
        const fraudAlerts = await businessRules.getFraudAlerts();
        fraudAlerts.forEach((a: any) => {
          notifs.push({
            id: a.id,
            user_id: user.id,
            title: a.title,
            message: a.description,
            type: 'system',
            is_read: !!a.isRead,
            created_at: a.timestamp
          });
        });
      }

      // Ordenar por mais recente
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Sincroniza a cada 30s
    return () => clearInterval(interval);
  }, [user, profile]);

  const markAsRead = async (id: string) => {
    try {
      // Se for alerta do localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const localAlerts = JSON.parse(localStorage.getItem('system_fraud_alerts') || '[]');
        const updated = localAlerts.map((a: any) => a.id === id ? { ...a, isRead: true } : a);
        localStorage.setItem('system_fraud_alerts', JSON.stringify(updated));
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const localAlerts = JSON.parse(localStorage.getItem('system_fraud_alerts') || '[]');
        const updated = localAlerts.map((a: any) => ({ ...a, isRead: true }));
        localStorage.setItem('system_fraud_alerts', JSON.stringify(updated));
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
