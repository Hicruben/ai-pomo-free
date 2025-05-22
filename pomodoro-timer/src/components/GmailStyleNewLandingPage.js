import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaCheck, FaGoogle, FaBars, FaArrowRight } from 'react-icons/fa';

const GmailStyleNewLandingPage = () => {
  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <Logo>
            <LogoIcon>🍅</LogoIcon>
            <LogoText>AI Pomo</LogoText>
          </Logo>
        </HeaderLeft>
        <HeaderRight>
          <NavLinks>
            <NavLink href="#benefits">Benefits</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </NavLinks>
          <HeaderButtons>
            <SecondaryButton to="/login">Sign in</SecondaryButton>
            <PrimaryButton to="/register">Get started</PrimaryButton>
          </HeaderButtons>
          <MobileMenuButton>
            <FaBars />
          </MobileMenuButton>
        </HeaderRight>
      </Header>

      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Focus smarter, achieve more with AI
          </HeroTitle>
          <HeroDescription>
            AI Pomo supercharges the Pomodoro technique with artificial intelligence to eliminate planning friction, maximize focus, and transform how you achieve your goals.
          </HeroDescription>
          <CreateAccountSection>
            <CreateAccountTitle>Start free today</CreateAccountTitle>
            <AccountButtons>
              <PersonalButton to="/register">
                Personal
              </PersonalButton>
              <WorkButton to="/register">
                Business
              </WorkButton>
            </AccountButtons>
          </CreateAccountSection>
          <HeroNote>No credit card • Setup in 30 seconds</HeroNote>
        </HeroContent>
        <HeroImageContainer>
          <HeroImage src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="AI Pomo Dashboard" />
        </HeroImageContainer>
      </HeroSection>

      {/* Benefits Section */}
      <BenefitsSection id="benefits">
        <BenefitsSectionTitle>
          Five powerful tools to master your time
        </BenefitsSectionTitle>
        <BenefitsSectionSubtitle>
          Accomplish more with less stress and greater satisfaction
        </BenefitsSectionSubtitle>

        {/* Benefit 1: AI Project Generation */}
        <BenefitRow>
          <BenefitContent>
            <BenefitSubtitle>AI-Powered Project Generation</BenefitSubtitle>
            <BenefitDescription>
              Describe your idea in plain language, and AI instantly creates a complete project framework with milestones, tasks, and subtasks.
            </BenefitDescription>
            <BenefitValue>
              <BenefitValueTitle>Why it matters:</BenefitValueTitle>
              <BenefitValueText>
                Eliminates the "blank page" problem when starting new projects. Turn vague ideas into actionable plans in seconds, not hours—whether learning skills, planning trips, or tackling work projects.
              </BenefitValueText>
            </BenefitValue>
          </BenefitContent>
          <BenefitImageContainer>
            <BenefitImage src="https://placehold.co/600x400?text=AI+Project+Generation" alt="AI Project Generation" />
          </BenefitImageContainer>
        </BenefitRow>

        {/* Benefit 2: Pomodoro Integration */}
        <BenefitRow reverse>
          <BenefitContent>
            <BenefitTag>Core Feature</BenefitTag>
            <BenefitSubtitle>Seamless Pomodoro-Task Integration</BenefitSubtitle>
            <BenefitDescription>
              Every focus session links directly to specific tasks, tracking estimated vs. actual pomodoros <PomodoroIcon>🍅</PomodoroIcon> to quantify your progress.
            </BenefitDescription>
            <BenefitFeatures>
              <BenefitFeature>
                <BenefitFeatureIcon>✓</BenefitFeatureIcon>
                <BenefitFeatureText>Track estimated vs. actual pomodoros</BenefitFeatureText>
              </BenefitFeature>
              <BenefitFeature>
                <BenefitFeatureIcon>✓</BenefitFeatureIcon>
                <BenefitFeatureText>Link sessions to specific tasks</BenefitFeatureText>
              </BenefitFeature>
              <BenefitFeature>
                <BenefitFeatureIcon>✓</BenefitFeatureIcon>
                <BenefitFeatureText>Visualize productivity patterns</BenefitFeatureText>
              </BenefitFeature>
            </BenefitFeatures>
            <BenefitValue>
              <BenefitValueTitle>Why it matters:</BenefitValueTitle>
              <BenefitValueText>
                See exactly how your time translates to results. This direct connection between effort and outcomes creates a powerful feedback loop that drives productivity and satisfaction.
              </BenefitValueText>
            </BenefitValue>
          </BenefitContent>
          <BenefitImageContainer>
            <BenefitImage src="https://placehold.co/600x400?text=Pomodoro+Integration" alt="Pomodoro Integration" />
            <BenefitImageOverlay />
            <BenefitImageBadge>
              <BenefitImageBadgeIcon>🍅</BenefitImageBadgeIcon>
              <BenefitImageBadgeText>Focus Tracker</BenefitImageBadgeText>
            </BenefitImageBadge>
          </BenefitImageContainer>
        </BenefitRow>

        {/* Benefit 3: Comprehensive Statistics */}
        <BenefitRow>
          <BenefitContent>
            <BenefitSubtitle>Visual Progress & Insights</BenefitSubtitle>
            <BenefitDescription>
              Track your productivity with intuitive charts showing daily, weekly and monthly patterns, completion rates, and calendar-based milestone visualization.
            </BenefitDescription>
            <BenefitValue>
              <BenefitValueTitle>Why it matters:</BenefitValueTitle>
              <BenefitValueText>
                Data-driven motivation that works. See your progress unfold visually, identify your most productive patterns, and experience the satisfaction of watching your consistency build over time.
              </BenefitValueText>
            </BenefitValue>
          </BenefitContent>
          <BenefitImageContainer>
            <BenefitImage src="https://placehold.co/600x400?text=Comprehensive+Statistics" alt="Comprehensive Statistics" />
          </BenefitImageContainer>
        </BenefitRow>

        {/* Benefit 4: Structured Project Management */}
        <BenefitRow reverse>
          <BenefitContent>
            <BenefitSubtitle>Structured Project Framework</BenefitSubtitle>
            <BenefitDescription>
              Organize your life with a professional project system—track status, deadlines, milestones, and notes in one place. Free plan includes 3 concurrent projects.
            </BenefitDescription>
            <BenefitValue>
              <BenefitValueTitle>Why it matters:</BenefitValueTitle>
              <BenefitValueText>
                Elevate personal goals to professional-grade projects. Whether learning skills, planning travel, or managing work, this structured approach transforms vague intentions into achievable outcomes.
              </BenefitValueText>
            </BenefitValue>
          </BenefitContent>
          <BenefitImageContainer>
            <BenefitImage src="https://placehold.co/600x400?text=Project+Management" alt="Project Management" />
          </BenefitImageContainer>
        </BenefitRow>

        {/* Benefit 5: Single-Task Focus */}
        <BenefitRow>
          <BenefitContent>
            <BenefitSubtitle>Single-Task Focus System</BenefitSubtitle>
            <BenefitDescription>
              Built-in guardrails that enforce deep work—one task at a time, with intentional task-switching and clear consequences for interrupted sessions.
            </BenefitDescription>
            <BenefitValue>
              <BenefitValueTitle>Why it matters:</BenefitValueTitle>
              <BenefitValueText>
                Defeat distraction by design. In a world pulling your attention in every direction, this system trains your brain to focus deeply, creating the conditions for flow state and meaningful progress.
              </BenefitValueText>
            </BenefitValue>
          </BenefitContent>
          <BenefitImageContainer>
            <BenefitImage src="https://placehold.co/600x400?text=Single-Task+Focus" alt="Single-Task Focus" />
          </BenefitImageContainer>
        </BenefitRow>
      </BenefitsSection>

      {/* CTA Section */}
      <CtaSection>
        <CtaTitle>Ready to work smarter, not harder?</CtaTitle>
        <CtaSubtitle>Join the productivity revolution with AI-powered focus.</CtaSubtitle>
        <CtaFeatures>
          <CtaFeatureItem>
            <CtaFeatureIcon>✓</CtaFeatureIcon>
            <CtaFeatureText>Powerful free plan</CtaFeatureText>
          </CtaFeatureItem>
          <CtaFeatureItem>
            <CtaFeatureIcon>✓</CtaFeatureIcon>
            <CtaFeatureText>No credit card</CtaFeatureText>
          </CtaFeatureItem>
          <CtaFeatureItem>
            <CtaFeatureIcon>✓</CtaFeatureIcon>
            <CtaFeatureText>Instant setup</CtaFeatureText>
          </CtaFeatureItem>
        </CtaFeatures>
        <CreateAccountSection>
          <CreateAccountTitle>Start free today</CreateAccountTitle>
          <AccountButtons>
            <PersonalButton to="/register">
              Personal
            </PersonalButton>
            <WorkButton to="/register">
              Business
            </WorkButton>
          </AccountButtons>
        </CreateAccountSection>
      </CtaSection>

      {/* Footer */}
      <Footer>
        <FooterLogo>
          <LogoIcon>🍅</LogoIcon>
          <LogoText>AI Pomo</LogoText>
        </FooterLogo>
        <FooterLinks>
          <FooterLink href="#privacy">Privacy</FooterLink>
          <FooterLink href="#terms">Terms</FooterLink>
          <FooterLink href="#about">About</FooterLink>
          <FooterLink href="#contact">Contact</FooterLink>
        </FooterLinks>
        <FooterCopyright>© {new Date().getFullYear()} AI Pomo. All rights reserved.</FooterCopyright>
      </Footer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  font-family: 'Google Sans', 'Roboto', Arial, sans-serif;
  color: #202124;
  line-height: 1.5;
  background-color: #ffffff;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 500;
  color: #5f6368;
  cursor: pointer;
`;

const LogoIcon = styled.span`
  font-size: 1.8rem;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  color: #5f6368;
  font-weight: 500;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: #5f6368;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    color: #d95550;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const PrimaryButton = styled(Link)`
  background-color: #d95550;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c04540;
  }
