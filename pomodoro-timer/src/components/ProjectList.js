import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { projectApi, milestoneApi, noteApi, taskApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import MilestoneTimeline from './MilestoneTimeline';
import ProjectLimitWarningModal from './ProjectLimitWarningModal';
import {
  getProjectsFromLocalStorage,
  getFilteredProjects,
  createProjectInLocalStorage,
  getMilestonesFromLocalStorage,
  getNotesFromLocalStorage
} from '../utils/projectUtils';
import { getTasksFromLocalStorage } from '../utils/taskUtils';
import ProjectDetail from './ProjectDetail';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import eventBus from '../utils/eventBus';

const ProjectList = ({
  onSelectProject,
  activeProjectId,
  activeProject,
  timerState,
  settings,
  onTimerStateChange,
  onPomodoroCompleted,
  activeTaskId,
  onTaskCompleted,
  onActiveTaskChange,
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('open');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLimitWarningOpen, setIsLimitWarningOpen] = useState(false);
  const [currentEditProject, setCurrentEditProject] = useState(null);

  // State for active project's details
  const [milestones, setMilestones] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 1. Add allTasks state
  const [allTasks, setAllTasks] = useState([]);

  // Helper to get project ID
  const getProjectId = (project) => isAuthenticated() ? project._id : project.id;





  // Function to fetch projects and tasks
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated()) {
        // Always fetch both open and working projects for the open tab
        let status = '';
        if (activeTab === 'open') {
          status = 'open,working';
        } else if (activeTab === 'finished') {
          status = 'finished';
        }
        const [fetchedProjects, fetchedTasks] = await Promise.all([
          projectApi.getProjects(status),
          taskApi.getTasks()
        ]);
        setProjects(fetchedProjects);
        setTasks(fetchedTasks);
        setAllTasks(fetchedTasks);
        console.log('ProjectList debug: fetchedTasks', fetchedTasks);
        if (fetchedTasks.length > 0) {
          fetchedTasks.forEach(task => {
            console.log('ProjectList debug: task.projectId', task.projectId, typeof task.projectId);
          });
        }
      } else {
        // For localStorage, show all open and working projects in the open tab
        const allProjects = getProjectsFromLocalStorage();
        let filteredProjects = [];
        if (activeTab === 'open') {
          filteredProjects = allProjects.filter(p => p.status === 'open' || p.status === 'working');
        } else if (activeTab === 'finished') {
          filteredProjects = allProjects.filter(p => p.status === 'finished');
        }
        const allTasks = getTasksFromLocalStorage();
        setProjects(filteredProjects);
        setTasks(allTasks);
        setAllTasks(allTasks);
      }
    } catch (err) {
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load projects list on component mount and tab change
  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  // Listen for pomodoro completion events to update project cards in real-time
  useEffect(() => {
    console.log('ProjectList: Setting up pomodoroCompleted event listener');

    // Create a debounced version of the event handler to prevent multiple refreshes
    // This will ensure that even if multiple pomodoroCompleted events are fired,
    // we only update the UI once within a short time period
    let debounceTimer = null;
    let lastEventTime = 0;

    const handlePomodoroCompletedEvent = async (data) => {
      console.log('ProjectList: Received pomodoroCompleted event', data);

      // Skip updating if the timer was skipped
      if (data && data.isSkip) {
        console.log('ProjectList: Timer was skipped, not updating project data');
        return;
      }

      // Prevent multiple refreshes within 500ms
      const now = Date.now();
      if (now - lastEventTime < 500) {
        console.log('ProjectList: Ignoring duplicate pomodoroCompleted event (received within 500ms)');

        // Clear any existing timer and set a new one
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Set a new timer to update after the debounce period
        debounceTimer = setTimeout(() => updateProjectData(data), 500);
        return;
      }

      // Update the last event time
      lastEventTime = now;

      // Update the project data
      updateProjectData(data);
    };

    // Function to update project data
    const updateProjectData = async (data) => {
      // Update only the necessary data
      if (isAuthenticated()) {
        try {
          // Fetch updated tasks data
          const updatedTasks = await taskApi.getTasks();

          // Update the tasks state without triggering a full page reload
          if (activeProject) {
            const currentProjectId = getProjectId(activeProject);
            const projectTasks = updatedTasks.filter(task =>
              task.projectId === currentProjectId ||
              task.project?._id === currentProjectId ||
              task.project?.id === currentProjectId
            );
            setTasks(projectTasks);
          }

          // Update all tasks for reference
          setAllTasks(updatedTasks);

          // Also fetch updated projects to get the latest pomodoro counts
          const status = activeTab === 'open' ? 'open,working' : 'finished';
          const updatedProjects = await projectApi.getProjects(status);
          setProjects(updatedProjects);

          console.log('ProjectList: Updated tasks and projects after pomodoro completion');
        } catch (error) {
          console.error('Error updating data after pomodoro completion:', error);
        }
      } else {
        // For localStorage mode, update the tasks and projects
        try {
          // Get tasks from localStorage
          const savedTasks = localStorage.getItem('pomodoroTasks');
          if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            setAllTasks(parsedTasks);

            // Filter tasks for the active project
            if (activeProject) {
              const currentProjectId = getProjectId(activeProject);
              const projectTasks = parsedTasks.filter(task => task.projectId === currentProjectId);
              setTasks(projectTasks);
            }
          }

          // Get projects from localStorage
          const savedProjects = localStorage.getItem('pomodoroProjects');
          if (savedProjects) {
            const parsedProjects = JSON.parse(savedProjects);
            const filteredProjects = getFilteredProjects(parsedProjects, activeTab);
            setProjects(filteredProjects);
          }

          console.log('ProjectList: Updated localStorage data after pomodoro completion');
        } catch (error) {
          console.error('Error updating localStorage data after pomodoro completion:', error);
        }
      }
    };

    // Subscribe to the pomodoroCompleted event
    const unsubscribe = eventBus.on('pomodoroCompleted', handlePomodoroCompletedEvent);

    // Clean up the subscription when the component unmounts
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unsubscribe();
    };
  }, [activeProject, activeTab]);

  // Load milestones, notes, and tasks when the active project changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!activeProject) {
        setMilestones([]);
        setNotes([]);
        setTasks([]);
        return;
      }

      setDetailsLoading(true);
      setError(null);
      const currentProjectId = getProjectId(activeProject);

      try {
        if (isAuthenticated()) {
          const [fetchedMilestones, fetchedNotes, fetchedTasks] = await Promise.all([
            milestoneApi.getMilestones(currentProjectId),
            noteApi.getNotes(currentProjectId),
            taskApi.getTasks(null, currentProjectId)
          ]);
          setMilestones(fetchedMilestones);
          setNotes(fetchedNotes);
          setTasks(fetchedTasks);
        } else {
          // Load from localStorage
          const projectMilestones = getMilestonesFromLocalStorage(currentProjectId);
          const projectNotes = getNotesFromLocalStorage(currentProjectId);
          const projectTasks = getTasksFromLocalStorage(currentProjectId);
          setMilestones(projectMilestones);
          setNotes(projectNotes);
          setTasks(projectTasks);
        }

        // Listen for task changes and update milestones
        const handleTasksChanged = (e) => {
          if (e.detail && e.detail.projectId === currentProjectId) {
            console.log('ProjectList: Received tasksChanged event, refreshing milestones');
            // Refresh milestones
            if (isAuthenticated()) {
              milestoneApi.getMilestones(currentProjectId)
                .then(updatedMilestones => {
                  setMilestones(updatedMilestones);
                })
                .catch(error => {
                  console.error('Error refreshing milestones:', error);
                });
            } else {
              const refreshedMilestones = getMilestonesFromLocalStorage(currentProjectId);
              setMilestones(refreshedMilestones);
            }
          }
        };

        // Add event listener for task changes
        window.addEventListener('tasksChanged', handleTasksChanged);

        // Clean up function to remove event listener
        return () => {
          window.removeEventListener('tasksChanged', handleTasksChanged);
        };
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details.');
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [activeProject]); // Re-run when activeProject changes

  // Handle tasks update
  const handleTasksUpdate = (updatedTasks) => {
    setTasks(updatedTasks);
  };

  // Get user data including subscription status and project limit
  const [userData, setUserData] = useState(null);

  // Fetch user data including subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated()) {
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
            console.log('User data for ProjectList:', data);
            setUserData(data);
          } else {
            console.error('Failed to fetch user data:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Check if user has reached their project limit
  const checkProjectLimit = () => {
    const openProjects = projects.filter(p => p.status === 'open' || p.status === 'working');
    console.log('Current open projects:', openProjects);
    console.log('Open projects count:', openProjects.length);

    // Get the user's project limit from their profile
    const projectLimit = userData?.maxProjects || 3;
    console.log('User project limit:', projectLimit);

    return openProjects.length >= projectLimit;
  };

  // Handle opening the create project modal or showing the limit warning
  const handleAddProjectClick = () => {
    if (checkProjectLimit()) {
      // Show the warning modal instead of opening the create modal
      console.log('Project limit reached! Opening warning modal...');
      setIsLimitWarningOpen(true);
    } else {
      // Open the create project modal
      setIsCreateModalOpen(true);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Potentially clear active project when changing tabs if desired
    // onSelectProject(null);
  };

  // Handle project selection
  const handleSelectProject = (project) => {
    // If the project is finished, we need to reactivate it first
    if (project.status === 'finished') {
      console.log('ProjectList: Reactivating finished project:', project);

      // We don't automatically reactivate finished projects when clicked
      // The reactivation is handled by the Reactivate button in ProjectCard
      // which will call this function

      // Reactivate the project by setting it to 'open' status
      const projectId = getProjectId(project);
      handleReactivateProject(projectId);
    } else {
      // For non-finished projects, just select them
      if (onSelectProject) {
        onSelectProject(project);
      }
    }
  };

  // Handle setting a project as "working on"
  const handleSetWorking = async (projectId) => {
    try {
      if (isAuthenticated()) {
        await projectApi.setProjectAsWorking(projectId);

        // Refresh projects
        const status = activeTab === 'open' ? 'open,working' : 'finished';
        const updatedProjects = await projectApi.getProjects(status);
        setProjects(updatedProjects);
      } else {
        // Update localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        // Reset any working project
        const updatedProjects = parsedProjects.map(project => ({
          ...project,
          status: project.status === 'working' ? 'open' : project.status
        }));

        // Set the selected project as working
        const finalProjects = updatedProjects.map(project => ({
          ...project,
          status: project.id === projectId ? 'working' : project.status
        }));

        localStorage.setItem('pomodoroProjects', JSON.stringify(finalProjects));

        // Filter projects based on active tab
        const filteredProjects = finalProjects.filter(project =>
          activeTab === 'open'
            ? (project.status === 'open' || project.status === 'working')
            : project.status === 'finished'
        );

        setProjects(filteredProjects);
      }

      // After success, refetch or update project list state
      const status = activeTab === 'open' ? 'open,working' : 'finished';
      const updatedProjects = isAuthenticated() ? await projectApi.getProjects(status) : getFilteredProjects(getProjectsFromLocalStorage(), activeTab);
      setProjects(updatedProjects);

      // Update the active project in parent if the working one changed
      if (onSelectProject) {
        const newActive = updatedProjects.find(p => getProjectId(p) === projectId && p.status === 'working');
        onSelectProject(newActive || null);
      }

    } catch (err) {
      setError('Failed to update project status. Please try again.');
    }
  };

  // Handle finishing a project
  const handleFinishProject = async (projectId) => {
    try {
      if (isAuthenticated()) {
        await projectApi.finishProject(projectId);

        // Refresh projects
        const status = activeTab === 'open' ? 'open,working' : 'finished';
        const updatedProjects = await projectApi.getProjects(status);
        setProjects(updatedProjects);
      } else {
        // Update localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        // Set the selected project as finished
        const updatedProjects = parsedProjects.map(project => ({
          ...project,
          status: project.id === projectId ? 'finished' : project.status,
          completedDate: project.id === projectId ? new Date().toISOString() : project.completedDate
        }));

        localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));

        // Filter projects based on active tab
        const filteredProjects = updatedProjects.filter(project =>
          activeTab === 'open'
            ? (project.status === 'open' || project.status === 'working')
            : project.status === 'finished'
        );

        setProjects(filteredProjects);
      }

      // After success, refetch or update project list state
      const status = activeTab === 'open' ? 'open,working' : 'finished';
      const updatedProjects = isAuthenticated() ? await projectApi.getProjects(status) : getFilteredProjects(getProjectsFromLocalStorage(), activeTab);
      setProjects(updatedProjects);

      // If the finished project was active, clear active project in parent
      if (activeProjectId === projectId && onSelectProject) {
        onSelectProject(null);
      }

    } catch (err) {
      setError('Failed to finish project. Please try again.');
    }
  };

  // Handle reactivating a finished project
  const handleReactivateProject = async (projectId) => {
    try {
      if (isAuthenticated()) {
        // Call API to reactivate the project (set status to 'open')
        await projectApi.updateProject(projectId, { status: 'open' });

        // Refresh projects
        const updatedProjects = await projectApi.getProjects('open,working,finished');

        // Update projects list based on current tab
        const filteredProjects = updatedProjects.filter(project =>
          activeTab === 'open'
            ? (project.status === 'open' || project.status === 'working')
            : project.status === 'finished'
        );
        setProjects(filteredProjects);

        // Find the reactivated project to select it
        const reactivatedProject = updatedProjects.find(p => getProjectId(p) === projectId);
        if (reactivatedProject && onSelectProject) {
          onSelectProject(reactivatedProject);
        }

        // Switch to the open projects tab
        handleTabChange('open');
      } else {
        // Update localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        // Set the selected project as open
        const updatedProjects = parsedProjects.map(project => ({
          ...project,
          status: project.id === projectId ? 'open' : project.status,
          // Remove completedDate if it exists
          ...(project.id === projectId ? { completedDate: null } : {})
        }));

        localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));

        // Find the reactivated project
        const reactivatedProject = updatedProjects.find(p => p.id === projectId);

        // Switch to the open projects tab
        handleTabChange('open');

        // Select the reactivated project
        if (reactivatedProject && onSelectProject) {
          onSelectProject(reactivatedProject);
        }
      }
    } catch (err) {
      console.error('Error reactivating project:', err);
      setError('Failed to reactivate project. Please try again.');
    }
  };

  // Handle creating a new project
  const handleCreateProject = (projectData) => {
    setError(null);

    return new Promise((resolve) => {
      // Use a non-async function to avoid the "async Client Component" error
      if (isAuthenticated()) {
        // Handle authenticated user case
        projectApi.createProject(projectData)
          .then(newProject => {
            // Store the newly created project to select it later
            const createdProject = newProject;
            const status = activeTab === 'open' ? 'open,working' : 'finished';
            return projectApi.getProjects(status)
              .then(updatedProjects => {
                // Return both the created project and updated projects list
                return { createdProject, updatedProjects };
              });
          })
          .then(({ createdProject, updatedProjects }) => {
            setProjects(updatedProjects);

            // Select the newly created project
            if (onSelectProject && createdProject) {
              onSelectProject(createdProject);
            }

            resolve(true);
          })
          .catch(err => {
            console.error('Error creating project:', err);
            setError('An unexpected error occurred. Please try again.');
            resolve(false);
          });
      } else {
        // Handle localStorage case (synchronous)
        try {
          const result = createProjectInLocalStorage(projectData);
          if (!result.success) {
            setError(result.error);
            resolve(false);
            return;
          }
          const filteredProjects = getFilteredProjects(result.projects, activeTab);
          setProjects(filteredProjects);

          // Select the newly created project
          if (onSelectProject && result.project) {
            onSelectProject(result.project);
          }

          resolve(true);
        } catch (err) {
          console.error('Error creating project in localStorage:', err);
          setError('An unexpected error occurred. Please try again.');
          resolve(false);
        }
      }
    });
  };

  // Handle deleting a project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project and all its data?')) {
      return;
    }
    setError(null);
    try {
      if (isAuthenticated()) {
        try {
          await projectApi.deleteProject(projectId);

          // Refresh projects
          const status = activeTab === 'open' ? 'open,working' : 'finished';
          const updatedProjects = await projectApi.getProjects(status);
          setProjects(updatedProjects);
        } catch (apiError) {
          const errorMessage = apiError.response?.data?.message || 'Failed to delete project. Please try again.';
          setError(errorMessage);
          return;
        }
      } else {
        // Delete project from localStorage
        try {
          const savedProjects = localStorage.getItem('pomodoroProjects');
          const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

          // Verify the project exists before attempting to delete
          const projectToDelete = parsedProjects.find(p => p.id === projectId);
          if (!projectToDelete) {
            setError('Project not found. It may have been already deleted.');
            return;
          }

          const updatedProjects = parsedProjects.filter(project => project.id !== projectId);

          localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));

          // Filter projects based on active tab
          const filteredProjects = getFilteredProjects(updatedProjects, activeTab);
          setProjects(filteredProjects);
        } catch (localStorageError) {
          setError('Failed to delete project from local storage. Please try again.');
          return;
        }
      }

      // If the deleted project was active, clear active project in parent
      if (activeProjectId === projectId && onSelectProject) {
        onSelectProject(null);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  // Handle pomodoro completed
  const handlePomodoroCompleted = async (data) => {
    try {
      // Extract data from the parameter, supporting both object and simple formats
      let taskId, projectId, isSkip = false;

      if (typeof data === 'object') {
        taskId = data.taskId;
        projectId = data.projectId;
        isSkip = data.isSkip || false;
      } else {
        // For backward compatibility
        taskId = data;
      }

      console.log('ProjectList: handlePomodoroCompleted called with data:', data);
      console.log('ProjectList: isSkip:', isSkip);

      // If the timer was skipped, don't update the pomodoro count
      if (isSkip) {
        console.log('ProjectList: Timer was skipped, not updating pomodoro count');
        return;
      }

      if (taskId) {
        if (isAuthenticated()) {
          // Force refresh all tasks to get the latest completedPomodoros count
          // which is now calculated from the pomodoro table on the server
          const allTasks = await taskApi.getTasks();
          setAllTasks(allTasks);

          // Filter tasks for the active project if available
          if (activeProject) {
            const currentProjectId = getProjectId(activeProject);
            const projectTasks = allTasks.filter(task =>
              task.projectId === currentProjectId ||
              task.project?._id === currentProjectId ||
              task.project?.id === currentProjectId
            );
            setTasks(projectTasks);
          }

          // Also refresh projects to update the pomodoro counts
          const status = activeTab === 'open' ? 'open,working' : 'finished';
          const updatedProjects = await projectApi.getProjects(status);
          setProjects(updatedProjects);
        } else {
          // For localStorage mode, we still need to update the completedPomodoros count
          const savedTasks = localStorage.getItem('pomodoroTasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

          // Update the task's pomodoro count
          const updatedTasks = parsedTasks.map(task =>
            task.id === taskId ? { ...task, completedPomodoros: (task.completedPomodoros || 0) + 1 } : task
          );

          // Save to localStorage
          localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

          // Update local task list
          setAllTasks(updatedTasks);

          // Filter tasks for the active project if available
          if (activeProject) {
            const currentProjectId = getProjectId(activeProject);
            const projectTasks = updatedTasks.filter(task => task.projectId === currentProjectId);
            setTasks(projectTasks);
          }

          // Also update projects in localStorage to reflect the new pomodoro count
          // This is a simplified approach since we don't have a server to calculate the total
          const savedProjects = localStorage.getItem('pomodoroProjects');
          if (savedProjects) {
            const parsedProjects = JSON.parse(savedProjects);
            const filteredProjects = getFilteredProjects(parsedProjects, activeTab);
            setProjects(filteredProjects);
          }
        }
      }
    } catch (err) {
      console.error('Error in handlePomodoroCompleted:', err);
      setError('Failed to update pomodoro count. Please try again.');
    }
  };

  // 处理编辑项目的请求
  const handleEditProject = (project) => {
    setCurrentEditProject(project);
    setIsEditModalOpen(true);
  };

  // 处理更新项目
  const handleUpdateProject = async (projectId, updatedData) => {
    setError(null);
    try {
      if (isAuthenticated()) {
        // 通过API更新项目
        await projectApi.updateProject(projectId, updatedData);

        // 刷新项目列表
        const status = activeTab === 'open' ? 'open,working' : 'finished';
        const updatedProjects = await projectApi.getProjects(status);
        setProjects(updatedProjects);
      } else {
        // 更新localStorage中的项目
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        const updatedProjects = parsedProjects.map(p =>
          p.id === projectId ? { ...p, ...updatedData } : p
        );

        localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));

        // 刷新项目列表
        setProjects(getFilteredProjects(updatedProjects, activeTab));
      }

      // 关闭编辑模态窗
      setIsEditModalOpen(false);
      setCurrentEditProject(null);
    } catch (err) {
      setError('Failed to update project. Please try again.');
    }
  };

  // Find the active project
  const currentActiveProject = projects.find(p => getProjectId(p) === activeProjectId);

  // Handle drag end for project grid
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    // Reorder the projects in the local state
    const reordered = Array.from(projects);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update the local state immediately for a responsive UI
    setProjects(reordered);

    try {
      if (isAuthenticated()) {
        // Prepare the positions data for the API
        const positions = reordered.map((project, index) => ({
          id: getProjectId(project),
          position: index
        }));

        // Persist the new order to the backend
        await projectApi.updateProjectPositions(positions);
        console.log('Project positions updated successfully');
      } else {
        // For localStorage, update the positions and save
        const allProjects = getProjectsFromLocalStorage();

        // Create a map of project IDs to their new positions
        const positionMap = {};
        reordered.forEach((project, index) => {
          positionMap[getProjectId(project)] = index;
        });

        // Update positions in all projects
        const updatedProjects = allProjects.map(project => ({
          ...project,
          position: positionMap[project.id] !== undefined ? positionMap[project.id] : project.position || 0
        }));

        // Save to localStorage
        localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));
        console.log('Project positions updated in localStorage');
      }
    } catch (err) {
      console.error('Error updating project positions:', err);
      setError('Failed to save project order. Please try again.');

      // Optionally, revert to the original order if the API call fails
      // fetchProjects();
    }
  };

  if (loading) {
    return <LoadingMessage>Loading projects...</LoadingMessage>;
  }

  return (
    <ProjectListContainer>
      {/* Header container with tabs and add button */}
      <ContentWrapper>
        <HeaderContainer>
          <TabsRow>
            <TabsContainer>
              <Tab $active={activeTab === 'open'} onClick={() => handleTabChange('open')}>Open Projects</Tab>
              <Tab $active={activeTab === 'finished'} onClick={() => handleTabChange('finished')}>Finished Projects</Tab>
            </TabsContainer>
          </TabsRow>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </HeaderContainer>

        {/* Project Grid: Always show projects in original order */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="projectGrid" direction="horizontal">
            {(provided) => (
              <NonActiveProjectsGrid
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {projects.length > 0 ? (
                  projects.map((project, index) => {
                    const projectId = getProjectId(project);
                    const projectTasks = allTasks.filter(task => String(task.project) === String(projectId));
                    console.log('ProjectList debug: project', project, 'projectId:', project._id || project.id, typeof (project._id || project.id));
                    console.log('ProjectList debug: projectTasks', projectTasks);
                    const isWorking = currentActiveProject && getProjectId(currentActiveProject) === projectId;
                    return (
                      <Draggable key={projectId} draggableId={projectId.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.7 : 1,
                            }}
                          >
                            <ProjectCard
                              project={project}
                              isWorking={isWorking}
                              isActive={isWorking}
                              onSelect={() => handleSelectProject(project)}
                              onSetWorking={() => handleSetWorking(projectId)}
                              onFinish={() => handleFinishProject(projectId)}
                              onDelete={() => handleDeleteProject(projectId)}
                              onEdit={() => handleEditProject(project)}
                              tasks={projectTasks}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                ) : (
                  !currentActiveProject && activeTab !== 'finished' && !loading &&
                  <EmptyMessage style={{ gridColumn: '1 / -1' }}>No other open projects.</EmptyMessage>
                )}
                {/* Add Project Card */}
                {activeTab === 'open' && (
                  <AddProjectCard onClick={handleAddProjectClick}>
                    <span className="plus">＋</span>
                    <span className="text">Add Project</span>
                  </AddProjectCard>
                )}
                {provided.placeholder}
              </NonActiveProjectsGrid>
            )}
          </Droppable>
        </DragDropContext>

        {currentActiveProject && (
          <WorkingProjectHeader>
            <NowWorkingOnHeading>
              <span className="dot" />
              <span className="badge">
                Now working on
              </span>
            </NowWorkingOnHeading>
            <ProjectNameDisplay>
              {currentActiveProject.title || currentActiveProject.name}
            </ProjectNameDisplay>
          </WorkingProjectHeader>
        )}
        {currentActiveProject && (
          <ActiveProjectSection>
            <MilestoneTimeline
              milestones={milestones}
              projectId={getProjectId(currentActiveProject)}
              onMilestonesUpdate={setMilestones}
              project={currentActiveProject}
            />
            <ProjectDetail
              project={currentActiveProject}
              timerState={timerState}
              onTimerStateChange={onTimerStateChange}
              onPomodoroCompleted={onPomodoroCompleted}
              settings={settings}
              onBack={() => onSelectProject && onSelectProject(null)}
              activeTaskId={activeTaskId}
              onActiveTaskChange={onActiveTaskChange}
            />
          </ActiveProjectSection>
        )}
      </ContentWrapper>

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateProject}
        />
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && currentEditProject && (
        <EditProjectModal
          project={currentEditProject}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentEditProject(null);
          }}
          onUpdate={handleUpdateProject}
        />
      )}

      {/* Project Limit Warning Modal */}
      <ProjectLimitWarningModal
        isOpen={isLimitWarningOpen}
        onClose={() => setIsLimitWarningOpen(false)}
      />
    </ProjectListContainer>
  );
};

