import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import GanttChartView from '../components/GanttChartView';
import MetricsTable from '../components/MetricsTable';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = state || {};
  const metrics = data.metrics || {};
  const gantt = data.gantt_ascii || '';
  const timeline = data.timeline || [];
  const perProcess = data.per_process || {};

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Results</Typography>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/simulate')}>Back to Simulation</Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Gantt (SVG)</Typography>
        <GanttChartView timeline={timeline} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Metrics</Typography>
        <MetricsTable metrics={metrics} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Per-Process Metrics</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PID</TableCell>
              <TableCell align="right">arrival</TableCell>
              <TableCell align="right">burst</TableCell>
              <TableCell align="right">priority</TableCell>
              <TableCell align="right">completion</TableCell>
              <TableCell align="right">turnaround</TableCell>
              <TableCell align="right">waiting</TableCell>
              <TableCell align="right">response</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(perProcess).sort((a,b) => String(a[0]).localeCompare(String(b[0]))).map(([pid, row]) => (
              <TableRow key={pid}>
                <TableCell>{pid}</TableCell>
                <TableCell align="right">{row.arrival}</TableCell>
                <TableCell align="right">{row.burst}</TableCell>
                <TableCell align="right">{row.priority}</TableCell>
                <TableCell align="right">{row.completion}</TableCell>
                <TableCell align="right">{row.turnaround}</TableCell>
                <TableCell align="right">{row.waiting}</TableCell>
                <TableCell align="right">{row.response}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Timeline (raw)</Typography>
        <pre style={{ background: '#fafafa', padding: 12, overflowX: 'auto', margin: 0 }}>
          {JSON.stringify(timeline, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default ResultsPage;
