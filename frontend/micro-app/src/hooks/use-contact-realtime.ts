import { useState, useEffect } from 'react';
import { useAppDispatch } from 'src/store/hooks';
import { fetchContactById } from 'src/store/slices/contact-slice';
import { useAuthContext } from 'src/auth/hooks';
import { useSocket } from './use-socket';

export function useContactRealtime(contactId: string, orgId: string) {
  const socket = useSocket(orgId);
  const dispatch = useAppDispatch();
  const { user } = useAuthContext();
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const userId = user?.id ? String(user.id) : '';
  const userName = (user?.fullName || user?.username || user?.email || '').trim();

  useEffect(() => {
    if (!socket || !contactId || !userId || !userName) return;

    // Join the contact room
    socket.emit('join-contact', {
      contactId,
      userId,
      userName,
    });

    // Listen for presence events
    const handlePresence = (data: any) => {
      if (data.contactId === contactId) {
        setActiveUsers((current) => {
          const exists = current.find((u) => u.userId === data.userId);
          if (exists) {
            return current.map((u) => (u.userId === data.userId ? data : u));
          }
          return [...current, data];
        });
      }
    };

    // Listen for updates
    const handleUpdated = (data: any) => {
      if (data.contactId === contactId) {
        // Dispatch action to refetch fresh data from Odoo
        dispatch(fetchContactById(contactId));
      }
    };

    socket.on('contact:presence', handlePresence);
    socket.on('contact:updated', handleUpdated);

    return () => {
      socket.off('contact:presence', handlePresence);
      socket.off('contact:updated', handleUpdated);
    };
  }, [socket, contactId, dispatch, userId, userName]);

  const notifyEditing = () => {
    if (socket && contactId && userId && userName) {
      socket.emit('contact:editing', {
        contactId,
        userId,
        userName,
      });
    }
  };

  const notifyUpdate = (updates: any) => {
    if (socket && contactId && userId && userName) {
      socket.emit('contact:update', {
        contactId,
        userId,
        updates,
      });
    }
  };

  return {
    activeUsers,
    notifyEditing,
    notifyUpdate,
  };
}
