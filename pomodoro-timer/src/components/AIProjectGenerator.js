import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { projectApi, milestoneApi, taskApi, noteApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';
import { aiService } from '../services/aiService';
import eventBus from '../utils/eventBus';
import { FaRobot, FaLightbulb, FaInfoCircle, FaArrowRight, FaCheck, FaTimes, FaTerminal, FaClock, FaBrain, FaChartLine, FaCalendarAlt, FaTasks } from 'react-icons/fa';
import AILoadingScreen from './AILoadingScreen';
import ConfirmationDialog from './common/ConfirmationDialog';

// Benefits content for the carousel
const benefitsContent = [
  {
    id: 1,
    icon: <FaClock />,
    title: "The Pomodoro Technique",
    content: "The Pomodoro Technique helps you work with time, not against it. Break work into 25-minute focused sessions followed by 5-minute breaks to maintain high concentration and prevent burnout."
  },
  {
    id: 2,
    icon: <FaBrain />,
    title: "Project-Based Thinking",
    content: "Treating your work, life, health, and travel as projects helps you organize tasks, set clear goals, track progress, and achieve meaningful outcomes with less stress and better focus."
  },
  {
    id: 3,
    icon: <FaChartLine />,
    title: "Productivity Benefits",
    content: "Studies show that the Pomodoro Technique can increase productivity by up to 25% by reducing distractions, preventing mental fatigue, and creating a sustainable work rhythm."
  },
  {
    id: 4,
    icon: <FaCalendarAlt />,
    title: "Consistent Progress",
    content: "Breaking large projects into manageable tasks with estimated pomodoros helps you make consistent daily progress and avoid procrastination and last-minute rushes."
  },
  {
    id: 5,
    icon: <FaTasks />,
    title: "AI-Pomo Advantage",
    content: "AI-Pomo combines the Pomodoro Technique with AI-powered project planning to help you structure your work optimally, estimate time requirements accurately, and focus on what matters most."
  },
  {
    id: 6,
    icon: <FaRobot />,
    title: "AI Project Generation",
    content: "Our AI analyzes your project description to create a complete structure with tasks, subtasks, milestones, and notes - saving you hours of planning time and ensuring nothing important is missed."
  }
];

// Benefits Carousel Component
const BenefitsCarousel = ({ compact = false, transparent = false }) => {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');

  // Rotate through benefits every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFadeState('out');

      setTimeout(() => {
        setCurrentBenefitIndex((prevIndex) => (prevIndex + 1) % benefitsContent.length);
        setFadeState('in');
      }, 500); // Wait for fade out animation to complete
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const currentBenefit = benefitsContent[currentBenefitIndex];

  if (compact) {
    return (
      <CompactBenefitSection fadeState={fadeState} transparent={transparent}>
        <CompactBenefitContent>
          <CompactBenefitIcon>{currentBenefit.icon}</CompactBenefitIcon>
          <div>
            <CompactBenefitTitle>{currentBenefit.title}</CompactBenefitTitle>
            <CompactBenefitText>{currentBenefit.content}</CompactBenefitText>
          </div>
        </CompactBenefitContent>
        <BenefitIndicators>
          {benefitsContent.map((benefit, index) => (
            <IndicatorDot
              key={benefit.id}
              active={index === currentBenefitIndex}
              onClick={() => {
                setFadeState('out');
                setTimeout(() => {
                  setCurrentBenefitIndex(index);
                  setFadeState('in');
                }, 500);
              }}
            />
          ))}
        </BenefitIndicators>
      </CompactBenefitSection>
    );
  }

  return (
    <BenefitSection fadeState={fadeState}>
      <BenefitIcon>{currentBenefit.icon}</BenefitIcon>
      <BenefitContent>
        <BenefitTitle>{currentBenefit.title}</BenefitTitle>
        <BenefitText>{currentBenefit.content}</BenefitText>
      </BenefitContent>
      <BenefitIndicators>
        {benefitsContent.map((benefit, index) => (
          <IndicatorDot
            key={benefit.id}
            active={index === currentBenefitIndex}
            onClick={() => {
              setFadeState('out');
              setTimeout(() => {
                setCurrentBenefitIndex(index);
                setFadeState('in');
              }, 500);
            }}
          />
        ))}
      </BenefitIndicators>
    </BenefitSection>
  );
};

const AIProjectGenerator = () => {
  // Initialize state without using localStorage
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProject, setGeneratedProject] = useState(null);

  // State for streaming output
  const [streamContent, setStreamContent] = useState('');
  const [streamJson, setStreamJson] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // State for navigation warning dialog
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Log when showNavigationWarning changes
  useEffect(() => {
    console.log('AIProjectGenerator: showNavigationWarning changed to', showNavigationWarning);
  }, [showNavigationWarning]);

  const [projectLimitReached, setProjectLimitReached] = useState(false);
  const [userData, setUserData] = useState(null);
  const [openProjects, setOpenProjects] = useState([]);
  const navigate = useNavigate();

  // Sample text for the user
  const sampleText = "Example: I want to create a personal website to showcase my portfolio. It should include my resume, projects, and contact information. I need to finish it by the end of next month for a job application. Key tasks include designing the layout, creating content, and deploying the site.";

  // More detailed example for the tooltip
  const detailedExample = `
I'm planning a wedding that will take place on June 15, 2025. We need to:
1. Book a venue within the next month
2. Send out invitations by March 2025
3. Arrange catering and flowers by April 2025
4. Finalize the guest list by February 2025
5. Book a photographer and DJ by January 2025

The wedding will have about 100 guests, and we want a garden ceremony with an indoor reception. Our budget is $20,000.
  `;

  // Check project limit on component mount
  useEffect(() => {
    const checkProjectLimit = async () => {
      try {
        if (isAuthenticated()) {
          // Get open projects
          const projects = await projectApi.getProjects('open,working');
          setOpenProjects(projects);

          // Get user data to check their project limit
          // Use the API base URL from environment or default to localhost
          const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiBaseUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const userDataResponse = await response.json();
            console.log('User data for AI project limit check:', userDataResponse);
            setUserData(userDataResponse);
            const projectLimit = userDataResponse.maxProjects || 3;

            setProjectLimitReached(projects.length >= projectLimit);
            console.log(`Project limit check: ${projects.length}/${projectLimit}`);
          } else {
            // Default to standard limit if there's an issue
            setProjectLimitReached(projects.length >= 3);
          }
        }
      } catch (err) {
        console.error('Error checking project limit:', err);
        setError('Failed to check project limit. Please try again.');
      }
    };

    checkProjectLimit();
  }, []);

  // Function to handle stream updates from the API
  const handleStreamUpdate = (update) => {
    if (update.partialContent) {
      setStreamContent(update.partialContent);

      // Ensure auto-scroll happens after state update
      setTimeout(() => {
        const codeContent = document.getElementById('codeContent');
        if (codeContent) {
          codeContent.scrollTop = codeContent.scrollHeight;
        }
      }, 0);
    }

    if (update.partialJson) {
      // Log the raw JSON we received
      console.log('Raw partial JSON update:', JSON.stringify(update.partialJson, null, 2));

      try {
        // Process the partial JSON to mark new items for animation
        const processedJson = processPartialJson(update.partialJson);

        // Log what we received for debugging
        console.log('Received partial JSON update with:',
          Object.keys(update.partialJson).map(key =>
            `${key}: ${Array.isArray(update.partialJson[key]) ? update.partialJson[key].length : 'object'}`
          )
        );

        // Check if we have new items to display
        let hasNewTasks = false;
        let hasNewNotes = false;
        let hasNewMilestones = false;

        // Check for new tasks
        if (processedJson.tasks && Array.isArray(processedJson.tasks) &&
            (!streamJson || !streamJson.tasks || !Array.isArray(streamJson.tasks) ||
            processedJson.tasks.length > streamJson.tasks.length)) {
          hasNewTasks = true;
          console.log(`New tasks detected: ${processedJson.tasks.length} vs previous ${streamJson?.tasks?.length || 0}`);

          // Log the first few tasks for debugging
          if (processedJson.tasks.length > 0) {
            console.log('First task sample:', JSON.stringify(processedJson.tasks[0], null, 2));
          }
        }

        // Check for new notes
        if (processedJson.notes && Array.isArray(processedJson.notes) &&
            (!streamJson || !streamJson.notes || !Array.isArray(streamJson.notes) ||
            processedJson.notes.length > streamJson.notes.length)) {
          hasNewNotes = true;
          console.log(`New notes detected: ${processedJson.notes.length} vs previous ${streamJson?.notes?.length || 0}`);
        }

        // Check for new milestones
        if (processedJson.milestones && Array.isArray(processedJson.milestones) &&
            (!streamJson || !streamJson.milestones || !Array.isArray(streamJson.milestones) ||
            processedJson.milestones.length > streamJson.milestones.length)) {
          hasNewMilestones = true;
          console.log(`New milestones detected: ${processedJson.milestones.length} vs previous ${streamJson?.milestones?.length || 0}`);
        }

        // Ensure we have all the required arrays even if they're not in the update
        const completeJson = {
          project: processedJson.project || streamJson?.project || null,
          milestones: Array.isArray(processedJson.milestones) ? processedJson.milestones : (Array.isArray(streamJson?.milestones) ? streamJson.milestones : []),
          tasks: Array.isArray(processedJson.tasks) ? processedJson.tasks : (Array.isArray(streamJson?.tasks) ? streamJson.tasks : []),
          notes: Array.isArray(processedJson.notes) ? processedJson.notes : (Array.isArray(streamJson?.notes) ? streamJson.notes : [])
        };

        // If we have a project object but it doesn't have animation properties, add them
        if (completeJson.project && !completeJson.project._displayed) {
          completeJson.project._displayed = false;
          completeJson.project._new = true;
          completeJson.project._animationDelay = 0;
        }

        // Always update immediately to show new content
        console.log('Updating UI with new content:', {
          project: completeJson.project ? 'present' : 'missing',
          milestones: `${completeJson.milestones.length} items`,
          tasks: `${completeJson.tasks.length} items`,
          notes: `${completeJson.notes.length} items`
        });

        setStreamJson(completeJson);
      } catch (error) {
        console.error('Error processing JSON update:', error);
        // Continue with the update even if there's an error
      }
    }

    // If this is the final update, set the generated project
    if (update.isComplete && update.finalResult) {
      setGeneratedProject(update.finalResult);
      setIsStreaming(false);
      setIsGenerating(false);
    }
  };

  // Function to get a random color for notes
  const getRandomNoteColor = (index) => {
    const colors = ['yellow', 'green', 'blue', 'purple', 'pink'];
    // Use index to ensure the same note always gets the same color
    // or use Math.random() for truly random colors
    return colors[index % colors.length];
  };

  // Helper function to process partial JSON and mark new items for animation
  const processPartialJson = (newJson) => {
    // Make sure all arrays are properly initialized
    if (!newJson.milestones) newJson.milestones = [];
    if (!newJson.tasks) newJson.tasks = [];
    if (!newJson.notes) newJson.notes = [];

    // Log what we're processing
    console.log('Processing partial JSON:', {
      project: newJson.project ? 'present' : 'missing',
      milestones: `${newJson.milestones.length} items`,
      tasks: `${newJson.tasks.length} items`,
      notes: `${newJson.notes.length} items`
    });

    // If we don't have existing JSON, everything is new
    if (!streamJson) {
      console.log('No existing streamJson, marking all items as new');

      // Mark project details as new for animation
      if (newJson.project) {
        newJson.project._displayed = false;
        newJson.project._new = true;
        newJson.project._animationDelay = 0; // Show project details first
      }

      // Mark all items as new for animation with staggered delays
      if (newJson.milestones && Array.isArray(newJson.milestones)) {
        newJson.milestones.forEach((milestone, index) => {
          milestone._displayed = false;
          milestone._new = true;
          milestone._animationDelay = 500 + (index * 200); // Stagger animation, start after project details
        });
      }

      if (newJson.tasks && Array.isArray(newJson.tasks)) {
        console.log(`Processing ${newJson.tasks.length} tasks as new`);
        newJson.tasks.forEach((task, index) => {
          task._displayed = false;
          task._new = true;
          // Use a longer delay for tasks to make them appear after milestones
          task._animationDelay = 1000 + (index * 200); // Stagger animation for tasks

          if (task.subtasks && Array.isArray(task.subtasks)) {
            task.subtasks.forEach((subtask, subtaskIndex) => {
              subtask._displayed = false;
              subtask._new = true;
              subtask._animationDelay = subtaskIndex * 150; // Stagger animation for subtasks
              // Ensure each subtask has a unique ID
              if (!subtask.id) {
                subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              }
            });
          }
        });
      }

      if (newJson.notes && Array.isArray(newJson.notes)) {
        newJson.notes.forEach((note, index) => {
          note._displayed = false;
          note._new = true;
          // Use a longer delay for notes to make them appear after tasks
          note._animationDelay = 1500 + (index * 200); // Stagger animation
        });
      }

      return newJson;
    }

    // We have existing JSON, so we need to compare and mark only new items
    const result = { ...newJson };

    // Process project details
    if (result.project && streamJson.project) {
      // If we already have project details, preserve the display state
      result.project._displayed = streamJson.project._displayed || false;
      result.project._new = false;
    } else if (result.project) {
      // If this is the first time we're seeing project details, mark as new
      result.project._displayed = false;
      result.project._new = true;
      result.project._animationDelay = 0; // Show project details first
    }

    // Process milestones
    if (result.milestones && streamJson.milestones) {
      const existingMilestoneIds = new Set(streamJson.milestones.map(m => m.title));
      result.milestones.forEach((milestone, index) => {
        // If this milestone wasn't in the previous update, mark it as new
        if (!existingMilestoneIds.has(milestone.title)) {
          milestone._displayed = false;
          milestone._new = true;
          milestone._animationDelay = 500 + (index * 200); // Animation delay for new milestones, after project details
        } else {
          // Find the existing milestone and preserve its _displayed state
          const existingMilestone = streamJson.milestones.find(m => m.title === milestone.title);
          milestone._displayed = existingMilestone?._displayed || false;
          milestone._new = false;
        }
      });
    }

    // Process tasks - with enhanced animation for incremental display
    if (result.tasks && streamJson.tasks) {
      const existingTaskIds = new Set(streamJson.tasks.map(t => t.title));

      // Count new tasks for staggered animation
      let newTaskCount = 0;

      result.tasks.forEach(task => {
        // If this task wasn't in the previous update, mark it as new
        if (!existingTaskIds.has(task.title)) {
          task._displayed = false;
          task._new = true;
          // Use a longer delay for tasks to make them appear after milestones
          task._animationDelay = 1000 + (newTaskCount * 200); // Staggered delay for new tasks
          newTaskCount++;

          console.log(`New task detected: ${task.title}`);

          if (task.subtasks) {
            task.subtasks.forEach((subtask, subtaskIndex) => {
              subtask._displayed = false;
              subtask._new = true;
              subtask._animationDelay = subtaskIndex * 100; // Stagger animation for subtasks
              // Ensure each subtask has a unique ID
              if (!subtask.id) {
                subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              }
            });
          }
        } else {
          // Find the existing task and preserve its _displayed state
          const existingTask = streamJson.tasks.find(t => t.title === task.title);
          task._displayed = existingTask?._displayed || false;
          task._new = false;

          // Process subtasks
          if (task.subtasks && existingTask?.subtasks) {
            const existingSubtaskIds = new Set(existingTask.subtasks.map(s => s.title));

            // Count new subtasks for staggered animation
            let newSubtaskCount = 0;

            task.subtasks.forEach(subtask => {
              // If this subtask wasn't in the previous update, mark it as new
              if (!existingSubtaskIds.has(subtask.title)) {
                subtask._displayed = false;
                subtask._new = true;
                subtask._animationDelay = 100 + (newSubtaskCount * 100); // Staggered delay
                newSubtaskCount++;
                // Ensure each subtask has a unique ID
                if (!subtask.id) {
                  subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
              } else {
                // Find the existing subtask and preserve its _displayed state
                const existingSubtask = existingTask.subtasks.find(s => s.title === subtask.title);
                subtask._displayed = existingSubtask?._displayed || false;
                subtask._new = false;
                // Preserve the existing subtask ID if it exists
                if (existingSubtask && existingSubtask.id) {
                  subtask.id = existingSubtask.id;
                } else if (!subtask.id) {
                  // Ensure each subtask has a unique ID
                  subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
              }
            });
          }
        }
      });
    }

    // Process notes - with enhanced animation for incremental display
    if (result.notes && streamJson.notes) {
      const existingNoteIds = new Set(streamJson.notes.map(n => n.content));

      // Count new notes for staggered animation
      let newNoteCount = 0;

      result.notes.forEach(note => {
        // If this note wasn't in the previous update, mark it as new
        if (!existingNoteIds.has(note.content)) {
          note._displayed = false;
          note._new = true;
          // Use a longer delay for notes to make them appear after tasks
          note._animationDelay = 1500 + (newNoteCount * 200); // Staggered delay
          newNoteCount++;

          console.log(`New note detected: ${note.content.substring(0, 30)}...`);
        } else {
          // Find the existing note and preserve its _displayed state
          const existingNote = streamJson.notes.find(n => n.content === note.content);
          note._displayed = existingNote?._displayed || false;
          note._new = false;
        }
      });
    }

    return result;
  };

  // Function to call DeepSeek API with the project prompt
  const generateProject = async () => {
    if (!description.trim()) {
      setError('Please enter a project description');
      return;
    }

    // If we're already in a generating state (e.g., after tab switch), don't restart the API call
    if (!isGenerating) {
      console.log('AIProjectGenerator: Starting generation process');
      setIsGenerating(true);
      setIsStreaming(true);
      setError(null);
      setGeneratedProject(null);
      setStreamContent('');
      setStreamJson(null);

      // Log the state to verify it's set correctly
      setTimeout(() => {
        console.log('AIProjectGenerator: Generation state after starting:', {
          isGenerating: true,
          isStreaming: true
        });
      }, 100);

      try {
        // Fetch the project prompt from the file
        const promptResponse = await fetch('/project_prompt.md');
        let promptText = await promptResponse.text();

        // Call the AI service to generate the project with streaming
        await aiService.generateProject(description, promptText, handleStreamUpdate);

        // Note: The final result will be set by the handleStreamUpdate callback
        // when the isComplete flag is true
      } catch (err) {
        console.error('Error generating project:', err);

        // Provide a more user-friendly error message
        if (err.message.includes('JSON')) {
          setError('Failed to generate project: There was an issue with the AI response format. Please try again with a simpler description or different wording.');
        } else if (err.message.includes('timeout') || err.message.includes('timed out')) {
          setError('Request timed out. Please try again with a simpler description or try later when the service is less busy.');
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError('Failed to generate project: ' + err.message);
        }

        setIsStreaming(false);
        setIsGenerating(false);
      }
    }
  };

  // Add event listeners for navigation attempts
  useEffect(() => {
    // Function to handle tab navigation attempts
    const handleTabChange = (event) => {
      console.log('AIProjectGenerator: Detected tab change event', event.detail);

      // Only show warning if we're currently generating
      if (isGenerating || isStreaming) {
        console.log('AIProjectGenerator: Generation in progress, showing warning dialog');

        // Store the navigation target
        setPendingNavigation(event.detail.tab);

        // Show the warning dialog
        setShowNavigationWarning(true);

        // Prevent the default navigation
        event.preventDefault();
        event.stopPropagation();

        // Make sure the event is marked as prevented
        Object.defineProperty(event, 'defaultPrevented', {
          get: function() { return true; }
        });

        // Return false to indicate the event was prevented
        return false;
      }

      console.log('AIProjectGenerator: No generation in progress, allowing navigation');
      return true;
    };

    // Function to handle direct navigation attempts (clicking links, browser back button, etc.)
    const handleBeforeUnload = (event) => {
      if (isGenerating || isStreaming) {
        console.log('AIProjectGenerator: Detected navigation attempt during generation');

        // Standard way to show a confirmation dialog when leaving the page
        event.preventDefault();
        event.returnValue = 'If you leave this page, all generation progress will be lost. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    // Function to handle navigation menu clicks directly
    const handleNavButtonClick = (event) => {
      // Check if the clicked element is a navigation button
      const navButton = event.target.closest('button');
      if (navButton && navButton.getAttribute('data-nav-button') === 'true') {
        if (isGenerating || isStreaming) {
          console.log('AIProjectGenerator: Detected direct nav button click during generation');

          // Get the target tab from the button's data attribute
          const targetTab = navButton.getAttribute('data-nav-target');
          if (targetTab) {
            // Store the navigation target
            setPendingNavigation(targetTab);

            // Show the warning dialog
            setShowNavigationWarning(true);

            // Prevent the default click
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('changeTab', handleTabChange, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleNavButtonClick, true);

    console.log('AIProjectGenerator: Added navigation event listeners');
    console.log('Current generation state:', { isGenerating, isStreaming });

    // Clean up
    return () => {
      window.removeEventListener('changeTab', handleTabChange, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleNavButtonClick, true);
      console.log('AIProjectGenerator: Removed navigation event listeners');
    };
  }, [isGenerating, isStreaming]);

  // Function to handle navigation confirmation
  const handleNavigationConfirm = () => {
    console.log('AIProjectGenerator: User confirmed navigation to', pendingNavigation);

    // Close the dialog
    setShowNavigationWarning(false);

    // If we have a pending navigation target, navigate to it
    if (pendingNavigation) {
      console.log('AIProjectGenerator: Aborting generation process and navigating to', pendingNavigation);

      // Abort the generation process
      setIsGenerating(false);
      setIsStreaming(false);

      // Add a small delay to ensure state updates before navigation
      setTimeout(() => {
        // Navigate to the target tab
        console.log('AIProjectGenerator: Dispatching changeTab event to navigate to', pendingNavigation);
        window.dispatchEvent(new CustomEvent('changeTab', {
          detail: { tab: pendingNavigation },
          bubbles: true,
          cancelable: false
        }));

        // Clear the pending navigation
        setPendingNavigation(null);
      }, 100);
    } else {
      console.log('AIProjectGenerator: No pending navigation target');
    }
  };

  // Function to handle navigation cancellation
  const handleNavigationCancel = () => {
    console.log('AIProjectGenerator: User cancelled navigation');

    // Close the dialog and clear the pending navigation
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  // Synchronize line numbers with code content scrolling and auto-scroll to bottom
  useEffect(() => {
    if (!isStreaming) return;

    const codeContent = document.getElementById('codeContent');
    const lineNumbers = document.querySelector('.line-numbers');

    if (!codeContent || !lineNumbers) return;

    // Synchronize scrolling between line numbers and code content
    const handleScroll = () => {
      lineNumbers.scrollTop = codeContent.scrollTop;
    };

    codeContent.addEventListener('scroll', handleScroll);

    // Auto-scroll to bottom when content changes
    codeContent.scrollTop = codeContent.scrollHeight;

    return () => {
      codeContent.removeEventListener('scroll', handleScroll);
    };
  }, [isStreaming, streamContent]);

  // Function to create the project with the generated data
  const createProject = async () => {
    if (!generatedProject) {
      setError('No project data to create');
      return;
    }

    if (!isAuthenticated()) {
      setError('You must be logged in to create a project');
      return;
    }

    if (projectLimitReached) {
      setError('You have reached the limit of 3 open projects');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      console.log('Creating project with data:', JSON.stringify(generatedProject, null, 2));

      // Create the project
      const newProject = await projectApi.createProject({
        title: generatedProject.project.title,
        description: generatedProject.project.description,
        deadline: generatedProject.project.deadline
      });

      console.log('Project created:', newProject);

      // Create milestones
      if (generatedProject.milestones && Array.isArray(generatedProject.milestones) && generatedProject.milestones.length > 0) {
        console.log(`Creating ${generatedProject.milestones.length} milestones`);
        for (const milestone of generatedProject.milestones) {
          await milestoneApi.createMilestone(newProject._id, {
            title: milestone.title,
            dueDate: milestone.dueDate,
            completed: false
          });
        }
      }

      // Create tasks
      if (generatedProject.tasks && Array.isArray(generatedProject.tasks) && generatedProject.tasks.length > 0) {
        console.log(`Creating ${generatedProject.tasks.length} tasks`);
        for (const task of generatedProject.tasks) {
          // Ensure task has all required fields
          const taskData = {
            projectId: newProject._id,
            title: task.title || `Task ${Math.floor(Math.random() * 1000)}`,
            completed: false,
            estimatedPomodoros: typeof task.estimatedPomodoros === 'number' ? task.estimatedPomodoros : 2,
            dueDate: task.dueDate || null
          };

          // Process subtasks if they exist
          if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
            taskData.subtasks = task.subtasks.map(subtask => ({
              id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID for each subtask
              title: subtask.title || `Subtask ${Math.floor(Math.random() * 1000)}`,
              completed: false,
              estimatedPomodoros: typeof subtask.estimatedPomodoros === 'number' ? subtask.estimatedPomodoros : 1
            }));
          } else {
            taskData.subtasks = [];
          }

          console.log('Creating task:', taskData);
          await taskApi.createTask(taskData);
        }
      }

      // Create notes with random colors
      if (generatedProject.notes && Array.isArray(generatedProject.notes) && generatedProject.notes.length > 0) {
        console.log(`Creating ${generatedProject.notes.length} notes`);
        for (let i = 0; i < generatedProject.notes.length; i++) {
          const note = generatedProject.notes[i];
          await noteApi.createNote(newProject._id, {
            content: note.content || `Note ${i+1}`,
            color: note.color || getRandomNoteColor(i), // Use random color based on index
            position: note.position || i
          });
        }
      }

      // Navigate to the projects tab and select the new project
      eventBus.emit('selectProject', newProject);
      navigate('/app');

      // Emit an event to change the active tab to 'projects'
      window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'projects' } }));

      // Clear the saved state since project was successfully created
      clearSavedState();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const [showDetailedExample, setShowDetailedExample] = useState(false);

  // Function to clear the state
  const clearSavedState = () => {
    setDescription('');
    setIsGenerating(false);
    setError(null);
    setGeneratedProject(null);
    setIsStreaming(false);
    setStreamContent('');
    setStreamJson(null);
  };

  // Handle cancel button click
  const handleCancel = () => {
    clearSavedState();
  };

  return (
    <Container>
      <HeaderSection>
        <TitleContainer>
          <RobotIcon><FaRobot /></RobotIcon>
          <Title>AI Project Generator</Title>
        </TitleContainer>
        <Description>
          Enter a description of your project, and our AI will help you structure it with tasks, milestones, and notes.
        </Description>
        <ManualProjectLink href="/app" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'projects' } }))}>
          Or create a project manually →
        </ManualProjectLink>
      </HeaderSection>

      {projectLimitReached && (
        <WarningBox>
          <WarningIconContainer>
            <FaInfoCircle />
          </WarningIconContainer>
          <WarningContent>
            <WarningTitle>Project Limit Reached</WarningTitle>
            <WarningText>
              You have reached your maximum number of open projects
              ({userData?.maxProjects || 3} for your {userData?.subscription?.plan || 'free'} plan).
              Please finish or delete an existing project before creating a new one.
            </WarningText>
          </WarningContent>
        </WarningBox>
      )}

      <InputSection>
        <SectionHeader>
          <SectionIcon><FaLightbulb /></SectionIcon>
          <SectionTitle>Project Description</SectionTitle>
        </SectionHeader>

        <SampleBoxContainer>
          <SampleBox>
            <SampleHeader>
              <SampleHeaderTitle>
                <FaInfoCircle style={{ marginRight: '0.5rem' }} />
                Example Project
              </SampleHeaderTitle>
              <ExampleToggle onClick={() => setShowDetailedExample(!showDetailedExample)}>
                {showDetailedExample ? 'Show Simple Example' : 'Show Detailed Example'}
                <FaArrowRight style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }} />
              </ExampleToggle>
            </SampleHeader>
            <SampleContent>
              {showDetailedExample ? detailedExample : sampleText}
            </SampleContent>
          </SampleBox>
        </SampleBoxContainer>

        <TextAreaWrapper>
          <TextAreaLabel>Your Project Description:</TextAreaLabel>
          <TextAreaContainer>
            <StyledTextArea
              placeholder="Describe your project in detail including tasks, deadlines, and any specific requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating || isCreating}
              rows={8}
            />
            <CharacterCount>
              {description.length} characters
            </CharacterCount>
          </TextAreaContainer>
          <TextAreaHint>
            <FaInfoCircle style={{ marginRight: '0.5rem' }} />
            The more details you provide, the better the AI can structure your project.
          </TextAreaHint>
        </TextAreaWrapper>

        <ButtonContainer>
          <GenerateButton
            onClick={generateProject}
            disabled={isGenerating || isCreating || !description.trim()}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner /> Generating...
              </>
            ) : (
              <>
                <FaRobot style={{ marginRight: '0.5rem' }} />
                Generate Project Structure
              </>
            )}
          </GenerateButton>

          {/* Show benefits carousel when generating */}
          {isGenerating && !isStreaming && (
            <GeneratingBenefitsContainer>
              <BenefitsCarousel compact={true} />
            </GeneratingBenefitsContainer>
          )}
        </ButtonContainer>
      </InputSection>

      {error && (
        <ErrorMessage>
          <FaTimes style={{ marginRight: '0.5rem' }} />
          {error}
        </ErrorMessage>
      )}

      {/* Navigation warning dialog */}
      {console.log('AIProjectGenerator: Rendering dialog with showNavigationWarning =', showNavigationWarning)}
      <ConfirmationDialog
        isOpen={showNavigationWarning}
        onClose={handleNavigationCancel}
        onConfirm={handleNavigationConfirm}
        title="Leave AI Generation Page?"
        message="If you leave this page, all generation progress will be lost. Are you sure you want to leave?"
        confirmText="Leave Page"
        cancelText="Stay on Page"
        isDestructive={true}
      />

      {/* We're not using the AILoadingScreen anymore since we're showing the benefits in the button container */}

      {/* Display streaming output when available */}
      {isStreaming && (
        <StreamingContainer>
          <StreamingHeader>
            <StreamingIcon><FaRobot /></StreamingIcon>
            <StreamingTitle>Generating Your Project</StreamingTitle>
          </StreamingHeader>

          {streamJson ? (
            <StreamingLayout>
              {/* Left panel - Tech-themed Raw AI response */}
              <RawResponsePanel>
                <RawResponseHeader>
                  <RawResponseHeaderLeft>
                    <RawResponseIcon><FaTerminal /></RawResponseIcon>
                    <RawResponseTitle>AI Raw Response</RawResponseTitle>
                    <RawResponseStatus>processing</RawResponseStatus>
                  </RawResponseHeaderLeft>
                  <RawResponseControls>
                    <RawResponseControlDot color="#ff5f57" />
                    <RawResponseControlDot color="#febc2e" />
                    <RawResponseControlDot color="#28c840" />
                  </RawResponseControls>
                </RawResponseHeader>
                <RawResponseContent>
                  <div className="line-numbers">
                    {streamContent.split('\n').map((_, i) => (
                      <div key={i} className="line-number">{i + 1}</div>
                    ))}
                  </div>
                  <div className="code-content" id="codeContent">
                    <pre
                      dangerouslySetInnerHTML={{
                        __html: streamContent
                          .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
                          .replace(/"([^"]+)"/g, '<span class="json-string">"$1"</span>')
                          .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
                          .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
                          .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')
                      }}
                    />
                  </div>
                </RawResponseContent>
              </RawResponsePanel>

              {/* Right panel - Structured preview */}
              <StreamingPreview>
                <PreviewHeader>
                  <PreviewIcon>🔍</PreviewIcon>
                  <PreviewTitle>Project Structure (Live Preview)</PreviewTitle>
                </PreviewHeader>

                <PreviewContent>
                {/* Project Details */}
                <PreviewSection>
                  <PreviewSectionTitle>
                    <PreviewSectionIcon>📋</PreviewSectionIcon>
                    Project Details
                  </PreviewSectionTitle>
                  {streamJson.project ? (
                    <PreviewCard
                      $new={!streamJson.project._displayed}
                      style={{
                        animationDelay: streamJson.project._animationDelay ? `${streamJson.project._animationDelay}ms` : '0ms'
                      }}
                    >
                      <PreviewItem>
                        <PreviewLabel>Title:</PreviewLabel>
                        <PreviewValue>{streamJson.project.title || 'Generating...'}</PreviewValue>
                      </PreviewItem>

                      <PreviewItem>
                        <PreviewLabel>Description:</PreviewLabel>
                        <PreviewValue>{streamJson.project.description || 'Generating...'}</PreviewValue>
                      </PreviewItem>

                      {streamJson.project.deadline && (
                        <PreviewItem>
                          <PreviewLabel>Deadline:</PreviewLabel>
                          <PreviewValue>{streamJson.project.deadline}</PreviewValue>
                        </PreviewItem>
                      )}
                      {/* Mark as displayed */}
                      {!streamJson.project._displayed && (streamJson.project._displayed = true)}
                    </PreviewCard>
                  ) : (
                    <PreviewEmptyState>Waiting for project details...</PreviewEmptyState>
                  )}
                </PreviewSection>

                {/* Milestones */}
                <PreviewSection>
                  <PreviewSectionTitle>
                    <PreviewSectionIcon>🏁</PreviewSectionIcon>
                    Milestones {streamJson.milestones && `(${streamJson.milestones.filter(milestone => milestone.title && !milestone.estimatedPomodoros).length})`}
                  </PreviewSectionTitle>
                  {streamJson.milestones && streamJson.milestones.length > 0 ? (
                    <PreviewList>
                      {streamJson.milestones
                        // Ensure we're only showing items that are actually milestones (have a title and dueDate)
                        .filter(milestone => milestone.title && !milestone.estimatedPomodoros)
                        .map((milestone, index) => (
                          <PreviewMilestone
                            key={milestone.title || index}
                            $new={!milestone._displayed}
                            style={{
                              animationDelay: milestone._animationDelay ? `${milestone._animationDelay}ms` : '0ms'
                            }}
                          >
                            <PreviewMilestoneTitle>{milestone.title}</PreviewMilestoneTitle>
                            {milestone.dueDate && (
                              <PreviewMilestoneDate>Due: {milestone.dueDate}</PreviewMilestoneDate>
                            )}
                            {/* Mark as displayed */}
                            {!milestone._displayed && (milestone._displayed = true)}
                          </PreviewMilestone>
                        ))}
                    </PreviewList>
                  ) : (
                    <PreviewEmptyState>Waiting for milestones...</PreviewEmptyState>
                  )}
                </PreviewSection>

                {/* Tasks */}
                <PreviewSection>
                  <PreviewSectionTitle>
                    <PreviewSectionIcon>📝</PreviewSectionIcon>
                    Tasks {streamJson.tasks && `(${streamJson.tasks.filter(task => typeof task.estimatedPomodoros === 'number').length})`}
                  </PreviewSectionTitle>
                  {console.log('Tasks in streamJson:', streamJson.tasks)}
                  {streamJson.tasks && Array.isArray(streamJson.tasks) && streamJson.tasks.length > 0 ? (
                    <PreviewList>
                      {streamJson.tasks
                        // Filter out any tasks that might actually be milestones (no estimatedPomodoros)
                        .filter(task => typeof task.estimatedPomodoros === 'number')
                        .map((task, index) => {
                          console.log('Rendering task:', task);
                          return (
                            <PreviewTask
                              key={task.title || index}
                              $new={!task._displayed}
                              style={{
                                animationDelay: task._animationDelay ? `${task._animationDelay}ms` : '0ms'
                              }}
                            >
                              <PreviewTaskHeader>
                                <PreviewTaskTitle>{task.title || `Task ${index + 1}`}</PreviewTaskTitle>
                                {task.estimatedPomodoros && (
                                  <PreviewTaskPomodoros>🍅 {task.estimatedPomodoros}</PreviewTaskPomodoros>
                                )}
                              </PreviewTaskHeader>

                              {task.dueDate && (
                                <PreviewTaskDueDate>Due: {task.dueDate}</PreviewTaskDueDate>
                              )}

                              {task.subtasks && task.subtasks.length > 0 && (
                                <PreviewSubtaskList>
                                  <PreviewSubtaskHeader>Subtasks:</PreviewSubtaskHeader>
                                  {task.subtasks.map((subtask, subtaskIndex) => {
                                    // Ensure each subtask has a unique ID
                                    if (!subtask.id) {
                                      subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                    }
                                    return (
                                      <PreviewSubtask
                                        key={subtask.id || subtask.title || subtaskIndex}
                                        $new={!subtask._displayed}
                                        style={{
                                          animationDelay: subtask._animationDelay ? `${subtask._animationDelay}ms` : '0ms'
                                        }}
                                      >
                                        <PreviewSubtaskTitle>{subtask.title}</PreviewSubtaskTitle>
                                        {subtask.estimatedPomodoros && (
                                          <PreviewSubtaskPomodoros>🍅 {subtask.estimatedPomodoros}</PreviewSubtaskPomodoros>
                                        )}
                                        {/* Mark as displayed */}
                                        {!subtask._displayed && (subtask._displayed = true)}
                                      </PreviewSubtask>
                                    );
                                  })}
                                </PreviewSubtaskList>
                              )}

                              {/* Mark as displayed */}
                              {!task._displayed && (task._displayed = true)}
                            </PreviewTask>
                          );
                        })}
                    </PreviewList>
                  ) : (
                    <PreviewEmptyState>
                      Waiting for tasks...
                      {streamJson.tasks ?
                        `(Found ${streamJson.tasks.length} tasks, but they may not be in the expected format)` :
                        '(No tasks found yet)'}
                    </PreviewEmptyState>
                  )}
                </PreviewSection>

                {/* Notes */}
                <PreviewSection>
                  <PreviewSectionTitle>
                    <PreviewSectionIcon>📝</PreviewSectionIcon>
                    Notes {streamJson.notes && `(${streamJson.notes.length})`}
                  </PreviewSectionTitle>
                  {console.log('Notes in streamJson:', streamJson.notes)}
                  {streamJson.notes && Array.isArray(streamJson.notes) && streamJson.notes.length > 0 ? (
                    <PreviewNotesList>
                      {streamJson.notes.map((note, index) => {
                        console.log('Rendering note:', note);
                        return (
                          <PreviewNote
                            key={note.content ? note.content.substring(0, 20) : index}
                            $new={!note._displayed}
                            $color={note.color || getRandomNoteColor(index)}
                            style={{
                              animationDelay: note._animationDelay ? `${note._animationDelay}ms` : '0ms'
                            }}
                          >
                            {note.content || `Note ${index + 1}`}
                            {/* Mark as displayed */}
                            {!note._displayed && (note._displayed = true)}
                          </PreviewNote>
                        );
                      })}
                    </PreviewNotesList>
                  ) : (
                    <PreviewEmptyState>
                      Waiting for notes...
                      {streamJson.notes ?
                        `(Found ${streamJson.notes.length} notes, but they may not be in the expected format)` :
                        '(No notes found yet)'}
                    </PreviewEmptyState>
                  )}
                </PreviewSection>

                {/* Generation Status with Benefits Carousel */}
                <PreviewGenerationStatus>
                  <PreviewStatusContent>
                    <PreviewStatusIcon>⚙️</PreviewStatusIcon>
                    <PreviewStatusText>AI is generating your project structure in real-time...</PreviewStatusText>
                  </PreviewStatusContent>
                  <BenefitsCarousel compact={true} transparent={true} />
                </PreviewGenerationStatus>
              </PreviewContent>
            </StreamingPreview>
            </StreamingLayout>
          ) : (
            <StreamingInitialState>
              <StreamingInitialIcon>🤖</StreamingInitialIcon>
              <StreamingInitialText>AI is analyzing your project description...</StreamingInitialText>
              <StreamingLoader />

              {/* Benefits Carousel */}
              <BenefitsCarousel />
            </StreamingInitialState>
          )}

          <StreamingFooter>
            <StreamingNote>
              <FaInfoCircle style={{ marginRight: '0.5rem' }} />
              The AI is generating your project structure in real-time. Please wait for the complete result.
            </StreamingNote>
          </StreamingFooter>
        </StreamingContainer>
      )}

      {generatedProject && (
        <ResultContainer>
          <ResultHeader>
            <ResultIcon><FaRobot /></ResultIcon>
            <ResultTitle>Generated Project Structure</ResultTitle>
          </ResultHeader>
          <ResultSubtitle>
            Review and create your AI-generated project structure
            {generatedProject.generationTime && (
              <GenerationTimeTag>
                {generatedProject.fromCache ? 'Retrieved from cache' : `Generated in ${(generatedProject.generationTime / 1000).toFixed(2)} seconds`}
              </GenerationTimeTag>
            )}
          </ResultSubtitle>

          <TopButtonContainer>
            <CreateButton
              onClick={createProject}
              disabled={isCreating || projectLimitReached}
            >
              {isCreating ? (
                <>
                  <LoadingSpinner isLight={true} /> Creating...
                </>
              ) : (
                <>
                  <FaCheck style={{ marginRight: '0.5rem' }} />
                  Create Project
                </>
              )}
            </CreateButton>
            <CancelButton
              onClick={handleCancel}
              disabled={isCreating}
            >
              <FaTimes style={{ marginRight: '0.5rem' }} />
              Cancel
            </CancelButton>
          </TopButtonContainer>

          {projectLimitReached && (
            <LimitWarningText style={{ marginBottom: '2rem' }}>
              <FaInfoCircle style={{ marginRight: '0.5rem' }} />
              You've reached your limit of {userData?.maxProjects || 3} open projects. Please finish or delete an existing project before creating this one.
            </LimitWarningText>
          )}

          <ResultGrid>
            <ProjectSection>
              <SectionTitle>
                <SectionIcon>📋</SectionIcon> Project Details
              </SectionTitle>
              <ProjectCard>
                <ProjectDetail>
                  <DetailLabel>Title:</DetailLabel>
                  <DetailValue>{generatedProject.project.title}</DetailValue>
                </ProjectDetail>
                <ProjectDetail>
                  <DetailLabel>Description:</DetailLabel>
                  <DetailValue>{generatedProject.project.description}</DetailValue>
                </ProjectDetail>
                <ProjectDetail>
                  <DetailLabel>Deadline:</DetailLabel>
                  <DetailValue>{generatedProject.project.deadline || 'None'}</DetailValue>
                </ProjectDetail>
              </ProjectCard>
            </ProjectSection>

            {generatedProject.milestones && generatedProject.milestones.length > 0 && (
              <ProjectSection>
                <SectionTitle>
                  <SectionIcon>🏁</SectionIcon> Milestones ({generatedProject.milestones.length})
                </SectionTitle>
                <MilestonesList>
                  {generatedProject.milestones.map((milestone, index) => (
                    <MilestoneItem key={index}>
                      <MilestoneTitle>{milestone.title}</MilestoneTitle>
                      <MilestoneDate>Due: {milestone.dueDate || 'No date set'}</MilestoneDate>
                    </MilestoneItem>
                  ))}
                </MilestonesList>
              </ProjectSection>
            )}

            {generatedProject.tasks && generatedProject.tasks.length > 0 && (
              <ProjectSection>
                <SectionTitle>
                  <SectionIcon>📋</SectionIcon> Tasks ({generatedProject.tasks.length})
                </SectionTitle>
                <TasksList>
                  {generatedProject.tasks.map((task, index) => (
                    <TaskItem key={index}>
                      <TaskHeader>
                        <TaskTitle>{task.title}</TaskTitle>
                        <TaskPomodoros>🍅 {task.estimatedPomodoros}</TaskPomodoros>
                      </TaskHeader>
                      {task.dueDate && <TaskDueDate>Due: {task.dueDate}</TaskDueDate>}

                      {task.subtasks && task.subtasks.length > 0 && (
                        <SubtaskList>
                          <SubtaskHeader>Subtasks:</SubtaskHeader>
                          {task.subtasks.map((subtask, subtaskIndex) => {
                            // Ensure each subtask has a unique ID
                            if (!subtask.id) {
                              subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                            }
                            return (
                              <SubtaskItem key={subtask.id || subtaskIndex}>
                                <SubtaskTitle>{subtask.title}</SubtaskTitle>
                                <SubtaskPomodoros>🍅 {subtask.estimatedPomodoros}</SubtaskPomodoros>
                              </SubtaskItem>
                            );
                          })}
                        </SubtaskList>
                      )}
                    </TaskItem>
                  ))}
                </TasksList>
              </ProjectSection>
            )}

            {generatedProject.notes && generatedProject.notes.length > 0 && (
              <ProjectSection>
                <SectionTitle>
                  <SectionIcon>📝</SectionIcon> Notes ({generatedProject.notes.length})
                </SectionTitle>
                <NotesList>
                  {generatedProject.notes.map((note, index) => (
                    <NoteItem
                      key={index}
                      color={note.color || getRandomNoteColor(index)}
                    >
                      {note.content}
                    </NoteItem>
                  ))}
                </NotesList>
              </ProjectSection>
            )}
          </ResultGrid>
        </ResultContainer>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  max-width: 1400px;

  @media (min-width: 1600px) {
    padding: 1.5rem 3rem;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  background: linear-gradient(135deg, rgba(217, 85, 80, 0.05) 0%, rgba(235, 107, 86, 0.1) 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(217, 85, 80, 0.1);

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--primary-color, #d95550), transparent);
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const RobotIcon = styled.div`
  font-size: 2.2rem;
  color: var(--primary-color, #d95550);
  margin-right: 1rem;
  background: linear-gradient(135deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 3px rgba(217, 85, 80, 0.3));

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-5px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  background: linear-gradient(90deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 800;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(217, 85, 80, 0.2);
`;

const Description = styled.p`
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 1rem;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 500;
`;

const ManualProjectLink = styled.a`
  display: inline-block;
  color: var(--primary-color, #d95550);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: var(--primary-color, #d95550);
    transform: scaleX(0.7);
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  &:hover {
    color: var(--primary-dark, #c04540);

    &:after {
      transform: scaleX(1);
      opacity: 1;
    }
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  position: relative;
  padding-bottom: 0.75rem;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color, #d95550), transparent);
  }
`;

const SectionIcon = styled.div`
  font-size: 1.2rem;
  color: var(--primary-color, #d95550);
  margin-right: 0.75rem;
  background: linear-gradient(135deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
`;

const SampleBoxContainer = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const SampleBox = styled.div`
  background-color: rgba(0, 0, 0, 0.02);
  padding: 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  color: var(--text-secondary);
  border: 1px solid rgba(217, 85, 80, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: rgba(217, 85, 80, 0.3);
  }
`;

const SampleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const SampleHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
`;

const SampleContent = styled.div`
  white-space: pre-line;
  line-height: 1.5;
  padding-left: 0.5rem;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

const ExampleToggle = styled.button`
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(217, 85, 80, 0.1), rgba(235, 107, 86, 0.1));
  border: 1px solid rgba(217, 85, 80, 0.2);
  color: var(--primary-color, #d95550);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(217, 85, 80, 0.1);

  &:hover {
    background: linear-gradient(90deg, rgba(217, 85, 80, 0.15), rgba(235, 107, 86, 0.15));
    color: var(--primary-dark, #c04540);
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(217, 85, 80, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(217, 85, 80, 0.1);
  }
`;

const TextAreaWrapper = styled.div`
  margin-bottom: 1.5rem;
`;

const TextAreaLabel = styled.div`
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  display: flex;
  align-items: center;

  &:before {
    content: '✏️';
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
`;

const TextAreaContainer = styled.div`
  position: relative;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  background: linear-gradient(to bottom right, rgba(217, 85, 80, 0.05), rgba(0, 0, 0, 0.01));
  padding: 2px;

  &:focus-within {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: linear-gradient(to bottom right, rgba(217, 85, 80, 0.1), rgba(235, 107, 86, 0.05));
  }
`;

const CharacterCount = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 500;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  padding: 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  background-color: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  line-height: 1.5;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color, #d95550);
    box-shadow: 0 0 0 3px rgba(217, 85, 80, 0.15);
    background-color: #ffffff;
  }

  &:disabled {
    background-color: var(--bg-disabled, #f0f0f0);
    cursor: not-allowed;
  }
`;

const TextAreaHint = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary-color, #d95550);
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const GeneratingBenefitsContainer = styled.div`
  margin-top: 1.25rem;
  width: 100%;
  max-width: 600px;
`;

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.85rem 2rem;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 10px rgba(217, 85, 80, 0.3),
    0 0 0 1px rgba(217, 85, 80, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: 250px;
  position: relative;
  overflow: hidden;

  /* Subtle shine effect */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: all 0.6s ease;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary-dark, #c04540), var(--primary-color, #d95550));
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(217, 85, 80, 0.4),
      0 0 0 1px rgba(217, 85, 80, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);

    &:before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow:
      0 2px 5px rgba(217, 85, 80, 0.3),
      0 0 0 1px rgba(217, 85, 80, 0.15);
  }

  &:disabled {
    background: linear-gradient(135deg, #cccccc, #d6d6d6);
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.8;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: var(--error, #d32f2f);
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--error-bg, #ffebee);
  border-radius: 0.75rem;
  border-left: 4px solid var(--error, #d32f2f);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: #fff3cd;
  padding: 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const WarningIconContainer = styled.div`
  color: #856404;
  font-size: 1.5rem;
  margin-right: 1rem;
  margin-top: 0.25rem;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  color: #856404;
  margin-bottom: 0.5rem;
`;

const WarningText = styled.div`
  color: #856404;
  line-height: 1.5;
`;

const ResultContainer = styled.div`
  background: rgba(245, 245, 250, 0.95);
  border-radius: 1.5rem;
  padding: 3rem;
  margin-top: 4rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  width: 100%;

  @media (min-width: 1200px) {
    padding: 4rem;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #4caf50, #2196F3, #9C27B0);
    background-size: 200% 100%;
    animation: gradientMove 3s linear infinite;
    z-index: 2;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%);
    background-size: cover;
    background-position: center;
    z-index: 0;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
`;

const ResultIcon = styled.div`
  font-size: 3rem;
  color: #4caf50;
  margin-right: 1.5rem;
  background: rgba(76, 175, 80, 0.1);
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 10px 25px rgba(76, 175, 80, 0.2),
    0 0 0 1px rgba(76, 175, 80, 0.1);
  animation: pulse 3s infinite;

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4), 0 10px 25px rgba(76, 175, 80, 0.2); }
    70% { box-shadow: 0 0 0 15px rgba(76, 175, 80, 0), 0 10px 25px rgba(76, 175, 80, 0.2); }
    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0), 0 10px 25px rgba(76, 175, 80, 0.2); }
  }
