import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaCheck, FaTrash, FaEdit, FaPlay } from 'react-icons/fa';
import { isAuthenticated } from '../services/authService';
import { taskApi } from '../services/apiService';

const StandaloneTodoList = ({ onTodoSelect, selectedTodoId }) => {
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load todos on component mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Load todos from API or localStorage
  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isAuthenticated()) {
        // Load from API for authenticated users using the standalone tasks API
        const response = await taskApi.getStandaloneTasks();
        setTodos(response);
      } else {
        // Load from localStorage for non-authenticated users
        const savedTodos = localStorage.getItem('standaloneTodos');
        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
        } else {
          setTodos([]);
        }
      }
    } catch (err) {
      console.error('Error loading todos:', err);
      setError('Failed to load todo list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save todos to localStorage (for non-authenticated users)
  const saveTodosToLocalStorage = (updatedTodos) => {
    localStorage.setItem('standaloneTodos', JSON.stringify(updatedTodos));
  };

  // Add a new todo
  const addTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodoTitle.trim()) return;
    
    try {
      if (isAuthenticated()) {
        // Create via API for authenticated users
        const todoData = {
          title: newTodoTitle.trim(),
          estimatedPomodoros: 1
        };
        
        const newTodo = await taskApi.createStandaloneTask(todoData);
        setTodos(prevTodos => [...prevTodos, newTodo]);
      } else {
        // Create locally for non-authenticated users
        const newTodo = {
          id: `local-${Date.now()}`,
          title: newTodoTitle.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        const updatedTodos = [...todos, newTodo];
        setTodos(updatedTodos);
        saveTodosToLocalStorage(updatedTodos);
      }
      
      // Reset form
      setNewTodoTitle('');
    } catch (err) {
      console.error('Error adding todo:', err);
      setError('Failed to add todo. Please try again.');
    }
  };

  // Toggle todo completion
  const toggleTodoCompletion = async (todoId) => {
    try {
      const todoToUpdate = todos.find(todo => getTodoId(todo) === todoId);
      if (!todoToUpdate) return;
      
      const updatedCompleted = !todoToUpdate.completed;
      
      if (isAuthenticated()) {
        // Update via API for authenticated users
        await taskApi.updateStandaloneTask(todoId, { completed: updatedCompleted });
        
        // Refresh todos
        await loadTodos();
      } else {
        // Update locally for non-authenticated users
        const updatedTodos = todos.map(todo => 
          getTodoId(todo) === todoId 
            ? { ...todo, completed: updatedCompleted } 
            : todo
        );
        
        setTodos(updatedTodos);
        saveTodosToLocalStorage(updatedTodos);
      }
    } catch (err) {
      console.error('Error toggling todo completion:', err);
      setError('Failed to update todo. Please try again.');
    }
  };

  // Delete a todo
  const deleteTodo = async (todoId) => {
    try {
      if (isAuthenticated()) {
        // Delete via API for authenticated users
        await taskApi.deleteStandaloneTask(todoId);
        
        // Refresh todos
        await loadTodos();
      } else {
        // Delete locally for non-authenticated users
        const updatedTodos = todos.filter(todo => getTodoId(todo) !== todoId);
        setTodos(updatedTodos);
        saveTodosToLocalStorage(updatedTodos);
      }
      
      // If the deleted todo was selected, clear the selection
      if (selectedTodoId === todoId) {
        onTodoSelect(null, null);
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo. Please try again.');
    }
  };

  // Start editing a todo
  const startEditingTodo = (todo) => {
    setEditingTodoId(getTodoId(todo));
    setEditTitle(todo.title);
  };

  // Save todo edits
  const saveTodoEdit = async () => {
    if (!editTitle.trim()) return;
    
    try {
      if (isAuthenticated()) {
        // Update via API for authenticated users
        await taskApi.updateStandaloneTask(editingTodoId, { title: editTitle.trim() });
        
        // Refresh todos
        await loadTodos();
      } else {
        // Update locally for non-authenticated users
        const updatedTodos = todos.map(todo => 
          getTodoId(todo) === editingTodoId 
            ? { ...todo, title: editTitle.trim() } 
            : todo
        );
        
        setTodos(updatedTodos);
        saveTodosToLocalStorage(updatedTodos);
      }
      
      // Update selected todo title if this todo is selected
      if (selectedTodoId === editingTodoId) {
        onTodoSelect(editingTodoId, editTitle.trim());
      }
      
      // Reset edit state
      setEditingTodoId(null);
      setEditTitle('');
    } catch (err) {
      console.error('Error saving todo edit:', err);
      setError('Failed to update todo. Please try again.');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditTitle('');
  };

  // Helper to get todo ID consistently
  const getTodoId = (todo) => {
    return todo._id || todo.id;
  };

  // Handle selecting a todo for the timer
  const handleSelectTodo = (todo) => {
    const todoId = getTodoId(todo);
    onTodoSelect(todoId, todo.title);
  };

  return (
    <TodoListContainer>
      {/* Add new todo form */}
      <AddTodoForm onSubmit={addTodo}>
        <AddTodoInput
          type="text"
          placeholder="Add a new todo..."
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
        />
        <AddTodoButton type="submit">
          <FaPlus />
        </AddTodoButton>
      </AddTodoForm>
      
      {/* Error message */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {/* Todo list */}
      {loading ? (
        <LoadingMessage>Loading todos...</LoadingMessage>
      ) : todos.length === 0 ? (
        <EmptyMessage>No todos yet. Add one to get started!</EmptyMessage>
      ) : (
        <TodoItems>
          {todos.map(todo => (
            <TodoItem 
              key={getTodoId(todo)} 
              $isCompleted={todo.completed}
              $isSelected={selectedTodoId === getTodoId(todo)}
            >
              {editingTodoId === getTodoId(todo) ? (
                // Edit mode
                <EditForm>
                  <EditInput
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <EditActions>
                    <ActionButton onClick={saveTodoEdit} title="Save">
                      <FaCheck />
                    </ActionButton>
                    <ActionButton onClick={cancelEditing} title="Cancel">
                      <FaTrash />
                    </ActionButton>
                  </EditActions>
                </EditForm>
              ) : (
                // View mode
                <>
                  <TodoCheckbox
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodoCompletion(getTodoId(todo))}
                  />
                  <TodoTitle $isCompleted={todo.completed}>{todo.title}</TodoTitle>
                  <TodoActions>
                    <ActionButton 
                      onClick={() => handleSelectTodo(todo)} 
                      title="Use with timer"
                      $isSelected={selectedTodoId === getTodoId(todo)}
                    >
                      <FaPlay />
                    </ActionButton>
                    <ActionButton onClick={() => startEditingTodo(todo)} title="Edit">
                      <FaEdit />
                    </ActionButton>
                    <ActionButton onClick={() => deleteTodo(getTodoId(todo))} title="Delete">
                      <FaTrash />
                    </ActionButton>
                  </TodoActions>
                </>
              )}
            </TodoItem>
          ))}
        </TodoItems>
      )}
    </TodoListContainer>
  );
};

// Styled components
const TodoListContainer = styled.div`
  width: 100%;
`;

const AddTodoForm = styled.form`
  display: flex;
  margin-bottom: 1rem;
`;

const AddTodoInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme['--border-color'] || '#e0e0e0'};
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
  background-color: ${props => props.theme['--input-bg'] || '#fff'};
  color: ${props => props.theme['--text-color']};
`;

const AddTodoButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: ${props => props.theme['--accent-color'] || '#4caf50'};
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme['--accent-hover'] || '#388e3c'};
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme['--error-color'] || '#f44336'};
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: ${props => props.theme['--error-bg'] || 'rgba(244, 67, 54, 0.1)'};
  border-radius: 4px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 1rem;
  color: ${props => props.theme['--text-secondary'] || '#757575'};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary'] || '#757575'};
  background-color: ${props => props.theme['--card-bg'] || '#f5f5f5'};
  border-radius: 8px;
`;

const TodoItems = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TodoItem = styled.li`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: ${props => 
    props.$isSelected 
      ? props.theme['--selected-bg'] || 'rgba(33, 150, 243, 0.1)' 
      : props.theme['--card-bg'] || '#f5f5f5'};
  border-left: 3px solid ${props => 
    props.$isSelected 
      ? props.theme['--accent-color'] || '#2196f3' 
      : 'transparent'};
  
  &:hover {
    background-color: ${props => 
      props.$isSelected 
        ? props.theme['--selected-bg'] || 'rgba(33, 150, 243, 0.1)' 
        : props.theme['--card-hover-bg'] || '#e0e0e0'};
  }
`;

const TodoCheckbox = styled.input`
  margin-right: 0.75rem;
  cursor: pointer;
`;

const TodoTitle = styled.span`
  flex: 1;
  text-decoration: ${props => props.$isCompleted ? 'line-through' : 'none'};
  color: ${props => props.$isCompleted ? props.theme['--text-secondary'] || '#757575' : props.theme['--text-color']};
`;

const TodoActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => 
    props.$isSelected 
      ? props.theme['--accent-color'] || '#2196f3' 
      : props.theme['--icon-color'] || '#757575'};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const EditForm = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

const EditInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid ${props => props.theme['--border-color'] || '#e0e0e0'};
  border-radius: 4px;
  font-size: 1rem;
  background-color: ${props => props.theme['--input-bg'] || '#fff'};
  color: ${props => props.theme['--text-color']};
`;

const EditActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 0.5rem;
`;

export default StandaloneTodoList;
