import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';

const ProjectLimitWarningModal = ({ isOpen, onClose }) => {
  console.log('ProjectLimitWarningModal - isOpen:', isOpen);
  const [userData, setUserData] = useState(null);

  // Fetch user data to get their project limit
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated() && isOpen) {
        try {
          // Use the API base URL from environment or default to localhost
          const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiBaseUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('User data for project limit warning:', data);
            setUserData(data);
          } else {
            console.error('Failed to fetch user data:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching user data for project limit warning:', error);
        }
      }
    };

    fetchUserData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Get the user's project limit
  const projectLimit = userData?.maxProjects || 3;
  const subscriptionPlan = userData?.subscription?.plan || 'free';

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>Project Limit Reached</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <WarningIcon>🔒</WarningIcon>
          <MessageText>
            You can have a maximum of {projectLimit} open projects with your {subscriptionPlan} plan.
            {subscriptionPlan === 'free' && ' Premium subscription will unlock more open projects.'}
          </MessageText>
          <InfoText>Please finish or delete an existing project first.</InfoText>
        </ModalBody>
        <ModalFooter>
          <OkButton onClick={onClose}>OK, Got it!</OkButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme['--border-color'] || '#eee'};

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme['--text-muted'] || '#777'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const WarningIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const MessageText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const InfoText = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme['--text-muted'] || '#777'};
  margin-bottom: 0;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid ${props => props.theme['--border-color'] || '#eee'};
`;

const OkButton = styled.button`
  background-color: ${props => props.theme['--primary-color'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme['--primary-hover'] || '#c04540'};
  }
`;

export default ProjectLimitWarningModal;
