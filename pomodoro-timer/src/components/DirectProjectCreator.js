import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { projectApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';
import ProjectLimitWarningModal from './ProjectLimitWarningModal';

const DirectProjectCreator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isLimitWarningOpen, setIsLimitWarningOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view projects');
      return;
    }

    setLoadingProjects(true);
    try {
      console.log('Authentication status in DirectProjectCreator:', isAuthenticated());
      console.log('Token:', localStorage.getItem('token'));
      console.log('Fetching open and working projects...');

      const fetchedProjects = await projectApi.getProjects('open,working');
      console.log('Projects fetched:', fetchedProjects);
      console.log('Number of projects:', fetchedProjects.length);

      if (fetchedProjects.length === 0) {
        console.log('No open or working projects found');
      } else {
        console.log('First project:', fetchedProjects[0]);
      }

      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to fetch projects: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingProjects(false);
    }
  };

  // Create project
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      setError('You must be logged in to create a project');
      return;
    }

    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    // Check if user has reached their project limit
    const openProjects = projects.filter(p => p.status === 'open' || p.status === 'working');
    console.log('Current open projects:', openProjects);
    console.log('Open projects count:', openProjects.length);

    // Get the user's project limit from their profile
    const fetchUserLimit = async () => {
      try {
        // Use the API base URL from environment or default to localhost
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data for project limit check:', userData);
          const projectLimit = userData.maxProjects || 3;

          if (openProjects.length >= projectLimit) {
            // Show the warning modal instead of creating a project
            console.log(`Project limit reached (${openProjects.length}/${projectLimit})! Opening warning modal...`);
            setIsLimitWarningOpen(true);
            return true;
          }
          return false;
        } else {
          console.error('Failed to fetch user data:', response.status, response.statusText);
          // Default to standard limit if there's an error
          if (openProjects.length >= 3) {
            setIsLimitWarningOpen(true);
            return true;
          }
          return false;
        }
      } catch (error) {
        console.error('Error fetching user data for project limit check:', error);
        // Default to standard limit if there's an error
        if (openProjects.length >= 3) {
          setIsLimitWarningOpen(true);
          return true;
        }
        return false;
      }
    };

    // For non-authenticated users or if there's an issue with the API
    if (!isAuthenticated() && openProjects.length >= 3) {
      console.log('Project limit reached for non-authenticated user! Opening warning modal...');
      setIsLimitWarningOpen(true);
      return;
    } else if (isAuthenticated()) {
      const limitReached = await fetchUserLimit();
      if (limitReached) return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Creating project with data:', { title, description });

      // Create project via API
      const newProject = await projectApi.createProject({
        title: title.trim(),
        description: description.trim()
      });

      console.log('Project created successfully:', newProject);

      // Reset form
      setTitle('');
      setDescription('');
      setSuccess('Project created successfully!');

      // Refresh projects
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Direct Project Creator</h2>
      <p>This component directly calls the API to create projects.</p>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <Form onSubmit={handleCreateProject}>
        <FormGroup>
          <Label htmlFor="title">Project Title *</Label>
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description"
            rows={4}
          />
        </FormGroup>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </Form>

      <ProjectsSection>
        <h3>Your Projects</h3>
        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects found. Create your first project above.</p>
        ) : (
          <ProjectsList>
            {projects.map(project => (
              <ProjectItem key={project._id}>
                <ProjectTitle>{project.title}</ProjectTitle>
                {project.description && <ProjectDescription>{project.description}</ProjectDescription>}
                <ProjectStatus>Status: {project.status}</ProjectStatus>
              </ProjectItem>
            ))}
          </ProjectsList>
        )}

        <RefreshButton onClick={fetchProjects} disabled={loadingProjects}>
          {loadingProjects ? 'Refreshing...' : 'Refresh Projects'}
        </RefreshButton>
      </ProjectsSection>

      {/* Project Limit Warning Modal */}
      <ProjectLimitWarningModal
        isOpen={isLimitWarningOpen}
        onClose={() => setIsLimitWarningOpen(false)}
      />
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #d95550;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #c04540;
  }

  &:disabled {
    background-color: #e0a0a0;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled(Button)`
  background-color: #2196f3;

  &:hover {
    background-color: #1976d2;
  }

  &:disabled {
    background-color: #90caf9;
  }
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

const ProjectsSection = styled.div`
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 20px;
`;

const ProjectsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;

const ProjectItem = styled.div`
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
`;

const ProjectTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #333;
`;

const ProjectDescription = styled.p`
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
`;

const ProjectStatus = styled.div`
  font-size: 0.8rem;
  color: #777;
  text-transform: uppercase;
`;

export default DirectProjectCreator;
