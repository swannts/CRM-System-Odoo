import axios from 'src/utils/axios';

export type NotificationRecord = {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  isSeen: boolean;
  isArchived: boolean;
  avatarUrl: string | null;
  metadata: Record<string, unknown>;
};

function normalizeNotification(item: any): NotificationRecord {
  return {
    id: String(item?.id || ''),
    type: String(item?.type || 'system'),
    category: String(item?.category || 'General'),
    title: String(item?.title || 'Notification'),
    body: String(item?.body || ''),
    createdAt: String(item?.created_at || item?.createdAt || new Date().toISOString()),
    isRead: Boolean(item?.is_read ?? item?.isRead),
    isSeen: Boolean(item?.is_seen ?? item?.isSeen),
    isArchived: Boolean(item?.is_archived ?? item?.isArchived),
    avatarUrl: typeof item?.metadata?.avatarUrl === 'string' ? item.metadata.avatarUrl : null,
    metadata: typeof item?.metadata === 'object' && item?.metadata !== null ? item.metadata : {},
  };
}

export async function getNotifications(filters?: {
  archived?: boolean;
  unread?: boolean;
  limit?: number;
}) {
  const response = await axios.get('/api/notifications', {
    params: {
      archived: typeof filters?.archived === 'boolean' ? String(filters.archived) : undefined,
      unread: typeof filters?.unread === 'boolean' ? String(filters.unread) : undefined,
      limit: filters?.limit ?? 50,
    },
  });

  const data = Array.isArray(response.data?.data) ? response.data.data : [];
  return data.map(normalizeNotification);
}

export async function getNotificationTotals() {
  const response = await axios.get('/api/notification/total');
  const data = response.data?.data ?? {};

  return {
    all: Number(data?.all || 0),
    unread: Number(data?.unread || 0),
    archived: Number(data?.archived || 0),
    categories: Array.isArray(data?.categories) ? data.categories : [],
  };
}

export async function markNotificationsRead(ids?: string[]) {
  await axios.post('/api/notification/read', { ids: ids || [] });
}

export async function archiveNotifications(ids?: string[]) {
  await axios.post('/api/notification/archive', { ids: ids || [] });
}

export async function unarchiveNotifications(ids?: string[]) {
  await axios.post('/api/notification/unarchive', { ids: ids || [] });
}

export async function markNotificationSeen(id: string) {
  await axios.post(`/api/notification/mark-seen/${encodeURIComponent(id)}`);
}

export const notificationService = {
  getNotifications,
  getNotificationTotals,
  markNotificationsRead,
  archiveNotifications,
  unarchiveNotifications,
  markNotificationSeen,
};
