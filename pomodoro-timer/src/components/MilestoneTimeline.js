import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import { milestoneApi, projectApi, taskApi } from '../services/apiService';
import { FaTrash, FaPlus, FaCheck } from 'react-icons/fa';
import { format } from 'date-fns';

const MilestoneTimeline = ({ milestones, projectId, onMilestonesUpdate, project }) => {
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState(null);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [todayPosition, setTodayPosition] = useState(null);
  const [timelineStart, setTimelineStart] = useState(null);
  const [timelineEnd, setTimelineEnd] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [deadlineMilestone, setDeadlineMilestone] = useState(null);

  // Get milestone ID based on authentication status
  const getMilestoneId = (milestone) => isAuthenticated() ? milestone._id : milestone.id;

  // Format date in a more compact way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Fetch project data if not provided
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (isAuthenticated() && projectId && !project) {
          const data = await projectApi.getProject(projectId);
          setProjectData(data);
        } else if (project) {
          setProjectData(project);
        } else if (!isAuthenticated() && projectId) {
          const savedProjects = localStorage.getItem('pomodoroProjects');
          const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];
          const foundProject = parsedProjects.find(p => p.id === projectId);
          if (foundProject) {
            setProjectData(foundProject);
          }
        }
      } catch (err) {
        console.error('Error fetching project data:', err);
      }
    };
    fetchProjectData();
  }, [projectId, project]);

  // Create a deadline milestone if project has a deadline
  useEffect(() => {
    const hasDeadline = (projectData && projectData.deadline) || (project && project.deadline);
    if (hasDeadline) {
      const deadlineDate = projectData?.deadline || project?.deadline;
      const deadline = new Date(deadlineDate);
      const deadlineMilestoneObj = {
        id: 'deadline-' + projectId,
        _id: 'deadline-' + projectId,
        title: 'Deadline',
        dueDate: deadline.toISOString(),
        isDeadline: true,
        completed: false,
        projectId
      };
      setDeadlineMilestone(deadlineMilestoneObj);
    } else {
      setDeadlineMilestone(null);
    }
  }, [projectData, project, projectId]);

  // Log when milestones change
  useEffect(() => {
    console.log('MilestoneTimeline: milestones changed', milestones);
  }, [milestones]);

  // Add a localStorage listener to detect changes
  useEffect(() => {
    if (!isAuthenticated()) {
      const handleStorageChange = (e) => {
        if (e.key === 'pomodoroMilestones') {
          console.log('MilestoneTimeline: localStorage changed, refreshing milestones');
          const savedMilestones = localStorage.getItem('pomodoroMilestones');
          const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
          const projectMilestones = parsedMilestones.filter(m => m.projectId === projectId);
          if (onMilestonesUpdate) {
            onMilestonesUpdate(projectMilestones);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [projectId, onMilestonesUpdate]);

  // Add a listener for the custom milestonesUpdated event
  useEffect(() => {
    const handleMilestonesUpdated = (e) => {
      if (e.detail && e.detail.projectId === projectId) {
        console.log('MilestoneTimeline: Received milestonesUpdated event', e.detail);
        if (onMilestonesUpdate) {
          onMilestonesUpdate(e.detail.milestones);
        }
      }
    };

    window.addEventListener('milestonesUpdated', handleMilestonesUpdated);
    return () => {
      window.removeEventListener('milestonesUpdated', handleMilestonesUpdated);
    };
  }, [projectId, onMilestonesUpdate]);

  // Add a direct refresh function that can be called from outside
  const refreshMilestones = useCallback(() => {
    console.log('MilestoneTimeline: Direct refresh called');

    // Log current state for debugging
    console.log('MilestoneTimeline: Current milestones state:', milestones);

    if (isAuthenticated()) {
      milestoneApi.getMilestones(projectId)
        .then(updatedMilestones => {
          console.log('MilestoneTimeline: Refreshed milestones from API', updatedMilestones);
          if (onMilestonesUpdate) {
            onMilestonesUpdate(updatedMilestones);
          }
        })
        .catch(error => {
          console.error('Error refreshing milestones:', error);
        });
    } else {
      const savedMilestones = localStorage.getItem('pomodoroMilestones');
      console.log('MilestoneTimeline: Raw localStorage data:', savedMilestones);
      const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
      console.log('MilestoneTimeline: All parsed milestones:', parsedMilestones);
      const projectMilestones = parsedMilestones.filter(m => m.projectId === projectId);
      console.log('MilestoneTimeline: Filtered project milestones:', projectMilestones);

      if (onMilestonesUpdate) {
        console.log('MilestoneTimeline: Calling onMilestonesUpdate with:', projectMilestones);
        onMilestonesUpdate(projectMilestones);

        // Force a re-render by updating the state directly
        setTimeout(() => {
          console.log('MilestoneTimeline: Forcing re-render after timeout');
          onMilestonesUpdate([...projectMilestones]);
        }, 100);
      }
    }
  }, [projectId, onMilestonesUpdate, milestones]);

  // Add a synchronization function that rebuilds task-related milestones
  const synchronizeMilestones = useCallback(async () => {
    console.log('MilestoneTimeline: Synchronizing milestones');

    if (isAuthenticated()) {
      try {
        console.log('MilestoneTimeline: Synchronizing milestones for authenticated user');

        // Step 1: Get all tasks with due dates for this project
        const tasks = await taskApi.getTasks(null, projectId);
        const tasksWithDueDates = tasks.filter(task => task.dueDate);
        console.log('MilestoneTimeline: Tasks with due dates (API):', tasksWithDueDates);

        // Step 2: Get all existing milestones
        const existingMilestones = await milestoneApi.getMilestones(projectId);
        console.log('MilestoneTimeline: Existing milestones (API):', existingMilestones);

        // Step 3: Filter out task due milestones
        const nonTaskMilestones = existingMilestones.filter(
          milestone => !milestone.title.startsWith('Task Due:')
        );

        // Step 4: Delete all existing task due milestones
        const deletePromises = existingMilestones
          .filter(milestone => milestone.title.startsWith('Task Due:'))
          .map(milestone => {
            console.log('MilestoneTimeline: Deleting milestone:', milestone);
            return milestoneApi.deleteMilestone(milestone._id || milestone.id);
          });

        await Promise.all(deletePromises);
        console.log('MilestoneTimeline: Deleted all existing task due milestones');

        // Step 5: Create new task due milestones
        // First, create a set of existing task milestone titles to avoid duplicates
        const existingTaskTitles = new Set();

        // Create promises for new task milestones, avoiding duplicates
        const createPromises = tasksWithDueDates.map(task => {
          const milestoneTitle = `Task Due: ${task.title}`;

          // Skip if we already created a milestone for this task
          if (existingTaskTitles.has(milestoneTitle)) {
            console.log(`MilestoneTimeline: Skipping duplicate task milestone: ${milestoneTitle}`);
            return Promise.resolve();
          }

          existingTaskTitles.add(milestoneTitle);

          const milestoneData = {
            title: milestoneTitle,
            dueDate: new Date(task.dueDate).toISOString(),
            completed: task.completed || false,
            projectId: projectId
          };
          console.log('MilestoneTimeline: Creating milestone:', milestoneData);
          return milestoneApi.createMilestone(projectId, milestoneData);
        });

        await Promise.all(createPromises);
        console.log('MilestoneTimeline: Created new task due milestones');

        // Step 6: Refresh milestones
        const updatedMilestones = await milestoneApi.getMilestones(projectId);
        console.log('MilestoneTimeline: Updated milestones (API):', updatedMilestones);

        if (onMilestonesUpdate) {
          onMilestonesUpdate(updatedMilestones);
        }
      } catch (error) {
        console.error('MilestoneTimeline: Error synchronizing milestones (API):', error);
      }
      return;
    }

    // For non-authenticated users, rebuild task-related milestones from scratch
    try {
      // Get all tasks with due dates for this project
      const savedTasks = localStorage.getItem('pomodoroTasks');
      const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
      const projectTasks = parsedTasks.filter(task => task.projectId === projectId);
      const tasksWithDueDates = projectTasks.filter(task => task.dueDate);

      console.log('MilestoneTimeline: Tasks with due dates (localStorage):', tasksWithDueDates);

      // Get all existing milestones
      const savedMilestones = localStorage.getItem('pomodoroMilestones');
      const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];

      // Filter out task due milestones for this project
      const allNonTaskMilestones = parsedMilestones.filter(
        milestone => !milestone.title.startsWith('Task Due:') || milestone.projectId !== projectId
      );

      // Create new task due milestones
      const taskDueMilestones = tasksWithDueDates.map(task => ({
        id: `milestone-task-${task.id}-${Date.now()}`,
        title: `Task Due: ${task.title}`,
        dueDate: new Date(task.dueDate).toISOString(),
        completed: task.completed || false,
        projectId: projectId,
        position: 0,
        createdAt: new Date().toISOString()
      }));

      console.log('MilestoneTimeline: Non-task milestones to keep (localStorage):', allNonTaskMilestones);
      console.log('MilestoneTimeline: Task due milestones to create (localStorage):', taskDueMilestones);

      // Combine non-task milestones with new task due milestones
      const updatedMilestones = [...allNonTaskMilestones, ...taskDueMilestones];

      // Save to localStorage
      localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));

      // Update state with project milestones
      const projectMilestones = updatedMilestones.filter(milestone => milestone.projectId === projectId);
      console.log('MilestoneTimeline: Updated project milestones (localStorage):', projectMilestones);

      if (onMilestonesUpdate) {
        onMilestonesUpdate(projectMilestones);

        // Force a re-render by updating the state directly
        setTimeout(() => {
          console.log('MilestoneTimeline: Forcing re-render after synchronization');
          onMilestonesUpdate([...projectMilestones]);
        }, 100);
      }

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('milestonesUpdated', {
        detail: { projectId, milestones: projectMilestones }
      }));
    } catch (error) {
      console.error('MilestoneTimeline: Error synchronizing milestones (localStorage):', error);
    }
  }, [projectId, onMilestonesUpdate, refreshMilestones]);

  // Expose the refresh and synchronize functions to the window object
  useEffect(() => {
    console.log('MilestoneTimeline: Exposing functions to window object');
    window.refreshMilestones = refreshMilestones;
    window.synchronizeMilestones = synchronizeMilestones;

    // Test if they're actually available
    console.log('MilestoneTimeline: Is refreshMilestones available?', !!window.refreshMilestones);
    console.log('MilestoneTimeline: Is synchronizeMilestones available?', !!window.synchronizeMilestones);

    return () => {
      console.log('MilestoneTimeline: Removing functions from window object');
      delete window.refreshMilestones;
      delete window.synchronizeMilestones;
    };
  }, [refreshMilestones, synchronizeMilestones]);

  // Listen for changes to tasks with due dates
  useEffect(() => {
    const handleTasksChanged = (e) => {
      console.log('MilestoneTimeline: Received tasksChanged event', e.detail);
      if (e.detail && e.detail.projectId === projectId) {
        // Synchronize milestones when tasks change
        synchronizeMilestones();
      }
    };

    window.addEventListener('tasksChanged', handleTasksChanged);
    return () => {
      window.removeEventListener('tasksChanged', handleTasksChanged);
    };
  }, [projectId, synchronizeMilestones]);

  // Combine regular milestones with deadline milestone if it exists
  // Also deduplicate milestones by title to prevent duplicates
  const combinedMilestones = useMemo(() => {
    // First deduplicate the milestones by title
    const uniqueMilestones = [];
    const titleSet = new Set();

    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        if (!titleSet.has(milestone.title)) {
          titleSet.add(milestone.title);
          uniqueMilestones.push(milestone);
        } else {
          console.log(`Duplicate milestone found and skipped: ${milestone.title}`);
        }
      }
    }

    // Then add the deadline milestone if it exists
    if (deadlineMilestone && !titleSet.has(deadlineMilestone.title)) {
      return [...uniqueMilestones, deadlineMilestone];
    }

    return uniqueMilestones;
  }, [milestones, deadlineMilestone]);

  // Sort milestones by due date
  const sortedMilestones = [...combinedMilestones].sort((a, b) =>
    new Date(a.dueDate) - new Date(b.dueDate)
  );

  // 计算今天在时间线上的相对位置
  useEffect(() => {
    if (sortedMilestones.length > 0) {
      const today = new Date();
      const firstDate = new Date(sortedMilestones[0].dueDate);
      const lastDate = new Date(sortedMilestones[sortedMilestones.length - 1].dueDate);
      if (today < firstDate) {
        setTodayPosition(-1);
      } else if (today > lastDate) {
        setTodayPosition(101);
      } else {
        const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
        const daysPassed = (today - firstDate) / (1000 * 60 * 60 * 24);
        const position = (daysPassed / totalDays) * 100;
        const timerRef = setTimeout(() => {
          setTodayPosition(position);
        }, 300);
        return () => clearTimeout(timerRef);
      }
    }
  }, [sortedMilestones]);

  useEffect(() => {
    if (milestones.length === 0) return;
    const today = new Date();
    let earliestDate = today;
    let latestDate = today;
    if (milestones.length > 0) {
      const milestoneDates = milestones.map(m => new Date(m.dueDate));
      const earliestMilestone = new Date(Math.min(...milestoneDates));
      const latestMilestone = new Date(Math.max(...milestoneDates));
      earliestDate = earliestMilestone < today ? earliestMilestone : today;
      latestDate = latestMilestone > today ? latestMilestone : today;
    }
    const timelinePadding = 3 * 24 * 60 * 60 * 1000;
    earliestDate = new Date(earliestDate.getTime() - timelinePadding);
    latestDate = new Date(latestDate.getTime() + timelinePadding);
    setTimelineStart(earliestDate);
    setTimelineEnd(latestDate);
    if (earliestDate && latestDate) {
      const timelineLength = latestDate.getTime() - earliestDate.getTime();
      const todayOffset = today.getTime() - earliestDate.getTime();
      const position = (todayOffset / timelineLength) * 100;
      setTodayPosition(Math.min(Math.max(position, 0), 100));
    }
  }, [milestones]);

  // Add a new milestone
  const addMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim() || !newMilestone.dueDate) {
      setError('Title and due date are required');
      return;
    }
    try {
      if (isAuthenticated()) {
        await milestoneApi.createMilestone(projectId, {
          title: newMilestone.title.trim(),
          dueDate: new Date(newMilestone.dueDate)
        });
        const updatedMilestones = await milestoneApi.getMilestones(projectId);
        onMilestonesUpdate && onMilestonesUpdate(updatedMilestones);
      } else {
        const newMilestoneObj = {
          id: Date.now().toString(),
          title: newMilestone.title.trim(),
          dueDate: new Date(newMilestone.dueDate).toISOString(),
          completed: false,
          projectId,
          position: milestones.length,
          createdAt: new Date().toISOString()
        };
        const savedMilestones = localStorage.getItem('pomodoroMilestones');
        const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
        const updatedMilestones = [...parsedMilestones, newMilestoneObj];
        localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));
        const projectMilestones = updatedMilestones.filter(milestone => milestone.projectId === projectId);
        onMilestonesUpdate && onMilestonesUpdate(projectMilestones);
      }
      setNewMilestone({ title: '', dueDate: '' });
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error('Error creating milestone:', err);
      setError('Failed to create milestone. Please try again.');
    }
  };

  // Delete a milestone - completely rewritten for simplicity and reliability
  const deleteMilestone = (milestoneId, milestone) => {
    console.log('Delete milestone called with:', { milestoneId, milestone });

    // Special case: Don't allow deletion of task due milestones
    if (milestone && milestone.title && milestone.title.startsWith('Task Due:')) {
      setError('Task due milestones cannot be deleted directly. Delete or edit the associated task to remove this milestone.');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    // For non-authenticated users, use localStorage directly
    if (!isAuthenticated()) {
      try {
        // Get current milestones from localStorage
        const savedMilestones = localStorage.getItem('pomodoroMilestones');
        const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];

        console.log('Before deletion, localStorage has', parsedMilestones.length, 'milestones');
        console.log('Looking for milestone with ID:', milestoneId);

        // Remove the milestone with the matching ID
        const updatedMilestones = parsedMilestones.filter(m => m.id !== milestoneId);

        console.log('After filtering, localStorage has', updatedMilestones.length, 'milestones');

        // Save the updated milestones back to localStorage
        localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));

        // Update the UI with only the milestones for this project
        const projectMilestones = updatedMilestones.filter(m => m.projectId === projectId);
        onMilestonesUpdate && onMilestonesUpdate(projectMilestones);

        console.log('Milestone deleted successfully');
        setError(null);
      } catch (error) {
        console.error('Error deleting milestone from localStorage:', error);
        setError('Failed to delete milestone. Please try again.');
      }
      return;
    }

    // For authenticated users, use the API
    milestoneApi.deleteMilestone(milestoneId)
      .then(() => {
        console.log('Milestone deleted successfully via API');
        return milestoneApi.getMilestones(projectId);
      })
      .then(updatedMilestones => {
        onMilestonesUpdate && onMilestonesUpdate(updatedMilestones);
        setError(null);
      })
      .catch(error => {
        console.error('Error deleting milestone via API:', error);
        setError('Failed to delete milestone. Please try again.'+ milestoneId);
      });
  };

  const getPositionOnTimeline = (date) => {
    if (!timelineStart || !timelineEnd) return 50;
    const dateObj = new Date(date);
    const timelineLength = timelineEnd.getTime() - timelineStart.getTime();
    const dateOffset = dateObj.getTime() - timelineStart.getTime();
    return (dateOffset / timelineLength) * 100;
  };

  // Calculate z-index for overlapping milestones
  const milestonesWithPosition = useMemo(() => {
    if (!timelineStart || !timelineEnd || milestones.length === 0) return [];
    return sortedMilestones.map((milestone, index) => {
      const position = getPositionOnTimeline(milestone.dueDate);
      const isTop = index % 2 === 0;
      return {
        ...milestone,
        position,
        isTop,
        zIndex: sortedMilestones.length - index
      };
    });
  }, [sortedMilestones, timelineStart, timelineEnd, getPositionOnTimeline, milestones.length]);

  const renderMilestones = () => {
    // If there are no milestones but there is a deadline milestone, still render the timeline
    if ((!milestones || milestones.length === 0) && deadlineMilestone) {
      // Deadline milestone is the only one
      // Calculate start and end dates based on the deadline
      const startDate = timelineStart || new Date(deadlineMilestone.dueDate);
      const endDate = timelineEnd || new Date(deadlineMilestone.dueDate);
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 7);
      const effectiveEndDate = endDate > minEndDate ? endDate : minEndDate;
      const totalDuration = effectiveEndDate.getTime() - startDate.getTime();
      const today = new Date();
      let todayPosition = 0;
      if (today >= startDate && today <= effectiveEndDate) {
        todayPosition = ((today.getTime() - startDate.getTime()) / totalDuration) * 100;
      } else if (today < startDate) {
        todayPosition = 0;
      } else {
        todayPosition = 100;
      }

      // Calculate the position of the deadline on the timeline
      if (!timelineStart || !timelineEnd || !totalDuration || totalDuration <= 0) return null;
      const deadlineDateObj = new Date(deadlineMilestone.dueDate);
      let deadlinePosition = ((deadlineDateObj.getTime() - startDate.getTime()) / totalDuration) * 100;
      let clampedDeadlinePosition = Math.max(0, Math.min(100, deadlinePosition));
      // Only render if position is a valid number
      if (isNaN(clampedDeadlinePosition)) return null;
      return (
        <TimelineContainer style={{ minWidth: 320 }}>
          <TimelineTrack $hasDeadline={true} $onlyDeadline={true} />
          <TimelineStartDate>{formatDate(startDate)}</TimelineStartDate>
          <TimelineEndDate>{formatDate(effectiveEndDate)}</TimelineEndDate>
          {todayPosition >= 0 && todayPosition <= 100 && (
            <>
              <TimelinePoint
                $position={todayPosition}
                $active={true}
                style={{ backgroundColor: '#ff9800', zIndex: 3 }}
              />
              <TodayMarker
                $position={todayPosition}
                $isTop={true}
                style={{ zIndex: hoveredMilestoneId === 'standalone-today' ? 100 : 5 }}
                onMouseEnter={() => setHoveredMilestoneId('standalone-today')}
                onMouseLeave={() => setHoveredMilestoneId(null)}
              >
                <TodayMarkerDot />
                <TodayLabel>Today</TodayLabel>
              </TodayMarker>
            </>
          )}
          <TimelinePoint
            $position={clampedDeadlinePosition}
            $isDeadline={true}
            $isOverdue={new Date(deadlineMilestone.dueDate) < new Date()}
          />
          <DeadlineMarker
            $position={clampedDeadlinePosition}
            $isTop={true}
            style={{ zIndex: hoveredMilestoneId === 'standalone-deadline' ? 100 : 5 }}
            onMouseEnter={() => setHoveredMilestoneId('standalone-deadline')}
            onMouseLeave={() => setHoveredMilestoneId(null)}
          >
            <DeadlineMarkerDot />
            <DeadlineLabel>Deadline</DeadlineLabel>
          </DeadlineMarker>
        </TimelineContainer>
      );
    }
    if (!milestones || milestones.length === 0) {
      return null;
    }

    // Calculate start and end dates based on milestones
    const startDate = timelineStart || new Date(Math.min(...milestones.map(m => new Date(m.dueDate))));
    const endDate = timelineEnd || new Date(Math.max(...milestones.map(m => new Date(m.dueDate))));

    // Ensure we have at least a week range for short projects
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + 7);

    const effectiveEndDate = endDate > minEndDate ? endDate : minEndDate;

    // Calculate the total duration in milliseconds
    const totalDuration = effectiveEndDate.getTime() - startDate.getTime();

    // Calculate today's position as a percentage
    const today = new Date();
    let todayPosition = 0;

    if (today >= startDate && today <= effectiveEndDate) {
      todayPosition = ((today.getTime() - startDate.getTime()) / totalDuration) * 100;
    } else if (today < startDate) {
      todayPosition = 0;
    } else {
      todayPosition = 100;
    }

    // Calculate deadline position as a percentage
    let deadlinePosition = -1; // Default to not showing
    const deadlineDate = projectData?.deadline ? new Date(projectData.deadline) :
                         (project?.deadline ? new Date(project.deadline) : null);

    if (deadlineDate && totalDuration > 0) {
      if (deadlineDate >= startDate && deadlineDate <= effectiveEndDate) {
        deadlinePosition = ((deadlineDate.getTime() - startDate.getTime()) / totalDuration) * 100;
      } else if (deadlineDate < startDate) {
        deadlinePosition = 0;
      } else if (deadlineDate > effectiveEndDate) {
        deadlinePosition = 100;
      }
    }

    // Check if today's marker would overlap with any milestone
    let todayIsTop = true; // Default position (above timeline)
    const proximityThreshold = 5; // Percentage threshold to consider overlap

    for (const milestone of milestonesWithPosition) {
      const distance = Math.abs(milestone.position - todayPosition);
      if (distance < proximityThreshold) {
        // If a milestone is nearby, place the today marker on the opposite side
        todayIsTop = !milestone.isTop;
        break;
      }
    }

    return (
      <TimelineContainer>
        <TimelineTrack $hasDeadline={!!(projectData?.deadline || project?.deadline)} $onlyDeadline={false} />
        <TimelineStartDate>{formatDate(startDate)}</TimelineStartDate>
        <TimelineEndDate>{formatDate(effectiveEndDate)}</TimelineEndDate>

        {/* Show deadline marker similar to Today marker - only if no deadline milestone exists */}
        {deadlinePosition >= 0 && deadlinePosition <= 100 && !milestonesWithPosition.some(m => m.isDeadline) && (
          <>
            <TimelinePoint
              $position={deadlinePosition}
              $active={true}
              style={{ backgroundColor: '#d32f2f', zIndex: 3 }}
            />
            <DeadlineMarker
              $position={deadlinePosition}
              $isTop={!todayIsTop}
              style={{ zIndex: hoveredMilestoneId === 'deadline' ? 100 : 5 }}
              onMouseEnter={() => setHoveredMilestoneId('deadline')}
              onMouseLeave={() => setHoveredMilestoneId(null)}
            >
              <DeadlineLabel>Deadline</DeadlineLabel>
            </DeadlineMarker>
          </>
        )}

        {todayPosition >= 0 && todayPosition <= 100 && (
          <>
            <TimelinePoint
              $position={todayPosition}
              $active={true}
              style={{ backgroundColor: '#ff9800', zIndex: 3 }}
            />
            <TodayMarker
              $position={todayPosition}
              $isTop={todayIsTop}
              style={{ zIndex: hoveredMilestoneId === 'today' ? 100 : 5 }}
              onMouseEnter={() => setHoveredMilestoneId('today')}
              onMouseLeave={() => setHoveredMilestoneId(null)}
            >
              <TodayLabel>Today</TodayLabel>
            </TodayMarker>
          </>
        )}

        {milestonesWithPosition.map((milestone) => {
          // 使用预先计算好的position
          const clampedPosition = Math.max(0, Math.min(100, milestone.position));
          const isDeadline = milestone.isDeadline;
          const isOverdue = isDeadline && new Date(milestone.dueDate) < new Date();

          // Render deadline milestones in the same style as the Today marker
          if (isDeadline) {
            const milestoneId = milestone.id || milestone._id;
            const isHovered = hoveredMilestoneId === milestoneId;

            return (
              <React.Fragment key={milestoneId}>
                <TimelinePoint
                  $position={clampedPosition}
                  $active={milestone.completed}
                  $isDeadline={isDeadline}
                  $isOverdue={isOverdue}
                />
                <DeadlineMarker
                  $position={clampedPosition}
                  $isTop={milestone.isTop}
                  style={{ zIndex: isHovered ? 100 : 10 }}
                  onMouseEnter={() => setHoveredMilestoneId(milestoneId)}
                  onMouseLeave={() => setHoveredMilestoneId(null)}
                >
                  <DeadlineLabel>Deadline</DeadlineLabel>
                </DeadlineMarker>
              </React.Fragment>
            );
          }

          // Render regular milestones
          const milestoneId = milestone.id || milestone._id;
          const isHovered = hoveredMilestoneId === milestoneId;

          return (
            <React.Fragment key={milestoneId}>
              <TimelinePoint
                $position={clampedPosition}
                $active={milestone.completed}
                $isDeadline={isDeadline}
                $isOverdue={isOverdue}
              />
              <MilestoneContent
                $position={clampedPosition}
                $isTop={milestone.isTop}
                $isDeadline={isDeadline}
                $isOverdue={isOverdue}
                $isHovered={isHovered}
                style={{
                  zIndex: isHovered ? 100 : milestone.zIndex,
                  minWidth: '120px',
                  padding: '8px 12px'
                }}
                onMouseEnter={() => setHoveredMilestoneId(milestoneId)}
                onMouseLeave={() => setHoveredMilestoneId(null)}
              >
                <MilestoneTitle $completed={milestone.completed} $isDeadline={isDeadline} $isOverdue={isOverdue}>
                  {milestone.title}
                </MilestoneTitle>
                <MilestoneDate $isDeadline={isDeadline} $isOverdue={isOverdue}>
                  {formatDate(milestone.dueDate)}
                </MilestoneDate>
                {/* Only show delete button if not a task due milestone */}
                {!milestone.title.startsWith('Task Due:') && (
                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log('Delete button clicked for milestone:', milestone);
                      const id = isAuthenticated() ? milestone._id : milestone.id;
                      console.log('Using ID:', id);
                      deleteMilestone(id, milestone);
                    }}
                    title="Delete milestone"
                  >
                    <FaTrash />
                  </DeleteButton>
                )}
              </MilestoneContent>
            </React.Fragment>
          );
        })}
      </TimelineContainer>
    );
  };

  return (
    <MilestoneContainer>
      <TitleRow>
        <TitleText>Timeline</TitleText>
        {!isAdding && (
          <AddButton onClick={() => setIsAdding(true)}>
            <FaPlus /> Add Milestone
          </AddButton>
        )}
      </TitleRow>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isAdding && (
        <AddMilestoneForm onSubmit={addMilestone}>
          <FormGroup>
            <Input
              type="text"
              placeholder="Milestone title"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup>
            <Input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              placeholder="Select a date"
              required
              autoFocus
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit">
              Add
            </SubmitButton>
          </ButtonGroup>
        </AddMilestoneForm>
      )}

      {renderMilestones()}
    </MilestoneContainer>
  );
};