// Styled components
const ProjectListContainer = styled.div`
  margin: 0.75rem 0 0 0;
  padding: 0 2.5vw;
  width: 100%;
  background: var(--card-bg);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid #ececec;
  overflow-x: hidden;
  box-sizing: border-box;
`;

// Add a ContentWrapper to maintain consistent widths
const ContentWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 0;
`;



const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #ddd;
  margin-bottom: 0.5rem;
  width: 100%;
`;

const Tab = styled.div`
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  font-size: 0.9rem;
  color: ${props => props.$active ? '#d95550' : '#555'};
  border-bottom: ${props => props.$active ? '2px solid #d95550' : 'none'};
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #d95550;
  }
`;

const TabsRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.5rem;
`;

const AddProjectButton = styled.button`
  padding: 0.5rem 1.2rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  box-shadow: none;
  margin: 0;
  text-align: center;
  line-height: 1.1;
  white-space: nowrap;
  align-self: flex-end;
  &:hover {
    background: #c04540;
  }
`;

// Grid for the NON-ACTIVE projects (smaller cards)
const NonActiveProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem !important;
  margin-bottom: 2rem;
  justify-content: start;
  width: 100%;
`;

// New styled components for the revised layout
const ActiveProjectSection = styled.section`
  padding: 1.5rem 1.25rem;
  border: 1px solid #ececec;
  border-radius: 6px;
  background: var(--card-bg);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  width: 100%;
  margin-bottom: 2rem;
`;

const ActiveProjectFlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const ActiveProjectContainer = styled.div`
  flex: 1;
  min-width: 0; // Prevents flex children from overflowing

  @media (min-width: 992px) {
    flex: 0 0 40%;
  }
`;

const ActiveProjectDetailsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Modified existing styled components
const MilestonesSection = styled.section`
  margin-bottom: 1rem;
  background-color: #f9fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #edf2f7;
  overflow: visible;
  position: relative;
`;

const TasksNotesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const TasksSection = styled.section`
  flex: 3;
  min-width: 0;
  padding: 1rem;
  background-color: #f9fafc;
  border-radius: 0.5rem;
  border: 1px solid #edf2f7;
`;

const NotesSection = styled.section`
  flex: 2;
  min-width: 0;
  padding: 1rem;
  background-color: #f9fafc;
  border-radius: 0.5rem;
  border: 1px solid #edf2f7;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1.2rem 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-color);
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #ececec;
  background: none;
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #777;
  font-style: italic;
  padding: 2rem;
  background-color: var(--card-bg);
  border-radius: 0.25rem;
  grid-column: 1 / -1; // Make empty message span all columns if grid is used
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-color);
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.9rem;
`;

// Add HeaderContainer
const HeaderContainer = styled.div`
  width: 100%;
  margin: 0 auto 0.75rem;
  display: flex;
  flex-direction: column;
  background: none;
`;

