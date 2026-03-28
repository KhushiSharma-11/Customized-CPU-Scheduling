import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, TextField, Button, Stack } from '@mui/material';

export default function ProcessTable({ processes, setProcesses }) {
  const handleChange = (index, field, value) => {
    const updated = [...processes];
    updated[index][field] = value;
    setProcesses(updated);
  };
  const addRow = () => setProcesses([...processes, { pid: `P${processes.length+1}`, arrival: 0, burst: 0, priority: 1 }]);
  const removeRow = (i) => setProcesses(processes.filter((_, idx) => idx !== i));

  const validate = (p) => {
    const errs = {};
    if (!p.pid || String(p.pid).trim() === '') errs.pid = 'PID required';
    if (p.arrival === '' || isNaN(p.arrival) || Number(p.arrival) < 0) errs.arrival = '>= 0';
    if (p.burst === '' || isNaN(p.burst) || Number(p.burst) <= 0) errs.burst = '> 0';
    if (p.priority === '' || isNaN(p.priority)) errs.priority = 'integer';
    return errs;
  };

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>PID</TableCell>
            <TableCell>Arrival</TableCell>
            <TableCell>Burst</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((p, i) => {
            const e = validate(p);
            return (
            <TableRow key={i}>
              <TableCell width={150}>
                <TextField size="small" value={p.pid}
                  error={!!e.pid}
                  helperText={e.pid || ''}
                  onChange={ev => handleChange(i, 'pid', ev.target.value)} />
              </TableCell>
              <TableCell width={150}>
                <TextField size="small" type="number" value={p.arrival}
                  error={!!e.arrival}
                  helperText={e.arrival || ''}
                  onChange={ev => handleChange(i, 'arrival', ev.target.value === '' ? '' : Number(ev.target.value))} />
              </TableCell>
              <TableCell width={150}>
                <TextField size="small" type="number" value={p.burst}
                  error={!!e.burst}
                  helperText={e.burst || ''}
                  onChange={ev => handleChange(i, 'burst', ev.target.value === '' ? '' : Number(ev.target.value))} />
              </TableCell>
              <TableCell width={150}>
                <TextField size="small" type="number" value={p.priority}
                  error={!!e.priority}
                  helperText={e.priority || ''}
                  onChange={ev => handleChange(i, 'priority', ev.target.value === '' ? '' : Number(ev.target.value))} />
              </TableCell>
              <TableCell>
                <Button color="error" onClick={() => removeRow(i)}>Delete</Button>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
      <Stack direction="row" sx={{ mt: 1 }}>
        <Button onClick={addRow}>Add Process</Button>
      </Stack>
    </>
  );
}
