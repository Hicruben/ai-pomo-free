import React, { useState } from 'react';
import styled from 'styled-components';
import { getTodoistTasks, formatTodoistTask } from '../utils/todoistUtils';

const TodoistIntegration = ({ onImportTasks }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('todoistToken') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem('todoistToken'));
  
  // Save token to localStorage
  const saveToken = (newToken) => {
    localStorage.setItem('todoistToken', newToken);
    setToken(newToken);
    setIsConnected(!!newToken);
  };
  
  // Clear token from localStorage
  const clearToken = () => {
    localStorage.removeItem('todoistToken');
    setToken('');
    setIsConnected(false);
  };
  
  // Handle token input change
  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };
  
  // Connect to Todoist
  const handleConnect = (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter a valid API token');
      return;
    }
    
    saveToken(token);
    setError(null);
  };
  
  // Disconnect from Todoist
  const handleDisconnect = () => {
    clearToken();
  };
  
  // Import tasks from Todoist
  const handleImportTasks = async () => {
    if (!token) {
      setError('Please connect to Todoist first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const todoistTasks = await getTodoistTasks(token);
      
      // Format tasks for our app
      const formattedTasks = todoistTasks.map(formatTodoistTask);
      
      // Pass tasks to parent component
      onImportTasks(formattedTasks);
      
      setIsLoading(false);
    } catch (error) {
      setError('Failed to import tasks. Please check your API token and try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <IntegrationContainer>
      <h3>Todoist Integration</h3>
      
      {!isConnected ? (
        <ConnectForm onSubmit={handleConnect}>
          <p>Connect to Todoist to import your tasks.</p>
          
          <FormGroup>
            <label htmlFor="todoistToken">Todoist API Token:</label>
            <input
              type="text"
              id="todoistToken"
              value={token}
              onChange={handleTokenChange}
              placeholder="Enter your Todoist API token"
            />
            <HelpText>
              You can find your API token in Todoist Settings &gt; Integrations
            </HelpText>
          </FormGroup>
          
          <ConnectButton type="submit">
            Connect
          </ConnectButton>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ConnectForm>
      ) : (
        <ConnectedView>
          <p>
            <ConnectedStatus>✓ Connected to Todoist</ConnectedStatus>
          </p>
          
          <ButtonGroup>
            <ImportButton 
              onClick={handleImportTasks} 
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Tasks'}
            </ImportButton>
            
            <DisconnectButton onClick={handleDisconnect}>
              Disconnect
            </DisconnectButton>
          </ButtonGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ConnectedView>
      )}
    </IntegrationContainer>
  );
};

// Styled components
const IntegrationContainer = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #555;
  }
`;

const ConnectForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-weight: 500;
    font-size: 0.9rem;
    color: #555;
  }
  
  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    background-color: ${props => props.theme['--card-bg']};
    color: ${props => props.theme['--text-color']};
  }
`;

const HelpText = styled.small`
  color: #777;
  font-size: 0.8rem;
`;

const ConnectButton = styled.button`
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #43a047;
  }
`;

const ConnectedView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConnectedStatus = styled.span`
  color: #4caf50;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ImportButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1e88e5;
  }
  
  &:disabled {
    background-color: #90caf9;
    cursor: not-allowed;
  }
`;

const DisconnectButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: #f0f0f0;
  color: #555;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

export default TodoistIntegration;
