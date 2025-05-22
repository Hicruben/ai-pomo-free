import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const DisabledSettings = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <SettingsModal>
          <SettingsContent>
            <SettingsHeader>
              <h2>Settings</h2>
              <CloseButton onClick={onClose}>
                <FaTimes />
              </CloseButton>
            </SettingsHeader>
            <MessageContainer>
              <MessageIcon>🔧</MessageIcon>
              <MessageTitle>Coming Soon!</MessageTitle>
              <MessageText>
                The settings functionality is currently being improved and will be available in the next release.
              </MessageText>
              <MessageSubtext>
                We're working on making your settings persistent across sessions and devices.
              </MessageSubtext>
              <CloseModalButton onClick={onClose}>
                Close
              </CloseModalButton>
            </MessageContainer>
          </SettingsContent>
        </SettingsModal>
      )}
    </>
  );
};

// Styled components
const SettingsModal = styled.div`
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

const SettingsContent = styled.div`
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #333;
  }
`;

const MessageContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MessageIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const MessageTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #d95550;
`;

const MessageText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const MessageSubtext = styled.p`
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 2rem;
`;

const CloseModalButton = styled.button`
  background-color: #d95550;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c04540;
  }
`;

export default DisabledSettings;
