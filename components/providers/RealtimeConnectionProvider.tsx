'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/clients';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface RealtimeConnectionContextType {
  status: ConnectionStatus;
  isOnline: boolean;
  retryCount: number;
}

const RealtimeConnectionContext = createContext<RealtimeConnectionContextType>({
  status: 'connected',
  isOnline: true,
  retryCount: 0,
});

export function useRealtimeConnection() {
  return useContext(RealtimeConnectionContext);
}

interface RealtimeConnectionProviderProps {
  children: ReactNode;
}

export function RealtimeConnectionProvider({ children }: RealtimeConnectionProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    
    // Monitor browser online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('connected');
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    // Monitor Supabase realtime connection
    const channel = supabase
      .channel('connection-monitor')
      .on('system', {}, (payload) => {
        console.log('🔌 Realtime system event:', payload);
        if (payload.extension === 'postgres_changes') {
          setStatus('connected');
          setRetryCount(0);
        }
      })
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setRetryCount(0);
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
        } else if (status === 'TIMED_OUT') {
          setStatus('reconnecting');
          setRetryCount(prev => prev + 1);
        }
      });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <RealtimeConnectionContext.Provider value={{ status, isOnline, retryCount }}>
      {children}
    </RealtimeConnectionContext.Provider>
  );
}