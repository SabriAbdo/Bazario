import { useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, Tooltip } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '@/api/notificationApi';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/formatCurrency';

const POLL_INTERVAL_MS = 20000;

function lastSeenKey(username: string) {
  return `bazario-notif-last-seen-${username}`;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [lastSeenId, setLastSeenId] = useState<number>(() =>
    Number(localStorage.getItem(lastSeenKey(user?.username ?? ''))) || 0
  );

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: notificationApi.getRecent,
    refetchInterval: POLL_INTERVAL_MS,
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => n.id > lastSeenId).length;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    const maxId = notifications.reduce((max, n) => Math.max(max, n.id), lastSeenId);
    if (maxId > lastSeenId && user) {
      localStorage.setItem(lastSeenKey(user.username), String(maxId));
      setLastSeenId(maxId);
    }
  };

  const handleNotificationClick = (orderId: number) => {
    navigate(`/operateur/commandes?orderId=${orderId}`);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('nav.notifications')}>
        <IconButton onClick={handleOpen} size="small">
          <Badge badgeContent={unreadCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} PaperProps={{ sx: { width: 340, maxHeight: 420 } }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {t('nav.notifications')}
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t('nav.no_notifications')}
            </Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleNotificationClick(n.orderId)}
              sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1 }}
            >
              <Box>
                <Typography variant="body2" fontWeight={n.id > lastSeenId ? 700 : 400}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(n.createdAt)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
