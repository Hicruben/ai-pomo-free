import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave } from 'react-icons/fa';
import { taskApi, projectApi } from '../services/apiService';

const TaskEditModal = ({ isOpen, onClose, task, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setEstimatedPomodoros(task.estimatedPomodoros || 1);
      
      // Format date for input
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        setDueDate(date.toISOString().split('T')[0]);
      } else {
        setDueDate('');
      }

      // Set project ID
      if (task.project) {
        const id = typeof task.project === 'object' ? 
          (task.project._id || task.project.id) : 
          task.project;
        setProjectId(id);
      } else if (task.projectId) {
        setProjectId(task.projectId);
      } else {
        setProjectId('');
      }

      // Fetch projects
      fetchProjects();
    }
  }, [isOpen, task]);

  const fetchProjects = async () => {
    try {
      const projectsData = await projectApi.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedTask = {
        ...task,
        title,
        description,
        estimatedPomodoros: Number(estimatedPomodoros),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId
      };

      const result = await taskApi.updateTask(task._id, updatedTask);
      
      if (onSave) {
        onSave(result);
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit Task</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </FormGroup>

            <FormRow>
              <FormGroup style={{ flex: 1 }}>
                <Label htmlFor="estimatedPomodoros">Estimated Pomodoros</Label>
                <Input
                  id="estimatedPomodoros"
                  type="number"
                  min="1"
                  max="20"
                  value={estimatedPomodoros}
                  onChange={e => setEstimatedPomodoros(e.target.value)}
                />
              </FormGroup>

              <FormGroup style={{ flex: 2 }}>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="project">Project</Label>
              <Select
                id="project"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <ButtonGroup>
              <CancelButton type="button" onClick={onClose}>
                Cancel
              </CancelButton>
              <SaveButton type="submit" disabled={loading}>
                <FaSave style={{ marginRight: '0.5rem' }} />
                {loading ? 'Saving...' : 'Save Changes'}
              </SaveButton>
            </ButtonGroup>
          </Form>
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
  max-width: 500px;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${props => props.theme['--text-color']};
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${props => props.theme['--border-color']};
  background-color: ${props => props.theme['--bg-color']};
  color: ${props => props.theme['--text-color']};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color']};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${props => props.theme['--border-color']};
  background-color: ${props => props.theme['--bg-color']};
  color: ${props => props.theme['--text-color']};
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color']};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${props => props.theme['--border-color']};
  background-color: ${props => props.theme['--bg-color']};
  color: ${props => props.theme['--text-color']};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color']};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CancelButton = styled(Button)`
  background: none;
  border: 1px solid ${props => props.theme['--border-color']};
  color: ${props => props.theme['--text-color']};
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SaveButton = styled(Button)`
  background-color: ${props => props.theme['--primary-color']};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${props => props.theme['--primary-dark'] || '#c04540'};
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export default TaskEditModal;