// Styled components
const MilestoneContainer = styled.div`
  margin-bottom: 1rem;
  position: relative;
  padding-top: 30px; /* Further increased padding to create even more space */
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem; /* Further increased margin to create even more space */
  padding: 6px 10px;
  position: relative;
  z-index: 20; /* Higher z-index to ensure it's above timeline elements */
`;

const TitleText = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #444;
  margin: 0;
`;

const TimelineContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 120px;
  padding: 25px 15px 40px;
  margin-top: 25px; /* Further increased margin to create even more space */
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  overflow: visible;
`;

const TimelineTrack = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #e0e0e0, #a0d2d5);
  transform: translateY(-50%);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 10px;
    height: 10px;
    background-color: #d32f2f;
    border-radius: 50%;
    transform: translateY(-50%);
    display: ${props => props.$hasDeadline && !props.$onlyDeadline ? 'block' : 'none'};
    box-shadow: 0 0 0 3px rgba(211,47,47,0.2);
  }
`;

const TimelinePoint = styled.div`
  position: absolute;
  width: ${props => props.$isDeadline ? '14px' : '10px'};
  height: ${props => props.$isDeadline ? '14px' : '10px'};
  border-radius: 50%;
  background-color: ${props => {
    if (props.$isDeadline) {
      return '#d32f2f'; // solid red for deadline
    }
    return props.$active ? '#4c9195' : '#a0d2d5';
  }};
  border: 2px solid #fff;
  top: 50%;
  left: ${props => props.$position}%;
  transform: translate(-50%, -50%);
  z-index: ${props => props.$isDeadline ? 5 : 2};
  box-shadow: ${props => props.$isDeadline
    ? '0 0 0 4px rgba(211,47,47,0.15), 0 2px 4px rgba(0,0,0,0.2)'
    : '0 0 0 3px rgba(160,210,213,0.2), 0 2px 4px rgba(0,0,0,0.1)'};
  transition: all 0.2s ease;

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: ${props => props.$isDeadline
      ? '0 0 0 5px rgba(211,47,47,0.2), 0 3px 6px rgba(0,0,0,0.25)'
      : '0 0 0 4px rgba(160,210,213,0.25), 0 3px 6px rgba(0,0,0,0.15)'};
  }
