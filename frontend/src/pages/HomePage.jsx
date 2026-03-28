import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Stack, Divider, Grid, Card, CardContent, Grow, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BoltIcon from '@mui/icons-material/Bolt';
import LoopIcon from '@mui/icons-material/Loop';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const HomePage = () => {
  const navigate = useNavigate();
  const algos = [
    {
      key: 'FCFS',
      title: 'FCFS',
      desc: 'Processes are scheduled in the order they arrive. Simple but may cause long waiting times for shorter jobs.',
      Icon: AccessTimeIcon,
    },
    {
      key: 'SJF',
      title: 'SJF',
      desc: 'Shortest Job First. Chooses process with smallest burst; efficient but can starve long jobs.',
      Icon: BoltIcon,
    },
    {
      key: 'RR',
      title: 'RR',
      desc: 'Round Robin. Each process gets equal CPU time slice; good for time-sharing systems.',
      Icon: LoopIcon,
    },
    {
      key: 'PRIORITY',
      title: 'PRIORITY',
      desc: 'Higher-priority processes run first; may cause starvation unless aging used.',
      Icon: PriorityHighIcon,
    },
    {
      key: 'DABP',
      title: 'DABP',
      desc: 'Custom algorithm combining dynamic aging and burst prediction to improve fairness and adaptability.',
      Icon: AutoGraphIcon,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, textAlign: 'center' }}>
      {/* Hero */}
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 800,
            letterSpacing: 0.3,
            textShadow: '0 1px 0 rgba(0,0,0,0.08)',
          }}
        >
          Welcome
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Run and compare CPU scheduling algorithms on simple workloads.
        </Typography>
      </Box>

      {/* Algorithms as subtle animated cards */}
      <Grid container spacing={2} sx={{ textAlign: 'left', mb: 4 }}>
        {algos.map((a, idx) => (
          <Grid key={a.key} item xs={12} sm={6} md={4} lg={4}>
            <Grow in timeout={400 + idx * 120}>
              <Card elevation={1} sx={{ height: '100%', borderRadius: 2, p: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <a.Icon color="primary" />
                    <Typography variant="h6">{a.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{a.desc}</Typography>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* How to Use */}
      <Box sx={{ textAlign: 'left', maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>How to Use the Simulator</Typography>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="1" size="small" color="primary" />
            <Typography>Choose an algorithm.</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="2" size="small" color="primary" />
            <Typography>Add process details (PID, arrival, burst, priority).</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="3" size="small" color="primary" />
            <Typography>Optionally adjust algorithm parameters.</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="4" size="small" color="primary" />
            <Typography>Click <strong>Run Simulation</strong> to view results or <strong>Compare Algorithms</strong> to evaluate all.</Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Primary action */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5 }} justifyContent="center">
        <Button size="large" variant="contained" onClick={() => navigate('/simulate')} sx={{ borderRadius: 3 }}>
          Run Simulation
        </Button>
      </Stack>
    </Box>
  );
};

export default HomePage;
