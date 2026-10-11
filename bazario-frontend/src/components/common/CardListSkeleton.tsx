import { Box, Paper, Skeleton } from '@mui/material';

interface Props {
  rows?: number;
}

/** Skeleton placeholder for vertical card-list pages (e.g. order history). */
export default function CardListSkeleton({ rows = 5 }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Paper key={i} sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="55%" height={20} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
          <Skeleton variant="rounded" width={88} height={26} sx={{ borderRadius: 2 }} />
        </Paper>
      ))}
    </Box>
  );
}
