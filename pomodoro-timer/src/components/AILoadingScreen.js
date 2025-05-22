import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaRobot, FaLightbulb, FaCheck, FaClock, FaBrain, FaChartLine, FaCalendarAlt, FaTasks } from 'react-icons/fa';

// Benefits and tips content
const benefitsContent = [
  {
    id: 1,
    icon: <FaClock />,
    title: "The Pomodoro Technique",
    content: "The Pomodoro Technique helps you work with time, not against it. Break work into 25-minute focused sessions followed by 5-minute breaks to maintain high concentration and prevent burnout."
  },
  {
    id: 2,
    icon: <FaBrain />,
    title: "Project-Based Thinking",
    content: "Treating your work, life, health, and travel as projects helps you organize tasks, set clear goals, track progress, and achieve meaningful outcomes with less stress and better focus."
  },
  {
    id: 3,
    icon: <FaChartLine />,
    title: "Productivity Benefits",
    content: "Studies show that the Pomodoro Technique can increase productivity by up to 25% by reducing distractions, preventing mental fatigue, and creating a sustainable work rhythm."
  },
  {
    id: 4,
    icon: <FaCalendarAlt />,
    title: "Consistent Progress",
    content: "Breaking large projects into manageable tasks with estimated pomodoros helps you make consistent daily progress and avoid procrastination and last-minute rushes."
  },
  {
    id: 5,
    icon: <FaTasks />,
    title: "AI-Pomo Advantage",
    content: "AI-Pomo combines the Pomodoro Technique with AI-powered project planning to help you structure your work optimally, estimate time requirements accurately, and focus on what matters most."
  },
  {
    id: 6,
    icon: <FaRobot />,
    title: "AI Project Generation",
    content: "Our AI analyzes your project description to create a complete structure with tasks, subtasks, milestones, and notes - saving you hours of planning time and ensuring nothing important is missed."
  }
];

const AILoadingScreen = ({ isLoading }) => {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Rotate through benefits every 5 seconds
  useEffect(() => {
    if (!isLoading) return;

    const intervalId = setInterval(() => {
      setFadeState('out');

      setTimeout(() => {
        setCurrentBenefitIndex((prevIndex) => (prevIndex + 1) % benefitsContent.length);
        setFadeState('in');
      }, 500); // Wait for fade out animation to complete
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Timer to track elapsed time
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentBenefit = benefitsContent[currentBenefitIndex];

  return (
    <LoadingContainer>
      <LoadingHeader>
        <RobotIcon><FaRobot /></RobotIcon>
        <LoadingTitle>Generating Your Project</LoadingTitle>
      </LoadingHeader>

      <LoadingMessage>
        Our AI is analyzing your description and creating a structured project plan...
      </LoadingMessage>

      <LoadingSpinnerContainer>
        <LoadingSpinner />
        <ProgressText>This usually takes 15-30 seconds</ProgressText>
        <TimerText>Generating your project structure... ({elapsedTime}s elapsed)</TimerText>
      </LoadingSpinnerContainer>

      <BenefitSection fadeState={fadeState}>
        <BenefitIcon>{currentBenefit.icon}</BenefitIcon>
        <BenefitContent>
          <BenefitTitle>{currentBenefit.title}</BenefitTitle>
          <BenefitText>{currentBenefit.content}</BenefitText>
        </BenefitContent>
      </BenefitSection>

      <BenefitIndicators>
        {benefitsContent.map((benefit, index) => (
          <IndicatorDot
            key={benefit.id}
            active={index === currentBenefitIndex}
            onClick={() => {
              setFadeState('out');
              setTimeout(() => {
                setCurrentBenefitIndex(index);
                setFadeState('in');
              }, 500);
            }}
          />
        ))}
      </BenefitIndicators>

      <TipsSection>
        <TipItem>
          <TipIcon><FaLightbulb /></TipIcon>
          <TipText>For best results, include specific deadlines, major tasks, and key milestones in your project description.</TipText>
        </TipItem>
        <TipItem>
          <TipIcon><FaCheck /></TipIcon>
          <TipText>AI-generated projects can be fully customized after creation - you can add, edit, or remove any elements.</TipText>
        </TipItem>
      </TipsSection>
    </LoadingContainer>
  );
};

// Styled components
const LoadingContainer = styled.div`
  background-color: var(--bg-card, #ffffff);
  border-radius: 0.75rem;
  padding: 2rem;
  margin-top: 1.5rem;
  border: 1px solid var(--border-color, #e0e0e0);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const LoadingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const RobotIcon = styled.div`
  font-size: 1.8rem;
  color: var(--primary-color, #d95550);
  margin-right: 0.75rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const LoadingTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text-color, #333);
  margin: 0;
`;

const LoadingMessage = styled.p`
  color: var(--text-secondary, #666);
  margin-bottom: 2rem;
`;

const LoadingSpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2.5rem;
`;

const LoadingSpinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(217, 85, 80, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #d95550);
  animation: spin 1.5s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary, #888);
  margin-bottom: 0.5rem;
`;

const TimerText = styled.div`
  font-size: 0.85rem;
  color: var(--primary-color, #d95550);
  font-weight: 500;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;

const BenefitSection = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: var(--bg-secondary, #f9f9f9);
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  min-height: 150px;
  opacity: ${props => props.fadeState === 'in' ? 1 : 0};
  transition: opacity 0.5s ease;
`;

const BenefitIcon = styled.div`
  font-size: 2rem;
  color: var(--primary-color, #d95550);
  margin-right: 1rem;
  padding-top: 0.25rem;
`;

const BenefitContent = styled.div`
  text-align: left;
  flex: 1;
`;

const BenefitTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--text-color, #333);
  font-size: 1.2rem;
`;

const BenefitText = styled.p`
  color: var(--text-secondary, #666);
  line-height: 1.5;
  margin: 0;
`;

const BenefitIndicators = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const IndicatorDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--primary-color, #d95550)' : '#ddd'};
  margin: 0 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
`;

const TipsSection = styled.div`
  border-top: 1px solid var(--border-color, #eee);
  padding-top: 1.5rem;
`;

const TipItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  text-align: left;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TipIcon = styled.div`
  color: var(--primary-color, #d95550);
  margin-right: 0.75rem;
  font-size: 1rem;
`;

const TipText = styled.p`
  color: var(--text-secondary, #666);
  margin: 0;
  line-height: 1.4;
  font-size: 0.95rem;
`;

export default AILoadingScreen;
