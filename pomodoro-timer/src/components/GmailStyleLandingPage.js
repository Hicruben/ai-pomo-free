import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaCheck, FaClock, FaChartBar, FaRobot, FaArrowRight, FaBars, FaGoogle } from 'react-icons/fa';

const GmailStyleLandingPage = () => {
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
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#support">Support</NavLink>
          </NavLinks>
          <HeaderButtons>
            <SecondaryButton to="/login">Sign in</SecondaryButton>
            <PrimaryButton to="/signup">Get started for free</PrimaryButton>
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
            Focus better with AI-powered time management
          </HeroTitle>
          <HeroDescription>
            AI Pomo combines the proven Pomodoro technique with artificial intelligence to help you manage your time, track your progress, and achieve your goals.
          </HeroDescription>
          <HeroButtons>
            <PrimaryButton to="/signup">Get started for free</PrimaryButton>
            <WorkspaceButton>
              <GoogleIcon><FaGoogle /></GoogleIcon>
              Sign up with Google
            </WorkspaceButton>
          </HeroButtons>
          <HeroNote>No credit card required</HeroNote>
        </HeroContent>
        <HeroImageContainer>
          <HeroImage src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="AI Pomo Dashboard" />
        </HeroImageContainer>
      </HeroSection>

      {/* Features Section */}
      <SectionTitle id="features">
        <SectionTitleText>Everything you need to master your time</SectionTitleText>
        <SectionSubtitle>AI Pomo helps you stay focused and accomplish more with less stress</SectionSubtitle>
      </SectionTitle>

      <FeaturesSection>
        <FeatureCard>
          <FeatureIcon><FaClock /></FeatureIcon>
          <FeatureContent>
            <FeatureTitle>Pomodoro Timer</FeatureTitle>
            <FeatureDescription>
              Work in focused 25-minute sessions with short breaks to maintain peak productivity and avoid burnout.
            </FeatureDescription>
          </FeatureContent>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon><FaChartBar /></FeatureIcon>
          <FeatureContent>
            <FeatureTitle>Productivity Analytics</FeatureTitle>
            <FeatureDescription>
              Track your progress with detailed statistics and insights to optimize your productivity patterns.
            </FeatureDescription>
          </FeatureContent>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon><FaRobot /></FeatureIcon>
          <FeatureContent>
            <FeatureTitle>AI Project Generator</FeatureTitle>
            <FeatureDescription>
              Let AI help you structure your projects with tasks, milestones, and deadlines for optimal organization.
            </FeatureDescription>
          </FeatureContent>
        </FeatureCard>
      </FeaturesSection>

      {/* Business Section */}
      <BusinessSection>
        <BusinessContent>
          <BusinessTitle>AI Pomo for Business</BusinessTitle>
          <BusinessDescription>
            Boost your team's productivity with AI Pomo's collaborative features. Track team progress, manage projects together, and achieve your goals faster.
          </BusinessDescription>
          <BusinessFeatures>
            <BusinessFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Team analytics dashboard
            </BusinessFeature>
            <BusinessFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Shared project management
            </BusinessFeature>
            <BusinessFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Priority support
            </BusinessFeature>
          </BusinessFeatures>
          <BusinessButton>Contact sales</BusinessButton>
        </BusinessContent>
        <BusinessImageContainer>
          <BusinessImage src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Team Collaboration" />
        </BusinessImageContainer>
      </BusinessSection>

      {/* Pricing Section */}
      <SectionTitle id="pricing">
        <SectionTitleText>Choose the plan that works for you</SectionTitleText>
        <SectionSubtitle>All plans include a free trial to get you started</SectionSubtitle>
      </SectionTitle>

      <PricingSection>
        <PricingCard>
          <PricingHeader>
            <PricingTitle>Free</PricingTitle>
            <PricingPrice>$0</PricingPrice>
            <PricingPeriod>forever</PricingPeriod>
          </PricingHeader>
          <PricingFeatures>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Up to 3 active projects
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Basic Pomodoro timer
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Limited analytics
            </PricingFeature>
          </PricingFeatures>
          <PricingButton to="/signup">Get started</PricingButton>
        </PricingCard>

        <PricingCard featured>
          <PricingHeader>
            <PricingTitle>Premium</PricingTitle>
            <PricingPrice>$5</PricingPrice>
            <PricingPeriod>per month</PricingPeriod>
          </PricingHeader>
          <PricingFeatures>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Unlimited projects
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Advanced Pomodoro customization
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Full analytics dashboard
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              AI project generation
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Priority support
            </PricingFeature>
          </PricingFeatures>
          <PricingButton to="/signup" featured>Try Premium</PricingButton>
        </PricingCard>

        <PricingCard>
          <PricingHeader>
            <PricingTitle>Business</PricingTitle>
            <PricingPrice>$12</PricingPrice>
            <PricingPeriod>per user/month</PricingPeriod>
          </PricingHeader>
          <PricingFeatures>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              All Premium features
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Team collaboration
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Admin controls
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              Team analytics
            </PricingFeature>
            <PricingFeature>
              <FeatureCheck><FaCheck /></FeatureCheck>
              24/7 support
            </PricingFeature>
          </PricingFeatures>
          <PricingButton to="/contact">Contact sales</PricingButton>
        </PricingCard>
      </PricingSection>

      {/* Footer */}
      <Footer>
        <FooterTop>
          <FooterColumn>
            <FooterLogo>
              <LogoIcon>🍅</LogoIcon>
              <LogoText>AI Pomo</LogoText>
            </FooterLogo>
          </FooterColumn>
          <FooterColumn>
            <FooterTitle>Product</FooterTitle>
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#pricing">Pricing</FooterLink>
            <FooterLink href="#security">Security</FooterLink>
          </FooterColumn>
          <FooterColumn>
            <FooterTitle>Resources</FooterTitle>
            <FooterLink href="#blog">Blog</FooterLink>
            <FooterLink href="#help">Help Center</FooterLink>
            <FooterLink href="#tutorials">Tutorials</FooterLink>
          </FooterColumn>
          <FooterColumn>
            <FooterTitle>Company</FooterTitle>
            <FooterLink href="#about">About</FooterLink>
            <FooterLink href="#contact">Contact</FooterLink>
            <FooterLink href="#careers">Careers</FooterLink>
          </FooterColumn>
        </FooterTop>
        <FooterBottom>
          <FooterCopyright>© {new Date().getFullYear()} AI Pomo. All rights reserved.</FooterCopyright>
          <FooterLinks>
            <FooterLink href="#terms">Terms</FooterLink>
            <FooterLink href="#privacy">Privacy</FooterLink>
            <FooterLink href="#cookies">Cookies</FooterLink>
          </FooterLinks>
        </FooterBottom>
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
    color: #1a73e8;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
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

const PrimaryButton = styled(Link)`
  background-color: #1a73e8;
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
    background-color: #1765cc;
  }
`;

const SecondaryButton = styled(Link)`
  background-color: transparent;
  color: #1a73e8;
  border: 1px solid #dadce0;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(26, 115, 232, 0.04);
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

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
  }
`;

const WorkspaceButton = styled.button`
  display: flex;
  align-items: center;
  background-color: white;
  color: #5f6368;
  border: 1px solid #dadce0;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const GoogleIcon = styled.span`
  color: #1a73e8;
  margin-right: 0.5rem;
  font-size: 1rem;
`;

const HeroNote = styled.p`
  font-size: 0.875rem;
  color: #5f6368;
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

const SectionTitle = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 0 auto 4rem;
  padding: 0 2rem;

  @media (max-width: 768px) {
    margin-bottom: 3rem;
    padding: 0 1rem;
  }
`;

const SectionTitleText = styled.h2`
  font-size: 2.5rem;
  font-weight: 400;
  color: #202124;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1.25rem;
  color: #5f6368;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto 6rem;
  padding: 0 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    margin-bottom: 4rem;
  }
