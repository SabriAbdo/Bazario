import { TableRow, TableCell, Skeleton } from '@mui/material';

interface Props {
  rows?: number;
  cols: number;
  /** Column index that should render a square image skeleton */
  imageCol?: number;
}

export default function TableSkeleton({ rows = 5, cols, imageCol }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} sx={{ py: imageCol === j ? 0.75 : 1.5 }}>
              {imageCol === j ? (
                <Skeleton variant="rectangular" width={52} height={52} sx={{ borderRadius: 1.5 }} />
              ) : (
                <Skeleton variant="text" height={22}
                  width={j === cols - 1 ? '55%' : j % 2 === 0 ? '80%' : '60%'} />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
