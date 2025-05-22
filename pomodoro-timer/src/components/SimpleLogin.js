import React, { useState } from 'react';
import styled from 'styled-components';
import { login, isAuthenticated, logout } from '../services/authService';

const SimpleLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Attempting to login with email:', email);
      const response = await login(email, password);
      console.log('Login response:', response);
      console.log('Token received:', localStorage.getItem('token'));

      setSuccess('Login successful!');
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');

      // Log the user data to verify isAdmin flag is included
      console.log('Login successful, user data:', response.user);
      console.log('Is admin?', response.user.isAdmin);

      // Don't reload the page immediately so we can see the success message
      console.log('Login successful, will reload page in 2 seconds');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    console.log('Token before logout:', localStorage.getItem('token'));

    logout();

    console.log('Token after logout:', localStorage.getItem('token'));
    setIsLoggedIn(false);
    setSuccess('Logged out successfully!');

    // Don't reload the page immediately so we can see the success message
    console.log('Logout successful, will reload page in 2 seconds');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <LoginContainer>
      <h2>Authentication</h2>

      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}

      {success && (
        <SuccessMessage>{success}</SuccessMessage>
      )}

      {isLoggedIn ? (
        <div>
          <p>You are currently logged in.</p>
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </LoginButton>
        </LoginForm>
      )}
    </LoginContainer>
  );
};

// Styled components
const LoginContainer = styled.div`
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 20px 0;
  background-color: white;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const LoginButton = styled.button`
  padding: 10px;
  background-color: #d95550;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #c04540;
  }

  &:disabled {
    background-color: #e0a0a0;
    cursor: not-allowed;
  }
`;

const LogoutButton = styled.button`
  padding: 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #d32f2f;
  }
`;

const ErrorMessage = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
`;

export default SimpleLogin;
