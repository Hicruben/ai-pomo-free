import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { projectApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all projects
  const fetchProjects = async () => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view projects');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get all projects (open, working, and finished)
      const fetchedProjects = await projectApi.getProjects('');
      setProjects(fetchedProjects);
    } catch (err) {
      setError('Failed to fetch projects: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Finish a project
  const handleFinishProject = async (projectId) => {
    if (!isAuthenticated()) {
      setError('You must be logged in to finish a project');
      return;
    }

    setActionInProgress(true);
    setError(null);
    setSuccess(null);

    try {
      await projectApi.finishProject(projectId);
      setSuccess(`Project marked as finished successfully!`);

      // Refresh projects
      await fetchProjects();
    } catch (err) {
      setError('Failed to finish project: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete a project
  const handleDeleteProject = async (projectId) => {
    if (!isAuthenticated()) {
      setError('You must be logged in to delete a project');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setActionInProgress(true);
    setError(null);
    setSuccess(null);

    try {
      await projectApi.deleteProject(projectId);
      setSuccess('Project deleted successfully!');

      // Refresh projects
      await fetchProjects();
    } catch (err) {
      setError('Failed to delete project: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionInProgress(false);
    }
  };

  // Get count of open projects
  const openProjectsCount = projects.filter(p => p.status === 'open' || p.status === 'working').length;

  return (
    <Container>
      <h2>Project Manager</h2>
      <p>Use this tool to manage your existing projects. You can have a maximum of 3 open projects with the free plan. Premium subscription will unlock more open projects in a future release.</p>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ProjectStats>
        <StatItem>
          <StatLabel>Open Projects:</StatLabel>
          <StatValue>{openProjectsCount}/3</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Total Projects:</StatLabel>
          <StatValue>{projects.length}</StatValue>
        </StatItem>
      </ProjectStats>

      {loading ? (
        <LoadingMessage>Loading projects...</LoadingMessage>
      ) : projects.length === 0 ? (
        <EmptyMessage>No projects found.</EmptyMessage>
      ) : (
        <ProjectsTable>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <ProjectRow key={project._id} status={project.status}>
                <td>{project.title}</td>
                <td>
                  <StatusBadge status={project.status}>
                    {project.status}
                  </StatusBadge>
                </td>
                <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                <td>
                  {(project.status === 'open' || project.status === 'working') && (
                    <ActionButton
                      onClick={() => handleFinishProject(project._id)}
                      disabled={actionInProgress}
                    >
                      Mark Finished
                    </ActionButton>
                  )}
                  <ActionButton
                    onClick={() => handleDeleteProject(project._id)}
                    disabled={actionInProgress}
                    danger
                  >
                    Delete
                  </ActionButton>
                </td>
              </ProjectRow>
            ))}
          </tbody>
        </ProjectsTable>
      )}

      <RefreshButton
        onClick={fetchProjects}
        disabled={loading || actionInProgress}
      >
        {loading ? 'Loading...' : 'Refresh Projects'}
      </RefreshButton>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 20px 0;
  background-color: white;
`;

const ProjectStats = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
`;

const StatLabel = styled.span`
  font-weight: bold;
  margin-right: 5px;
`;

const StatValue = styled.span`
  font-size: 1.1rem;
  color: ${props => props.theme['--nav-active-bg'] || '#d95550'};
`;

const ProjectsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
`;

const ProjectRow = styled.tr`
  background-color: ${props => {
    if (props.status === 'working') return '#e3f2fd';
    if (props.status === 'finished') return '#f9f9f9';
    return 'white';
  }};

  &:hover {
    background-color: #f5f5f5;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: bold;

  ${props => {
    if (props.status === 'working') {
      return `
        background-color: #bbdefb;
        color: #1565c0;
      `;
    } else if (props.status === 'finished') {
      return `
        background-color: #c8e6c9;
        color: #2e7d32;
      `;
    } else {
      return `
        background-color: #ffecb3;
        color: #ff8f00;
      `;
    }
  }}
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  margin-right: 5px;
  background-color: ${props => props.danger ? '#f44336' : '#2196f3'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background-color: ${props => props.danger ? '#d32f2f' : '#1976d2'};
  }

  &:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled.button`
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #388e3c;
  }

  &:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #757575;
`;

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #757575;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
`;

export default ProjectManager;
