/**
 * Utility functions for project management
 */

// Get projects from localStorage
export const getProjectsFromLocalStorage = () => {
  try {
    const savedProjects = localStorage.getItem('pomodoroProjects');
    if (!savedProjects) {
      return [];
    }

    const parsedProjects = JSON.parse(savedProjects);
    if (!Array.isArray(parsedProjects)) {
      return [];
    }

    // Sort projects by position first, then by createdAt (newest first)
    return parsedProjects.sort((a, b) => {
      // If both have position, sort by position
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }

      // If only one has position, the one with position comes first
      if (a.position !== undefined) return -1;
      if (b.position !== undefined) return 1;

      // If neither has position, sort by createdAt (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });
  } catch (error) {
    return [];
  }
};

// Save projects to localStorage
export const saveProjectsToLocalStorage = (projects) => {
  try {
    if (!Array.isArray(projects)) {
      return false;
    }

    localStorage.setItem('pomodoroProjects', JSON.stringify(projects));
    return true;
  } catch (error) {
    return false;
  }
};

// Create a new project in localStorage
export const createProjectInLocalStorage = (projectData) => {
  try {
    // Get existing projects
    const projects = getProjectsFromLocalStorage();

    // Check if user already has 3 open projects
    const openProjects = projects.filter(
      project => project.status === 'open' || project.status === 'working'
    );

    if (openProjects.length >= 3) {
      return {
        success: false,
        error: 'You can have a maximum of 3 open projects with the free plan. Premium subscription will unlock more open projects in a future release. Please finish or delete an existing project first.'
      };
    }

    // Find the highest position value to place the new project at the end
    const highestPosition = projects.reduce((max, project) => {
      return project.position !== undefined && project.position > max ? project.position : max;
    }, -1);

    // Create new project with position at the end
    const newProject = {
      id: Date.now().toString(),
      title: projectData.title,
      description: projectData.description || '',
      deadline: projectData.deadline || null,
      status: 'open',
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
      position: highestPosition + 1,
    };

    // Add to projects array
    const updatedProjects = [...projects, newProject];

    // Save to localStorage
    const saveResult = saveProjectsToLocalStorage(updatedProjects);

    if (!saveResult) {
      return {
        success: false,
        error: 'Failed to save project to localStorage.'
      };
    }

    return {
      success: true,
      project: newProject,
      projects: updatedProjects
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while creating the project.'
    };
  }
};

// Get filtered projects based on tab
export const getFilteredProjects = (projects, activeTab) => {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.filter(project =>
    activeTab === 'open'
      ? (project.status === 'open' || project.status === 'working')
      : project.status === 'finished'
  );
};

// Get milestones for a specific project from localStorage
export const getMilestonesFromLocalStorage = (projectId) => {
  const savedMilestones = localStorage.getItem('pomodoroMilestones');
  const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
  return parsedMilestones.filter(milestone => milestone.projectId === projectId);
};

// Get notes for a specific project from localStorage
export const getNotesFromLocalStorage = (projectId) => {
  const savedNotes = localStorage.getItem('pomodoroNotes');
  const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
  return parsedNotes.filter(note => note.projectId === projectId);
};

// Calculate the total pomodoros for a project by counting completed pomodoros
export const calculateProjectTotalPomodoros = (projectId, pomodoros = []) => {
  // Filter pomodoros belonging to this project
  const projectPomodoros = pomodoros.filter(pomodoro => {
    const pomodoroProjectId = pomodoro.projectId || (pomodoro.project ? (typeof pomodoro.project === 'object' ? (pomodoro.project._id || pomodoro.project.id) : pomodoro.project) : null);
    return String(pomodoroProjectId) === String(projectId);
  });

  // Count completed pomodoros
  return projectPomodoros.filter(p => p.completed && !p.interrupted).length;
};

// Get the completed pomodoro count for a project
export const getProjectCompletedPomodoros = (project, pomodoros = []) => {
  // If project has completedPomodoros property, use it directly
  if (project && project.completedPomodoros !== undefined) {
    return project.completedPomodoros;
  }

  // Otherwise calculate from pomodoros array
  const projectId = project?.id || project?._id;
  if (!projectId) return 0;

  return calculateProjectTotalPomodoros(projectId, pomodoros);
};
