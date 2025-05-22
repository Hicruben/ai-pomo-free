import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FaEnvelope, FaStar, FaBug, FaLightbulb, FaGift, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

// Import the API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create an axios instance with the correct base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add spinner animation
const SpinnerAnimation = createGlobalStyle`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const ContactModal = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState('premium');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error state
    setError('');

    // Validate form
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Set loading state
    setIsSubmitting(true);

    try {
      // Send data to the server using our API instance
      const response = await api.post('/contact', {
        name,
        email,
        message,
        type: selectedOption
      });

      console.log('Contact form submission response:', response.data);

      // Show success message
      setShowSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setName('');
        setEmail('');
        setMessage('');
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setError(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay>
      <SpinnerAnimation />
      <ModalContent>
        <ModalHeader>
          <h2>Contact Us</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          {showSuccess ? (
            <SuccessMessage>
              <SuccessIcon>✓</SuccessIcon>
              <p>Thank you for your message!</p>
              <p>We've received your request and will get back to you soon.</p>
            </SuccessMessage>
          ) : (
            <ContactForm onSubmit={handleSubmit}>
              <FormIntro>
                <AuthorInfo>
                  <p>Contact the AI Pomo Free team</p>
                  <p>For support with the open-source version, please use GitHub Issues.</p>
                  <p>For premium features, visit <a href="https://ai-pomo.com" target="_blank" rel="noopener noreferrer">AI-Pomo.com</a></p>
                </AuthorInfo>
              </FormIntro>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <OptionSelector>

                <OptionButton
                  type="button"
                  $isActive={selectedOption === 'feature'}
                  onClick={() => setSelectedOption('feature')}
                  disabled={isSubmitting}
                >
                  <FaLightbulb />
                  <span>Feature Request</span>
                </OptionButton>
                <OptionButton
                  type="button"
                  $isActive={selectedOption === 'bug'}
                  onClick={() => setSelectedOption('bug')}
                  disabled={isSubmitting}
                >
                  <FaBug />
                  <span>Bug Report</span>
                </OptionButton>
                <OptionButton
                  type="button"
                  $isActive={selectedOption === 'feedback'}
                  onClick={() => setSelectedOption('feedback')}
                  disabled={isSubmitting}
                >
                  <FaStar />
                  <span>Feedback</span>
                </OptionButton>
              </OptionSelector>

              <FormGroup>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="email">Your Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={getPlaceholderText(selectedOption)}
                  rows={5}
                  disabled={isSubmitting}
                  required
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FaEnvelope />
                    <span>Send Message</span>
                  </>
                )}
              </SubmitButton>
            </ContactForm>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// Helper function to get placeholder text based on selected option
const getPlaceholderText = (option) => {
  switch (option) {
    case 'premium':
      return 'I would like to request premium access to unlock more open projects...';
    case 'feature':
      return 'I would like to suggest a new feature...';
    case 'bug':
      return 'I found a bug when trying to... Steps to reproduce:';
    case 'feedback':
      return 'I would like to provide feedback about...';
    default:
      return 'Type your message here...';
  }
};

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  width: 90%;
  max-width: 550px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme['--border-color'] || '#eee'};

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme['--text-muted'] || '#777'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormIntro = styled.div`
  margin-bottom: 1rem;
`;

const AuthorInfo = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme['--text-muted'] || '#777'};
  line-height: 1.5;
`;

const OptionSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: ${props => props.$isActive ? props.theme['--primary-color'] || '#d95550' : '#f5f5f5'};
  color: ${props => props.$isActive ? 'white' : props.theme['--text-color'] || '#333'};
  border: 1px solid ${props => props.$isActive ? props.theme['--primary-color'] || '#d95550' : '#ddd'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$isActive ? props.theme['--primary-hover'] || '#c04540' : '#eee'};
  }

  svg {
    font-size: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
    box-shadow: 0 0 0 2px rgba(217, 85, 80, 0.2);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
    box-shadow: 0 0 0 2px rgba(217, 85, 80, 0.2);
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.theme['--primary-color'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background-color: ${props => props.theme['--primary-hover'] || '#c04540'};
  }

  svg {
    font-size: 1rem;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;

  p {
    margin: 0.5rem 0;
    line-height: 1.5;
  }
`;

const SuccessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  border-left: 4px solid #c62828;
`;

export default ContactModal;
