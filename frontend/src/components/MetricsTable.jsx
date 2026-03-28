import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

export default function MetricsTable({ metrics }) {
  if (!metrics) return null;
  const entries = Object.entries(metrics);
  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow>
          <TableCell>Metric</TableCell>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map(([k, v]) => (
          <TableRow key={k}>
            <TableCell>{k}</TableCell>
            <TableCell>{String(v)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
