import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser, FaCog, FaSignOutAlt, FaPlay, FaProjectDiagram, FaClock, FaChartBar, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { isAuthenticated } from '../services/authService';
import { pomodoroApi } from '../services/apiService';
import SimpleTimerFinal from './SimpleTimerFinal';

const Header = ({
  user,
  onLogout,
  activeTask,
  activeProject,
  onSettingsClick
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const navigate = useNavigate();

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  // Function to fetch completed pomodoro count for the active task
  const fetchCompletedPomodoroCount = async () => {
    if (!activeTask || !isAuthenticated()) return;

    try {
      // Get task ID (handle both _id and id properties)
      const taskId = activeTask._id || activeTask.id;

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch pomodoros for this task
      const pomodoros = await pomodoroApi.getPomodoros(today, today);

      // Filter pomodoros for this task
      const taskPomodoros = pomodoros.filter(p =>
        (p.task === taskId || p.taskId === taskId) && p.completed
      );

      console.log(`[Header] Found ${taskPomodoros.length} completed pomodoros for task ${taskId}`);

      // Update state with the count
      setCompletedPomodoros(taskPomodoros.length);
    } catch (error) {
      console.error('Error fetching completed pomodoro count:', error);
    }
  };

  // Fetch completed pomodoro count when active task changes
  useEffect(() => {
    if (activeTask) {
      fetchCompletedPomodoroCount();
    } else {
      setCompletedPomodoros(0);
    }
  }, [activeTask]);

  // Set up a timer to periodically refresh the pomodoro count
  useEffect(() => {
    if (!activeTask) return;

    // Refresh every 5 minutes instead of 30 seconds
    const intervalId = setInterval(() => {
      fetchCompletedPomodoroCount();
    }, 300000);

    return () => clearInterval(intervalId);
  }, [activeTask]);

  // Listen for pomodoro completion events
  useEffect(() => {
    const handlePomodoroCompleted = () => {
      console.log('[Header] Detected pomodoro completion event');
      // Refresh the count immediately instead of using setTimeout
      fetchCompletedPomodoroCount();
    };

    // Add event listener for the custom event
    window.addEventListener('pomodoroCompleted', handlePomodoroCompleted);

    // Clean up
    return () => {
      window.removeEventListener('pomodoroCompleted', handlePomodoroCompleted);
    };
  }, []);

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Get project and task IDs for the timer
  const getProjectId = () => {
    return activeProject ? (activeProject._id || activeProject.id) : null;
  };

  const getTaskId = () => {
    return activeTask ? (activeTask._id || activeTask.id) : null;
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo onClick={() => handleNavigation('/')}>AI Pomo</Logo>

        <Navigation>
          <NavButton onClick={() => handleNavigation('/')}>
            <FaProjectDiagram style={{ marginRight: '0.3rem' }} />
            Projects
          </NavButton>

          <NavButton onClick={() => handleNavigation('/calendar')}>
            <FaCalendarAlt style={{ marginRight: '0.3rem' }} />
            Calendar
          </NavButton>

          <NavButton onClick={() => handleNavigation('/timer-example')}>
            <FaClock style={{ marginRight: '0.3rem' }} />
            Timer Example
          </NavButton>
        </Navigation>

        <CurrentTaskDisplay>
          {activeTask ? (
            <>
              <CurrentTaskLabel>Current Task:</CurrentTaskLabel>
              <CurrentTaskInfo>
                <CurrentTaskName title={activeTask.title || activeTask.name || "Task"}>
                  {activeTask.title || activeTask.name || "Task"}
                </CurrentTaskName>
                <CurrentTaskCount>
                  {completedPomodoros}/{activeTask.estimatedPomodoros || 1}
                  {completedPomodoros > (activeTask.estimatedPomodoros || 1) && (
                    <span style={{
                      marginLeft: '4px',
                      color: '#e11d48',
                      fontWeight: 'bold'
                    }}>
                      (+{completedPomodoros - (activeTask.estimatedPomodoros || 1)})
                    </span>
                  )}
                </CurrentTaskCount>
                <TimerInfo>
                  <SimpleTimerFinal
                    initialDuration={25 * 60}
                    projectId={getProjectId()}
                    taskId={getTaskId()}
                    projectName={activeProject?.title}
                    taskName={activeTask?.title || activeTask?.name}
                    compact={true}
                  />
                </TimerInfo>
              </CurrentTaskInfo>
            </>
          ) : (
            <NoTaskMessage>
              No active task
              <TimerInfo style={{ marginTop: '10px' }}>
                <SimpleTimerFinal
                  initialDuration={25 * 60}
                  compact={true}
                />
              </TimerInfo>
            </NoTaskMessage>
          )}
        </CurrentTaskDisplay>

        <HeaderActions>
          <ContactButton onClick={openContactModal}>
            <FaEnvelope />
            <span>Contact</span>
          </ContactButton>

          <IconButton onClick={onSettingsClick}>
            <FaCog />
          </IconButton>

          <UserMenuContainer>
            <UserButton onClick={toggleUserMenu}>
              <UserAvatar>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <FaUser />
                )}
              </UserAvatar>
              <UserName>{user?.name || 'User'}</UserName>
            </UserButton>

            {showUserMenu && (
              <UserMenu>
                <UserMenuItem onClick={onLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </UserMenuItem>
              </UserMenu>
            )}
          </UserMenuContainer>
        </HeaderActions>
      </HeaderContent>
    </HeaderContainer>
  );
};

// Styled components
const HeaderContainer = styled.header`
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #d95550;
  cursor: pointer;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const CurrentTaskDisplay = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: 1rem;
`;

const CurrentTaskLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const CurrentTaskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CurrentTaskName = styled.div`
  font-weight: 500;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CurrentTaskCount = styled.div`
  font-size: 0.8rem;
  color: #666;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
`;

const TimerInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem;
  border-radius: 0.5rem;
  background-color: rgba(217, 85, 80, 0.05);
  border: 1px solid rgba(217, 85, 80, 0.1);
  flex-shrink: 0;
  min-width: 90px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  /* Make the timer smaller to fit in the header */
  & > div {
    transform: scale(0.6);
    margin: -15px;
  }
`;

const CurrentTaskButton = styled.button`
  background-color: #d95550;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #c04540;
  }
`;

const NoTaskMessage = styled.div`
  color: #888;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #555;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem;
  border-radius: 50%;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ContactButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  color: #555;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-weight: 500;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  min-width: 150px;
  z-index: 10;
`;

const UserMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export default Header;
