'use client';

import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect?: () => void;
}

export function ConnectionStatus({ isConnected, isConnecting, onReconnect }: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Bağlanıyor...';
    return isConnected ? 'Bağlı' : 'Bağlantı Yok';
  };

  const getIcon = () => {
    if (isConnecting) {
      return <RotateCcw className="h-4 w-4 animate-spin" />;
    }
    return isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
  };

  const getTooltip = () => {
    if (isConnecting) return 'WebSocket sunucusuna bağlanıyor...';
    if (isConnected) return 'WebSocket bağlantısı aktif - Anlık test sonuçları alıyorsunuz';
    return 'WebSocket bağlantısı yok - Anlık bildirimler çalışmıyor. Backend server\'ın çalıştığından emin olun.';
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div 
        className={`flex items-center space-x-1 ${getStatusColor()}`}
        title={getTooltip()}
      >
        {getIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </div>
      
      {!isConnected && !isConnecting && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs text-blue-500 hover:text-blue-600 underline"
          title="WebSocket bağlantısını yeniden dene"
        >
          Yeniden Bağlan
        </button>
      )}
    </div>
  );
}
