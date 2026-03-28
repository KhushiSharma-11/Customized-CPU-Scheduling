import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Alert, Divider, Button, Stack } from '@mui/material';
import GanttChartView from '../components/GanttChartView';

export default function ComparePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || [];

  const best = useMemo(() => {
    const valid = results.filter(r => r.data && r.data.metrics);
    if (valid.length === 0) return null;
    // choose by lowest avg_turnaround, tie-breaker avg_waiting
    const sorted = [...valid].sort((a, b) => {
      const ma = a.data.metrics, mb = b.data.metrics;
      if (ma.avg_turnaround !== mb.avg_turnaround) return ma.avg_turnaround - mb.avg_turnaround;
      return ma.avg_waiting - mb.avg_waiting;
    });
    const top = sorted[0];
    return { algo: top.algo, tat: top.data.metrics.avg_turnaround };
  }, [results]);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Compare Algorithms</Typography>
        <Button size="small" variant="outlined" onClick={() => navigate('/simulate')}>Back to Simulation</Button>
      </Stack>
      {results.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No comparison data. Please use "Compare Algorithms" from the Simulation page.
        </Alert>
      )}

      {best && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Best Algorithm: <strong>{best.algo}</strong> (lowest avg turnaround: {best.tat})
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box>
        <Table size="small" aria-label="comparison table">
          <TableHead>
            <TableRow>
              <TableCell>Algorithm</TableCell>
              <TableCell align="right">avg_turnaround</TableCell>
              <TableCell align="right">avg_waiting</TableCell>
              <TableCell align="right">avg_response</TableCell>
              <TableCell align="right">throughput</TableCell>
              <TableCell align="right">cpu_utilization</TableCell>
              <TableCell align="right">preemptions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r, idx) => {
              const metrics = r.data?.metrics;
              const isBest = best && r.algo === best.algo;
              return (
                <TableRow key={idx} sx={isBest ? { backgroundColor: '#e8f5e9' } : {}}>
                  <TableCell>{r.algo}</TableCell>
                  <TableCell align="right">{metrics ? metrics.avg_turnaround : '-'}</TableCell>
                  <TableCell align="right">{metrics ? metrics.avg_waiting : '-'}</TableCell>
                  <TableCell align="right">{metrics ? metrics.avg_response : '-'}</TableCell>
                  <TableCell align="right">{metrics ? metrics.throughput : '-'}</TableCell>
                  <TableCell align="right">{metrics ? metrics.cpu_utilization : '-'}</TableCell>
                  <TableCell align="right">{metrics ? metrics.preemptions : '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle1" gutterBottom>Gantt Charts</Typography>
        {results.map((r, i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}><strong>{r.algo}</strong></Typography>
            <GanttChartView timeline={r.data?.timeline || []} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