`;

const SecondaryButton = styled(Link)`
  background-color: transparent;
  color: #5f6368;
  border: 1px solid #dadce0;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #5f6368;
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HeroSection = styled.section`
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem;

  @media (max-width: 992px) {
    flex-direction: column;
    padding: 3rem 1rem;
    text-align: center;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  padding-right: 2rem;

  @media (max-width: 992px) {
    padding-right: 0;
    margin-bottom: 3rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 400;
  color: #202124;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroDescription = styled.p`
  font-size: 1.25rem;
  color: #5f6368;
  margin-bottom: 2rem;
  max-width: 600px;

  @media (max-width: 992px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroNote = styled.p`
  font-size: 0.875rem;
  color: #5f6368;
  margin-top: 1rem;
`;

const CreateAccountSection = styled.div`
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;

  &:before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(217, 85, 80, 0.05) 0%, rgba(217, 85, 80, 0) 70%);
    border-radius: 50%;
    z-index: -1;
  }
`;

const CreateAccountTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, rgba(217, 85, 80, 0.3), transparent);
  }
`;

const AccountButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
`;

const PersonalButton = styled(Link)`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(217, 85, 80, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(217, 85, 80, 0.4);
    background: linear-gradient(135deg, #c04540 0%, #d95550 100%);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(217, 85, 80, 0.3);
  }
`;

