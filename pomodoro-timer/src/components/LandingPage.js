import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <LandingContainer>
      <BackgroundGradient />
      <BackgroundCircle style={{ top: '10%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(217, 85, 80, 0.1) 0%, rgba(217, 85, 80, 0) 70%)' }} />
      <BackgroundCircle style={{ top: '60%', left: '8%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(69, 124, 163, 0.08) 0%, rgba(69, 124, 163, 0) 70%)' }} />
      <BackgroundCircle style={{ bottom: '15%', right: '15%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(235, 107, 86, 0.05) 0%, rgba(235, 107, 86, 0) 70%)' }} />

      <Header>
        <HeaderContainer>
          <Logo to="/app">
            <LogoIcon>🍅</LogoIcon>
            <LogoText>AI Pomo</LogoText>
          </Logo>
          <NavLinks>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#testimonials">Testimonials</NavLink>
          </NavLinks>
          <GetStartedButton to="/app">
            Get Started
            <ButtonArrow>→</ButtonArrow>
          </GetStartedButton>
        </HeaderContainer>
      </Header>

      <HeroSection>
        <HeroContent isVisible={isVisible}>
          <HeroTextContainer>
            <HeroEyebrow>AI-Powered Productivity</HeroEyebrow>
            <HeroTagline>Focus Better.<HighlightSpan> Achieve More.</HighlightSpan></HeroTagline>
            <HeroTitle>
              Revolutionize Your <HighlightText>Productivity</HighlightText> with AI-Enhanced Pomodoro Timer
            </HeroTitle>
            <HeroDescription>
              AI Pomo combines the proven Pomodoro technique with AI-powered task management to help you focus, track progress, and achieve your goals efficiently.
            </HeroDescription>
            <HeroButtons>
              <PrimaryButton to="/app">
                Start For Free
                <ButtonArrow>→</ButtonArrow>
              </PrimaryButton>
              <SecondaryButton href="#features">Learn More</SecondaryButton>
            </HeroButtons>
            <HeroBadges>
              <HeroBadge>
                <BadgeIcon>⚡</BadgeIcon> Boost productivity by up to 25%
              </HeroBadge>
              <HeroBadge>
                <BadgeIcon>🔒</BadgeIcon> Free forever plan available
              </HeroBadge>
            </HeroBadges>
          </HeroTextContainer>
          <HeroImageContainer>
            <HeroImageWrapper>
              <HeroImage src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="AI Pomo Dashboard" />
              <ImageOverlay />
              <FloatingElement style={{ top: '15%', right: '10%', animationDelay: '0.2s' }}>🍅</FloatingElement>
              <FloatingElement style={{ bottom: '20%', left: '5%', animationDelay: '0.5s' }}>⏱️</FloatingElement>
              <FloatingElement style={{ top: '60%', right: '15%', animationDelay: '0.8s' }}>✅</FloatingElement>
            </HeroImageWrapper>
            <ImageDecoration />
            <ImageDecoration style={{ bottom: '-20px', right: '-20px' }} />
          </HeroImageContainer>
        </HeroContent>
        <HeroStats>
          <StatItem>
            <StatNumber>10,000+</StatNumber>
            <StatLabel>Active Users</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatNumber>1M+</StatNumber>
            <StatLabel>Pomodoros Completed</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatNumber>4.9/5</StatNumber>
            <StatLabel>User Rating</StatLabel>
          </StatItem>
        </HeroStats>
      </HeroSection>

      <FeaturesSection id="features">
        <FeaturesSectionBackground />
        <SectionTitle>
          <SectionTitleAccent>Powerful Features</SectionTitleAccent>
          <h2>Everything You Need to <HighlightText>Master Your Time</HighlightText></h2>
          <SectionDescription>
            Discover how AI Pomo can transform your productivity and help you accomplish more with less stress.
          </SectionDescription>
        </SectionTitle>

        <FeaturesContainer>
          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>🍅</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>Customizable Pomodoro Timer</FeatureTitle>
              <FeatureDescription>
                Personalize your work sessions, short breaks, and long breaks to match your optimal focus rhythm. Default 25-minute work sessions with 5-minute breaks help maintain peak productivity.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>Customize session lengths to match your workflow</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>🤖</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>AI-Powered Task Management</FeatureTitle>
              <FeatureDescription>
                Our intelligent system helps you break down complex projects into manageable tasks, estimate effort, and track progress with precision.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>Smart task estimation and organization</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>📊</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>Comprehensive Calendar</FeatureTitle>
              <FeatureDescription>
                Visualize your productivity with our calendar feature showing milestones, deadlines, and completed pomodoros. Easily track your progress over time.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>Visual productivity tracking and insights</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>📱</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>Cross-Device Synchronization</FeatureTitle>
              <FeatureDescription>
                Access your projects, tasks, and timer from any device with our cloud-based synchronization. Your data is always up-to-date and secure.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>Seamless experience across all your devices</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>📝</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>Project Organization</FeatureTitle>
              <FeatureDescription>
                Organize your work with our GTD-inspired project management system. Create projects with tasks, milestones, and notes to keep everything in one place.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>GTD-inspired workflow management</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard>
            <FeatureIconContainer>
              <FeatureIcon>📈</FeatureIcon>
              <FeatureIconRing />
            </FeatureIconContainer>
            <FeatureContent>
              <FeatureTitle>Productivity Analytics</FeatureTitle>
              <FeatureDescription>
                Gain insights into your work patterns with detailed statistics and visualizations. Identify your most productive times and optimize your schedule.
              </FeatureDescription>
              <FeatureHighlight>
                <FeatureHighlightText>Data-driven productivity optimization</FeatureHighlightText>
              </FeatureHighlight>
            </FeatureContent>
          </FeatureCard>
        </FeaturesContainer>
      </FeaturesSection>

      <HowItWorksSection id="how-it-works">
        <HowItWorksBg />
        <SectionTitle>
          <SectionTitleAccent>Simple Process</SectionTitleAccent>
          <h2>How <HighlightText>AI Pomo</HighlightText> Works</h2>
          <SectionDescription>
            Our approach combines the time-tested Pomodoro Technique with modern AI to supercharge your productivity.
          </SectionDescription>
        </SectionTitle>

        <StepsContainer>
          <Step>
            <StepNumberContainer>
              <StepNumber>1</StepNumber>
            </StepNumberContainer>
            <StepContent>
              <StepTitle>Plan Your Tasks</StepTitle>
              <StepDescription>
                Create projects and break them down into manageable tasks. Estimate the number of pomodoros needed for each task.
              </StepDescription>
              <StepIcon>📋</StepIcon>
            </StepContent>
            <StepConnector />
          </Step>

          <Step>
            <StepNumberContainer>
              <StepNumber>2</StepNumber>
            </StepNumberContainer>
            <StepContent>
              <StepTitle>Focus with Pomodoro</StepTitle>
              <StepDescription>
                Work in focused 25-minute sessions, followed by short breaks. AI Pomo tracks your progress automatically.
              </StepDescription>
              <StepIcon>⏱️</StepIcon>
            </StepContent>
            <StepConnector />
          </Step>

          <Step>
            <StepNumberContainer>
              <StepNumber>3</StepNumber>
            </StepNumberContainer>
            <StepContent>
              <StepTitle>Track & Analyze</StepTitle>
              <StepDescription>
                Review your productivity patterns and achievements. Adjust your approach based on AI-powered insights.
              </StepDescription>
              <StepIcon>📊</StepIcon>
            </StepContent>
            <StepConnector />
          </Step>

          <Step>
            <StepNumberContainer>
              <StepNumber>4</StepNumber>
            </StepNumberContainer>
            <StepContent>
              <StepTitle>Achieve Your Goals</StepTitle>
              <StepDescription>
                Complete projects on time with less stress and better focus. Celebrate your productivity milestones!
              </StepDescription>
              <StepIcon>🏆</StepIcon>
            </StepContent>
          </Step>
        </StepsContainer>

        <ProcessImage src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80" alt="Productivity workflow" />
      </HowItWorksSection>

      <TestimonialsSection id="testimonials">
        <TestimonialsBg />
        <SectionTitle>
          <SectionTitleAccent>User Stories</SectionTitleAccent>
          <h2>What Our <HighlightText>Users Say</HighlightText></h2>
          <SectionDescription>
            Join thousands of professionals who have transformed their productivity with AI Pomo.
          </SectionDescription>
        </SectionTitle>

        <TestimonialsContainer>
          <TestimonialCard>
            <TestimonialQuoteMark>"</TestimonialQuoteMark>
            <TestimonialQuote>AI Pomo has completely changed how I manage my workday. The combination of Pomodoro timing with project management is genius!</TestimonialQuote>
            <TestimonialRating>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
            </TestimonialRating>
            <TestimonialAuthor>
              <TestimonialAvatar>
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Johnson" />
              </TestimonialAvatar>
              <TestimonialInfo>
                <TestimonialName>Sarah Johnson</TestimonialName>
                <TestimonialRole>Marketing Director</TestimonialRole>
              </TestimonialInfo>
            </TestimonialAuthor>
          </TestimonialCard>

          <TestimonialCard>
            <TestimonialQuoteMark>"</TestimonialQuoteMark>
            <TestimonialQuote>As a developer, I need to stay focused for long periods. AI Pomo helps me maintain concentration while avoiding burnout.</TestimonialQuote>
            <TestimonialRating>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
            </TestimonialRating>
            <TestimonialAuthor>
              <TestimonialAvatar>
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="David Chen" />
              </TestimonialAvatar>
              <TestimonialInfo>
                <TestimonialName>David Chen</TestimonialName>
                <TestimonialRole>Software Engineer</TestimonialRole>
              </TestimonialInfo>
            </TestimonialAuthor>
          </TestimonialCard>

          <TestimonialCard>
            <TestimonialQuoteMark>"</TestimonialQuoteMark>
            <TestimonialQuote>The calendar feature showing my completed pomodoros gives me a visual sense of accomplishment. I'm addicted to seeing those tomatoes fill up my days!</TestimonialQuote>
            <TestimonialRating>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
              <StarIcon>⭐</StarIcon>
            </TestimonialRating>
            <TestimonialAuthor>
              <TestimonialAvatar>
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Emma Rodriguez" />
              </TestimonialAvatar>
              <TestimonialInfo>
                <TestimonialName>Emma Rodriguez</TestimonialName>
                <TestimonialRole>Graduate Student</TestimonialRole>
              </TestimonialInfo>
            </TestimonialAuthor>
          </TestimonialCard>
        </TestimonialsContainer>

        <TestimonialCompanies>
          <TestimonialCompaniesTitle>Trusted by professionals from companies like:</TestimonialCompaniesTitle>
          <CompanyLogos>
            <CompanyLogo>Google</CompanyLogo>
            <CompanyLogo>Microsoft</CompanyLogo>
            <CompanyLogo>Apple</CompanyLogo>
            <CompanyLogo>Amazon</CompanyLogo>
            <CompanyLogo>Meta</CompanyLogo>
          </CompanyLogos>
        </TestimonialCompanies>
      </TestimonialsSection>

      <CtaSection>
        <CtaWave />
        <CtaContent>
          <CtaTitle>Ready to <HighlightText>Transform</HighlightText> Your Productivity?</CtaTitle>
          <CtaDescription>Join thousands of professionals who have discovered the power of AI-enhanced focus.</CtaDescription>
          <CtaFeatures>
            <CtaFeatureItem>
              <CtaFeatureIcon>✓</CtaFeatureIcon>
              <CtaFeatureText>Free forever plan available</CtaFeatureText>
            </CtaFeatureItem>
            <CtaFeatureItem>
              <CtaFeatureIcon>✓</CtaFeatureIcon>
              <CtaFeatureText>No credit card required</CtaFeatureText>
            </CtaFeatureItem>
            <CtaFeatureItem>
              <CtaFeatureIcon>✓</CtaFeatureIcon>
              <CtaFeatureText>Cancel anytime</CtaFeatureText>
            </CtaFeatureItem>
          </CtaFeatures>
          <CtaButton to="/app">
            Get Started For Free
            <ButtonArrow>→</ButtonArrow>
          </CtaButton>
        </CtaContent>
        <CtaDecoration />
      </CtaSection>

      <Footer>
        <FooterWave />
        <FooterContent>
          <FooterTop>
            <FooterBrand>
              <Logo to="/">
                <LogoIcon>🍅</LogoIcon>
                <LogoText>AI Pomo</LogoText>
              </Logo>
              <FooterTagline>Focus Better. Achieve More.</FooterTagline>
              <FooterDescription>
                AI Pomo is the ultimate productivity tool combining the Pomodoro technique with AI-powered task management to help you achieve more with less stress.
              </FooterDescription>
              <NewsletterForm>
                <NewsletterInput type="email" placeholder="Enter your email" />
                <NewsletterButton>Subscribe</NewsletterButton>
              </NewsletterForm>
            </FooterBrand>

            <FooterLinksContainer>
              <FooterLinkColumn>
                <FooterLinkTitle>Product</FooterLinkTitle>
                <FooterLink to="/features">Features</FooterLink>
                <FooterLink to="/pricing">Pricing</FooterLink>
                <FooterLink to="/roadmap">Roadmap</FooterLink>
                <FooterLink to="/changelog">Changelog</FooterLink>
              </FooterLinkColumn>

              <FooterLinkColumn>
                <FooterLinkTitle>Resources</FooterLinkTitle>
                <FooterLink to="/blog">Blog</FooterLink>
                <FooterLink to="/guides">Guides</FooterLink>
                <FooterLink to="/support">Support</FooterLink>
                <FooterLink to="/faq">FAQ</FooterLink>
              </FooterLinkColumn>

              <FooterLinkColumn>
                <FooterLinkTitle>Company</FooterLinkTitle>
                <FooterLink to="/about">About Us</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
                <FooterLink to="/careers">Careers</FooterLink>
                <FooterLink to="/press">Press Kit</FooterLink>
              </FooterLinkColumn>

              <FooterLinkColumn>
                <FooterLinkTitle>Legal</FooterLinkTitle>
                <FooterLink to="/privacy">Privacy Policy</FooterLink>
                <FooterLink to="/terms">Terms of Service</FooterLink>
                <FooterLink to="/cookies">Cookie Policy</FooterLink>
                <FooterLink to="/gdpr">GDPR</FooterLink>
              </FooterLinkColumn>
            </FooterLinksContainer>
          </FooterTop>

          <FooterBottom>
            <Copyright>
              &copy; {new Date().getFullYear()} AI Pomo. All rights reserved.
            </Copyright>
            <SocialLinks>
              <SocialLink href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <SocialIcon>𝕏</SocialIcon>
              </SocialLink>
              <SocialLink href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <SocialIcon>in</SocialIcon>
              </SocialLink>
              <SocialLink href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <SocialIcon>f</SocialIcon>
              </SocialLink>
              <SocialLink href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <SocialIcon>📷</SocialIcon>
              </SocialLink>
            </SocialLinks>
          </FooterBottom>
        </FooterContent>
      </Footer>
    </LandingContainer>
  );
};

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const fadeInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled components
const LandingContainer = styled.div`
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333333;
  background-color: #ffffff;
  overflow-x: hidden;
  position: relative;
`;

const BackgroundGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(217, 85, 80, 0.03) 0%, rgba(69, 124, 163, 0.03) 100%);
  z-index: -2;
`;

const BackgroundCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  z-index: -1;
`;

const Header = styled.header`
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #d95550;
  text-decoration: none;
  display: flex;
  align-items: center;
`;

const LogoIcon = styled.span`
  font-size: 1.8rem;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: #555;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;

  &:hover {
    color: #d95550;
  }
`;

const GetStartedButton = styled(Link)`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  box-shadow: 0 4px 10px rgba(217, 85, 80, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(217, 85, 80, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(217, 85, 80, 0.2);
  }
`;

const HeroSection = styled.section`
  padding: 8rem 2rem 5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle at 20% 30%, rgba(217, 85, 80, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(69, 124, 163, 0.05) 0%, transparent 50%);
  }

  @media (max-width: 768px) {
    padding: 7rem 1rem 3rem;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 4rem;
  position: relative;
  z-index: 1;

  ${props => props.isVisible && css`
    & > * {
      animation: ${fadeIn} 0.8s ease-out forwards;
    }

    & > *:first-child {
      animation: ${fadeInLeft} 0.8s ease-out forwards;
    }

    & > *:last-child {
      animation: ${fadeInRight} 0.8s ease-out forwards;
    }
  `}

  @media (max-width: 992px) {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
`;