const DeadlineDisplay = styled.div`
  font-size: 1rem;
  color: ${props => props.overdue ? '#d32f2f' : '#1976d2'};
  font-weight: 500;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: ${props => props.overdue ? '#ffebee' : '#e3f2fd'};
  border-radius: 0.25rem;
  text-align: center;
`;

const WorkingHeader = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
`;

const WorkingTitle = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const WorkingLabel = styled.span`
  font-size: 1.25rem;
  font-weight: 500;
  color: #718096;
  margin-right: 0.5rem;
`;

const ProjectTitleText = styled.h1`
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0;
  font-weight: 600;
  display: inline;
`;

const CompactSectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
`;

const HeaderDeadlineDisplay = styled.div`
  font-size: 0.95rem;
  color: ${props => props.overdue ? '#d32f2f' : '#1976d2'};
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background-color: ${props => props.overdue ? '#ffebee' : '#e3f2fd'};
  border-radius: 0.25rem;
  display: inline-block;
  margin-left: 1rem;
`;

const MilestoneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const WorkingProjectHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
  padding-left: 0.5rem;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    top: -1.5rem;
    left: -2rem;
    right: -2rem;
    height: 1px;
    background: linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.1), rgba(0,0,0,0.03));
  }
`;

const ProjectNameDisplay = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #d95550;
  margin: 0 0 0 1rem;
  padding: 0;
  display: inline-block;
  position: relative;
  top: 1px;

  &::after {
    content: '';
    display: block;
    width: 100%;
    height: 2px;
    background-color: rgba(217, 85, 80, 0.2);
    position: absolute;
    bottom: -2px;
    left: 0;
    transition: all 0.2s ease;
  }

  @media (max-width: 600px) {
    font-size: 1.4rem;
    margin-left: 0.5rem;
  }
`;

