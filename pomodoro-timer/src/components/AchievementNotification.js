import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { getAchievementById } from '../utils/statsUtils';

const AchievementNotification = ({ achievementId, onClose }) => {
  const [visible, setVisible] = useState(true);
  const achievement = getAchievementById(achievementId);
  
  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Allow animation to complete
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Allow animation to complete
  };
  
  if (!achievement) return null;
  
  return (
    <NotificationContainer visible={visible}>
      <NotificationContent>
        <AchievementIcon>{achievement.icon}</AchievementIcon>
        <AchievementInfo>
          <AchievementTitle>Achievement Unlocked!</AchievementTitle>
          <AchievementName>{achievement.name}</AchievementName>
          <AchievementDescription>{achievement.description}</AchievementDescription>
        </AchievementInfo>
        <CloseButton onClick={handleClose}>×</CloseButton>
      </NotificationContent>
    </NotificationContainer>
  );
};

// Level up notification
export const LevelUpNotification = ({ level, onClose }) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Allow animation to complete
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Allow animation to complete
  };
  
  return (
    <NotificationContainer visible={visible}>
      <NotificationContent>
        <LevelUpIcon>⭐</LevelUpIcon>
        <AchievementInfo>
          <AchievementTitle>Level Up!</AchievementTitle>
          <AchievementName>You reached Level {level}</AchievementName>
          <AchievementDescription>Keep up the great work!</AchievementDescription>
        </AchievementInfo>
        <CloseButton onClick={handleClose}>×</CloseButton>
      </NotificationContent>
    </NotificationContainer>
  );
};

// Animations
const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

// Styled components
const NotificationContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  animation: ${props => props.visible ? slideIn : slideOut} 0.5s ease forwards;
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 350px;
`;

const AchievementIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #ffc107;
  margin-right: 1rem;
  font-size: 1.5rem;
`;

const LevelUpIcon = styled(AchievementIcon)`
  background-color: #4caf50;
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementTitle = styled.div`
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
`;

const AchievementName = styled.div`
  font-weight: 600;
  color: #555;
  margin-bottom: 0.25rem;
`;

const AchievementDescription = styled.div`
  font-size: 0.85rem;
  color: #777;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  line-height: 1;
  
  &:hover {
    color: #333;
  }
`;

export default AchievementNotification;
