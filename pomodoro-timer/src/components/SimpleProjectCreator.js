import React, { useState, useEffect } from 'react';

const SimpleProjectCreator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('simpleProjects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        console.log('Loaded projects from localStorage:', parsedProjects);
        setProjects(parsedProjects);
      }
    } catch (err) {
      console.error('Error loading projects from localStorage:', err);
      setError('Failed to load projects from localStorage');
    }
  }, []);

  // Create a new project
  const handleCreateProject = (e) => {
    e.preventDefault();
    
    // Reset messages
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!title.trim()) {
      setError('Project title is required');
      return;
    }
    
    try {
      // Create new project
      const newProject = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating new project:', newProject);
      
      // Add to projects array
      const updatedProjects = [...projects, newProject];
      
      // Save to localStorage
      localStorage.setItem('simpleProjects', JSON.stringify(updatedProjects));
      
      // Update state
      setProjects(updatedProjects);
      setTitle('');
      setDescription('');
      setSuccess('Project created successfully!');
      
      console.log('Project created and saved to localStorage');
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project: ' + err.message);
    }
  };

  // Delete a project
  const handleDeleteProject = (id) => {
    try {
      // Filter out the project to delete
      const updatedProjects = projects.filter(project => project.id !== id);
      
      // Save to localStorage
      localStorage.setItem('simpleProjects', JSON.stringify(updatedProjects));
      
      // Update state
      setProjects(updatedProjects);
      setSuccess('Project deleted successfully!');
      
      console.log('Project deleted and localStorage updated');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project: ' + err.message);
    }
  };

  // Clear all projects
  const handleClearProjects = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('simpleProjects');
      
      // Update state
      setProjects([]);
      setSuccess('All projects cleared successfully!');
      
      console.log('All projects cleared from localStorage');
    } catch (err) {
      console.error('Error clearing projects:', err);
      setError('Failed to clear projects: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', margin: '20px' }}>
      <h2>Simple Project Creator</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '3px' }}>
          Error: {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '3px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleCreateProject} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Project Title:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Description (optional):
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description"
            rows={4}
            style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        
        <button 
          type="submit"
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Create Project
        </button>
      </form>
      
      <div>
        <h3>Projects ({projects.length})</h3>
        
        {projects.length === 0 ? (
          <p>No projects yet. Create your first project above.</p>
        ) : (
          <div>
            <button 
              onClick={handleClearProjects}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                marginBottom: '10px'
              }}
            >
              Clear All Projects
            </button>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {projects.map(project => (
                <li 
                  key={project.id}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '3px',
                    marginBottom: '10px'
                  }}
                >
                  <h4 style={{ margin: '0 0 5px 0' }}>{project.title}</h4>
                  {project.description && <p style={{ margin: '0 0 10px 0' }}>{project.description}</p>}
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Created: {new Date(project.createdAt).toLocaleString()}
                  </div>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    style={{ 
                      padding: '3px 8px', 
                      backgroundColor: '#f44336', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px',
                      marginTop: '5px',
                      fontSize: '0.8em'
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleProjectCreator;
