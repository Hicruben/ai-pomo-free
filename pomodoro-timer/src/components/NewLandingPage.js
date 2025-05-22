import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { FaCheck, FaGoogle, FaBars, FaArrowRight } from 'react-icons/fa';

const NewLandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <LandingContainer>
      <BackgroundGradient />

      {/* Header */}
      <Header>
        <HeaderContainer>
          <Logo to="/app">
            <LogoIcon>🍅</LogoIcon>
            <LogoText>AI Pomo</LogoText>
          </Logo>
          <NavLinks>
            <NavLink href="#benefits">Benefits</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
          </NavLinks>
          <HeaderButtons>
            <SecondaryButton to="/login">Sign in</SecondaryButton>
            <GetStartedButton to="/register">
              Get Started
              <ButtonArrow>→</ButtonArrow>
            </GetStartedButton>
          </HeaderButtons>
          <MobileMenuButton>
            <FaBars />
          </MobileMenuButton>
        </HeaderContainer>
      </Header>

      {/* Hero Section */}
      <HeroSection>
        <HeroContent isVisible={isVisible}>
          <HeroTextContainer>
            <HeroEyebrow>AI-Powered Productivity</HeroEyebrow>
            <HeroTagline>Focus Better.<HighlightSpan> Achieve More.</HighlightSpan></HeroTagline>
            <HeroTitle>
              Transform Your <HighlightText>Productivity</HighlightText> with AI-Enhanced Pomodoro Timer
            </HeroTitle>
            <HeroDescription>
              AI Pomo combines the proven Pomodoro technique with AI-powered project management to help you focus, track progress, and achieve your goals efficiently.
            </HeroDescription>
            <HeroButtons>
              <PrimaryButton to="/register">
                Start For Free
                <ButtonArrow>→</ButtonArrow>
              </PrimaryButton>
              <SecondaryButton href="#benefits">Learn More</SecondaryButton>
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
          </HeroImageContainer>
        </HeroContent>
      </HeroSection>

      {/* Benefits Section */}
      <BenefitsSection id="benefits">
        <SectionTitle>
          <SectionTitleAccent>Why Choose AI Pomo</SectionTitleAccent>
          <h2>Powerful <HighlightText>Benefits</HighlightText> That Transform Your Workflow</h2>
          <SectionDescription>
            Discover how AI Pomo can revolutionize your productivity and help you achieve your goals.
          </SectionDescription>
        </SectionTitle>

        <BenefitsContainer>
          <BenefitCard>
            <BenefitIconContainer>
              <BenefitIcon>🤖</BenefitIcon>
              <BenefitIconRing />
            </BenefitIconContainer>
            <BenefitContent>
              <BenefitTitle>AI 驱动的项目规划与任务分解</BenefitTitle>
              <BenefitDescription>
                用户只需通过自然语言描述项目想法，AI即可自动生成包含里程碑、任务、子任务和笔记的完整项目结构。极大地降低了用户启动和规划复杂个人项目的门槛，解决了"不知从何开始"的痛点。
              </BenefitDescription>
            </BenefitContent>
          </BenefitCard>

          <BenefitCard>
            <BenefitIconContainer>
              <BenefitIcon>🍅</BenefitIcon>
              <BenefitIconRing />
            </BenefitIconContainer>
            <BenefitContent>
              <BenefitTitle>番茄钟与任务、项目的无缝整合与量化追踪</BenefitTitle>
              <BenefitDescription>
                应用不仅仅是番茄钟和任务列表的简单叠加，而是将番茄工作法深度嵌入到任务执行和项目管理中。每个工作番茄钟都与特定任务关联，并能追踪预估与实际完成的番茄数量 (🍅)。
              </BenefitDescription>
            </BenefitContent>
          </BenefitCard>

          <BenefitCard>
            <BenefitIconContainer>
              <BenefitIcon>📊</BenefitIcon>
              <BenefitIconRing />
            </BenefitIconContainer>
            <BenefitContent>
              <BenefitTitle>全面的数据统计与可视化进度反馈</BenefitTitle>
              <BenefitDescription>
                提供每日、每周、每月的番茄钟完成数量，项目和任务的完成率，生产力趋势图表，以及将里程碑、截止日期和每日完成番茄钟在日历上可视化。
              </BenefitDescription>
            </BenefitContent>
          </BenefitCard>

          <BenefitCard>
            <BenefitIconContainer>
              <BenefitIcon>📝</BenefitIcon>
              <BenefitIconRing />
            </BenefitIconContainer>
            <BenefitContent>
              <BenefitTitle>结构化的个人项目管理系统</BenefitTitle>
              <BenefitDescription>
                用户可以创建项目，设定状态（开启、进行中、已完成）、截止日期，并在项目下管理任务、里程碑和笔记。支持免费版3个开放项目，且只有一个项目能处于"进行中"状态。
              </BenefitDescription>
            </BenefitContent>
          </BenefitCard>

          <BenefitCard>
            <BenefitIconContainer>
              <BenefitIcon>🎯</BenefitIcon>
              <BenefitIconRing />
            </BenefitIconContainer>
            <BenefitContent>
              <BenefitTitle>引导专注的单一任务工作流</BenefitTitle>
              <BenefitDescription>
                严格执行"一次只专注于一个任务"的原则，计时器在切换任务时会重置（并有提示），中断的番茄钟会被放弃。通过机制设计，主动引导用户减少多任务切换带来的效率损耗。
              </BenefitDescription>
            </BenefitContent>
          </BenefitCard>
        </BenefitsContainer>
      </BenefitsSection>

      {/* CTA Section */}
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
          <CtaButton to="/register">
            Get Started For Free
            <ButtonArrow>→</ButtonArrow>
          </CtaButton>
        </CtaContent>
        <CtaDecoration />
      </CtaSection>

      {/* Footer */}
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
            </FooterBrand>
          </FooterTop>
          <FooterBottom>
            <FooterCopyright>© {new Date().getFullYear()} AI Pomo. All rights reserved.</FooterCopyright>
          </FooterBottom>
        </FooterContent>
      </Footer>
    </LandingContainer>
  );
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
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
  display: inline-flex;
  align-items: center;
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

const ButtonArrow = styled.span`
  margin-left: 0.5rem;
`;

const HeroSection = styled.section`
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 7rem 1rem 3rem;
  }
`;

const HeroContent = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  opacity: ${props => (props.isVisible ? 1 : 0)};
  transform: translateY(${props => (props.isVisible ? 0 : 20)}px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;

  @media (max-width: 992px) {
    flex-direction: column;
    text-align: center;
  }
`;

const HeroTextContainer = styled.div`
  flex: 1;
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
  font-size: 1.2rem;
  color: #666;
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
  margin-bottom: 2rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
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
  display: inline-flex;
  align-items: center;
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

const SecondaryButton = styled(Link)`
  background-color: transparent;
  color: #d95550;
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
  gap: 1.5rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
  }
`;

const HeroBadge = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
`;

const BadgeIcon = styled.span`
  margin-right: 0.5rem;
`;

const HeroImageContainer = styled.div`
  flex: 1;
  max-width: 550px;

  @media (max-width: 992px) {
    width: 100%;
  }
`;

const HeroImageWrapper = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const HeroImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s;

  &:hover {
    transform: scale(1.03);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2));
`;

const FloatingElement = styled.div`
  position: absolute;
  font-size: 2rem;
  animation: ${float} 3s ease-in-out infinite;
  z-index: 2;
`;

export default NewLandingPage;
