import React from 'react';
import styled from 'styled-components';
import StandalonePomodoroTest from '../components/StandalonePomodoroTest';

const TestPomodoroPage = () => {
  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <Title>AI Pomo - Pomodoro Insertion Test</Title>
          <BackButton onClick={() => window.location.href = '/'}>
            Back to App
          </BackButton>
        </HeaderContent>
      </Header>
      
      <MainContent>
        <StandalonePomodoroTest />
      </MainContent>
      
      <Footer>
        <FooterText>
          AI Pomo - Testing Tools
        </FooterText>
      </Footer>
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #d95550;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const BackButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Footer = styled.footer`
  background-color: #333;
  color: #aaa;
  padding: 1rem 0;
  text-align: center;
`;

const FooterText = styled.p`
  margin: 0;
  font-size: 0.9rem;
`;

export default TestPomodoroPage;