`;

const ResultTitle = styled.h2`
  font-size: 2.5rem;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(to right, #1e3c72, #2a5298);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ResultSubtitle = styled.p`
  color: rgba(30, 30, 60, 0.7);
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 1.2rem;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const GenerationTimeTag = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: fit-content;

  &:before {
    content: '⏱️';
    margin-right: 0.5rem;
  }
`;

const ProjectSection = styled.div`
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-in-out;
  animation-fill-mode: both;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
`;

const ProjectDetail = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color, #e0e0e0);

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  width: 120px;
  color: var(--text-secondary);
  flex-shrink: 0;
`;

const DetailValue = styled.span`
  flex: 1;
  color: var(--text-primary);
  line-height: 1.5;
`;

const MilestoneItem = styled.div`
  background-color: var(--bg-light, #f5f5f5);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--primary-color, #d95550);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const MilestoneTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.05rem;
`;

const MilestoneDate = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;

  &:before {
    content: '📅';
    margin-right: 0.5rem;
  }
`;

const TaskItem = styled.div`
  background-color: var(--bg-light, #f5f5f5);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--secondary, #4c9195);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const TaskTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.05rem;
`;

const TaskPomodoros = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: rgba(217, 85, 80, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
`;

const TaskDueDate = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;

  &:before {
    content: '📅';
    margin-right: 0.5rem;
  }
`;

const SubtaskList = styled.div`
  margin-top: 1rem;
  padding: 0.5rem 0 0 1rem;
  border-top: 1px dashed var(--border-color, #e0e0e0);
`;

const SubtaskItem = styled.div`
  background-color: var(--bg-card, #ffffff);
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  border-left: 2px solid var(--secondary-light, #6ab7bb);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SubtaskTitle = styled.div`
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text-primary);
`;

const SubtaskPomodoros = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  background-color: rgba(217, 85, 80, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 0.4rem;
`;

const NoteItem = styled.div`
  background-color: ${props => {
    switch(props.color) {
      case 'yellow': return 'rgba(255, 235, 59, 0.2)';
      case 'green': return 'rgba(76, 175, 80, 0.2)';
      case 'blue': return 'rgba(33, 150, 243, 0.2)';
      case 'purple': return 'rgba(156, 39, 176, 0.2)';
      case 'pink': return 'rgba(233, 30, 99, 0.2)';
      default: return 'var(--bg-light, #f5f5f5)';
    }
  }};
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  border-left: 4px solid ${props => {
    switch(props.color) {
      case 'yellow': return '#FFC107';
      case 'green': return '#4CAF50';
      case 'blue': return '#2196F3';
      case 'purple': return '#9C27B0';
      case 'pink': return '#E91E63';
      default: return '#9E9E9E';
    }
  }};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:before {
    content: '📝';
    position: absolute;
    top: -0.5rem;
    left: -0.5rem;
    background: white;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const TopButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const CreateButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  gap: 1rem;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, var(--success, #4caf50), #66bb6a);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
  min-width: 200px;

  &:hover:not(:disabled) {
    background: linear-gradient(90deg, #43a047, var(--success, #4caf50));
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-light, #f5f5f5);
  color: var(--text-primary);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.75rem;
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;

  &:hover:not(:disabled) {
    background-color: var(--bg-hover, #e9e9e9);
    border-color: var(--text-secondary);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: var(--bg-disabled, #f0f0f0);
    cursor: not-allowed;
  }
`;

const InputSection = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  padding: 1.75rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56), var(--primary-color, #d95550));
    background-size: 200% 100%;
    animation: gradientMove 4s linear infinite;
  }

  @keyframes gradientMove {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
  }
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1800px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ProjectCard = styled.div`
  background-color: var(--bg-light, #f5f5f5);
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color, #e0e0e0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const MilestonesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SubtaskHeader = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;

  &:before {
    content: '📋';
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
`;

const LoadingSpinner = styled.div`
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid ${props => props.isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 50%;
  border-top-color: ${props => props.isLight ? '#fff' : 'var(--primary-color, #d95550)'};
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.75rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LimitWarningText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #856404;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fff3cd;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  text-align: center;
`;

const InfoMessage = styled.div`
  display: flex;
  align-items: center;
  color: #0c5460;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #d1ecf1;
  border-radius: 0.75rem;
  border-left: 4px solid #0c5460;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #0c5460;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;

  &:hover {
    background-color: rgba(12, 84, 96, 0.1);
  }
`;

// Streaming output styled components
const StreamingContainer = styled.div`
  background-color: var(--bg-card, #ffffff);
  border-radius: 0.75rem;
  padding: 2rem;
  margin-top: 1.5rem;
  border: 1px solid var(--border-color, #e0e0e0);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// Layout for side-by-side display
const StreamingLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
  margin-bottom: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

// Raw response panel - Tech-themed styling
const RawResponsePanel = styled.div`
  background-color: #1a1a2e;
  border-radius: 0.75rem;
  border: 1px solid #2d2d3a;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px; /* Fixed height */
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 198, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00c6ff, #0072ff, #00c6ff);
    background-size: 200% 100%;
    animation: gradientMove 3s linear infinite;
    z-index: 2;
  }

  /* Add a subtle grid pattern to the background */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes gradientMove {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
  }
`;

const RawResponseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #20203a;
  border-bottom: 1px solid #2d2d3a;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  position: relative;
  z-index: 3;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const RawResponseHeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const RawResponseIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
  color: #00c6ff;
  text-shadow: 0 0 5px rgba(0, 198, 255, 0.5);
`;

const RawResponseTitle = styled.h3`
  font-size: 0.95rem;
  margin: 0;
  color: #e0e0e0;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(224, 224, 224, 0.3);
`;

const RawResponseStatus = styled.div`
  display: flex;
  align-items: center;
  margin-left: 1rem;
  font-size: 0.8rem;
  color: #8be9fd;
  background-color: rgba(139, 233, 253, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(139, 233, 253, 0.2);

  &:before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #8be9fd;
    margin-right: 0.5rem;
    animation: pulse 2s infinite;
    box-shadow: 0 0 5px rgba(139, 233, 253, 0.5);
  }

  @keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
`;

const RawResponseControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RawResponseControlDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  opacity: 0.8;
  transition: all 0.2s;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);

  &:hover {
    opacity: 1;
    transform: scale(1.1);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
`;

const RawResponseContent = styled.div`
  padding: 0;
  flex-grow: 1;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
  background-color: #1e1e2e;
  white-space: pre-wrap;
  position: relative;
  display: flex;
  overflow: hidden; /* Prevent outer scrollbar */

  /* Terminal-like background with subtle grid */
  background-image:
    linear-gradient(rgba(18, 30, 49, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(18, 30, 49, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;

  /* Scanline effect */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(32, 32, 32, 0.05) 50%,
      transparent 100%
    );
    background-size: 100% 4px;
    pointer-events: none;
    animation: scanlines 1s linear infinite;
    z-index: 2;
    opacity: 0.3;
  }

  @keyframes scanlines {
    0% { background-position: 0 0; }
    100% { background-position: 0 100px; }
  }

  /* Gradient fade at bottom */
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, #1e1e2e);
    pointer-events: none;
    z-index: 3;
  }

  /* Line numbers */
  .line-numbers {
    flex: 0 0 auto;
    padding: 1rem 0.5rem 1rem 0;
    background-color: #191927;
    border-right: 1px solid #2d2d3a;
    color: #6272a4;
    text-align: right;
    user-select: none;
    overflow-y: hidden; /* Hide scrollbar */
    min-width: 3.5rem; /* Ensure enough space for line numbers */
    position: sticky;
    left: 0;
    z-index: 5;
  }

  .line-number {
    font-size: 0.8rem;
    line-height: 1.6;
    padding: 0 0.5rem;
    height: 1.6em; /* Match the line height of the code content */
  }

  /* Code content */
  .code-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto; /* Only this element should scroll */
    overflow-x: auto;
    height: 100%; /* Take full height */
    line-height: 1.6;
    scroll-behavior: smooth; /* Smooth scrolling */
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    position: relative;
  }

  /* Syntax highlighting simulation */
  .json-key {
    color: #ff79c6;
    font-weight: bold;
  }

  .json-string {
    color: #f1fa8c;
  }

  .json-number {
    color: #bd93f9;
    font-weight: bold;
  }

  .json-boolean {
    color: #8be9fd;
    font-weight: bold;
  }

  .json-null {
    color: #6272a4;
    font-style: italic;
  }

  /* Blinking cursor effect */
  .code-content:after {
    content: '|';
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    color: #00c6ff;
    animation: blink 1s step-end infinite;
    z-index: 4;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

const StreamingHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const StreamingIcon = styled.div`
  font-size: 1.8rem;
  color: var(--primary-color, #d95550);
  margin-right: 0.75rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const StreamingTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text-color, #333);
  margin: 0;
`;

const StreamingInitialState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  margin-bottom: 1rem;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  min-height: 400px;
`;

const StreamingInitialIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const StreamingInitialText = styled.div`
  font-size: 1.1rem;
  color: var(--text-primary, #333);
  margin-bottom: 1rem;
  font-weight: 500;
`;

const StreamingLoader = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #d95550);
  animation: spin 1s linear infinite;
  margin-bottom: 0.75rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PreviewEmptyState = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary, #666);
  font-style: italic;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
`;

const StreamingPreview = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(76, 175, 80, 0.2);
  height: 600px; /* Fixed height to match RawResponsePanel */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(76, 175, 80, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  backdrop-filter: blur(5px);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4CAF50, #8BC34A, #4CAF50);
    background-size: 200% 100%;
    animation: gradientMove 3s linear infinite;
    z-index: 2;
  }

  /* Add a subtle pattern to the background */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(rgba(76, 175, 80, 0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 0;
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  position: relative;
  z-index: 2;
`;

const PreviewIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
  color: #4CAF50;
  text-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
`;

const PreviewTitle = styled.h3`
  font-size: 1.1rem;
  color: var(--text-color, #333);
  margin: 0;
  font-weight: 600;
  background: linear-gradient(90deg, #2E7D32, #4CAF50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
  z-index: 2;
  padding: 0.5rem;

  /* Add a subtle scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(76, 175, 80, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(76, 175, 80, 0.3);
    }
  }
`;

const PreviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PreviewLabel = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
`;

const PreviewValue = styled.div`
  color: var(--text-primary, #333);
  font-size: 1rem;
  line-height: 1.4;
  animation: fadeInPreview 0.3s ease-in;

  @keyframes fadeInPreview {
    from { opacity: 0.5; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StreamingFooter = styled.div`
  margin-top: 1rem;
`;

const StreamingNote = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  background-color: rgba(12, 84, 96, 0.05);
  padding: 0.75rem;
  border-radius: 0.5rem;
`;

// Preview section components
const PreviewSection = styled.div`
  margin-bottom: 1.5rem;
  animation: fadeIn 0.5s ease-in-out;
`;

const PreviewSectionTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary, #333);
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgba(76, 175, 80, 0.2);
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 40px;
    height: 2px;
    background-color: #4CAF50;
  }
`;

const PreviewSectionIcon = styled.span`
  margin-right: 0.5rem;
  color: #4CAF50;
  font-size: 1.1rem;
`;

const PreviewCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--primary-color, #d95550);
  animation: ${props => props.$new ? 'fadeInCard 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  animation-fill-mode: both;
  opacity: ${props => props.$new ? 0 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  }

  /* Add a subtle gradient overlay */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
  }

  @keyframes fadeInCard {
    from {
      opacity: 0;
      transform: translateY(-15px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const PreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

// Milestone components
const PreviewMilestone = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 0.75rem;
  border-left: 3px solid var(--primary-color, #d95550);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  animation: ${props => props.$new ? 'slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  animation-fill-mode: both;
  opacity: ${props => props.$new ? 0 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  }

  /* Add a subtle gradient overlay */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-15px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const PreviewMilestoneTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
  font-size: 0.95rem;
  display: flex;
  align-items: center;

  &:before {
    content: '🏁';
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
`;

const PreviewMilestoneDate = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 0.3rem 0.5rem;
  border-radius: 0.25rem;
  width: fit-content;
  margin-top: 0.25rem;

  &:before {
    content: '📅';
    margin-right: 0.5rem;
  }
`;

// Task components
const PreviewTask = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 0.75rem;
  border-left: 3px solid var(--secondary, #4c9195);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  animation: ${props => props.$new ? 'slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  animation-fill-mode: both;
  opacity: ${props => props.$new ? 0 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  }

  /* Add a subtle gradient overlay */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
  }
`;

const PreviewTaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
`;

const PreviewTaskTitle = styled.div`
  font-weight: 600;
  color: var(--text-primary, #333);
  font-size: 0.95rem;
  display: flex;
  align-items: center;

  &:before {
    content: '📋';
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
`;

const PreviewTaskPomodoros = styled.div`
  font-size: 0.85rem;
  color: white;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(217, 85, 80, 0.2);
`;

const PreviewTaskDueDate = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin-bottom: 0.5rem;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 0.3rem 0.5rem;
  border-radius: 0.25rem;
  width: fit-content;

  &:before {
    content: '📅';
    margin-right: 0.5rem;
  }
`;

// Subtask components
const PreviewSubtaskList = styled.div`
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
`;

const PreviewSubtaskHeader = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary, #666);
  display: flex;
  align-items: center;

  &:before {
    content: '✓';
    margin-right: 0.5rem;
    font-size: 0.8rem;
    background-color: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const PreviewSubtask = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  margin-left: 0.5rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  animation: ${props => props.$new ? 'fadeInSubtask 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  animation-fill-mode: both;
  opacity: ${props => props.$new ? 0 : 1};
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  }

  @keyframes fadeInSubtask {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PreviewSubtaskTitle = styled.div`
  font-size: 0.9rem;
  color: var(--text-primary, #333);
  font-weight: 500;
  display: flex;
  align-items: center;

  &:before {
    content: '•';
    margin-right: 0.5rem;
    color: var(--secondary, #4c9195);
    font-size: 1.2rem;
  }
`;

const PreviewSubtaskPomodoros = styled.div`
  font-size: 0.8rem;
  color: white;
  background: linear-gradient(135deg, var(--primary-color, #d95550), var(--primary-gradient, #eb6b56));
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(217, 85, 80, 0.2);
`;

// Note components
const PreviewNotesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PreviewNote = styled.div`
  background-color: ${props => {
    switch(props.$color) {
      case 'yellow': return 'rgba(255, 235, 59, 0.15)';
      case 'green': return 'rgba(76, 175, 80, 0.15)';
      case 'blue': return 'rgba(33, 150, 243, 0.15)';
      case 'purple': return 'rgba(156, 39, 176, 0.15)';
      case 'pink': return 'rgba(233, 30, 99, 0.15)';
      default: return 'rgba(255, 255, 255, 0.9)';
    }
  }};
  border-left: 4px solid ${props => {
    switch(props.$color) {
      case 'yellow': return '#FFC107';
      case 'green': return '#4CAF50';
      case 'blue': return '#2196F3';
      case 'purple': return '#9C27B0';
      case 'pink': return '#E91E63';
      default: return '#9E9E9E';
    }
  }};
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  width: calc(50% - 0.5rem);
  font-size: 0.9rem;
  color: var(--text-primary, #333);
  animation: ${props => props.$new ? 'fadeInNote 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  animation-fill-mode: both;
  opacity: ${props => props.$new ? 0 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);

  &:hover {
    transform: translateY(-3px) rotate(1deg);
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 2px 5px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  }

  /* Add a subtle paper texture */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
  }

  @keyframes fadeInNote {
    from {
      opacity: 0;
      transform: scale(0.92) rotate(-2deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
`;

// Generation status
const PreviewGenerationStatus = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.12) 100%);
  border-radius: 0.75rem;
  border: 1px solid rgba(33, 150, 243, 0.2);
  box-shadow:
    0 4px 15px rgba(33, 150, 243, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;

  /* Add a subtle pulse animation to the background */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
    z-index: 0;
  }

  @keyframes pulse {
    0% { opacity: 0.3; transform: scale(0.95); }
    50% { opacity: 0.6; transform: scale(1.05); }
    100% { opacity: 0.3; transform: scale(0.95); }
  }
`;

const PreviewStatusContent = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
`;

const PreviewStatusIcon = styled.span`
  margin-right: 0.75rem;
  animation: spin 2s linear infinite;
  display: inline-block;
  font-size: 1.1rem;
  color: #1976D2;
  text-shadow: 0 0 5px rgba(33, 150, 243, 0.3);

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PreviewStatusText = styled.div`
  font-size: 0.95rem;
  color: #1976D2;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-shadow: 0 0 10px rgba(33, 150, 243, 0.2);
`;

// Benefit carousel styled components
const BenefitSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--bg-secondary, #f9f9f9);
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  min-height: 140px;
  width: 100%;
  max-width: 500px;
  opacity: ${props => props.fadeState === 'in' ? 1 : 0};
  transition: opacity 0.5s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

// Compact benefit carousel styled components
const CompactBenefitSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${props => props.transparent ? 'transparent' : 'var(--bg-secondary, #f9f9f9)'};
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin: 0.75rem 0;
  width: 100%;
  max-width: 800px;
  opacity: ${props => props.fadeState === 'in' ? 1 : 0};
  transition: opacity 0.5s ease;
  box-shadow: ${props => props.transparent ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  border: ${props => props.transparent ? 'none' : '1px solid rgba(0, 0, 0, 0.05)'};
`;

const CompactBenefitContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 0.5rem;
`;

const CompactBenefitIcon = styled.div`
  font-size: 1.25rem;
  color: var(--primary-color, #d95550);
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const CompactBenefitTitle = styled.h4`
  margin: 0 0 0.25rem 0;
  color: var(--text-color, #333);
  font-size: 0.95rem;
  text-align: left;
`;

const CompactBenefitText = styled.p`
  color: var(--text-secondary, #666);
  line-height: 1.3;
  margin: 0;
  font-size: 0.85rem;
  text-align: left;
`;

const BenefitIcon = styled.div`
  font-size: 1.5rem;
  color: var(--primary-color, #d95550);
  margin-bottom: 0.5rem;
`;

const BenefitContent = styled.div`
  text-align: center;
  flex: 1;
  max-width: 450px;
`;

const BenefitTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 0.25rem;
  color: var(--text-color, #333);
  font-size: 1.1rem;
`;

const BenefitText = styled.p`
  color: var(--text-secondary, #666);
  line-height: 1.4;
  margin: 0;
  font-size: 0.9rem;
`;

const BenefitIndicators = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
`;

const IndicatorDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--primary-color, #d95550)' : '#ddd'};
  margin: 0 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
`;

export default AIProjectGenerator;
