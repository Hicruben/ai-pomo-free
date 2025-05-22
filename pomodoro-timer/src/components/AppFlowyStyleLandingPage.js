import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBars, FaTimes, FaCheck, FaExpand, FaCompress, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AppFlowyStyleLandingPage = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderTimerRef = useRef(null);

  // AI Project Generator slider images
  const aiSliderImages = [
    "/landing-pics/AI_Project_Generator.png",
    "/landing-pics/AI-genrated-project-result.png"
  ];

  // Function to handle image click and show popup
  const handleImageClick = (imageSrc) => {
    setPopupImage(imageSrc);
    // Prevent scrolling when popup is open
    document.body.style.overflow = 'hidden';
  };

  // Function to close popup
  const closePopup = () => {
    setPopupImage(null);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

  // Function to navigate to next slide
  const nextSlide = () => {
    setCurrentSlide(prevSlide =>
      prevSlide === aiSliderImages.length - 1 ? 0 : prevSlide + 1
    );
  };

  // Function to navigate to previous slide
  const prevSlide = () => {
    setCurrentSlide(prevSlide =>
      prevSlide === 0 ? aiSliderImages.length - 1 : prevSlide - 1
    );
  };

  // State to track if slider is being hovered
  const [isSliderHovered, setIsSliderHovered] = useState(false);

  // Auto-slide functionality
  useEffect(() => {
    if (activeTab === 'ai' && !isSliderHovered) {
      sliderTimerRef.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (sliderTimerRef.current) {
        clearInterval(sliderTimerRef.current);
      }
    };
  }, [activeTab, currentSlide, isSliderHovered]);

  // Reset current slide when tab changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeTab]);

  // Add keyboard support for the popup and slider navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Popup escape key handling
      if (e.key === 'Escape' && popupImage) {
        closePopup();
      }

      // Slider navigation with arrow keys when AI tab is active
      if (activeTab === 'ai' && !popupImage) {
        if (e.key === 'ArrowLeft') {
          prevSlide();
        } else if (e.key === 'ArrowRight') {
          nextSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popupImage, activeTab, prevSlide, nextSlide, closePopup]);

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContainer>
          <Logo to="/">
            <LogoIcon>🍅</LogoIcon>
            <LogoText>AI Pomo</LogoText>
          </Logo>
          <NavLinks isOpen={isMenuOpen}>
            <CloseButton onClick={() => setIsMenuOpen(false)}><FaTimes /></CloseButton>
          </NavLinks>
          <HeaderRight>
            <GetStartedButton to="/login" secondary>
              Log in
            </GetStartedButton>
            <GetStartedButton to="/register">
              Start for free
            </GetStartedButton>
            <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <FaBars />
            </MobileMenuButton>
          </HeaderRight>
        </HeaderContainer>
      </Header>

      {/* Hero Section */}
      <HeroSection>
        <HeroContainer>
          <HeroTitle>
            Bring projects, tasks, and focus together with AI
          </HeroTitle>
          <HeroSubtitle>
            The AI workspace where you achieve more with the proven Pomodoro technique
          </HeroSubtitle>
          <FeaturesHeading>Key Features</FeaturesHeading>
        </HeroContainer>
      </HeroSection>

      {/* Features Tabs */}
      <FeaturesSection id="features">
        <FeaturesTabs>
          <FeatureTab
            isActive={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          >
            Pomodoro with Quick Tasks
          </FeatureTab>
          <FeatureTab
            isActive={activeTab === 'pomodoro'}
            onClick={() => setActiveTab('pomodoro')}
          >
            Project with Pomodoro Focus
          </FeatureTab>
          <FeatureTab
            isActive={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
          >
            Pomodoro Progress Tracking
          </FeatureTab>
          <FeatureTab
            isActive={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          >
            AI Project Generator
          </FeatureTab>
          <FeatureTab
            isActive={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar View
          </FeatureTab>
          <FeatureTab
            isActive={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics View
          </FeatureTab>
        </FeaturesTabs>

        <FeatureContent>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {activeTab === 'ai' && (
              <>
                <FeatureTagline>
                  Transform your ideas into structured projects with AI assistance
                </FeatureTagline>
                <FeatureDescription>
                  Describe your project goals and let AI generate a complete structure with tasks, milestones, and notes - saving you hours of planning time.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src={aiSliderImages[currentSlide]}
                    alt="AI Project Generator"
                    onClick={() => handleImageClick(aiSliderImages[currentSlide])}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>

                  <SliderNavigation style={{ position: 'absolute', bottom: '10px', left: '0', right: '0' }}>
                    <SliderButton onClick={prevSlide}>
                      <FaChevronLeft />
                    </SliderButton>
                    <SliderDots>
                      {aiSliderImages.map((_, index) => (
                        <SliderDot
                          key={index}
                          isActive={index === currentSlide}
                          onClick={() => setCurrentSlide(index)}
                        />
                      ))}
                    </SliderDots>
                    <SliderButton onClick={nextSlide}>
                      <FaChevronRight />
                    </SliderButton>
                  </SliderNavigation>
                  <SliderIndicator>
                    {currentSlide + 1}/{aiSliderImages.length}
                  </SliderIndicator>
                </FeatureImageWrapper>
              </>
            )}
            {activeTab === 'projects' && (
              <>
                <FeatureTagline>
                  Track both time investment and progress with Pomodoro counts
                </FeatureTagline>
                <FeatureDescription>
                  See exactly how much time you've invested in each project with clear Pomodoro counters. Watch your progress grow with every completed focus session, giving you a tangible measure of both effort and achievement.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src="/landing-pics/open_projects_with_pomodoro_count.png"
                    alt="Projects"
                    onClick={() => handleImageClick("/landing-pics/open_projects_with_pomodoro_count.png")}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>
                </FeatureImageWrapper>
              </>
            )}
            {activeTab === 'tasks' && (
              <>
                <FeatureTagline>
                  Capture and complete tasks with built-in Pomodoro focus sessions
                </FeatureTagline>
                <FeatureDescription>
                  Quickly add tasks, estimate required Pomodoros, and track your progress - perfect for daily to-dos and standalone tasks that need focused attention with the Pomodoro technique.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src="/landing-pics/quick-tasks-with-pomodoros.png"
                    alt="Pomodoro with Quick Tasks"
                    onClick={() => handleImageClick("/landing-pics/quick-tasks-with-pomodoros.png")}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>
                </FeatureImageWrapper>
              </>
            )}
            {activeTab === 'calendar' && (
              <>
                <FeatureTagline>
                  Visualize your productivity journey with an integrated calendar
                </FeatureTagline>
                <FeatureDescription>
                  See your completed Pomodoros, upcoming deadlines, and milestones in one view - helping you track progress and plan your time effectively.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src="/landing-pics/calendar_with_pomodoro_task_milestones.png"
                    alt="Calendar"
                    onClick={() => handleImageClick("/landing-pics/calendar_with_pomodoro_task_milestones.png")}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>
                </FeatureImageWrapper>
              </>
            )}
            {activeTab === 'pomodoro' && (
              <>
                <FeatureTagline>
                  Supercharge your projects with integrated Pomodoro focus sessions
                </FeatureTagline>
                <FeatureDescription>
                  Seamlessly blend deep focus into your project workflow with built-in Pomodoro sessions. Enhance concentration, reduce distractions, and make consistent progress while tracking exactly how much focused time you've invested in each project.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src="/landing-pics/project_with_pomodoros.png"
                    alt="Project with Pomodoro Focus"
                    onClick={() => handleImageClick("/landing-pics/project_with_pomodoros.png")}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>
                </FeatureImageWrapper>
              </>
            )}
            {activeTab === 'statistics' && (
              <>
                <FeatureTagline>
                  Track your productivity with detailed statistics
                </FeatureTagline>
                <FeatureDescription>
                  Gain valuable insights into your work patterns with comprehensive statistics. Visualize your focus time, track completed Pomodoros, and analyze your productivity trends over time to optimize your workflow and achieve better results.
                </FeatureDescription>
                <FeatureImageWrapper>
                  <FeatureImage
                    src="/landing-pics/statistics.png"
                    alt="Statistics View"
                    onClick={() => handleImageClick("/landing-pics/statistics.png")}
                  />
                  <ExpandIcon><FaExpand /></ExpandIcon>
                </FeatureImageWrapper>
              </>
            )}
          </div>
        </FeatureContent>
      </FeaturesSection>

      {/* AI Videos Section */}
      <AIVideosSection id="ai-videos">
        <SectionContainer>
          <VideoSectionTitle>AI-Powered Productivity Revolution</VideoSectionTitle>
          <VideoSectionSubtitle>Experience how our intelligent assistant eliminates hours of planning work and transforms your productivity in seconds</VideoSectionSubtitle>

          <VideoGrid>
            <VideoCard>
              <VideoTitle>Turn Ideas Into Complete Projects Instantly</VideoTitle>
              <VideoDescription>
                Watch as our AI transforms your simple concept into a fully structured project with tasks, milestones, and deadlines—all in under 30 seconds. Skip hours of manual setup and jump straight into productive work.
              </VideoDescription>
              <VideoWrapper>
                <Video controls>
                  <source src="/landing-videos/AI-project-generation.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </Video>
              </VideoWrapper>
            </VideoCard>

            <VideoCard>
              <VideoTitle>Never Miss a Critical Task Again</VideoTitle>
              <VideoDescription>
                See how our AI identifies and generates all essential subtasks for your projects that even experienced managers might overlook. Eliminate planning anxiety and ensure comprehensive project coverage with a single click.
              </VideoDescription>
              <VideoWrapper>
                <Video controls>
                  <source src="/landing-videos/AI-subtasks.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </Video>
              </VideoWrapper>
            </VideoCard>
          </VideoGrid>
        </SectionContainer>
      </AIVideosSection>

      {/* CTA Section */}
      <CTASection>
        <CTAContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px', textAlign: 'left', marginRight: '1rem' }}>
              <CTATitle>Boost your productivity today</CTATitle>
              <CTASubtitle>Join thousands of focused professionals who've mastered their time</CTASubtitle>
            </div>
            <CTAButtons>
              <PrimaryButton to="/register">Start for free</PrimaryButton>
              <SecondaryButton to="/login">Log in</SecondaryButton>
            </CTAButtons>
          </div>
        </CTAContainer>
      </CTASection>

      {/* Footer */}
      <Footer>
        <FooterContainer>
          <FooterCopyright>
            Copyright © {new Date().getFullYear()} 🍅 AI Pomo
          </FooterCopyright>
        </FooterContainer>
      </Footer>

      {/* Image Popup/Lightbox */}
      {popupImage && (
        <ImagePopup onClick={closePopup}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <PopupImage src={popupImage} alt="Enlarged view" />
            <ClosePopupButton onClick={closePopup}>
              <FaTimes />
            </ClosePopupButton>
            <ZoomIndicator>
              <FaExpand />
              <ZoomText>Click anywhere outside to close</ZoomText>
            </ZoomIndicator>
          </PopupContent>
        </ImagePopup>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #111827;
  background-color: #ffffff;
  overflow-x: hidden;
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #111827;
  font-weight: 700;
  font-size: 1.5rem;
`;

const LogoIcon = styled.span`
  font-size: 1.8rem;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  font-weight: 700;
`;

const NavLinks = styled.nav`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 250px;
    flex-direction: column;
    background-color: white;
    padding: 5rem 2rem 2rem;
    transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 1001;
  }
`;

const NavLink = styled.a`
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #d95550;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4b5563;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;



const GetStartedButton = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: ${props => props.secondary ? 'white' : '#d95550'};
  color: ${props => props.secondary ? '#111827' : 'white'};
  text-decoration: none;
  border-radius: 9999px;
  font-weight: 600;
  border: ${props => props.secondary ? '1px solid #e5e7eb' : 'none'};
  transition: all 0.2s;
  margin-left: ${props => props.secondary ? '0' : '0.5rem'};

  &:hover {
    background-color: ${props => props.secondary ? '#f3f4f6' : '#c73e39'};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4b5563;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HeroSection = styled.section`
  padding: 5rem 2rem 0;
  text-align: center;
  background-color: #ffffff;

  @media (max-width: 768px) {
    padding: 4rem 1rem 0;
  }
`;

const HeroContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const HeroTitle = styled.h1`
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  background: linear-gradient(to right, #d95550, #eb6b56);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: #4b5563;
  margin-bottom: 1.5rem;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
`;

const HeroButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background-color: #d95550;
  color: white;
  text-decoration: none;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c73e39;
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background-color: white;
  color: #111827;
  text-decoration: none;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid #e5e7eb;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const HeroLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const HeroLink = styled.a`
  color: #d95550;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const FeaturesSection = styled.section`
  padding: 0.5rem 2rem 6rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem 4rem;
  }
`;

const FeaturesHeading = styled.h2`
  text-align: center;
  font-size: 2.25rem;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #111827;
  position: relative;
  z-index: 1;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.4rem;
    left: 50%;
    transform: translateX(-50%);
    width: 5rem;
    height: 0.25rem;
    background: linear-gradient(to right, #d95550, #eb6b56);
    border-radius: 0.125rem;
  }

  @media (max-width: 768px) {
    font-size: 1.85rem;
    margin-top: 0;
  }
`;

const FeaturesTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 0.5rem 1rem;
  position: relative;
  width: 100%;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
`;

const FeatureTab = styled.button`
  padding: 0.5rem 1.25rem;
  background-color: transparent;
  border: ${props => props.isActive ? '2px solid #d95550' : '1px solid #e5e7eb'};
  border-radius: 9999px;
  font-size: 0.95rem;
  font-weight: ${props => props.isActive ? '700' : '600'};
  color: ${props => props.isActive ? '#d95550' : '#6b7280'};
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  margin: 0.15rem;

  &:hover {
    border-color: #d95550;
    color: #d95550;
  }
`;

const FeatureContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 600px;
  padding: 1rem;

  @media (max-width: 768px) {
    min-height: 450px;
    padding: 0.5rem;
  }
`;

const FeatureTagline = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
  text-align: center;
  max-width: 800px;
  background: linear-gradient(to right, #d95550, #eb6b56);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 1.35rem;
  }
`;

const FeatureDescription = styled.p`
  font-size: 1.05rem;
  color: #4b5563;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 800px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
  }
`;

const FeatureImageWrapper = styled.div`
  position: relative;
  cursor: pointer;
  border-radius: 0.75rem;
  overflow: hidden;
  max-width: 100%;
  max-height: 700px;
  border: 2px solid #ff8c42;
  box-shadow: 0 6px 16px rgba(255, 140, 66, 0.15);
  transition: all 0.3s ease;

  &:hover {
    img {
      transform: scale(1.02);
    }

    div {
      opacity: 1;
    }
    box-shadow: 0 8px 20px rgba(255, 140, 66, 0.25);
  }

  @media (max-width: 768px) {
    max-height: 350px;
  }
`;

// Slider styled components
const SliderContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 550px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid #ff8c42;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    height: 350px;
  }
`;

const SliderSlide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => props.isActive ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    div {
      opacity: 1;
    }
  }
`;

const SliderNavigation = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  gap: 1rem;
`;

const SliderButton = styled.button`
  background-color: #f8f8f8;
  color: #d95550;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #d95550;
    color: white;
    transform: scale(1.1);
  }
`;

const SliderDots = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SliderDot = styled.button`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${props => props.isActive ? '#d95550' : '#e5e7eb'};
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.isActive ? '#d95550' : '#d1d5db'};
    transform: scale(1.2);
  }
`;

const SliderIndicator = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 10;
`;

const ExpandIcon = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  color: #111827;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

const FeatureImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  transition: transform 0.3s ease;
  cursor: pointer;

  ${SliderSlide} & {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1200px;
    object-fit: contain;
  }

  ${FeatureImageWrapper} &:hover,
  ${SliderSlide}:hover & {
    transform: scale(1.02);
  }
`;



// AI Videos Section Styled Components
const AIVideosSection = styled.section`
  padding: 6rem 2rem;
  background-color: #f9fafb;

  @media (max-width: 768px) {
    padding: 4rem 1rem;
  }
`;

const SectionContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const VideoSectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #d95550, #eb6b56);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 5rem;
    height: 0.25rem;
    background: linear-gradient(to right, #d95550, #eb6b56);
    border-radius: 0.125rem;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const VideoSectionSubtitle = styled.p`
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 3rem;
  color: #4b5563;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`;

const VideoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const VideoCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const VideoTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #111827;
  position: relative;
  display: inline-block;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    width: 2.5rem;
    height: 0.2rem;
    background: linear-gradient(to right, #d95550, #eb6b56);
    border-radius: 0.1rem;
  }
`;

const VideoDescription = styled.p`
  font-size: 1.0625rem;
  color: #4b5563;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid #ff8c42;
  box-shadow: 0 6px 16px rgba(255, 140, 66, 0.15);
  margin-top: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(255, 140, 66, 0.25);
  }
`;

const Video = styled.video`
  width: 100%;
  display: block;
  border-radius: 0.5rem;
  max-height: 600px;
  object-fit: contain;
  background-color: #f3f4f6;
`;

const CTASection = styled.section`
  padding: 3rem 2rem;
  background: linear-gradient(to right, #d95550, #eb6b56);
  color: white;
  text-align: center;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const CTAContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTASubtitle = styled.p`
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-start;
    margin-top: 1rem;
    width: 100%;
  }
`;

const Footer = styled.footer`
  padding: 5rem 2rem 2rem;
  background-color: #ffffff;

  @media (max-width: 768px) {
    padding: 3rem 1rem 2rem;
  }
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;





const FooterCopyright = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 1rem;
`;

// Popup/Lightbox styled components
const ImagePopup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 2rem;
  cursor: zoom-out;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PopupContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  cursor: default;
`;

const PopupImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
`;

const ClosePopupButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  z-index: 2010;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const ZoomIndicator = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: fadeInUp 0.5s ease;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

const ZoomText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

export default AppFlowyStyleLandingPage;
