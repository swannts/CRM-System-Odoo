import { useRef, useEffect } from 'react';

import { socketClient } from 'src/utils/socket';

export function useSocket(orgId?: string, onEvent?: (event: string, data: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!orgId) return;

    const token = sessionStorage.getItem('accessToken') || '';
    const socket = socketClient.connect(token, orgId);

    const handleTokenRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string; orgId?: string }>).detail;
      if (detail?.token && detail.orgId === orgId) socketClient.connect(detail.token, orgId);
    };
    window.addEventListener('auth-token-refreshed', handleTokenRefresh);

    const handleAny = (event: string, ...args: any[]) => {
      onEventRef.current?.(event, args[0]);
    };

    socket.onAny(handleAny);

    return () => {
      socket.offAny(handleAny);
      window.removeEventListener('auth-token-refreshed', handleTokenRefresh);
    };
  }, [orgId]);

  return socketClient.getSocket();
}