const NowWorkingOnHeading = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: fit-content;

  .badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    padding: 0.4rem 1.2rem 0.4rem 2.2rem;
    border-radius: 2rem;
    background: linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%);
    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
    letter-spacing: 0.5px;
    border: none;
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
    user-select: none;
    outline: none;
    z-index: 1;
    overflow: visible;
  }

  .badge:hover {
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
    transform: translateY(-2px);
    background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
  }

  .dot {
    content: '';
    display: inline-block;
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    animation: pulseDot 2s infinite cubic-bezier(0.66, 0, 0, 1);
    z-index: 2;
  }

  .arrow {
    font-size: 1.2rem;
    font-weight: 600;
    margin-left: 0.3rem;
    color: #fff;
    transition: transform 0.3s ease;
  }

  .badge:hover .arrow {
    transform: translateX(4px);
  }

  @keyframes pulseDot {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  @media (max-width: 600px) {
    .badge {
      font-size: 0.8rem;
      padding: 0.3rem 0.8rem 0.3rem 1.8rem;
    }
    .dot {
      left: 0.5rem;
      width: 8px;
      height: 8px;
    }
    .arrow {
      font-size: 0.9rem;
    }
  }
`;



const AddProjectCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  max-width: 300px;
  min-height: 280px;
  height: 100%;
  background: #fff;
  border: 1.5px dashed #ececec;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: box-shadow 0.18s, border-color 0.18s, background 0.18s;
  box-shadow: 0 3px 15px rgba(0,0,0,0.06);
  color: #bbb;
  font-family: inherit;
  margin: 0.75rem auto;
  gap: 0.5rem;
  &:hover {
    border-color: #d95550;
    background: #faf7f7;
    color: #d95550;
    box-shadow: 0 2px 8px rgba(217,85,80,0.07);
  }
  .plus {
    font-size: 2.4rem;
    font-weight: 400;
    margin-bottom: 0.2rem;
    line-height: 1;
  }
  .text {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
`;

export default ProjectList;