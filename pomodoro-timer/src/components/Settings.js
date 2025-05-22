import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { availableSounds, initAudioContext, playSound } from '../utils/audioUtils';
import { useSettings } from '../context/SettingsContext';

const Settings = ({ isOpen, onClose }) => {
  // Get settings from context
  const { settings, saveSettings: saveSettingsToContext, isLoading } = useSettings();

  // Local state for form values
  const [formValues, setFormValues] = useState({
    workTime: settings?.workTime || 25,
    shortBreakTime: settings?.shortBreakTime || 5,
    longBreakTime: settings?.longBreakTime || 15,
    longBreakInterval: settings?.longBreakInterval || 4,
    autoStartNextSession: settings?.autoStartNextSession || false,
    tickingSound: settings?.tickingSound || false,
    volume: settings?.volume || 50,
    selectedSound: settings?.selectedSound || 'bell',
  });

  // Update form values when settings change
  useEffect(() => {
    if (settings) {
      setFormValues({
        workTime: settings.workTime || 25,
        shortBreakTime: settings.shortBreakTime || 5,
        longBreakTime: settings.longBreakTime || 15,
        longBreakInterval: settings.longBreakInterval || 4,
        autoStartNextSession: settings.autoStartNextSession || false,
        tickingSound: settings.tickingSound || false,
        volume: settings.volume || 50,
        selectedSound: settings.selectedSound || 'bell',
      });
    }
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
    console.log('Testing sound:', formValues.selectedSound);
    initAudioContext();
    playSound(formValues.selectedSound, formValues.volume / 100);
  };

  // Save settings
  const saveSettings = (e) => {
    e.preventDefault();
    console.log('[Settings] Saving settings:', formValues);

    // Save settings to context (which will save to database and localStorage)
    saveSettingsToContext(formValues);

    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <SettingsModal>
      <SettingsContent>
        <SettingsHeader>
          <h2>Settings</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </SettingsHeader>

        <SettingsForm onSubmit={saveSettings}>
          <SettingsSection>
            <h3>Timer</h3>

            <FormGroup>
              <label htmlFor="workTime">Focus Time (minutes)</label>
              <input
                type="number"
                id="workTime"
                name="workTime"
                min="1"
                max="60"
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
                id="tickingSound"
                name="tickingSound"
                checked={formValues.tickingSound}
                onChange={handleInputChange}
              />
              <label htmlFor="tickingSound">Play ticking sound during focus time</label>
            </CheckboxGroup>
          </SettingsSection>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit">
              Save Settings
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
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 0.5rem;
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
  padding: 1.5rem;
  border-bottom: 1px solid #eee;

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #333;
  }
`;

const SettingsForm = styled.form`
  padding: 1.5rem;
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: #555;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    background-color: ${props => props.theme['--card-bg']};
    color: ${props => props.theme['--text-color']};
  }

  input[type="range"] {
    padding: 0.5rem 0;
  }
`;

const TestSoundButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f0f0f0;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;

  input {
    margin-right: 0.75rem;
  }

  label {
    margin-bottom: 0;
    font-size: 0.9rem;
    color: #555;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
`;

const SaveButton = styled(Button)`
  background-color: #4caf50;
  color: white;

  &:hover {
    background-color: #43a047;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f0f0f0;
  color: #555;

  &:hover {
    background-color: #e0e0e0;
  }
`;

export default Settings;
