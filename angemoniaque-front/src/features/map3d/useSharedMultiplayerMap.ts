import { useEffect } from 'react';
import { apiClient } from '../../shared/api/httpClient';

interface UseSharedMultiplayerMapParams {
  characterId: string;
  onViewportLoaded: (viewportData: any) => void;
  onRemoteEntityUpdated: (event: any) => void;
}

export function useSharedMultiplayerMap({
  characterId,
  onViewportLoaded,
  onRemoteEntityUpdated,
}: UseSharedMultiplayerMapParams) {
  useEffect(() => {
    if (!characterId) return;

    let isMounted = true;
    apiClient(`/map/vision/${characterId}`)
      .then((data) => {
        if (isMounted && data) onViewportLoaded(data);
      })
      .catch(() => {});

    let socket: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWs = `${protocol}//${window.location.host}/ws`;
      const wsBase = (import.meta as any).env?.VITE_WS_URL || defaultWs;
      const sep = wsBase.includes('?') ? '&' : '?';
      socket = new WebSocket(`${wsBase}${sep}characterId=${characterId}`);

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data);
          if (isMounted) onRemoteEntityUpdated(event);
        } catch {
          // Ignore les trames malformées
        }
      };

      socket.onerror = () => {
        // Ignore silencieusement les erreurs WS en local
      };
    } catch {
      // Ignore si l'URL WebSocket est invalide
    }

    return () => {
      isMounted = false;
      if (socket && socket.readyState <= 1) {
        socket.close();
      }
    };
  }, [characterId, onViewportLoaded, onRemoteEntityUpdated]);
}