const WorkButton = styled(Link)`
  background-color: white;
  color: #d95550;
  border: 2px solid rgba(217, 85, 80, 0.2);
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    background-color: rgba(217, 85, 80, 0.05);
    border-color: #d95550;
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }
`;

const HeroImageContainer = styled.div`
  flex: 1;

  @media (max-width: 992px) {
    width: 100%;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
`;

const BenefitsSection = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem;

  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const BenefitsSectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 400;
  color: #202124;
  margin-bottom: 1rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const BenefitsSectionSubtitle = styled.p`
  font-size: 1.25rem;
  color: #5f6368;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`;

const BenefitRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 7rem;
  flex-direction: ${props => props.reverse ? 'row-reverse' : 'row'};
  position: relative;
  z-index: 1;

  &:after {
    content: '';
    position: absolute;
    bottom: -3.5rem;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(217, 85, 80, 0.2), transparent);
    z-index: -1;
  }

  &:last-child:after {
    display: none;
  }

  @media (max-width: 992px) {
    flex-direction: column;
    margin-bottom: 5rem;
  }
`;

const BenefitContent = styled.div`
  flex: 1;
  padding: ${props => props.reverse ? '0 0 0 3rem' : '0 3rem 0 0'};
  position: relative;

  @media (max-width: 992px) {
    padding: 0;
    margin-bottom: 2rem;
    text-align: center;
  }
