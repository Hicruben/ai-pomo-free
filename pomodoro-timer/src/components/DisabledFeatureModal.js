import React from 'react';
import styled from 'styled-components';

const DisabledFeatureModal = ({ isOpen, onClose, featureName, message }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{featureName} Coming Soon</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <ComingSoonIcon>🚧</ComingSoonIcon>
          <MessageText>{message || `The ${featureName} feature will be available in a future release.`}</MessageText>
          <InfoText>We're working hard to bring you this feature soon!</InfoText>
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

const ComingSoonIcon = styled.div`
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

export default DisabledFeatureModal;