`;

const TodayMarker = styled.div`
  position: absolute;
  top: ${props => props.$isTop ? '40%' : '60%'};
  left: ${props => props.$position}%;
  transform: translateX(-50%) translateY(${props => props.$isTop ? '-100%' : '0'});
  z-index: 5;
  background: transparent;
  transition: all 0.2s ease, z-index 0s;
  display: flex;
  flex-direction: column;
  align-items: center;

  /* Add dotted line connector */
  &::after {
    content: '';
    position: absolute;
    width: 0;
    border-left: 2.5px dashed #ff9800;
    z-index: 1;

    /* Position the line based on whether the marker is above or below */
    ${props => props.$isTop ? `
      bottom: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    ` : `
      top: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    `}
  }

  &:hover {
    transform: translateX(-50%) translateY(${props => props.$isTop ? '-100%' : '0'}) scale(1.05);
    z-index: 100 !important; /* Force highest z-index on hover */
  }
`;

const TodayMarkerDot = styled.div`
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 14px solid #ff9800;
  filter: drop-shadow(0 0 3px rgba(255, 152, 0, 0.5));
  z-index: 4;
  transition: all 0.2s ease;
  margin-bottom: -1px;
`;

const TodayLabel = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  color: #ff7800;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  border: 1px solid rgba(255, 152, 0, 0.3);
  text-align: center;
  min-width: 40px;
`;

