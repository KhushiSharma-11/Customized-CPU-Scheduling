import React from 'react';
import { Grid, TextField } from '@mui/material';

export default function ParamsForm({ algorithm, params, setParams }) {
  const handle = (k, v) => setParams({ ...params, [k]: v });
  return (
    <Grid container spacing={2}>
      {algorithm === 'RR' && (
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Quantum (rr_q)" type="number"
            value={params.rr_q ?? 4}
            onChange={e => handle('rr_q', Number(e.target.value))} />
        </Grid>
      )}
      {algorithm === 'DABP' && (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Alpha" type="number" inputProps={{ step: '0.1' }}
              value={params.alpha ?? 0.5}
              onChange={e => handle('alpha', Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Gamma" type="number" inputProps={{ step: '0.1' }}
              value={params.gamma ?? 0.2}
              onChange={e => handle('gamma', Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="SJF Weight" type="number" inputProps={{ step: '0.1' }}
              value={params.sjf_weight ?? 1.0}
              onChange={e => handle('sjf_weight', Number(e.target.value))} />
          </Grid>
        </>
      )}
    </Grid>
  );
}
