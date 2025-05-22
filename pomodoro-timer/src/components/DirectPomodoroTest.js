import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import axios from 'axios';

const DirectPomodoroTest = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pomodoroRecords, setPomodoroRecords] = useState([]);
  const [recordsBefore, setRecordsBefore] = useState(0);
  const [recordsAfter, setRecordsAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
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
        // Fetch from API
        const response = await axios.get('/projects');
        setProjects(response.data);
      } else {
        // Fetch from localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects));
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects. Please try again.');
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
        const response = await axios.get(`/tasks?projectId=${projectId}`);
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
      setError('Failed to fetch tasks. Please try again.');
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
      setError('You need to be logged in to fetch pomodoro records.');
      return [];
    }

    try {
      const response = await axios.get('/pomodoros');
      setPomodoroRecords(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching pomodoro records:', err);
      setError('Failed to fetch pomodoro records.');
      return [];
    }
  };

  // Run the direct test
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

      const pomodoroData = {
        projectId,
        taskId,
        startTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        endTime: new Date(),
        duration: 25,
        completed: true,
        interrupted: false
      };

      // Create the pomodoro record
      await axios.post('/pomodoros', pomodoroData);

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
      <Title>Direct Pomodoro Insertion Test</Title>
      <Description>
        This component directly tests the API endpoint for inserting pomodoro records into the database.
        It bypasses the timer completion logic to verify that the database insertion works correctly.
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

      <Section>
        <SectionTitle>3. Run Direct Test</SectionTitle>
        <Button
          onClick={runDirectTest}
          disabled={!activeProject || loading || testInProgress}
        >
          {testInProgress ? 'Testing...' : 'Run Direct Test'}
        </Button>
      </Section>

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
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #343a40;
`;

const Description = styled.p`
  margin-bottom: 1.5rem;
  color: #6c757d;
  font-size: 0.9rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #495057;
`;

const SelectContainer = styled.div`
  width: 100%;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #0069d9;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
`;

const ResultSection = styled.div`
  padding: 1rem;
  margin-top: 1rem;
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.success ? '#c3e6cb' : '#f5c6cb'};
  border-radius: 0.25rem;
`;

const ResultTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const ResultMessage = styled.p`
  margin-bottom: 0.5rem;
`;

const RecordDetails = styled.div`
  background-color: rgba(255, 255, 255, 0.5);
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;

  div {
    margin-bottom: 0.25rem;
  }
`;

export default DirectPomodoroTest;
