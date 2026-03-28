import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import HomePage from './HomePage';
import SimulationPage from './SimulationPage';
import ResultsPage from './ResultsPage';
import ComparePage from './ComparePage';

const App = () => {
  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ justifyContent: 'center', py: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'inherit',
              textAlign: 'center',
              fontWeight: 800,
              letterSpacing: 0.4,
              textShadow: '0 1px 1px rgba(0,0,0,0.18)',
              lineHeight: 1.25,
            }}
          >
            Custom CPU Scheduling with Dynamic Aging and Burst Prediction
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 6, mb: 6 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulate" element={<SimulationPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </Container>
    </>
  );
};

export default App;
