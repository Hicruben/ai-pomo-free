import React from 'react';
import styled from 'styled-components';
import { FaTrash } from 'react-icons/fa';
import { isAuthenticated } from '../services/authService';
import { milestoneApi } from '../services/apiService';

const MarkerContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
`;

const DeadlineBox = styled.div`
  background-color: white;
  border: 1px dashed #d32f2f;
  border-radius: 3px;
  padding: 3px 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
`;

const RedFlag = styled.div`
  width: 12px;
  height: 12px;
  background-color: #d32f2f;
  margin-right: 5px;
  clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
`;

const DeadlineText = styled.div`
  color: #d32f2f;
  font-size: 0.9rem;
  font-weight: bold;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #d95550;
  cursor: pointer;
  padding: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: opacity 0.2s, color 0.2s, background-color 0.2s;
  border-radius: 3px;
  margin-left: 8px;

  &:hover {
    color: #fff;
    background-color: #d95550;
    opacity: 1;
  }
`;

const DeadlineMarker = ({ projectId }) => {
  const handleDeleteDeadline = () => {
    if (window.confirm('Are you sure you want to delete the project deadline?')) {
      try {
        const deadlineId = 'deadline-' + projectId;
        console.log('Deleting deadline milestone with ID:', deadlineId);

        if (isAuthenticated()) {
          milestoneApi.deleteMilestone(deadlineId)
            .then(() => {
              console.log('Deadline deleted successfully');
              window.location.reload(); // Refresh the page to update the UI
            })
            .catch(error => {
              console.error('Error deleting deadline:', error);
              alert('Failed to delete deadline. Please try again.');
            });
        } else {
          // For non-authenticated users, handle localStorage deletion
          const savedMilestones = localStorage.getItem('pomodoroMilestones');
          const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
          const updatedMilestones = parsedMilestones.filter(m => m.id !== deadlineId);
          localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));
          window.location.reload(); // Refresh the page to update the UI
        }
      } catch (error) {
        console.error('Error in handleDeleteDeadline:', error);
        alert('Failed to delete deadline. Please try again.');
      }
    }
  };

  return (
    <MarkerContainer>
      <DeadlineBox>
        <RedFlag />
        <DeadlineText>Deadline</DeadlineText>
        <DeleteButton onClick={handleDeleteDeadline} title="Delete deadline">
          <FaTrash />
        </DeleteButton>
      </DeadlineBox>
    </MarkerContainer>
  );
};

export default DeadlineMarker;
