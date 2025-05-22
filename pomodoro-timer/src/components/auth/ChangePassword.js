import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const { currentPassword, newPassword, confirmPassword } = formData;

  // Effect for countdown and logout
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && success) {
      // Logout the user
      localStorage.removeItem('token');
      // Redirect to login page
      navigate('/login');
    }
  }, [countdown, success, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Start countdown for logout
      setCountdown(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <FormCard>
        <FormHeader>Change Password</FormHeader>

        {success && (
          <SuccessMessage>
            Your password has been successfully updated!
            <LogoutCountdown>
              You will be logged out in {countdown} second{countdown !== 1 ? 's' : ''} to login with your new password.
            </LogoutCountdown>
          </SuccessMessage>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <ButtonSpinner /> Updating...
              </>
            ) : (
              'Update Password'
            )}
          </SubmitButton>
        </Form>
      </FormCard>
    </Container>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
`;

const FormHeader = styled.h2`
  margin-bottom: 1.5rem;
  color: ${props => props.theme['--text-color']};
  text-align: center;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: ${props => props.theme['--text-color']};
  font-weight: 500;
  font-size: 0.95rem;
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
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  margin-top: 0.5rem;
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

const ErrorMessage = styled.div`
  padding: 0.9rem;
  margin-bottom: 1rem;
  background-color: rgba(198, 40, 40, 0.08);
  color: #c62828;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #c62828;
  animation: ${fadeIn} 0.3s ease-out;
`;

const SuccessMessage = styled.div`
  padding: 0.9rem;
  margin-bottom: 1rem;
  background-color: rgba(76, 175, 80, 0.08);
  color: #2e7d32;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #2e7d32;
  animation: ${fadeIn} 0.3s ease-out;
`;

const LogoutCountdown = styled.div`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
`;

export default ChangePassword;