`;

const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  color: #1a73e8;
  margin-bottom: 1.5rem;
`;

const FeatureContent = styled.div``;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  color: #5f6368;
  line-height: 1.6;
`;

const BusinessSection = styled.section`
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto 6rem;
  padding: 0 2rem;

  @media (max-width: 992px) {
    flex-direction: column-reverse;
    padding: 0 1rem;
    margin-bottom: 4rem;
  }
`;

const BusinessContent = styled.div`
  flex: 1;
  padding-right: 2rem;

  @media (max-width: 992px) {
    padding-right: 0;
    text-align: center;
  }
`;

const BusinessTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 400;
  color: #202124;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const BusinessDescription = styled.p`
  font-size: 1.25rem;
  color: #5f6368;
  margin-bottom: 2rem;
  max-width: 600px;

  @media (max-width: 992px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const BusinessFeatures = styled.div`
  margin-bottom: 2rem;
`;

const BusinessFeature = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #5f6368;

  @media (max-width: 992px) {
    justify-content: center;
  }
`;

const FeatureCheck = styled.span`
  color: #1a73e8;
  margin-right: 0.75rem;
`;

const BusinessButton = styled.button`
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1765cc;
  }
`;

const BusinessImageContainer = styled.div`
  flex: 1;

  @media (max-width: 992px) {
    width: 100%;
    margin-bottom: 3rem;
  }
`;

const BusinessImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
`;

const PricingSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto 6rem;
  padding: 0 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    margin-bottom: 4rem;
  }
`;

const PricingCard = styled.div`
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 2rem;
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: white;
  position: relative;

  ${props => props.featured && `
    border-color: #1a73e8;
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);

    &:before {
      content: 'Most Popular';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #1a73e8;
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  `}

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  }
`;

const PricingHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #dadce0;
`;

const PricingTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1rem;
`;

const PricingPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 400;
  color: #202124;
  margin-bottom: 0.5rem;
`;

const PricingPeriod = styled.div`
  font-size: 0.875rem;
  color: #5f6368;
`;

const PricingFeatures = styled.div`
  margin-bottom: 2rem;
`;

const PricingFeature = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #5f6368;
`;

const PricingButton = styled(Link)`
  display: block;
  width: 100%;
  text-align: center;
  background-color: ${props => props.featured ? '#1a73e8' : 'white'};
  color: ${props => props.featured ? 'white' : '#1a73e8'};
  border: 1px solid ${props => props.featured ? '#1a73e8' : '#dadce0'};
  padding: 0.75rem 0;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.featured ? '#1765cc' : 'rgba(26, 115, 232, 0.04)'};
  }
`;

const Footer = styled.footer`
  background-color: #f8f9fa;
  padding: 4rem 2rem 2rem;

  @media (max-width: 768px) {
    padding: 3rem 1rem 2rem;
  }
`;

const FooterTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto 3rem;

  @media (max-width: 768px) {
    gap: 2rem;
  }
`;

const FooterColumn = styled.div`
  min-width: 160px;

  @media (max-width: 576px) {
    min-width: 45%;
  }
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 1rem;
`;

const FooterTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1.5rem;
`;

const FooterLink = styled.a`
  display: block;
  color: #5f6368;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  &:hover {
    color: #1a73e8;
  }
`;

const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid #dadce0;

  @media (max-width: 576px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const FooterCopyright = styled.div`
  font-size: 0.75rem;
  color: #5f6368;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

export default GmailStyleLandingPage;
