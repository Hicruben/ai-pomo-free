import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaDatabase, FaDownload, FaTrash, FaUndo, FaPlus,
  FaCog, FaSpinner, FaExclamationTriangle, FaCheck,
  FaCalendarAlt, FaUser, FaFileAlt, FaInfoCircle
} from 'react-icons/fa';
import { adminApi } from '../../services/apiService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const AdminBackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [backupSettings, setBackupSettings] = useState({
    enableAutoBackup: false,
    backupFrequency: 'daily',
    maxBackups: 10
  });
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isMongoDumpAvailable, setIsMongoDumpAvailable] = useState(true); // Assume available until proven otherwise
  const [isDockerMode, setIsDockerMode] = useState(false); // Track if we're using Docker for backups

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await adminApi.getBackups();
      setBackups(data);
    } catch (error) {
      console.error('Error fetching backups:', error);

      // Check if the error is related to mongodump not being installed
      if (error.response?.data?.message?.includes('mongodump command not found') ||
          error.response?.data?.details?.includes('mongodump')) {
        setIsMongoDumpAvailable(false);
      }

      setError('Failed to load backups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);

    try {
      const response = await adminApi.createBackup(backupDescription);

      // Check if the backup was created using Docker
      if (response.message && response.message.includes('Docker')) {
        setIsDockerMode(true);
        toast.success('Backup created successfully using Docker');
      } else {
        toast.success('Backup created successfully');
      }

      setShowBackupModal(false);
      setBackupDescription('');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);

      // Check if the error is related to mongodump not being installed
      if (error.response?.data?.message?.includes('mongodump command not found') ||
          error.response?.data?.details?.includes('mongodump')) {
        setIsMongoDumpAvailable(false);

        // Check if Docker is also not available
        if (error.response?.data?.message?.includes('Docker is not available')) {
          toast.error('MongoDB Database Tools not installed and Docker is not available. See instructions below.');
        } else if (error.response?.data?.message?.includes('Docker backup failed')) {
          toast.error('MongoDB Database Tools not installed and Docker backup failed. See instructions below.');
        } else {
          toast.error('MongoDB Database Tools not installed. See instructions below.');
        }
      } else {
        toast.error('Failed to create backup: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      await adminApi.deleteBackup(backupId);
      toast.success('Backup deleted successfully');
      fetchBackups();
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRestoreBackup = async (backupId) => {
    setIsRestoringBackup(true);

    try {
      const response = await adminApi.restoreBackup(backupId);

      // Check if the backup was restored using Docker
      if (response.message && response.message.includes('Docker')) {
        setIsDockerMode(true);
        toast.success('Backup restored successfully using Docker');
      } else {
        toast.success('Backup restored successfully');
      }

      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error restoring backup:', error);

      // Check if the error is related to mongorestore not being installed
      if (error.response?.data?.message?.includes('mongorestore command not found') ||
          error.response?.data?.details?.includes('mongorestore')) {
        setIsMongoDumpAvailable(false);

        // Check if Docker is also not available
        if (error.response?.data?.message?.includes('Docker is not available')) {
          toast.error('MongoDB Database Tools not installed and Docker is not available. See instructions below.');
        } else if (error.response?.data?.message?.includes('Docker restore failed')) {
          toast.error('MongoDB Database Tools not installed and Docker restore failed. See instructions below.');
        } else {
          toast.error('MongoDB Database Tools not installed. See instructions below.');
        }
      } else {
        toast.error('Failed to restore backup: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await adminApi.updateBackupSettings(backupSettings);
      toast.success('Backup settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error updating backup settings:', error);
      toast.error('Failed to update backup settings: ' + (error.response?.data?.message || error.message));
    }
  };

  const confirmDelete = (backup) => {
    setSelectedBackup(backup);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const confirmRestore = (backup) => {
    setSelectedBackup(backup);
    setConfirmAction('restore');
    setShowConfirmModal(true);
  };

  const downloadBackup = (backupId) => {
    const downloadUrl = adminApi.downloadBackup(backupId);
    window.open(downloadUrl, '_blank');
  };

  if (isLoading && backups.length === 0) {
    return (
      <LoadingContainer>
        <FaSpinner className="spinner" />
        <span>Loading backups...</span>
      </LoadingContainer>
    );
  }

  return (
    <BackupPageContainer>
      <BackupHeader>
        <h1>Database Backup Management</h1>
        <BackupActions>
          <ActionButton
            onClick={() => setShowBackupModal(true)}
            disabled={!isMongoDumpAvailable}
            title={!isMongoDumpAvailable ? "MongoDB Database Tools required" : "Create a new backup"}
          >
            <FaPlus />
            <span>Create Backup</span>
          </ActionButton>
          <ActionButton onClick={() => setShowSettingsModal(true)}>
            <FaCog />
            <span>Backup Settings</span>
          </ActionButton>
        </BackupActions>
      </BackupHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isMongoDumpAvailable && (
        <InstallationInstructions>
          <h3><FaExclamationTriangle /> MongoDB Database Tools Required</h3>
          <p>The backup functionality requires MongoDB Database Tools to be installed on the server.</p>

          {isDockerMode ? (
            <div>
              <p><strong>Docker Mode Active:</strong> The system is currently using Docker for MongoDB backups.</p>
              <p>For optimal performance, consider configuring your MongoDB container name in the server environment:</p>
              <pre>MONGODB_CONTAINER_NAME=your-mongodb-container-name</pre>
            </div>
          ) : (
            <>
              <h4>Option 1: Install MongoDB Database Tools</h4>
              <ol>
                <li>
                  <strong>Windows:</strong>
                  <ul>
                    <li>Download MongoDB Database Tools from the <a href="https://www.mongodb.com/try/download/database-tools" target="_blank" rel="noopener noreferrer">official MongoDB website</a></li>
                    <li>Extract the downloaded archive</li>
                    <li>Add the bin directory to your system PATH</li>
                    <li>Restart the server application</li>
                  </ul>
                </li>
                <li>
                  <strong>macOS (using Homebrew):</strong>
                  <ul>
                    <li><code>brew install mongodb-database-tools</code></li>
                  </ul>
                </li>
                <li>
                  <strong>Linux:</strong>
                  <ul>
                    <li>Ubuntu/Debian: <code>sudo apt-get install mongodb-database-tools</code></li>
                    <li>RHEL/CentOS: <code>sudo yum install mongodb-database-tools</code></li>
                  </ul>
                </li>
              </ol>

              <h4>Option 2: Configure Docker for MongoDB Backups</h4>
              <p>Since you're using MongoDB in a Docker container, you can configure the server to use Docker for backups:</p>
              <ol>
                <li>Make sure Docker is installed and running on your server</li>
                <li>Set the following environment variables in your server configuration:
                  <pre>
MONGODB_CONTAINER_NAME=your-mongodb-container-name
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=pomodoro
                  </pre>
                </li>
                <li>Restart the server application</li>
              </ol>

              <p>The system will automatically try to use Docker for backups if MongoDB Database Tools are not installed.</p>
            </>
          )}
        </InstallationInstructions>
      )}

      <BackupList>
        {backups.length === 0 ? (
          <NoBackupsMessage>
            <FaInfoCircle />
            <span>No backups found. Create your first backup to protect your data.</span>
          </NoBackupsMessage>
        ) : (
          backups.map(backup => (
            <BackupItem key={backup.id}>
              <BackupIcon $type={backup.type}>
                <FaDatabase />
              </BackupIcon>
              <BackupDetails>
                <BackupName>{backup.fileName}</BackupName>
                <BackupDescription>{backup.description}</BackupDescription>
                <BackupMeta>
                  <MetaItem>
                    <FaCalendarAlt />
                    <span>{new Date(backup.createdAt).toLocaleString()} ({formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })})</span>
                  </MetaItem>
                  {backup.createdBy && (
                    <MetaItem>
                      <FaUser />
                      <span>{backup.createdBy.name}</span>
                    </MetaItem>
                  )}
                  <MetaItem>
                    <FaFileAlt />
                    <span>{backup.fileSize}</span>
                  </MetaItem>
                </BackupMeta>
              </BackupDetails>
              <BackupActions>
                <ActionButton onClick={() => downloadBackup(backup.id)} title="Download Backup">
                  <FaDownload />
                </ActionButton>
                <ActionButton
                  onClick={() => confirmRestore(backup)}
                  title={!isMongoDumpAvailable ? "MongoDB Database Tools required" : "Restore Backup"}
                  disabled={!isMongoDumpAvailable}
                >
                  <FaUndo />
                </ActionButton>
                <ActionButton $danger onClick={() => confirmDelete(backup)} title="Delete Backup">
                  <FaTrash />
                </ActionButton>
              </BackupActions>
            </BackupItem>
          ))
        )}
      </BackupList>

      {/* Create Backup Modal */}
      {showBackupModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Create New Backup</h2>
              <CloseButton onClick={() => setShowBackupModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Enter a description for this backup"
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowBackupModal(false)}>Cancel</Button>
              <Button
                $primary
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
              >
                {isCreatingBackup ? <FaSpinner className="spinner" /> : <FaPlus />}
                <span>{isCreatingBackup ? 'Creating...' : 'Create Backup'}</span>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Backup Settings Modal */}
      {showSettingsModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Backup Settings</h2>
              <CloseButton onClick={() => setShowSettingsModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Automatic Backups</Label>
                <Checkbox
                  checked={backupSettings.enableAutoBackup}
                  onChange={(e) => setBackupSettings({
                    ...backupSettings,
                    enableAutoBackup: e.target.checked
                  })}
                >
                  Enable automatic backups
                </Checkbox>
              </FormGroup>

              {backupSettings.enableAutoBackup && (
                <>
                  <FormGroup>
                    <Label>Backup Frequency</Label>
                    <Select
                      value={backupSettings.backupFrequency}
                      onChange={(e) => setBackupSettings({
                        ...backupSettings,
                        backupFrequency: e.target.value
                      })}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Maximum Automatic Backups</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={backupSettings.maxBackups}
                      onChange={(e) => setBackupSettings({
                        ...backupSettings,
                        maxBackups: parseInt(e.target.value, 10)
                      })}
                    />
                    <HelpText>
                      Oldest automatic backups will be deleted when this limit is reached.
                    </HelpText>
                  </FormGroup>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowSettingsModal(false)}>Cancel</Button>
              <Button $primary onClick={handleUpdateSettings}>
                <FaCheck />
                <span>Save Settings</span>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedBackup && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>
                {confirmAction === 'delete' ? 'Confirm Delete' : 'Confirm Restore'}
              </h2>
              <CloseButton onClick={() => setShowConfirmModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {confirmAction === 'delete' ? (
                <p>Are you sure you want to delete the backup <strong>{selectedBackup.fileName}</strong>? This action cannot be undone.</p>
              ) : (
                <div>
                  <p>Are you sure you want to restore the database from backup <strong>{selectedBackup.fileName}</strong>?</p>
                  <WarningMessage>
                    <FaExclamationTriangle />
                    <span>This will overwrite all current data in the database. All data changes since this backup was created will be lost.</span>
                  </WarningMessage>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button
                $danger={confirmAction === 'delete'}
                $warning={confirmAction === 'restore'}
                onClick={() => confirmAction === 'delete'
                  ? handleDeleteBackup(selectedBackup.id)
                  : handleRestoreBackup(selectedBackup.id)
                }
                disabled={confirmAction === 'restore' && isRestoringBackup}
              >
                {confirmAction === 'restore' && isRestoringBackup ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    {confirmAction === 'delete' ? <FaTrash /> : <FaUndo />}
                    <span>{confirmAction === 'delete' ? 'Delete' : 'Restore'}</span>
                  </>
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </BackupPageContainer>
  );
};

// Styled Components
const BackupPageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const BackupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 1.75rem;
    margin: 0;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const BackupActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.$danger
    ? '#f44336'
    : props.$warning
      ? '#ff9800'
      : props.$primary
        ? props.theme['--primary-color'] || '#d95550'
        : props.theme['--card-bg'] || '#fff'};
  color: ${props => (props.$danger || props.$warning || props.$primary) ? 'white' : props.theme['--text-color'] || '#333'};
  border: 1px solid ${props => props.$danger
    ? '#d32f2f'
    : props.$warning
      ? '#f57c00'
      : props.$primary
        ? props.theme['--primary-color'] || '#d95550'
        : '#ddd'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    background-color: ${props => props.$danger
      ? '#d32f2f'
      : props.$warning
        ? '#f57c00'
        : props.$primary
          ? props.theme['--primary-hover'] || '#c04540'
          : props.theme['--bg-color'] || '#f5f5f5'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BackupItem = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const BackupIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$type === 'automatic'
    ? 'rgba(33, 150, 243, 0.1)'
    : 'rgba(76, 175, 80, 0.1)'};
  color: ${props => props.$type === 'automatic' ? '#2196F3' : '#4CAF50'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1.25rem;

  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const BackupDetails = styled.div`
  flex: 1;
`;

const BackupName = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
  margin-bottom: 0.25rem;
`;

const BackupDescription = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  margin-bottom: 0.75rem;
`;

const BackupMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};

  svg {
    font-size: 0.875rem;
  }
`;

const NoBackupsMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-style: italic;

  svg {
    font-size: 1.5rem;
    color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};

  .spinner {
    font-size: 2rem;
    margin-bottom: 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: #F44336;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.5rem;
  }
`;

const WarningMessage = styled.div`
  background-color: rgba(255, 152, 0, 0.1);
  color: #FF9800;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    font-size: 1.25rem;
  }
`;

const InstallationInstructions = styled.div`
  background-color: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: ${props => props.theme['--text-color'] || '#333'};

  h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0;
    color: #2196F3;
    font-size: 1.25rem;

    svg {
      color: #2196F3;
    }
  }

  h4 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.1rem;
  }

  ol {
    padding-left: 1.5rem;

    li {
      margin-bottom: 1rem;
    }
  }

  ul {
    padding-left: 1.5rem;
    margin-top: 0.5rem;

    li {
      margin-bottom: 0.5rem;
    }
  }

  code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
  }

  a {
    color: #2196F3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

const Modal = styled.div`
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #eee;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid #eee;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  line-height: 1;

  &:hover {
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input {
    margin: 0;
  }
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  margin-top: 0.5rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.$danger
    ? '#f44336'
    : props.$warning
      ? '#ff9800'
      : props.$primary
        ? props.theme['--primary-color'] || '#d95550'
        : 'transparent'};
  color: ${props => (props.$danger || props.$warning || props.$primary) ? 'white' : props.theme['--text-secondary'] || '#666'};
  border: 1px solid ${props => props.$danger
    ? '#d32f2f'
    : props.$warning
      ? '#f57c00'
      : props.$primary
        ? props.theme['--primary-color'] || '#d95550'
        : '#ddd'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    background-color: ${props => props.$danger
      ? '#d32f2f'
      : props.$warning
        ? '#f57c00'
        : props.$primary
          ? props.theme['--primary-hover'] || '#c04540'
          : props.theme['--bg-color'] || '#f5f5f5'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
`;

export default AdminBackupPage;
