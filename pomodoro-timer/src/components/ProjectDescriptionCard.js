import React from 'react';
import styled from 'styled-components';

// Function to truncate text to a specific length
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const ProjectDescriptionCard = ({ project }) => {
  // Always render the component for testing, even if there's no description
  return (
    <DescriptionContainer title={project?.description || 'No description available'}>
      <DescriptionTitle>Project Description</DescriptionTitle>
      <DescriptionText>
        {project?.description ? truncateText(project.description) : 'No description available for this project.'}
      </DescriptionText>
    </DescriptionContainer>
  );
};

const DescriptionContainer = styled.div`
  background-color: #e6f7ff; /* Light blue background */
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-top: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  border: 2px solid #0284c7; /* Add a visible border */

  &::before {
    content: '"';
    position: absolute;
    top: 0.5rem;
    left: 0.75rem;
    font-size: 2rem;
    color: rgba(0, 0, 0, 0.1);
    font-family: Georgia, serif;
  }

  &::after {
    content: '"';
    position: absolute;
    bottom: 0;
    right: 0.75rem;
    font-size: 2rem;
    color: rgba(0, 0, 0, 0.1);
    font-family: Georgia, serif;
  }
`;

const DescriptionTitle = styled.h3`
  font-size: 0.9rem;
  color: #0284c7;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  text-align: center;
`;

const DescriptionText = styled.p`
  font-size: 0.95rem;
  color: #333;
  line-height: 1.5;
  margin: 0;
  text-align: center;
  font-style: italic;
  padding: 0 1.5rem;
`;

export default ProjectDescriptionCard;