// Removed unused TimelineItemsContainer

const MilestoneContent = styled.div`
  background-color: ${props => {
    if (props.$isDeadline) {
      return '#ffebee'; // light red background
    }
    return '#fff';
  }};
  padding: ${props => props.$isDeadline ? '10px 15px 30px' : '8px 12px 30px'}; /* Increased bottom padding for delete button */
  border-radius: 8px;
  transition: all 0.2s ease, z-index 0s;
  position: absolute;
  box-shadow: ${props => props.$isDeadline
    ? '0 3px 8px rgba(211,47,47,0.15), 0 1px 3px rgba(0,0,0,0.1)'
    : '0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'};
  border: ${props => props.$isDeadline
    ? '1.5px solid #d32f2f'
    : '1px solid rgba(0,0,0,0.1)'};
  min-width: ${props => props.$isDeadline ? '160px' : '130px'};
  max-width: ${props => props.$isDeadline ? '250px' : '220px'}; /* Increased max-width to accommodate longer text */
  transform: translateX(${props => {
    // Adjust position for items near the edges
    const position = props.$position;
    if (position >= 90) return '-90%';
    if (position <= 10) return '-10%';
    return '-50%';
  }});
  left: ${props => props.$position}%;
  top: ${props => props.$isTop ? '-25px' : '55%'};
  z-index: ${props => {
    // Give deadline milestones higher z-index to prevent overlapping
    if (props.$isDeadline) return 10;
    if (props.$isHovered) return 100; // Very high z-index when hovered
    return props.style?.zIndex || 2;
  }};
  overflow: visible;
  white-space: normal;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  word-break: break-word;
  max-height: none; /* Remove any height restrictions */

  /* Add dotted line connector */
  &::after {
    content: '';
    position: absolute;
    width: 0;
    border-left: 2.5px dashed #666;
    z-index: 1;

    /* Position the line based on whether the tooltip is above or below */
    ${props => props.$isTop ? `
      bottom: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    ` : `
      top: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    `}
  }

  &:hover {
    transform: translateX(${props => {
      // Maintain the same edge adjustment on hover
      const position = props.$position;
      if (position >= 90) return '-90%';
      if (position <= 10) return '-10%';
      return '-50%';
    }}) scale(1.02);
    box-shadow: ${props => props.$isDeadline
      ? '0 5px 12px rgba(211,47,47,0.2), 0 2px 4px rgba(0,0,0,0.15)'
      : '0 4px 10px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'};
    z-index: 100 !important; /* Force highest z-index on hover */
  }
`;

