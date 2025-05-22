import React, { useState } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import SimpleTimerFinal from './SimpleTimerFinal'; // Import SimpleTimerFinal
import { getProjectCompletedPomodoros } from '../utils/projectUtils'; // Import the new utility function
import { FaEdit, FaTrash } from 'react-icons/fa';

// Move these BEFORE CardContainer
const IconButtonGroupLeft = styled.div`
  position: absolute;
  top: 0.1rem;
  left: 1rem;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s;
  display: flex;
`;
const IconButtonGroupRight = styled.div`
  position: absolute;
  top: 0.1rem;
  right: 1rem;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s;
  display: flex;
`;

const ProjectCard = ({
  project,
  isWorking, // Changed from isActive, now specifically means "working on"
  onSelect,
  onSetWorking,
  onFinish,
  onDelete,
  // Props for the working project card
  timerState,
  settings,
  onTimerStateChange,
  onPomodoroCompleted,
  activeTaskId,
  onEdit,
  // Tasks for pomodoro calculation
  tasks = [],
}) => {
  // Get project ID based on authentication status
  const getProjectId = () => isAuthenticated() ? project._id : project.id;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Truncate description to a specific character limit
  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 判断是否过期
  const isOverdue = project.deadline && new Date(project.deadline) < new Date();

  // Use tomato emoji instead of SVG - only red tomatoes for completed pomodoros
  const PomodoroSVG = ({ filled = true }) => (
    <span style={{
      fontSize: '20px',
      opacity: 1,
      marginRight: '2px',
      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e11d48'
    }}>
      🍅
    </span>
  );

  // 2. Update renderPomodoros to only show completed pomodoros in red
  const renderPomodoros = () => {
    // Get completed pomodoros count - now synchronous
    const completed = getProjectCompletedPomodoros(project, tasks);
    const estimated = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 1), 0);
    const maxPerRow = 8;
    const maxIcons = 16;
    let icons = [];
    let extra = 0;

    // Only show completed pomodoros
    if (completed > maxIcons) {
      extra = completed - maxIcons;
    }

    const displayCount = Math.min(completed, maxIcons);
    for (let i = 0; i < displayCount; i++) {
      icons.push(<PomodoroSVG key={i} filled={true} />);
    }

    // Split into rows
    const rows = [];
    for (let i = 0; i < icons.length; i += maxPerRow) {
      rows.push(
        <PomodoroIconsContainer key={i}>
          {icons.slice(i, i + maxPerRow)}
          {/* Show +N only on the last row and last icon */}
          {extra > 0 && i + maxPerRow >= icons.length && (
            <ExtraPomodoros>+{extra}</ExtraPomodoros>
          )}
        </PomodoroIconsContainer>
      );
    }

    // Format the numbers to ensure they don't get too long
    const formattedCompleted = completed > 999 ? '999+' : completed;
    const formattedEstimated = estimated > 999 ? '999+' : estimated;

    return (
      <PomodoroCountWrapper>
        {rows}
        <PomodoroText $isWorking={isWorking}>
          <PomodoroCount $isWorking={isWorking}>{formattedCompleted}</PomodoroCount>
          <span> / {formattedEstimated} Pomodoros</span>
        </PomodoroText>
      </PomodoroCountWrapper>
    );
  };

  // Determine project status for badge
  const getStatusBadge = () => {
    if (isWorking) return { text: 'Working', color: '#ffffff', bgColor: '#f59e0b' };
    if (project.status === 'finished') return { text: 'Completed', color: '#065f46', bgColor: '#d1fae5' };
    return { text: 'Open', color: '#1e40af', bgColor: '#dbeafe' };
  };

  const statusBadge = getStatusBadge();

  // Get the project ID for data attribute
  const projectId = isAuthenticated() ? project._id : project.id;

  // Determine if this is a finished project
  const isFinished = project.status === 'finished';

  // Only allow clicking to select if the project is not finished and not already working
  const handleCardClick = (e) => {
    if (!isWorking && !isFinished) {
      onSelect();
    }
  };

  return (
    <CardContainer
      $isWorking={isWorking}
      $isFinished={isFinished}
      onClick={handleCardClick}
      data-project-id={projectId}
    >
      {/* Floating icon buttons */}
      <IconButtonGroupLeft>
        <IconButton title="Edit" onClick={e => { e.stopPropagation(); if (onEdit) onEdit(project); }}>
          <FaEdit />
        </IconButton>
      </IconButtonGroupLeft>
      <IconButtonGroupRight>
        <IconButton title="Delete" $danger onClick={e => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this project?')) { onDelete(); } }}>
          <FaTrash />
        </IconButton>
      </IconButtonGroupRight>
      <CardHeader>
        <CardTitle $isWorking={isWorking}>{project.title}</CardTitle>
        <StatusBadge $color={statusBadge.color} $bgColor={statusBadge.bgColor} $isWorking={isWorking}>
          {statusBadge.text}
        </StatusBadge>
      </CardHeader>
      {/* Pomodoros and Description (only shown if NOT working) */}
      {!isWorking && (
        <>
          <PomodoroWrapper>
            <PomodoroContainer>{renderPomodoros()}</PomodoroContainer>
          </PomodoroWrapper>
        </>
      )}
      {/* Timer, Pomodoros, and Description shown when working */}
      {isWorking && (
        <WorkingContent>
          <PomodoroWrapper>
            <PomodoroContainer>{renderPomodoros()}</PomodoroContainer>
          </PomodoroWrapper>
          {timerState && (
            <TimerContainer>
              <SimpleTimerFinal
                initialDuration={25 * 60}
                onComplete={onPomodoroCompleted}
              />
            </TimerContainer>
          )}
        </WorkingContent>
      )}
      {/* Footer with deadline on left and action buttons on right */}
      <CardFooter>
        <div>
          {project.deadline ? (
            <FooterDeadlineText $overdue={isOverdue}>
              Deadline: {formatDate(project.deadline)}
            </FooterDeadlineText>
          ) : (
            <span></span>
          )}
        </div>
        <div>
          {/* Show Finish button for open/working projects */}
          {(project.status === 'open' || project.status === 'working') && (
            <FinishButton
              $isWorking={isWorking}
              onClick={e => { e.stopPropagation(); onFinish(); }}
            >
              Finish
            </FinishButton>
          )}

          {/* Show Reactivate button and completion date for finished projects */}
          {project.status === 'finished' && (
            <FooterFinishedContainer>
              <CardDate>
                Completed: {formatDate(project.completedDate)}
              </CardDate>
              <ReactivateButton
                onClick={e => { e.stopPropagation(); onSelect(); }}
                title="Reactivate this project"
              >
                Reactivate
              </ReactivateButton>
            </FooterFinishedContainer>
          )}
        </div>
      </CardFooter>
    </CardContainer>
  );
};

