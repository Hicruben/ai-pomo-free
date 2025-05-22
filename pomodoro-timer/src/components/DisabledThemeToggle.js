import React, { useState } from 'react';
import styled from 'styled-components';
import { FaMoon, FaSun } from 'react-icons/fa';

const DisabledThemeToggle = ({ darkMode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    setShowTooltip(true);
    
    // Hide tooltip after 3 seconds
    setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
  };

  return (
    <ThemeToggleContainer>
      <IconButton onClick={handleClick}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </IconButton>
      
      {showTooltip && (
        <Tooltip>
          <TooltipText>
            Theme toggle will be available in the next release
          </TooltipText>
        </Tooltip>
      )}
    </ThemeToggleContainer>
  );
};

const ThemeToggleContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: ${props => props.theme['--header-text']};
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-style: solid;
    border-color: transparent transparent #333 transparent;
  }
`;

const TooltipText = styled.span`
  display: block;
`;

export default DisabledThemeToggle;