const HeroTextContainer = styled.div`
  flex: 1;
  animation: ${fadeIn} 1s ease-out;

  @media (max-width: 992px) {
    max-width: 600px;
  }
`;

const HeroEyebrow = styled.div`
  color: #d95550;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const HeroTagline = styled.div`
  color: #333;
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
`;

const HighlightSpan = styled.span`
  color: #d95550;
`;

const HighlightText = styled.span`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: inherit;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: #333333;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroDescription = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2.5rem;
  color: #555;
  max-width: 600px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 992px) {
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PrimaryButton = styled(Link)`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 5px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  box-shadow: 0 4px 10px rgba(217, 85, 80, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(217, 85, 80, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(217, 85, 80, 0.2);
  }
`;

const SecondaryButton = styled.a`
  background: transparent;
  color: #333;
  border: 2px solid #d95550;
  padding: 1rem 2rem;
  border-radius: 5px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;

  &:hover {
    background-color: rgba(217, 85, 80, 0.05);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const HeroBadges = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 992px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: rgba(217, 85, 80, 0.1);
  color: #d95550;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;

  @media (max-width: 992px) {
    margin: 0 auto;
  }
`;

const BadgeIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1.2rem;
`;

const HeroImageContainer = styled.div`
  flex: 1;
  position: relative;
  height: 400px;

  @media (max-width: 992px) {
    width: 100%;
    max-width: 500px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }
`;

const HeroImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
  transition: all 0.5s ease;

  &:hover {
    transform: perspective(1000px) rotateY(0) rotateX(0);
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  transition: transform 0.5s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(217, 85, 80, 0.2) 0%, rgba(69, 124, 163, 0.2) 100%);
  border-radius: 10px;
`;

const ImageDecoration = styled.div`
  position: absolute;
  top: -20px;
  left: -20px;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  z-index: -1;
  opacity: 0.8;
`;

const FloatingElement = styled.div`
  position: absolute;
  font-size: 2.5rem;
  animation: ${float} 3s ease-in-out infinite;
  z-index: 2;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
`;

const HeroStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #d95550;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background-color: #eee;

  @media (max-width: 768px) {
    width: 80px;
    height: 1px;
  }
`;

const ButtonArrow = styled.span`
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
  display: inline-block;

  ${props => props.parent}:hover & {
    transform: translateX(5px);
  }
`;

const FeaturesSection = styled.section`
  padding: 8rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 6rem 1rem;
  }