// 3. Update CardContainer and other styled components for modern look
const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: ${props => {
    if (props.$isWorking) return '#0ea5e9'; // Working project - blue
    if (props.$isFinished) return '#f8fafc'; // Finished project - lighter gray
    return '#f0f9ff'; // Normal project - light blue
  }};
  color: ${props => {
    if (props.$isWorking) return '#ffffff'; // Working project - white text
    if (props.$isFinished) return '#64748b'; // Finished project - muted text
    return '#1e293b'; // Normal project - dark text
  }};
  border-radius: 0.75rem;
  box-shadow: ${props => {
    if (props.$isWorking) return '0 6px 20px rgba(14, 165, 233, 0.25)';
    if (props.$isFinished) return '0 2px 10px rgba(0,0,0,0.03)';
    return '0 3px 15px rgba(0,0,0,0.06)';
  }};
  width: 260px;
  min-width: 240px;
  max-width: 300px;
  min-height: 280px;
  height: 100%;
  margin: 0.75rem auto;
  position: relative;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  border-left: ${props => {
    if (props.$isWorking) return '4px solid #f59e0b'; // Working - orange border
    if (props.$isFinished) return '4px solid #94a3b8'; // Finished - gray border
    return 'none'; // Normal - no border
  }};
  box-sizing: border-box;
  overflow: hidden;
  transition: background-color 0.3s, box-shadow 0.3s, color 0.3s;
  opacity: ${props => props.$isFinished ? 0.85 : 1}; // Slightly fade finished projects
  cursor: ${props => {
    if (props.$isWorking) return 'default';
    if (props.$isFinished) return 'default';
    return 'pointer';
  }};
  &:hover ${IconButtonGroupLeft},
  &:hover ${IconButtonGroupRight},
  &:focus-within ${IconButtonGroupLeft},
  &:focus-within ${IconButtonGroupRight},
  &.active ${IconButtonGroupLeft},
  &.active ${IconButtonGroupRight} {
    opacity: 1;
    pointer-events: auto;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.$isWorking ? '#ffffff' : '#0f172a'};
  margin: 0;
`;

const CardDescription = styled.p`
  margin: 0.5rem 0 0.75rem;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
  opacity: 0.9;
  position: relative;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
  max-height: 2.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: default; /* Show default cursor to indicate text can't be selected */
  text-align: center;

  &::before {
    content: '"';
    position: absolute;
    top: 0;
    left: 0.25rem;
    font-size: 1.2rem;
    color: rgba(0, 0, 0, 0.1);
    font-family: Georgia, serif;
  }

  &::after {
    content: '"';
    position: absolute;
    bottom: -0.4rem;
    right: 0.25rem;
    font-size: 1.2rem;
    color: rgba(0, 0, 0, 0.1);
    font-family: Georgia, serif;
  }
