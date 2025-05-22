import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSettings } from '../context/SettingsContext';
import { playSound, availableSounds, initAudioContext } from '../utils/audioUtils';

/**
 * Timer Settings component
 * Allows users to customize timer durations, sounds, and other settings
 */
const TimerSettings = ({ isOpen, onClose }) => {
  const { settings, saveSettings, resetSettings, isLoading } = useSettings();
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    workTime: settings.workTime || 25,
    shortBreakTime: settings.shortBreakTime || 5,
    longBreakTime: settings.longBreakTime || 15,
    longBreakInterval: settings.longBreakInterval || 4,
    autoStartNextSession: settings.autoStartNextSession || false,
    tickingSound: settings.tickingSound || false,
    completionSound: settings.completionSound || true,
    notifications: settings.notifications || true,
    volume: settings.volume || 50,
    selectedSound: settings.selectedSound || 'bell',
  });

  // Update local state when settings change
  useEffect(() => {
    setFormValues({
      workTime: settings.workTime || 25,
      shortBreakTime: settings.shortBreakTime || 5,
      longBreakTime: settings.longBreakTime || 15,
      longBreakInterval: settings.longBreakInterval || 4,
      autoStartNextSession: settings.autoStartNextSession || false,
      tickingSound: settings.tickingSound || false,
      completionSound: settings.completionSound || true,
      notifications: settings.notifications || true,
      volume: settings.volume || 50,
      selectedSound: settings.selectedSound || 'bell',
    });
  }, [settings]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  // Test sound
  const testSound = () => {
    initAudioContext();
    playSound(formValues.selectedSound, formValues.volume / 100);
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Show a test notification
        new Notification('Notification Test', {
          body: 'Notifications are now enabled!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveSettings(formValues);
    onClose();
  };

  // Reset settings to defaults
  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
    }
  };

  if (!isOpen) return null;

  return (
    <SettingsModal>
      <SettingsContent>
        <SettingsHeader>
          <h2>Timer Settings</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </SettingsHeader>

        <SettingsForm onSubmit={handleSaveSettings}>
          <SettingsSection>
            <h3>Timer Durations</h3>

            <FormGroup>
              <label htmlFor="workTime">Focus Time (minutes)</label>
              <input
                type="number"
                id="workTime"
                name="workTime"
                min="1"
                max="120"
                value={formValues.workTime}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="shortBreakTime">Short Break (minutes)</label>
              <input
                type="number"
                id="shortBreakTime"
                name="shortBreakTime"
                min="1"
                max="30"
                value={formValues.shortBreakTime}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="longBreakTime">Long Break (minutes)</label>
              <input
                type="number"
                id="longBreakTime"
                name="longBreakTime"
                min="1"
                max="60"
                value={formValues.longBreakTime}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="longBreakInterval">Long Break After (pomodoros)</label>
              <input
                type="number"
                id="longBreakInterval"
                name="longBreakInterval"
                min="1"
                max="10"
                value={formValues.longBreakInterval}
                onChange={handleInputChange}
              />
            </FormGroup>
          </SettingsSection>

          <SettingsSection>
            <h3>Behavior</h3>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="autoStartNextSession"
                name="autoStartNextSession"
                checked={formValues.autoStartNextSession}
                onChange={handleInputChange}
              />
              <label htmlFor="autoStartNextSession">Auto-start next session</label>
            </CheckboxGroup>
          </SettingsSection>

          <SettingsSection>
            <h3>Sound</h3>

            <FormGroup>
              <label htmlFor="selectedSound">Timer Completion Sound</label>
              <select
                id="selectedSound"
                name="selectedSound"
                value={formValues.selectedSound}
                onChange={handleInputChange}
              >
                {availableSounds.map(sound => (
                  <option key={sound.id} value={sound.id}>
                    {sound.name}
                  </option>
                ))}
              </select>
              <TestSoundButton type="button" onClick={testSound}>
                Test Sound
              </TestSoundButton>
            </FormGroup>

            <FormGroup>
              <label htmlFor="volume">Volume ({formValues.volume}%)</label>
              <input
                type="range"
                id="volume"
                name="volume"
                min="0"
                max="100"
                value={formValues.volume}
                onChange={handleInputChange}
              />
            </FormGroup>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="completionSound"
                name="completionSound"
                checked={formValues.completionSound}
                onChange={handleInputChange}
              />
              <label htmlFor="completionSound">Play sound when timer completes</label>
            </CheckboxGroup>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="tickingSound"
                name="tickingSound"
                checked={formValues.tickingSound}
                onChange={handleInputChange}
              />
              <label htmlFor="tickingSound">Play ticking sound during focus time</label>
            </CheckboxGroup>
          </SettingsSection>

          <SettingsSection>
            <h3>Notifications</h3>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={formValues.notifications}
                onChange={handleInputChange}
              />
              <label htmlFor="notifications">Show browser notifications</label>
            </CheckboxGroup>

            <NotificationPermissionButton type="button" onClick={requestNotificationPermission}>
              Request Notification Permission
            </NotificationPermissionButton>
          </SettingsSection>

          <ButtonGroup>
            <ResetButton type="button" onClick={handleResetSettings}>
              Reset to Defaults
            </ResetButton>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </SaveButton>
          </ButtonGroup>
        </SettingsForm>
      </SettingsContent>
    </SettingsModal>
  );
};

// Styled components
const SettingsModal = styled.div`
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

const SettingsContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const SettingsForm = styled.form`
  padding: 16px 24px;
`;

const SettingsSection = styled.div`
  margin-bottom: 24px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 1.2rem;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  }
  
  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input[type="range"] {
    padding: 0;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  input {
    margin-right: 8px;
  }
  
  label {
    margin-bottom: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #388e3c;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #333;
  border: 1px solid #ccc;
  
  &:hover:not(:disabled) {
    background-color: #f5f5f5;
  }
`;

const ResetButton = styled(Button)`
  background-color: white;
  color: #f44336;
  border: 1px solid #f44336;
  margin-right: auto;
  
  &:hover:not(:disabled) {
    background-color: #ffebee;
  }
`;

const TestSoundButton = styled(Button)`
  background-color: #2196f3;
  color: white;
  border: none;
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    background-color: #1976d2;
  }
`;

const NotificationPermissionButton = styled(Button)`
  background-color: #ff9800;
  color: white;
  border: none;
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    background-color: #f57c00;
  }
`;

export default TimerSettings;
