import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { login } from '../../services/authService';
import { useSettings } from '../../context/SettingsContext';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { reloadSettings } = useSettings();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Login the user
      const userData = await login(email, password);

      // Log the user data to verify isAdmin flag is included
      console.log('Login successful, user data:', userData.user);
      console.log('Is admin?', userData.user.isAdmin);

      // Reload user settings from the server
      console.log('Login successful, reloading user settings...');
      await reloadSettings();

      // Notify parent component about successful login
      onLogin(userData);

      // Force a timer refresh with the new settings
      const workDuration = userData.user.settings?.workTime || 25;
      const event = new CustomEvent('forceTimerRefresh', {
        detail: {
          session: 'work',
          duration: workDuration * 60
        }
      });
      window.dispatchEvent(event);
      console.log('Dispatched forceTimerRefresh event with duration:', workDuration * 60);

      // Navigate to home page
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginContainer>
        <LogoContainer>
          <LogoIcon>🍅</LogoIcon>
          <LogoText>AI Pomo</LogoText>
        </LogoContainer>

        <WelcomeText>Welcome back!</WelcomeText>

        <LoginForm onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <InputWrapper>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <LabelContainer>
              <Label htmlFor="password">Password</Label>
              <ForgotPasswordLink to="/forgot-password">Forgot password?</ForgotPasswordLink>
            </LabelContainer>
            <InputWrapper>
              <Input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </InputWrapper>
          </FormGroup>

          <LoginButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <ButtonSpinner /> Logging in...
              </>
            ) : (
              'Log In'
            )}
          </LoginButton>

          <RegisterLink>
            Don't have an account? <Link to="/register">Create account</Link>
          </RegisterLink>
        </LoginForm>
      </LoginContainer>

      <ImageContainer>
        <OverlayText>
          <OverlayTitle>Focus Better. Achieve More.</OverlayTitle>
          <OverlayDescription>
            AI Pomo helps you manage your time effectively with the Pomodoro technique.
          </OverlayDescription>
        </OverlayText>
      </ImageContainer>
    </PageContainer>
  );
};

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${props => props.theme['--bg-color']};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LoginContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const LogoIcon = styled.span`
  font-size: 2.5rem;
  margin-right: 0.5rem;
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`;

const WelcomeText = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: ${props => props.theme['--text-color']};
  text-align: center;
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  display: block;
  color: ${props => props.theme['--text-color']};
  font-weight: 500;
  font-size: 0.95rem;
`;

const ForgotPasswordLink = styled(Link)`
  font-size: 0.85rem;
  color: ${props => props.theme['--primary-color'] || '#d95550'};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  background-color: ${props => props.theme['--card-bg']};
  color: ${props => props.theme['--text-color']};
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #d95550;
    box-shadow: 0 0 0 3px rgba(217, 85, 80, 0.15);
  }

  &::placeholder {
    color: #aaa;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(217, 85, 80, 0.25);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: linear-gradient(135deg, #e0a0a0 0%, #e8b5b0 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 0.8s linear infinite;
  margin-right: 8px;
`;

const RegisterLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.95rem;
  color: ${props => props.theme['--text-color']};

  a {
    color: ${props => props.theme['--primary-color'] || '#d95550'};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ImageContainer = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80');
    background-size: cover;
    background-position: center;
    opacity: 0.2;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const OverlayText = styled.div`
  position: relative;
  color: white;
  text-align: center;
  padding: 2rem;
  max-width: 80%;
`;

const OverlayTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const OverlayDescription = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;



const ErrorMessage = styled.div`
  padding: 0.9rem;
  margin-bottom: 1.5rem;
  background-color: rgba(198, 40, 40, 0.08);
  color: #c62828;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #c62828;
  animation: ${fadeIn} 0.3s ease-out;
`;

export default Login;
