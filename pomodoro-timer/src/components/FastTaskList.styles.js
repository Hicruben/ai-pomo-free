import styled from 'styled-components';

// Styled components
export const TaskListContainer = styled.div`
  width: 100%;
  padding: 0;

  h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    font-size: 1.5rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  h3 {
    margin: 1.5rem 0 1rem;
    font-weight: 500;
    color: ${props => props.theme['--text-color'] || '#555'};
    font-size: 1.2rem;
  }
`;

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const AIProjectLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme['--accent-color'] || '#d95550'};
  font-size: 0.9rem;
  text-decoration: none;
  margin-top: 0.25rem;
  transition: all 0.2s ease;

  svg {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    opacity: 0.85;
    text-decoration: underline;

    svg:last-child {
      transform: translateX(3px);
    }
  }
`;

export const AddTaskForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: ${props => props.theme['--card-bg'] || '#f8f9fa'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
  }
`;

export const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const TaskInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--accent-color'] || '#d95550'};
    box-shadow: 0 4px 12px rgba(217, 85, 80, 0.1);
  }
`;

export const PomodoroInput = styled.div`
  display: flex;
  align-items: center;
  flex: 1;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: ${props => props.theme['--text-color'] || '#555'};
  }

  input {
    width: 3rem;
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
    text-align: center;
  }
`;

export const DateInput = styled.div`
  display: flex;
  align-items: center;
  flex: 2;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: ${props => props.theme['--text-color'] || '#555'};
  }

  input {
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
  }
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: ${props => props.theme['--accent-color'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(217, 85, 80, 0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #c04540;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(217, 85, 80, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const TaskSection = styled.section`
  margin-bottom: 2rem;
`;

export const TaskSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;

  h3 {
    margin: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }
`;

export const FilterLink = styled.button`
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: ${props => props.isActive ? props.theme['--accent-color'] || '#d95550' : props.theme['--text-secondary'] || '#777'};
  font-weight: ${props => props.isActive ? '600' : '400'};
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.5rem;
    right: 0.5rem;
    height: 2px;
    background-color: ${props => props.isActive ? props.theme['--accent-color'] || '#d95550' : 'transparent'};
    transition: all 0.2s ease;
  }

  &:hover {
    color: ${props => props.theme['--accent-color'] || '#d95550'};
    background-color: rgba(217, 85, 80, 0.05);
  }
`;

export const TaskCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 1rem;
  background-color: ${props => props.isActive ? props.theme['--accent-color'] || '#d95550' : 'rgba(0, 0, 0, 0.1)'};
  color: ${props => props.isActive ? 'white' : props.theme['--text-secondary'] || '#777'};
  transition: all 0.2s ease;
`;

export const TaskItems = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const TaskItem = styled.li`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: ${props =>
    props.isActive ? '#f0f7ff' :
    props.theme['--card-bg'] || '#f8f9fa'
  };
  border-left: 4px solid ${props =>
    props.isActive ? '#1e88e5' :
    props.isCompleted ? '#4caf50' : '#ddd'
  };
  border-radius: 0.5rem;
  box-shadow: ${props =>
    props.isActive ? '0 4px 12px rgba(30, 136, 229, 0.15)' :
    '0 4px 12px rgba(0, 0, 0, 0.05)'
  };
  opacity: ${props => props.isCompleted ? 0.7 : 1};
  margin-bottom: 0.75rem;
  border: 1px solid ${props =>
    props.isActive ? 'rgba(30, 136, 229, 0.2)' :
    'rgba(0, 0, 0, 0.03)'
  };
  transition: all 0.3s ease;
  cursor: ${props => props.isCompleted ? 'default' : 'pointer'};

  &:hover {
    box-shadow: ${props =>
      props.isActive ? '0 6px 18px rgba(30, 136, 229, 0.2)' :
      '0 6px 18px rgba(0, 0, 0, 0.07)'
    };
    transform: ${props => props.isCompleted ? 'none' : 'translateY(-2px)'};
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

export const TaskContent = styled.div`
  flex: 1;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

export const TaskTitle = styled.div`
  font-weight: ${props => props.isActive ? '600' : '500'};
  margin-bottom: 0.25rem;
  color: ${props =>
    props.isActive ? '#1e88e5' :
    props.theme['--text-color'] || '#333'
  };
  font-size: ${props => props.isActive ? '1.05rem' : '1rem'};
`;

export const TaskDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

export const TaskProgress = styled.div`
  font-size: 0.85rem;
  color: ${props =>
    props.isActive ? '#1e88e5' :
    props.theme['--text-secondary'] || '#777'
  };
  font-weight: ${props => props.isActive ? '500' : 'normal'};
`;

export const DueDate = styled.div`
  font-size: 0.85rem;
  color: ${props =>
    props.isActive ? '#1e88e5' :
    props.theme['--text-secondary'] || '#777'
  };
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: ${props => props.isActive ? '500' : 'normal'};
`;

export const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const ActionButton = styled.button`
  padding: 0.5rem;
  border: 1px solid ${props =>
    props.isActive ? 'rgba(30, 136, 229, 0.3)' :
    'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 50%;
  background-color: ${props =>
    props.isActive ? 'rgba(30, 136, 229, 0.1)' :
    'transparent'
  };
  color: ${props =>
    props.isActive ? '#1e88e5' :
    props.theme['--text-color'] || '#555'
  };
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;

  &:hover {
    background-color: ${props =>
      props.isActive ? 'rgba(30, 136, 229, 0.2)' :
      'rgba(0, 0, 0, 0.05)'
    };
    transform: translateY(-2px);
    box-shadow: ${props =>
      props.isActive ? '0 4px 12px rgba(30, 136, 229, 0.15)' :
      '0 4px 12px rgba(0, 0, 0, 0.1)'
    };
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const EmptyMessage = styled.p`
  text-align: center;
  color: ${props => props.theme['--text-secondary'] || '#777'};
  font-style: italic;
  padding: 1rem;
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary'] || '#777'};
`;

export const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
`;
