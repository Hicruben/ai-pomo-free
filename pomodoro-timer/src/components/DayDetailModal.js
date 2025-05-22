import React from 'react';
import styled from 'styled-components';
import { FaFlag, FaCheckSquare, FaCalendarDay, FaTimes } from 'react-icons/fa';
import { TomatoSVG } from './PomodoroIcon';
// Removed taskApi and milestoneApi imports as they're no longer needed

const DayDetailModal = ({
  isOpen,
  onClose,
  date,
  milestones,
  tasks,
  projects,
  pomodoroCount,
  pomodoroDuration
  // Removed onTaskComplete, onTaskEdit, and onMilestoneEdit props
}) => {
  if (!isOpen) return null;

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Removed handleTaskComplete, handleTaskEdit, and handleMilestoneEdit functions

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{formatDate(date)}</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {pomodoroCount > 0 && (
            <Section>
              <SectionTitle>Pomodoros</SectionTitle>
              <PomodoroDisplay>
                <PomodoroIcon><TomatoSVG size={24} color="#d95550" /></PomodoroIcon>
                <PomodoroText>{pomodoroCount} completed</PomodoroText>
                <PomodoroTime>({pomodoroDuration || (pomodoroCount * 25)} minutes of focus time)</PomodoroTime>
              </PomodoroDisplay>
            </Section>
          )}

          {tasks.length > 0 && (
            <Section>
              <SectionTitle>
                <FaCheckSquare style={{ marginRight: '0.5rem' }} />
                Tasks Due
              </SectionTitle>
              <ItemList>
                {tasks.map(task => (
                  <TaskItem key={task._id} completed={task.completed}>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <TaskPomodoros>
                        <TomatoSVG size={16} color="#d95550" /> {task.completedPomodoros}/{task.estimatedPomodoros}
                        {(task.completedPomodoros || 0) > (task.estimatedPomodoros || 1) && (
                          <span style={{
                            marginLeft: '4px',
                            color: '#e11d48',
                            fontWeight: 'bold'
                          }}>
                            (+{(task.completedPomodoros || 0) - (task.estimatedPomodoros || 1)})
                          </span>
                        )}
                      </TaskPomodoros>
                      {/* Removed TaskActions with mark and edit buttons */}
                    </TaskMeta>
                  </TaskItem>
                ))}
              </ItemList>
            </Section>
          )}

          {milestones.length > 0 && (
            <Section>
              <SectionTitle>
                <FaFlag style={{ marginRight: '0.5rem' }} />
                Milestones
              </SectionTitle>
              <ItemList>
                {milestones.map(milestone => (
                  <MilestoneItem key={milestone._id} completed={milestone.completed}>
                    <MilestoneTitle>{milestone.title}</MilestoneTitle>
                    {/* Removed MilestoneActions with edit button */}
                  </MilestoneItem>
                ))}
              </ItemList>
            </Section>
          )}

          {projects.length > 0 && (
            <Section>
              <SectionTitle>
                <FaCalendarDay style={{ marginRight: '0.5rem' }} />
                Project Deadlines
              </SectionTitle>
              <ItemList>
                {projects.map(project => (
                  <ProjectItem key={project._id}>
                    <ProjectTitle>{project.title}</ProjectTitle>
                    <ProjectStatus status={project.status}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </ProjectStatus>
                  </ProjectItem>
                ))}
              </ItemList>
            </Section>
          )}

          {pomodoroCount === 0 && tasks.length === 0 && milestones.length === 0 && projects.length === 0 && (
            <EmptyMessage>No events scheduled for this day.</EmptyMessage>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme['--border-color']};
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme['--text-color']};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme['--text-secondary']};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ModalBody = styled.div`
  padding: 1rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: ${props => props.theme['--text-color']};
  display: flex;
  align-items: center;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TaskItem = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.theme['--bg-color']};
  border-left: 3px solid ${props => props.completed ? '#4caf50' : '#2196f3'};
  opacity: ${props => props.completed ? 0.7 : 1};
`;

const TaskTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${props => props.theme['--text-color']};
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TaskPomodoros = styled.div`
  font-size: 0.85rem;
  color: #d95550;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme['--text-secondary']};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: ${props => props.theme['--primary-color']};
  }
`;

const MilestoneItem = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.theme['--bg-color']};
  border-left: 3px solid #4caf50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: ${props => props.completed ? 0.7 : 1};
`;

const MilestoneTitle = styled.div`
  font-weight: 500;
  color: ${props => props.theme['--text-color']};
`;

const MilestoneActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ProjectItem = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.theme['--bg-color']};
  border-left: 3px solid #ff9800;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProjectTitle = styled.div`
  font-weight: 500;
  color: ${props => props.theme['--text-color']};
`;

const ProjectStatus = styled.div`
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background-color: ${props => {
    switch(props.status) {
      case 'open': return 'rgba(33, 150, 243, 0.1)';
      case 'working': return 'rgba(255, 152, 0, 0.1)';
      case 'finished': return 'rgba(76, 175, 80, 0.1)';
      default: return 'rgba(0, 0, 0, 0.05)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'open': return '#2196f3';
      case 'working': return '#ff9800';
      case 'finished': return '#4caf50';
      default: return props.theme['--text-color'];
    }
  }};
`;

const PomodoroDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: rgba(217, 85, 80, 0.1);
`;

const PomodoroIcon = styled.div`
  font-size: 1.5rem;
`;

const PomodoroText = styled.div`
  font-weight: 500;
  color: #d95550;
`;

const PomodoroTime = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme['--text-secondary']};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary']};
`;

export default DayDetailModal;
