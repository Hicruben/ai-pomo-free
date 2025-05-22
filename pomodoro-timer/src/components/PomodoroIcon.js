import React from 'react';
import styled from 'styled-components';

// Tomato emoji icon - red for completed pomodoros, grey for incomplete
export const TomatoSVG = ({ size = 16, color = "#bbb" }) => (
  <span style={{
    fontSize: `${Math.max(size, 18)}px`,
    opacity: 1,
    marginRight: '2px',
    textShadow: '0 1px 2px rgba(0,0,0,0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color === "#d95550" ? '#e11d48' : '#888', // Use red for completed, grey for incomplete
    filter: color === "#d95550" ? 'none' : 'grayscale(100%)' // Apply grayscale filter for incomplete pomodoros
  }}>
    🍅
  </span>
);

export const PomodoroIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

export default TomatoSVG;
