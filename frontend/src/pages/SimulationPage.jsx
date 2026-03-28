import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Box, Button, Grid, MenuItem, Select, InputLabel, FormControl, Typography, Alert, Divider, Stack } from '@mui/material';
import ProcessTable from '../components/ProcessTable';
import ParamsForm from '../components/ParamsForm';

const algoOptions = ['FCFS', 'SJF', 'RR', 'PRIORITY', 'DABP'];
const ALGOS = ['FCFS', 'SJF', 'RR', 'PRIORITY', 'DABP'];

const defaultProcesses = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 2 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1 },
];

const SimulationPage = () => {
  const navigate = useNavigate();
  const [algorithm, setAlgorithm] = useState('DABP');
  const [processes, setProcesses] = useState(defaultProcesses);
  const [params, setParams] = useState({ rr_q: 4, alpha: 0.5, gamma: 0.2, sjf_weight: 1.0 });
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  // Validation: disable run if any process invalid
  const hasInvalid =
    processes.length === 0 ||
    processes.some(p => !p.pid || String(p.pid).trim() === '' || Number(p.arrival) < 0 || Number(p.burst) <= 0 || isNaN(p.priority));

  const loadSample = async () => {
    setError('');
    try {
      const res = await api.get('/workloads');
      const items = res?.data?.workloads || [];
      const first = items.find(it => it?.data?.processes);
      if (first) {
        const procs = first.data.processes.map(p => ({
          pid: String(p.pid),
          arrival: Number(p.arrival),
          burst: Number(p.burst),
          priority: Number(p.priority ?? 0),
        }));
        setProcesses(procs);
      } else {
        setError('No sample workloads found.');
      }
    } catch (e) {
      setError('Failed to load workloads');
    }
  };

  const runSimulation = async () => {
    setError('');
    setLoading(true);
    try {
      const body = {
        algorithm,
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')),
        workload: {
          processes: processes.map(p => ({
            pid: String(p.pid),
            arrival: Number(p.arrival),
            burst: Number(p.burst),
            priority: Number(p.priority ?? 0),
          })),
        },
      };
      const res = await api.post('/simulate', body);
      navigate('/results', { state: res.data });
    } catch (e) {
      setError('Invalid input or server error. Check values and try again.');
    } finally {
      setLoading(false);
    }
  };

  const compareAll = async () => {
    setError('');
    setComparing(true);
    try {
      const workload = {
        processes: processes.map(p => ({
          pid: String(p.pid),
          arrival: Number(p.arrival),
          burst: Number(p.burst),
          priority: Number(p.priority ?? 0),
        })),
      };
      const calls = ALGOS.map(algo => {
        const body = { algorithm: algo, params, workload };
        return api.post('/simulate', body)
          .then(r => ({ algo, data: r.data }))
          .catch(err => ({ algo, error: err?.message || 'error' }));
      });
      const results = await Promise.all(calls);
      navigate('/compare', { state: { results } });
    } catch (e) {
      setError('Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Simulation</Typography>
        <Button size="small" variant="outlined" onClick={() => navigate('/')}>Home</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="algo-label">Algorithm</InputLabel>
            <Select labelId="algo-label" label="Algorithm" value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
              {algoOptions.map(a => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" gutterBottom>Processes</Typography>
        <Typography role="button" tabIndex={0} onClick={loadSample} onKeyDown={(e) => e.key==='Enter' && loadSample()} sx={{ cursor: 'pointer' }} color="primary" variant="body2">
          Load Sample Workload
        </Typography>
      </Stack>
      <ProcessTable processes={processes} setProcesses={setProcesses} />

      <Divider sx={{ my: 4 }} />

      <Typography variant="subtitle1" gutterBottom>Parameters</Typography>
      <ParamsForm algorithm={algorithm} params={params} setParams={setParams} />

      <Box mt={4} textAlign="center">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button size="large" variant="contained" color="primary" onClick={runSimulation} disabled={loading || comparing || hasInvalid} sx={{ borderRadius: 3 }}>
            {loading ? 'Running...' : 'Run Simulation'}
          </Button>
          <Button size="large" variant="outlined" color="secondary" onClick={compareAll} disabled={comparing || hasInvalid} sx={{ borderRadius: 3 }}>
            {comparing ? 'Comparing...' : 'Compare Algorithms'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default SimulationPage;
