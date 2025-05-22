import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import axios from 'axios';
import { pomodoroApi } from '../services/apiService';

const StandalonePomodoroTest = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [testDuration, setTestDuration] = useState(5); // 5 seconds default
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [pomodoroRecords, setPomodoroRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recordsBefore, setRecordsBefore] = useState(0);
  const [recordsAfter, setRecordsAfter] = useState(0);
  const [testInProgress, setTestInProgress] = useState(false);

  // Fetch projects and tasks on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated()) {
        console.log('User is authenticated, fetching projects from API');
        // Fetch from API
        try {
          const token = localStorage.getItem('token');
          console.log('Auth token available:', !!token);

          // Use the API service instead of direct axios call
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          console.log('Using API URL:', API_URL);

          const response = await axios.get(`${API_URL}/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Projects API response:', response.data);
          setProjects(response.data);

          if (response.data.length === 0) {
            setError('No projects found. Please create a project first.');
          }
        } catch (apiError) {
          console.error('API Error details:', apiError.response || apiError);
          throw apiError;
        }
      } else {
        console.log('User is not authenticated, fetching projects from localStorage');
        // Fetch from localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          console.log('Projects from localStorage:', parsedProjects);
          setProjects(parsedProjects);

          if (parsedProjects.length === 0) {
            setError('No projects found in localStorage. Please create a project first.');
          }
        } else {
          setError('No projects found. Please create a project first.');
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      const errorMessage = err.response ?
        `Failed to fetch projects: ${err.response.status} ${err.response.statusText}` :
        `Failed to fetch projects: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for a project
  const fetchTasks = async (projectId) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated()) {
        // Fetch from API
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        console.log(`Fetching tasks for project ${projectId} from API`);
        const response = await axios.get(`${API_URL}/tasks?projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Tasks API response:', response.data);
        setTasks(response.data);
      } else {
        // Fetch from localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks.filter(task => task.projectId === projectId));
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      const errorMessage = err.response ?
        `Failed to fetch tasks: ${err.response.status} ${err.response.statusText}` :
        `Failed to fetch tasks: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = (project) => {
    setActiveProject(project);
    setActiveTask(null);
    fetchTasks(project.id || project._id);
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    setActiveTask(task);
  };

  // Fetch pomodoro records
  const fetchPomodoroRecords = async () => {
    if (!isAuthenticated()) {
      console.log('User is not authenticated, cannot fetch pomodoro records');
      setError('You need to be logged in to fetch pomodoro records.');
      return [];
    }

    try {
      console.log('Fetching pomodoro records from API');
      const token = localStorage.getItem('token');
      console.log('Auth token available:', !!token);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Using API URL:', API_URL);

      const response = await axios.get(`${API_URL}/pomodoros`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Pomodoro records API response:', response.data);
      setPomodoroRecords(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching pomodoro records:', err);
      const errorMessage = err.response ?
        `Failed to fetch pomodoro records: ${err.response.status} ${err.response.statusText}` :
        `Failed to fetch pomodoro records: ${err.message}`;
      setError(errorMessage);
      return [];
    }
  };

  // Start the test timer
  const startTest = async () => {
    if (!activeProject) {
      setError('Please select a project first.');
      return;
    }

    setError(null);
    setTestResult(null);
    setTimeRemaining(testDuration);
    setTimerRunning(true);
    setTestInProgress(true);

    // Fetch current pomodoro records to compare later
    const beforeRecords = await fetchPomodoroRecords();
    setRecordsBefore(beforeRecords.length);
  };

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerRunning(false);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  // Handle timer completion
  const handleTimerComplete = async () => {
    // Simulate the pomodoro completion
    try {
      if (isAuthenticated()) {
        // Create pomodoro record via API
        const projectId = activeProject.id || activeProject._id;
        const taskId = activeTask ? (activeTask.id || activeTask._id) : null;

        // Make sure field names match exactly what the server expects
        const pomodoroData = {
          projectId,
          taskId,
          startTime: new Date(Date.now() - testDuration * 1000),
          endTime: new Date(),
          duration: testDuration,
          completed: true,
          interrupted: false
        };

        console.log('Sending pomodoro data:', pomodoroData);

        // Use the pomodoroApi service instead of direct axios call
        // This service has duplicate call prevention logic
        const result = await pomodoroApi.createPomodoro(pomodoroData);
        console.log('Pomodoro creation result:', result);

        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch updated pomodoro records
        const afterRecords = await fetchPomodoroRecords();
        setRecordsAfter(afterRecords.length);

        // Check if a new record was added
        if (afterRecords.length > recordsBefore) {
          setTestResult({
            success: true,
            message: 'Success! A new pomodoro record was inserted into the database.',
            newRecord: afterRecords[0]
          });
        } else {
          setTestResult({
            success: false,
            message: 'No new pomodoro record was found in the database.'
          });
        }
      } else {
        setTestResult({
          success: false,
          message: 'You need to be logged in to test pomodoro insertion.'
        });
      }
    } catch (err) {
      console.error('Error in timer completion:', err);
      setTestResult({
        success: false,
        message: `Error: ${err.message}`
      });
    } finally {
      setTestInProgress(false);
    }
  };

  // Run direct API test
  const runDirectTest = async () => {
    if (!activeProject) {
      setError('Please select a project first.');
      return;
    }

    setError(null);
    setTestResult(null);
    setTestInProgress(true);

    try {
      // Step 1: Get current pomodoro count
      const beforeRecords = await fetchPomodoroRecords();
      setRecordsBefore(beforeRecords.length);

      // Step 2: Directly create a pomodoro record
      const projectId = activeProject.id || activeProject._id;
      const taskId = activeTask ? (activeTask.id || activeTask._id) : null;

      // Make sure field names match exactly what the server expects
      const pomodoroData = {
        projectId,
        taskId,
        startTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        endTime: new Date(),
        duration: 25,
        completed: true,
        interrupted: false
      };

      console.log('Sending pomodoro data (direct test):', pomodoroData);

      // Create the pomodoro record using the pomodoroApi service
      // This service has duplicate call prevention logic
      const result = await pomodoroApi.createPomodoro(pomodoroData);
      console.log('Pomodoro creation result (direct test):', result);

      // Step 3: Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Get updated pomodoro count
      const afterRecords = await fetchPomodoroRecords();
      setRecordsAfter(afterRecords.length);

      // Step 5: Check if a new record was added
      if (afterRecords.length > beforeRecords.length) {
        setTestResult({
          success: true,
          message: 'Success! A new pomodoro record was inserted into the database.',
          newRecord: afterRecords[0]
        });
      } else {
        setTestResult({
          success: false,
          message: 'No new pomodoro record was found in the database.'
        });
      }
    } catch (err) {
      console.error('Error in direct test:', err);
      setTestResult({
        success: false,
        message: `Error: ${err.message}`
      });
    } finally {
      setTestInProgress(false);
    }
  };

  return (
    <Container>
      <Title>Pomodoro Insertion Test</Title>
      <Description>
        This page tests whether pomodoro records are inserted into the database when a timer completes.
      </Description>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Section>
        <SectionTitle>1. Select a Project</SectionTitle>
        <SelectContainer>
          <Select
            value={activeProject ? (activeProject.id || activeProject._id) : ''}
            onChange={(e) => {
              const project = projects.find(p => (p.id === e.target.value || p._id === e.target.value));
              handleProjectSelect(project);
            }}
            disabled={loading || testInProgress}
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id || project._id} value={project.id || project._id}>
                {project.title || project.name}
              </option>
            ))}
          </Select>
        </SelectContainer>
      </Section>

      <Section>
        <SectionTitle>2. Select a Task (Optional)</SectionTitle>
        <SelectContainer>
          <Select
            value={activeTask ? (activeTask.id || activeTask._id) : ''}
            onChange={(e) => {
              const task = tasks.find(t => (t.id === e.target.value || t._id === e.target.value));
              handleTaskSelect(task);
            }}
            disabled={!activeProject || loading || testInProgress}
          >
            <option value="">No task (project only)</option>
            {tasks.map(task => (
              <option key={task.id || task._id} value={task.id || task._id}>
                {task.title || task.name}
              </option>
            ))}
          </Select>
        </SelectContainer>
      </Section>

      <TestSection>
        <TestCard>
          <TestCardTitle>Test 1: Timer Simulation</TestCardTitle>
          <TestCardDescription>
            Simulates a timer completion with a short duration.
          </TestCardDescription>

          <InputGroup>
            <Label>Test Duration (seconds):</Label>
            <Input
              type="number"
              min="1"
              max="60"
              value={testDuration}
              onChange={(e) => setTestDuration(parseInt(e.target.value) || 5)}
              disabled={timerRunning}
            />
          </InputGroup>

          {timerRunning ? (
            <TimerDisplay>
              <span>Test running: {timeRemaining}s remaining</span>
            </TimerDisplay>
          ) : (
            <Button
              onClick={startTest}
              disabled={!activeProject || loading || testInProgress}
            >
              Start Timer Test
            </Button>
          )}
        </TestCard>

        <TestCard>
          <TestCardTitle>Test 2: Direct API Test</TestCardTitle>
          <TestCardDescription>
            Directly calls the API endpoint to create a pomodoro record.
          </TestCardDescription>

          <Button
            onClick={runDirectTest}
            disabled={!activeProject || loading || testInProgress}
          >
            Run Direct API Test
          </Button>
        </TestCard>
      </TestSection>

      {testResult && (
        <ResultSection success={testResult.success}>
          <ResultTitle>{testResult.success ? 'Test Passed!' : 'Test Failed'}</ResultTitle>
          <ResultMessage>{testResult.message}</ResultMessage>

          <RecordDetails>
            <div><strong>Records Before:</strong> {recordsBefore}</div>
            <div><strong>Records After:</strong> {recordsAfter}</div>
            {testResult.newRecord && (
              <>
                <div><strong>Project ID:</strong> {testResult.newRecord.project}</div>
                <div><strong>Task ID:</strong> {testResult.newRecord.task || 'None'}</div>
                <div><strong>Created At:</strong> {new Date(testResult.newRecord.createdAt).toLocaleString()}</div>
              </>
            )}
          </RecordDetails>
        </ResultSection>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #343a40;
  font-size: 1.75rem;
`;

const Description = styled.p`
  margin-bottom: 2rem;
  color: #6c757d;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #495057;
  font-size: 1.25rem;
`;

const SelectContainer = styled.div`
  width: 100%;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
  font-size: 1rem;
`;

const TestSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TestCard = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const TestCardTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #343a40;
  font-size: 1.1rem;
`;

const TestCardDescription = styled.p`
  margin-bottom: 1.25rem;
  color: #6c757d;
  font-size: 0.9rem;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #495057;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  width: 80px;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  width: 100%;

  &:hover {
    background-color: #0069d9;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const TimerDisplay = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #007bff;
  text-align: center;
  padding: 0.75rem;
  background-color: #e6f2ff;
  border-radius: 0.25rem;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
`;

const ResultSection = styled.div`
  padding: 1.5rem;
  margin-top: 1.5rem;
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.success ? '#c3e6cb' : '#f5c6cb'};
  border-radius: 0.5rem;
`;

const ResultTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
`;

const ResultMessage = styled.p`
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const RecordDetails = styled.div`
  background-color: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 0.25rem;
  margin-top: 0.75rem;

  div {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }
`;

export default StandalonePomodoroTest;