`;

const BenefitTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: #d95550;
  margin-bottom: 0.5rem;
`;

const BenefitSubtitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    width: 3rem;
    height: 3px;
    background: linear-gradient(to right, #d95550, #eb6b56);
    border-radius: 2px;
  }

  @media (max-width: 992px) {
    &:after {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

const BenefitDescription = styled.p`
  font-size: 1.1rem;
  color: #5f6368;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const BenefitValue = styled.div`
  background: linear-gradient(to bottom right, #f8f9fa, #ffffff);
  padding: 1.8rem;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(217, 85, 80, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  }
`;

const BenefitValueTitle = styled.h5`
  font-size: 1.1rem;
  font-weight: 600;
  color: #d95550;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;

  &:before {
    content: '★';
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
`;

const BenefitValueText = styled.p`
  font-size: 1.05rem;
  color: #5f6368;
  line-height: 1.7;
`;

const BenefitImageContainer = styled.div`
  flex: 1;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: linear-gradient(135deg, rgba(217, 85, 80, 0.05) 0%, rgba(235, 107, 86, 0.05) 100%);
    border-radius: 12px;
    z-index: -1;
  }

  @media (max-width: 992px) {
    width: 100%;
  }
`;

const BenefitTag = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PomodoroIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin: 0 0.2rem;
  position: relative;
  top: 2px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const BenefitFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
`;

const BenefitFeature = styled.div`
  display: flex;
  align-items: center;
`;

const BenefitFeatureIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background-color: rgba(217, 85, 80, 0.1);
  color: #d95550;
  border-radius: 50%;
  margin-right: 0.8rem;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const BenefitFeatureText = styled.span`
  font-size: 1rem;
  color: #5f6368;
`;

const BenefitImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
  position: relative;
  z-index: 1;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const BenefitImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(217, 85, 80, 0.05) 0%, rgba(235, 107, 86, 0.1) 100%);
  border-radius: 12px;
  z-index: 2;
  pointer-events: none;
`;

const BenefitImageBadge = styled.div`
  position: absolute;
  bottom: -15px;
  right: 30px;
  background: white;
  border-radius: 30px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 3;
  border: 1px solid rgba(217, 85, 80, 0.1);
`;

const BenefitImageBadgeIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const BenefitImageBadgeText = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #202124;
`;

const CtaSection = styled.section`
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  padding: 8rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;

  &:before {
    content: '🍅';
    position: absolute;
    font-size: 15rem;
    opacity: 0.03;
    top: -2rem;
    left: -2rem;
    transform: rotate(-15deg);
  }

  &:after {
    content: '⏱️';
    position: absolute;
    font-size: 12rem;
    opacity: 0.03;
    bottom: -2rem;
    right: 5rem;
    transform: rotate(10deg);
  }

  @media (max-width: 768px) {
    padding: 5rem 1rem;
  }
`;

const CtaTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 700;
  color: #202124;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.8rem;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(to right, #d95550, #eb6b56);
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    font-size: 2.8rem;
  }
`;

const CtaSubtitle = styled.p`
  font-size: 1.4rem;
  color: #5f6368;
  margin-bottom: 3rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
`;

const CtaFeatures = styled.div`
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 3.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.2rem;
    align-items: center;
    margin-bottom: 2.5rem;
  }
`;

const CtaFeatureItem = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
`;

const CtaFeatureIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border-radius: 50%;
  margin-right: 0.8rem;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const CtaFeatureText = styled.span`
  color: #202124;
  font-size: 1rem;
  font-weight: 500;
`;

const Footer = styled.footer`
  background-color: #f8f9fa;
  padding: 2rem;
  text-align: center;
  border-top: 1px solid #dadce0;
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 1.5rem;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;

  @media (max-width: 576px) {
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const FooterLink = styled.a`
  color: #5f6368;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    color: #d95550;
  }
`;

const FooterCopyright = styled.p`
  font-size: 0.875rem;
  color: #5f6368;
`;

export default GmailStyleNewLandingPage;
