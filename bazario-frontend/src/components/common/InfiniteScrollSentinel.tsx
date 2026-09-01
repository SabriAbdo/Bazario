import { useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface Props {
  onIntersect: () => void;
  hasMore: boolean;
  loading?: boolean;
}

export default function InfiniteScrollSentinel({ onIntersect, hasMore, loading }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasMore, onIntersect]);

  return (
    <Box ref={ref} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      {loading && <CircularProgress size={28} />}
    </Box>
  );
}
