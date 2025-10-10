'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRealtimeConnection } from '@/components/providers/RealtimeConnectionProvider';

interface ConnectionIndicatorProps {
  className?: string;
}

export default function ConnectionIndicator({ className = '' }: ConnectionIndicatorProps) {
  const { status, isOnline, retryCount } = useRealtimeConnection();

  if (isOnline && status === 'connected') {
    return null; // Don't show anything when everything is working
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-700/50',
        message: 'Offline - Check your connection',
      };
    }

    switch (status) {
      case 'reconnecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-700/50',
          message: `Reconnecting... (${retryCount})`,
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700/50',
          message: 'Connection error - Some features may be delayed',
        };
      default:
        return {
          icon: Wifi,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-700/50',
          message: 'Connected',
        };
    }
  };

  const { icon: Icon, color, bgColor, borderColor, message } = getStatusInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${bgColor} ${borderColor} ${color} text-xs sm:text-sm ${className}`}
    >
      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>{message}</span>
      {status === 'reconnecting' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </motion.div>
      )}
    </motion.div>
  );
}