`;

const FeaturesSectionBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(217, 85, 80, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(69, 124, 163, 0.03) 0%, transparent 50%);
  z-index: -1;
`;

const SectionTitle = styled.div`
  text-align: center;
  margin-bottom: 4rem;

  h2 {
    font-size: 2.8rem;
    margin-bottom: 1rem;
    color: #333333;
    font-weight: 800;
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 2.2rem;
    }
  }
`;

const SectionTitleAccent = styled.div`
  color: #d95550;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: inline-block;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 2px;
    background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  }
`;

const SectionDescription = styled.p`
  font-size: 1.2rem;
  max-width: 700px;
  margin: 1.5rem auto 0;
  color: #666;
  line-height: 1.6;
`;

const FeaturesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 50px;
    background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
    border-radius: 0 0 5px 0;
  }
`;

const FeatureIconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(217, 85, 80, 0.08) 0%, rgba(235, 107, 86, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  position: relative;
`;

const FeatureIconRing = styled.div`
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px dashed rgba(217, 85, 80, 0.3);
  border-radius: 50%;
  animation: ${rotate} 15s linear infinite;
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333333;
  font-weight: 700;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.7;
  margin-bottom: 1.5rem;
`;

const FeatureHighlight = styled.div`
  background-color: rgba(217, 85, 80, 0.08);
  border-left: 3px solid #d95550;
  padding: 0.8rem 1rem;
  border-radius: 0 5px 5px 0;
  margin-top: auto;
`;

