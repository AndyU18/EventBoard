import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useEventStore } from '../store/useEventStore';
import { useAuthStore } from '../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = () => {
  const addEvent = useEventStore((state) => state.addEvent);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      console.log('🔌 Conectado al servidor de WebSockets');
    });

    socket.on('event_received', (event) => {
      console.log('📡 Evento recibido por WebSocket:', event);
      addEvent(event);

      // Si es una alerta crítica o advertencia, refrescar notificaciones y estadísticas
      if (event.severity === 'CRITICAL' || event.severity === 'WARNING' || (event.type && event.type.startsWith('SYSTEM_ALERT'))) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['event-stats'] });
        }, 500);
      } else {
        queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor de WebSockets');
    });

    return () => {
      socket.off('connect');
      socket.off('event_received');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [isAuthenticated, addEvent, queryClient]);
};
