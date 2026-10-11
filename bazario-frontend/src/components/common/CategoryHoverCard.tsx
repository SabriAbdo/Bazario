/**
 * Wraps a category tile (anywhere in the app) with a rich hover popup showing the
 * category's picture, title and description — so users get more context without navigating.
 */
import type { ReactElement } from 'react';
import { Box, Tooltip, Typography, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { resolveImageUrl } from '@/utils/categoryDisplay';

const CategoryTooltip = styled(({ className, ...props }: React.ComponentProps<typeof Tooltip>) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[8],
    borderRadius: 12,
    padding: 0,
    maxWidth: 260,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

interface Props {
  label: string;
  imageUrl?: string;
  description?: string;
  children: ReactElement;
}

export default function CategoryHoverCard({ label, imageUrl, description, children }: Props) {
  return (
    <CategoryTooltip
      enterDelay={350}
      title={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1.5, gap: 1 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {imageUrl
              ? <Box component="img" src={resolveImageUrl(imageUrl)} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <ImageNotSupportedIcon fontSize="small" color="disabled" />}
          </Box>
          <Typography variant="subtitle2" fontWeight={700} textAlign="center">{label}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.4 }}>
              {description}
            </Typography>
          )}
        </Box>
      }
    >
      {children}
    </CategoryTooltip>
  );
}