`;

const PomodoroContainer = styled.div`
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin: 0.3rem 0 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
`;

const PomodoroIconsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin-bottom: 0.3rem;
  justify-content: center;
  width: 100%;
  padding: 0.1rem;
`;

const PomodoroText = styled.div`
  font-size: 0.85rem;
  color: ${props => props.$isWorking ? '#ffffff' : '#0f172a'};
  font-weight: 500;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PomodoroCount = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.$isWorking ? '#ffffff' : '#e11d48'};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.3rem;
  margin-top: auto;
  font-size: 0.85rem;
`;

const ActionButton = styled.button`
  background: ${props => props.$danger ? '#ffe5e5' : '#e0f2fe'};
  color: ${props => props.$danger ? '#d32f2f' : '#0284c7'};
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.9rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  &:hover {
    background: ${props => props.$danger ? '#ffd6d6' : '#bae6fd'};
    color: ${props => props.$danger ? '#b71c1c' : '#0369a1'};
  }
`;

const StatusBadge = styled.span`
  background: ${props => props.$isWorking ? '#f59e0b' : (props.$bgColor || '#e0e7ff')};
  color: ${props => props.$isWorking ? '#fff' : (props.$color || '#3730a3')};
  font-size: ${props => props.$isWorking ? '0.8rem' : '0.8rem'};
  font-weight: 600;
  border-radius: 0.5rem;
  padding: 0.2rem 0.8rem;
  margin-left: 0.3rem;
  min-width: 60px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.$isWorking ? '0 2px 6px rgba(245, 158, 11, 0.25)' : 'none'};
`;



const CardDate = styled.div`
  font-size: 0.7rem;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;

  &::before {
    content: '✓';
    display: inline-block;
    margin-right: 0.3rem;
    color: #10b981;
    font-weight: bold;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -0.4rem;
    left: 0;
    width: 1.5rem;
    height: 1px;
    background: linear-gradient(90deg, rgba(0,0,0,0.1), transparent);
    border-radius: 1px;
  }
`;

// New container for Timer when working
const WorkingContent = styled.div`
  margin: 0.5rem 0 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

// Specific container for the Timer
const TimerContainer = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow:
    inset 0 1px 2px rgba(0,0,0,0.05),
    0 4px 8px rgba(0,0,0,0.03);
  border: 1px solid rgba(2, 132, 199, 0.1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  }

  // Make SimpleTimer take necessary space
  & > div:first-child {
    margin-bottom: 0.75rem;
  }
`;

// Container for Pomodoros inside the Timer area
const WorkingPomodoros = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
  justify-content: center;
  padding: 0.5rem;
  background-color: rgba(255,255,255,0.5);
  border-radius: 0.5rem;
  border: 1px dashed rgba(2, 132, 199, 0.2);
`;

const PomodoroCountWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 0.3rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

// 4. Add ExtraPomodoros styled component
const ExtraPomodoros = styled.span`
  font-size: 0.8rem;
  color: ${props => props.$isWorking ? '#ffffff' : '#e11d48'};
  font-weight: 700;
  margin-left: 0.2rem;
`;

// Add styled components for icon buttons and group
const IconButton = styled.button`
  background: #f3f4f6;
  color: #bbb;
  border: none;
  border-radius: 50%;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  &:hover {
    background: #e0e7ff;
    color: ${props => props.$danger ? '#d32f2f' : '#6366f1'};
    box-shadow: 0 2px 8px rgba(99,102,241,0.10);
  }
`;
const FinishButton = styled.button`
  background: ${props => props.$isWorking ? '#0ea5e9' : '#f1f5f9'};
  color: ${props => props.$isWorking ? '#ffffff' : '#64748b'};
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: block;
  box-shadow: 0 1px 3px rgba(14, 165, 233, 0.1);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  &:hover {
    background: ${props => props.$isWorking ? '#0284c7' : '#0ea5e9'};
    color: #fff;
    box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
  }
`;

const ReactivateButton = styled.button`
  background: #10b981; /* Green color for reactivate */
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: block;
  margin-top: 0.4rem;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  &:hover {
    background: #059669;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
  }
`;

const FooterFinishedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

// Add a specific styled component for the deadline in the footer
const FooterDeadlineText = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$overdue ? '#e53935' : '#d97706'};
  font-weight: 500;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background: ${props => props.$overdue ? 'rgba(229, 57, 53, 0.1)' : '#fff4e6'};
  display: inline-block;
`;
const PomodoroWrapper = styled.div`
  min-height: 3.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 0.1rem;
`;

export default ProjectCard;
