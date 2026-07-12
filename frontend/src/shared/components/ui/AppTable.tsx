import Paper from '@mui/material/Paper';
import Table, { type TableProps } from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';

export interface AppTableProps extends TableProps {
  readonly maxHeight?: number | string;
}

export function AppTable({ children, maxHeight, ...tableProps }: AppTableProps) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight }}>
      <Table stickyHeader {...tableProps}>
        {children}
      </Table>
    </TableContainer>
  );
}
