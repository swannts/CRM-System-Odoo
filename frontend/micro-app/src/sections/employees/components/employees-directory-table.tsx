import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Employee, formatEmployeeName } from '../types';

type Props = {
  rows: Employee[];
  onEdit: (employee: Employee) => void;
  onArchive: (employee: Employee) => void;
};

export function EmployeesDirectoryTable({ rows, onEdit, onArchive }: Props) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Job title</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Employment type</TableCell>
            <TableCell>Start date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((employee) => (
            <TableRow key={employee.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar src={employee.avatarUrl}>{formatEmployeeName(employee).charAt(0)}</Avatar>
                  <Typography variant="body2">{formatEmployeeName(employee)}</Typography>
                </Box>
              </TableCell>
              <TableCell>{employee.email || 'Unavailable'}</TableCell>
              <TableCell>{employee.phone || 'Unavailable'}</TableCell>
              <TableCell>{employee.jobTitle || 'Unavailable'}</TableCell>
              <TableCell>{employee.departmentName || 'Unavailable'}</TableCell>
              <TableCell>
                <Chip size="small" label={employee.status ? employee.status.replace('_', ' ') : 'Unavailable'} />
              </TableCell>
              <TableCell>{employee.employmentType ? employee.employmentType.replace('_', ' ') : 'Unavailable'}</TableCell>
              <TableCell>{employee.startDate || 'Unavailable'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onEdit(employee)}>
                  Edit
                </Button>
                <Button size="small" color="warning" onClick={() => onArchive(employee)}>
                  Archive
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
