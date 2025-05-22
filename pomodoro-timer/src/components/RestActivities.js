import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Sample rest activities
const restActivities = [
  {
    id: 'breathing',
    name: 'Deep Breathing',
    description: 'Take 5 deep breaths, inhaling for 4 seconds and exhaling for 6 seconds.',
    icon: '😌',
    duration: 60, // seconds
    type: 'mindfulness',
  },
  {
    id: 'stretching',
    name: 'Desk Stretches',
    description: 'Simple stretches you can do at your desk to relieve tension.',
    icon: '🧘',
    duration: 120, // seconds
    type: 'physical',
    steps: [
      'Stretch your arms above your head for 10 seconds',
      'Roll your shoulders backward 5 times, then forward 5 times',
      'Gently tilt your head to each side, holding for 10 seconds',
      'Stretch your wrists by extending your arms and gently pulling fingers back'
    ]
  },
  {
    id: 'eye_rest',
    name: 'Eye Rest',
    description: 'Look away from your screen at something 20 feet away for 20 seconds.',
    icon: '👁️',
    duration: 20, // seconds
    type: 'physical',
  },
  {
    id: 'water',
    name: 'Hydration Break',
    description: 'Take a moment to drink a glass of water.',
    icon: '💧',
    duration: 30, // seconds
    type: 'health',
  },
  {
    id: 'walk',
    name: 'Quick Walk',
    description: 'Stand up and take a short walk around your space.',
    icon: '🚶',
    duration: 60, // seconds
    type: 'physical',
  },
];

const RestActivities = ({ currentSession }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityInProgress, setActivityInProgress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  // Only show during break sessions
  const isBreak = currentSession === 'shortBreak' || currentSession === 'longBreak';

  // Start an activity
  const startActivity = (activity) => {
    setSelectedActivity(activity);
    setActivityInProgress(true);
    setTimeRemaining(activity.duration);

    // Clear any existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Start countdown
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setActivityInProgress(false);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Skip the current activity
  const skipActivity = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setActivityInProgress(false);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  if (!isBreak) {
    return null;
  }

  return (
    <RestActivitiesContainer>
      {!activityInProgress ? (
        <>
          <h3>Break Activities</h3>
          <p>Choose an activity for your break:</p>

          <ActivityList>
            {restActivities.map(activity => (
              <ActivityItem
                key={activity.id}
                onClick={() => startActivity(activity)}
              >
                <ActivityIcon>{activity.icon}</ActivityIcon>
                <ActivityContent>
                  <ActivityName>{activity.name}</ActivityName>
                  <ActivityDuration>{formatTime(activity.duration)}</ActivityDuration>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>

          <SkipMessage>
            Or simply relax and enjoy your break!
          </SkipMessage>
        </>
      ) : (
        <ActivityInProgress>
          <ActivityHeader>
            <h3>{selectedActivity.name}</h3>
            <ActivityTimer>{formatTime(timeRemaining)}</ActivityTimer>
          </ActivityHeader>

          <ActivityDescription>
            {selectedActivity.description}
          </ActivityDescription>

          {selectedActivity.steps && (
            <ActivitySteps>
              {selectedActivity.steps.map((step, index) => (
                <ActivityStep key={index}>
                  {index + 1}. {step}
                </ActivityStep>
              ))}
            </ActivitySteps>
          )}

          <SkipButton onClick={skipActivity}>
            Skip Activity
          </SkipButton>
        </ActivityInProgress>
      )}
    </RestActivitiesContainer>
  );
};

// Styled components
const RestActivitiesContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto 0;
  padding: 1.5rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;

  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #457ca3; // Blue color for breaks
  }

  p {
    margin-bottom: 1.5rem;
    color: #666;
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ActivityIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #457ca3;
  color: white;
  margin-right: 1rem;
  font-size: 1.25rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ActivityDuration = styled.div`
  font-size: 0.85rem;
  color: #777;
`;

const SkipMessage = styled.div`
  text-align: center;
  font-style: italic;
  color: #888;
  margin-top: 1rem;
`;

const ActivityInProgress = styled.div`
  text-align: center;
`;

const ActivityHeader = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const ActivityTimer = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #457ca3;
`;

const ActivityDescription = styled.div`
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.5;
  color: #555;
`;

const ActivitySteps = styled.div`
  text-align: left;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 0.5rem;
`;

const ActivityStep = styled.div`
  margin-bottom: 0.75rem;
  line-height: 1.4;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SkipButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #777;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f0f0;
    color: #555;
  }
`;

export default RestActivities;
