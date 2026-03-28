import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

/*
  Minimal SVG Gantt from timeline segments [{pid, start, end}].
  Renders horizontal bars scaled to makespan; color by pid.
*/
export default function GanttChartView({ timeline }) {
  const { makespan, bars } = useMemo(() => {
    if (!Array.isArray(timeline) || timeline.length === 0) return { makespan: 0, bars: [] };
    const ms = timeline[timeline.length - 1].end;
    const rows = [];
    const yMap = new Map();
    let nextY = 0;
    for (const seg of timeline) {
      const pid = seg.pid || 'IDLE';
      if (!yMap.has(pid)) {
        yMap.set(pid, nextY);
        nextY += 1;
      }
      rows.push({ ...seg, y: yMap.get(pid) });
    }
    return { makespan: ms, bars: rows };
  }, [timeline]);

  if (!makespan) {
    return <Typography variant="body2">No timeline.</Typography>;
  }

  const width = 800;
  const rowH = 24;
  const height = (Math.max(...bars.map(b => b.y), 0) + 1) * (rowH + 6) + 30;

  const colorFor = (pid) => {
    if (pid === 'IDLE') return '#ccc';
    // simple hash to color
    let h = 0; for (let i = 0; i < pid.length; i++) h = (h * 31 + pid.charCodeAt(i)) >>> 0;
    const hue = h % 360; return `hsl(${hue} 70% 60%)`;
  };

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid #eee', p: 1 }}>
      <svg width={width} height={height} role="img" aria-label="Gantt Chart">
        {/* axes */}
        <line x1={40} y1={10} x2={40} y2={height - 20} stroke="#999" />
        <line x1={40} y1={height - 20} x2={width - 10} y2={height - 20} stroke="#999" />
        {/* ticks */}
        {Array.from({ length: makespan + 1 }).map((_, t) => {
          const x = 40 + (t / makespan) * (width - 60);
          const showLabel = t % Math.max(1, Math.floor(makespan / 10)) === 0 || t === makespan;
          return (
            <g key={t}>
              <line x1={x} y1={height - 20} x2={x} y2={height - 25} stroke="#999" />
              {showLabel && (
                <text x={x} y={height - 5} fontSize={10} textAnchor="middle">{t}</text>
              )}
            </g>
          );
        })}
        {/* labels and bars */}
        {bars.map((b, i) => {
          const x1 = 40 + (b.start / makespan) * (width - 60);
          const x2 = 40 + (b.end / makespan) * (width - 60);
          const y = 20 + b.y * (rowH + 6);
          return (
            <g key={i}>
              <text x={5} y={y + rowH * 0.7} fontSize={12}>{b.pid}</text>
              <rect x={x1} y={y} width={Math.max(1, x2 - x1)} height={rowH} fill={colorFor(b.pid)} rx={4} />
              <text x={(x1 + x2) / 2} y={y + rowH * 0.7} fontSize={11} textAnchor="middle" fill="#222">{b.pid}</text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