const MilestoneTitle = styled.div`
  font-weight: 700;
  font-size: ${props => props.$isDeadline ? '0.95rem' : '0.9rem'};
  color: ${props => props.$isDeadline ? '#d32f2f' : '#333'};
  margin-bottom: 4px;
  background: none;
  border-radius: 3px;
  padding: 0;
  display: flex;
  align-items: flex-start;
  overflow: visible; /* Changed from hidden to visible */
  max-width: 100%;
  white-space: normal;
  width: 100%;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.4; /* Slightly increased line height */
  hyphens: auto; /* Enable hyphenation for better text wrapping */

  svg {
    margin-right: 6px;
    font-size: ${props => props.$isDeadline ? '0.9rem' : '0.8rem'};
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin-top: 2px;
  }

  ${MilestoneContent}:hover & {
    transform: translateX(2px);
    color: ${props => props.$isDeadline ? '#b71c1c' : '#111'};

    svg {
      transform: scale(1.1);
    }
  }
`;

const MilestoneDate = styled.div`
  font-size: ${props => props.$isDeadline ? '0.85rem' : '0.8rem'};
  color: ${props => props.$isDeadline ? '#d32f2f' : '#666'};
  margin-top: 2px;
  font-weight: 500;
  white-space: normal;
  overflow: visible; /* Changed from hidden to visible */
  width: 100%;
  transition: all 0.3s ease;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.3; /* Slightly increased line height */
  hyphens: auto; /* Enable hyphenation for better text wrapping */

  ${MilestoneContent}:hover & {
    transform: translateX(2px);
    color: ${props => props.$isDeadline ? '#b71c1c' : '#444'};
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: none;
  border: none;
  color: #d95550;
  cursor: pointer;
  padding: 6px;  /* Slightly reduced padding */
  font-size: 0.9rem;  /* Slightly reduced font size */
  opacity: 0.6;  /* Slightly more visible by default */
  transition: all 0.2s ease;
  border-radius: 4px;
  z-index: 10;
  margin-top: 8px; /* Increased space from the content above */

  &:hover {
    color: #fff;
    background-color: #d95550;
    opacity: 1;
    transform: scale(1.1);
  }

  ${MilestoneContent}:hover & {
    opacity: 0.9;  /* More visible on hover */
  }
`;

const AddMilestoneForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  background-color: var(--card-bg);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: #d95550;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
`;

const AddButton = styled(Button)`
  background-color: #d95550;
  color: white;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 25; /* Even higher z-index to ensure it's above all other elements */
  margin-right: 10px; /* Add some margin to prevent overlap */

  svg {
    font-size: 0.7rem;
  }

  &:hover {
    background-color: #c04540;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
`;

const CancelButton = styled(Button)`
  background-color: #f0f0f0;
  color: #555;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #d95550;
  color: white;

  &:hover {
    background-color: #c04540;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;

  &::before {
    content: "⚠️";
    margin-right: 5px;
  }
`;

// TodayLabel is now defined above

const DeadlineMarker = styled.div`
  position: absolute;
  top: ${props => props.$isTop ? '40%' : '60%'};
  left: ${props => props.$position}%;
  transform: translateX(-50%) translateY(${props => props.$isTop ? '-100%' : '0'});
  z-index: 5;
  background: transparent;
  transition: all 0.2s ease, z-index 0s;
  display: flex;
  flex-direction: column-reverse; /* Changed to column-reverse to put triangle below text */
  align-items: center;

  /* Add dotted line connector */
  &::after {
    content: '';
    position: absolute;
    width: 0;
    border-left: 2.5px dashed #d32f2f;
    z-index: 1;

    /* Position the line based on whether the marker is above or below */
    ${props => props.$isTop ? `
      bottom: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    ` : `
      top: -10px;
      height: 10px;
      left: 50%;
      transform: translateX(-50%);
    `}
  }

  &:hover {
    transform: translateX(-50%) translateY(${props => props.$isTop ? '-100%' : '0'}) scale(1.05);
    z-index: 100 !important; /* Force highest z-index on hover */
  }
`;

const DeadlineMarkerDot = styled.div`
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid #d32f2f; /* Changed from border-bottom to border-top */
  filter: drop-shadow(0 0 3px rgba(211, 47, 47, 0.5));
  z-index: 4;
  transition: all 0.2s ease;
  margin-top: -1px; /* Changed from margin-bottom to margin-top */
`;

const DeadlineLabel = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  color: #d32f2f;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  border: 1px solid rgba(211, 47, 47, 0.3);
  text-align: center;
  min-width: 40px;
`;

const TimelineStartDate = styled.div`
  position: absolute;
  left: 0;
  bottom: 10px;
  font-size: 0.8rem;
  color: #666;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
`;

const TimelineEndDate = styled.div`
  position: absolute;
  right: 0;
  bottom: 10px;
  font-size: 0.8rem;
  color: #666;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
`;

export default MilestoneTimeline;