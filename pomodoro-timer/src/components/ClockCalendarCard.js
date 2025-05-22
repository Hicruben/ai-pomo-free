import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Google Fonts: Orbitron (digital style)
const FontStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
`;

const ClockCalendarCard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time as digital, with AM/PM
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 => 12
    return {
      time: [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':'),
      ampm
    };
  };

  // Format date as: WED - 7 MAY 2025
  const formatDate = (date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = days[date.getDay()];
    const d = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} - ${d} ${month} ${year}`;
  };

  const { time, ampm } = formatTime(currentTime);
  const dateStr = formatDate(currentTime);

  return (
    <>
      <FontStyle />
      <DigitalCard>
        <Label>Time Now</Label>
        <TimeRow>
          <TimeDisplay>{time}</TimeDisplay>
          <AMPM>{ampm}</AMPM>
        </TimeRow>
        <DateDisplay>{dateStr}</DateDisplay>
      </DigitalCard>
    </>
  );
};

const DigitalCard = styled.div`
  background: #111;
  color: #FFA500;
  border-radius: 18px;
  box-shadow: 0 4px 32px #000a;
  padding: 2.5rem 1.5rem 2rem 1.5rem;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Label = styled.div`
  font-size: 1.5rem;
  color: #FFA500;
  margin-bottom: 1.5rem;
  font-family: 'Orbitron', 'Consolas', monospace;
  letter-spacing: 1px;
`;

const TimeRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
`;

const TimeDisplay = styled.div`
  font-family: 'Orbitron', 'Consolas', monospace;
  font-size: 4rem;
  letter-spacing: 0.2rem;
  font-weight: 700;
  color: #FFA500;
  text-shadow: 0 0 8px #ffb300, 0 0 2px #fff2;
`;

const AMPM = styled.div`
  font-family: 'Orbitron', 'Consolas', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFA500;
  margin-left: 0.5rem;
  margin-top: 0.7rem;
  letter-spacing: 0.1rem;
  text-shadow: 0 0 6px #ffb300, 0 0 2px #fff2;
`;

const DateDisplay = styled.div`
  font-family: 'Orbitron', 'Consolas', monospace;
  font-size: 1.2rem;
  color: #FFA500;
  margin-top: 2.2rem;
  letter-spacing: 0.35rem;
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 0 6px #ffb300, 0 0 2px #fff2;
`;

export default ClockCalendarCard; 