import React, { useState } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import { noteApi } from '../services/apiService';

const NotesGrid = ({ notes, projectId, onNotesUpdate }) => {
  const [newNote, setNewNote] = useState({ content: '', color: '#ffffff' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState(null);
  
  // Available note colors
  const noteColors = [
    '#ffffff', // White
    '#ffcdd2', // Light Red
    '#f8bbd0', // Light Pink
    '#e1bee7', // Light Purple
    '#d1c4e9', // Light Deep Purple
    '#c5cae9', // Light Indigo
    '#bbdefb', // Light Blue
    '#b3e5fc', // Light Light Blue
    '#b2ebf2', // Light Cyan
    '#b2dfdb', // Light Teal
    '#c8e6c9', // Light Green
    '#dcedc8', // Light Light Green
    '#f0f4c3', // Light Lime
    '#fff9c4', // Light Yellow
    '#ffecb3', // Light Amber
    '#ffe0b2', // Light Orange
    '#ffccbc', // Light Deep Orange
  ];
  
  // Get note ID based on authentication status
  const getNoteId = (note) => isAuthenticated() ? note._id : note.id;
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Add a new note
  const addNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.content.trim()) {
      setError('Note content is required');
      return;
    }
    
    try {
      if (isAuthenticated()) {
        // Create note via API if authenticated
        await noteApi.createNote(projectId, {
          content: newNote.content.trim(),
          color: newNote.color
        });
        
        // Refresh notes
        const updatedNotes = await noteApi.getNotes(projectId);
        onNotesUpdate && onNotesUpdate(updatedNotes);
      } else {
        // Create note locally if not authenticated
        const newNoteObj = {
          id: Date.now().toString(),
          content: newNote.content.trim(),
          color: newNote.color,
          projectId,
          position: notes.length,
          createdAt: new Date().toISOString()
        };
        
        // Update localStorage
        const savedNotes = localStorage.getItem('pomodoroNotes');
        const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = [...parsedNotes, newNoteObj];
        localStorage.setItem('pomodoroNotes', JSON.stringify(updatedNotes));
        
        // Update parent component
        const projectNotes = updatedNotes.filter(note => note.projectId === projectId);
        onNotesUpdate && onNotesUpdate(projectNotes);
      }
      
      // Reset form
      setNewNote({ content: '', color: '#ffffff' });
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Please try again.');
    }
  };
  
  // Update a note
  const updateNote = async (e) => {
    e.preventDefault();
    
    if (!editingNote || !editingNote.content.trim()) {
      setError('Note content is required');
      return;
    }
    
    try {
      const noteId = getNoteId(editingNote);
      
      if (isAuthenticated()) {
        // Update note via API if authenticated
        await noteApi.updateNote(noteId, {
          content: editingNote.content.trim(),
          color: editingNote.color
        });
        
        // Refresh notes
        const updatedNotes = await noteApi.getNotes(projectId);
        onNotesUpdate && onNotesUpdate(updatedNotes);
      } else {
        // Update localStorage
        const savedNotes = localStorage.getItem('pomodoroNotes');
        const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = parsedNotes.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              content: editingNote.content.trim(),
              color: editingNote.color
            };
          }
          return note;
        });
        localStorage.setItem('pomodoroNotes', JSON.stringify(updatedNotes));
        
        // Update parent component
        const projectNotes = updatedNotes.filter(note => note.projectId === projectId);
        onNotesUpdate && onNotesUpdate(projectNotes);
      }
      
      // Reset editing state
      setEditingNote(null);
      setError(null);
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
    }
  };
  
  // Delete a note
  const deleteNote = async (noteId) => {
    try {
      if (isAuthenticated()) {
        // Delete note via API if authenticated
        await noteApi.deleteNote(noteId);
        
        // Refresh notes
        const updatedNotes = await noteApi.getNotes(projectId);
        onNotesUpdate && onNotesUpdate(updatedNotes);
      } else {
        // Delete note from localStorage
        const savedNotes = localStorage.getItem('pomodoroNotes');
        const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = parsedNotes.filter(note => note.id !== noteId);
        localStorage.setItem('pomodoroNotes', JSON.stringify(updatedNotes));
        
        // Update parent component
        const projectNotes = updatedNotes.filter(note => note.projectId === projectId);
        onNotesUpdate && onNotesUpdate(projectNotes);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  return (
    <NotesContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {isAdding ? (
        <NoteForm onSubmit={addNote}>
          <NoteTextarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Enter your note here..."
            rows={4}
            required
          />
          
          <ColorSelector>
            <ColorLabel>Color:</ColorLabel>
            <ColorOptions>
              {noteColors.map(color => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={newNote.color === color}
                  onClick={() => setNewNote({ ...newNote, color })}
                />
              ))}
            </ColorOptions>
          </ColorSelector>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit">
              Add Note
            </SubmitButton>
          </ButtonGroup>
        </NoteForm>
      ) : (
        <AddButton onClick={() => setIsAdding(true)}>
          + Add Note
        </AddButton>
      )}
      
      {notes.length === 0 ? (
        <EmptyMessage>No notes yet. Add your first note to capture ideas and information.</EmptyMessage>
      ) : (
        <Grid>
          {notes.map(note => (
            <NoteCard 
              key={getNoteId(note)} 
              color={note.color}
            >
              {editingNote && getNoteId(editingNote) === getNoteId(note) ? (
                <NoteForm onSubmit={updateNote}>
                  <NoteTextarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={4}
                    required
                  />
                  
                  <ColorSelector>
                    <ColorLabel>Color:</ColorLabel>
                    <ColorOptions>
                      {noteColors.map(color => (
                        <ColorOption
                          key={color}
                          color={color}
                          selected={editingNote.color === color}
                          onClick={() => setEditingNote({ ...editingNote, color })}
                        />
                      ))}
                    </ColorOptions>
                  </ColorSelector>
                  
                  <ButtonGroup>
                    <CancelButton type="button" onClick={() => setEditingNote(null)}>
                      Cancel
                    </CancelButton>
                    <SubmitButton type="submit">
                      Save
                    </SubmitButton>
                  </ButtonGroup>
                </NoteForm>
              ) : (
                <>
                  <NoteContent>{note.content}</NoteContent>
                  
                  <NoteFooter>
                    <NoteDate>
                      {formatDate(note.createdAt)}
                    </NoteDate>
                    
                    <NoteActions>
                      <ActionButton onClick={() => setEditingNote(note)}>
                        Edit
                      </ActionButton>
                      <ActionButton 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this note?')) {
                            deleteNote(getNoteId(note));
                          }
                        }}
                      >
                        Delete
                      </ActionButton>
                    </NoteActions>
                  </NoteFooter>
                </>
              )}
            </NoteCard>
          ))}
        </Grid>
      )}
    </NotesContainer>
  );
};

// Styled components
const NotesContainer = styled.div`
  margin-bottom: 2rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const NoteCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: ${props => props.color || '#ffffff'};
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 150px;
`;

const NoteContent = styled.div`
  flex: 1;
  margin-bottom: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const NoteFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
`;

const NoteDate = styled.div`
  font-size: 0.75rem;
  color: #777;
`;

const NoteActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const NoteTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  resize: vertical;
  background-color: var(--card-bg);
  color: var(--text-color);
  
  &:focus {
    outline: none;
    border-color: #d95550;
  }
`;

const ColorSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ColorLabel = styled.div`
  font-size: 0.85rem;
  color: #555;
`;

const ColorOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ColorOption = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#333' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
`;

const AddButton = styled(Button)`
  background-color: #d95550;
  color: white;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #c04540;
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

const EmptyMessage = styled.p`
  text-align: center;
  color: #777;
  font-style: italic;
  padding: 1rem;
  background-color: var(--card-bg);
  border-radius: 0.25rem;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.9rem;
`;

export default NotesGrid;