const FeatureHighlightText = styled.div`
  color: #d95550;
  font-weight: 600;
  font-size: 0.9rem;
`;

const HowItWorksSection = styled.section`
  padding: 8rem 2rem;
  background-color: #f8f9fa;
  position: relative;

  @media (max-width: 768px) {
    padding: 6rem 1rem;
  }
`;

const HowItWorksBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d95550' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 0;
`;

const StepsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto 4rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.div`
  text-align: center;
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }
`;

const StepConnector = styled.div`
  position: absolute;
  top: 50%;
  right: -30px;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #d95550, transparent);

  @media (max-width: 768px) {
    display: none;
  }
`;

const StepNumberContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 2rem;
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(217, 85, 80, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    border: 2px dashed rgba(217, 85, 80, 0.3);
    animation: ${rotate} 15s linear infinite;
  }
`;

const StepContent = styled.div`
  position: relative;
`;

const StepTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333333;
  font-weight: 700;
`;

const StepDescription = styled.p`
  color: #666;
  line-height: 1.7;
`;

const StepIcon = styled.div`
  position: absolute;
  top: -15px;
  right: -15px;
  font-size: 2rem;
  opacity: 0.2;
`;

const ProcessImage = styled.img`
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  display: block;
  position: relative;
  z-index: 1;
`;

const TestimonialsSection = styled.section`
  padding: 8rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 6rem 1rem;
  }
`;

const TestimonialsBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 90% 10%, rgba(217, 85, 80, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(69, 124, 163, 0.03) 0%, transparent 50%);
  z-index: -1;
`;

const TestimonialsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  margin-bottom: 4rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }
`;

const TestimonialQuoteMark = styled.div`
  position: absolute;
  top: 20px;
  left: 25px;
  font-size: 5rem;
  color: rgba(217, 85, 80, 0.1);
  font-family: Georgia, serif;
  line-height: 1;
  z-index: 0;
`;

const TestimonialQuote = styled.p`
  font-size: 1.1rem;
  color: #555;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  font-style: italic;
  position: relative;
  z-index: 1;
`;

const TestimonialRating = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
`;

const StarIcon = styled.div`
  color: #ffb400;
  margin-right: 0.25rem;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
`;

const TestimonialAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TestimonialInfo = styled.div``;

const TestimonialName = styled.div`
  font-weight: 700;
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const TestimonialRole = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const TestimonialCompanies = styled.div`
  text-align: center;
  margin-top: 4rem;
`;

const TestimonialCompaniesTitle = styled.div`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
  font-weight: 500;
`;

const CompanyLogos = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 3rem;
`;

const CompanyLogo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #aaa;
  letter-spacing: 1px;
`;

const CtaSection = styled.section`
  padding: 8rem 2rem;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 6rem 1rem;
  }
`;

const CtaWave = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  background-position: bottom;
`;

const CtaContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const CtaTitle = styled.h2`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const CtaDescription = styled.p`
  font-size: 1.3rem;
  margin-bottom: 2.5rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CtaFeatures = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
`;

const CtaFeatureItem = styled.div`
  display: flex;
  align-items: center;
`;

const CtaFeatureIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: white;
  color: #d95550;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: bold;
  font-size: 0.9rem;
`;

const CtaFeatureText = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`;

const CtaButton = styled(Link)`
  background-color: white;
  color: #d95550;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
`;

const CtaDecoration = styled.div`
  position: absolute;
  bottom: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: -30px;
    left: -30px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Footer = styled.footer`
  background-color: #222;
  color: white;
  padding: 6rem 2rem 3rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 4rem 1rem 2rem;
  }
`;

const FooterWave = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23eb6b56' fill-opacity='1' d='M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,165.3C672,149,768,139,864,154.7C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  background-position: bottom;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const FooterTop = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4rem;

  @media (max-width: 992px) {
    flex-direction: column;
    gap: 3rem;
  }
`;

const FooterBrand = styled.div`
  max-width: 350px;

  @media (max-width: 992px) {
    text-align: center;
    margin: 0 auto;
  }
`;

const FooterTagline = styled.p`
  margin-top: 1rem;
  color: #d95550;
  font-weight: 600;
  font-size: 1.1rem;
`;

const FooterDescription = styled.p`
  margin-top: 1.5rem;
  color: #aaa;
  line-height: 1.7;
  margin-bottom: 2rem;
`;

const NewsletterForm = styled.form`
  display: flex;
  margin-top: 1.5rem;

  @media (max-width: 576px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 5px 0 0 5px;
  font-size: 0.9rem;

  @media (max-width: 576px) {
    border-radius: 5px;
  }
`;

const NewsletterButton = styled.button`
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0 5px 5px 0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(135deg, #c04540 0%, #d95550 100%);
  }

  @media (max-width: 576px) {
    border-radius: 5px;
  }
`;

const FooterLinksContainer = styled.div`
  display: flex;
  gap: 4rem;

  @media (max-width: 992px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 3rem;
  }

  @media (max-width: 576px) {
    gap: 2rem;
  }
`;

const FooterLinkColumn = styled.div`
  min-width: 140px;

  @media (max-width: 576px) {
    min-width: 45%;
    margin-bottom: 1.5rem;
    text-align: center;
  }
`;

const FooterLinkTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  color: white;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 30px;
    height: 2px;
    background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);

    @media (max-width: 576px) {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

const FooterLink = styled(Link)`
  display: block;
  color: #aaa;
  margin-bottom: 1rem;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 0.95rem;

  &:hover {
    color: #d95550;
    transform: translateX(5px);

    @media (max-width: 576px) {
      transform: none;
    }
  }
`;

const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const Copyright = styled.div`
  color: #aaa;
  font-size: 0.9rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const SocialLink = styled.a`
  color: #aaa;
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    color: #d95550;
  }
`;

const SocialIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s;

  &:hover {
    background-color: rgba(217, 85, 80, 0.2);
    transform: translateY(-3px);
  }
`;

export default LandingPage;
