import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaSearch, FaSpinner, FaUserEdit, FaKey, FaEnvelope,
  FaToggleOn, FaToggleOff, FaTrash, FaExclamationTriangle,
  FaFilter, FaSort, FaCheck, FaTimes, FaCrown
} from 'react-icons/fa';
import { adminApi } from '../../services/apiService';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');

  // Form states
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    isAdmin: false,
    subscriptionPlan: 'free',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortDirection, filterStatus, filterSubscription]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await adminApi.getUsers({
        page: currentPage,
        sort: sortField,
        direction: sortDirection,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        subscription: filterSubscription !== 'all' ? filterSubscription : undefined
      });

      setUsers(data.users);
      setFilteredUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      subscriptionPlan: user.subscription?.plan || 'free',
      isActive: user.isActive !== false // Default to true if not specified
    });
    setIsUserModalOpen(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setTempPassword(generateTempPassword());
    setIsPasswordModalOpen(true);
  };

  const handleMessageUser = (user) => {
    setSelectedUser(user);
    setMessageSubject('');
    setMessageBody('');
    setIsMessageModalOpen(true);
  };

  const handleToggleUserStatus = (user) => {
    setSelectedUser(user);
    setConfirmAction({
      type: 'toggleStatus',
      message: `Are you sure you want to ${user.isActive !== false ? 'disable' : 'enable'} this user?`
    });
    setIsConfirmModalOpen(true);
  };

  const handleUpdateSubscription = (user, plan) => {
    setSelectedUser(user);
    setConfirmAction({
      type: 'updateSubscription',
      message: `Are you sure you want to change this user's subscription to ${plan}?`,
      data: { plan }
    });
    setIsConfirmModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setConfirmAction({
      type: 'deleteUser',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.'
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !selectedUser) return;

    setActionLoading(true);

    try {
      switch (confirmAction.type) {
        case 'toggleStatus':
          await adminApi.updateUserStatus(selectedUser._id, !selectedUser.isActive);
          break;
        case 'updateSubscription':
          await adminApi.updateUserSubscription(selectedUser._id, confirmAction.data.plan);
          break;
        case 'deleteUser':
          await adminApi.deleteUser(selectedUser._id);
          break;
        case 'resetPassword':
          await adminApi.resetUserPassword(selectedUser._id, tempPassword);
          break;
        case 'sendMessage':
          await adminApi.sendUserMessage(selectedUser._id, {
            subject: messageSubject,
            body: messageBody
          });
          break;
        default:
          throw new Error('Unknown action type');
      }

      // Refresh user list
      fetchUsers();

      // Close modals
      setIsConfirmModalOpen(false);
      setIsPasswordModalOpen(false);
      setIsMessageModalOpen(false);
      setIsUserModalOpen(false);

      // Reset states
      setSelectedUser(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error performing action:', error);
      setError(`Failed to ${confirmAction.type}: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);

    try {
      await adminApi.updateUser(selectedUser._id, userFormData);

      // Refresh user list
      fetchUsers();

      // Close modal
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(`Failed to update user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageSubject || !messageBody) return;

    setConfirmAction({
      type: 'sendMessage',
      message: 'Are you sure you want to send this message?'
    });
    setIsConfirmModalOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    if (!selectedUser || !tempPassword) return;

    setConfirmAction({
      type: 'resetPassword',
      message: 'Are you sure you want to reset this user\'s password?'
    });
    setIsConfirmModalOpen(true);
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <PageContainer>
      <PageHeader>
        <h1>User Management</h1>
        <p>Manage user accounts, subscriptions, and access</p>
      </PageHeader>

      {error && (
        <ErrorMessage>
          <FaExclamationTriangle />
          <span>{error}</span>
        </ErrorMessage>
      )}

      <ControlsContainer>
        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <FiltersContainer>
          <FilterGroup>
            <FilterLabel>
              <FaFilter /> Status:
            </FilterLabel>
            <FilterSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>
              <FaFilter /> Subscription:
            </FilterLabel>
            <FilterSelect
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </FilterSelect>
          </FilterGroup>
        </FiltersContainer>
      </ControlsContainer>

      {isLoading ? (
        <LoadingContainer>
          <FaSpinner className="spinner" />
          <span>Loading users...</span>
        </LoadingContainer>
      ) : (
        <>
          <UsersTable>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (
                    <SortIcon direction={sortDirection}>
                      <FaSort />
                    </SortIcon>
                  )}
                </th>
                <th onClick={() => handleSort('email')}>
                  Email {sortField === 'email' && (
                    <SortIcon direction={sortDirection}>
                      <FaSort />
                    </SortIcon>
                  )}
                </th>
                <th onClick={() => handleSort('createdAt')}>
                  Registered {sortField === 'createdAt' && (
                    <SortIcon direction={sortDirection}>
                      <FaSort />
                    </SortIcon>
                  )}
                </th>
                <th onClick={() => handleSort('subscription.plan')}>
                  Subscription {sortField === 'subscription.plan' && (
                    <SortIcon direction={sortDirection}>
                      <FaSort />
                    </SortIcon>
                  )}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      {user.name}
                      {user.isAdmin && (
                        <AdminBadge>
                          <FaCrown /> Admin
                        </AdminBadge>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <SubscriptionBadge plan={user.subscription?.plan || 'free'}>
                        {user.subscription?.plan ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1) : 'Free'}
                      </SubscriptionBadge>
                    </td>
                    <td>
                      <StatusBadge active={user.isActive !== false}>
                        {user.isActive !== false ? 'Active' : 'Disabled'}
                      </StatusBadge>
                    </td>
                    <td>
                      <ActionButtons>
                        <ActionButton title="Edit User" onClick={() => handleEditUser(user)}>
                          <FaUserEdit />
                        </ActionButton>
                        <ActionButton title="Reset Password" onClick={() => handleResetPassword(user)}>
                          <FaKey />
                        </ActionButton>
                        <ActionButton title="Message User" onClick={() => handleMessageUser(user)}>
                          <FaEnvelope />
                        </ActionButton>
                        <ActionButton
                          title={user.isActive !== false ? "Disable User" : "Enable User"}
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.isActive !== false ? <FaToggleOn /> : <FaToggleOff />}
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </UsersTable>

          <Pagination>
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            <PageInfo>
              Page {currentPage} of {totalPages}
            </PageInfo>
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
          </Pagination>
        </>
      )}

      {/* User Edit Modal */}
      {isUserModalOpen && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Edit User</h2>
              <CloseButton onClick={() => setIsUserModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                />
              </FormGroup>
              <FormGroup>
                <Label>Subscription Plan</Label>
                <Select
                  value={userFormData.subscriptionPlan}
                  onChange={(e) => setUserFormData({...userFormData, subscriptionPlan: e.target.value})}
                >
                  <option value="free">Free</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={userFormData.isAdmin}
                    onChange={(e) => setUserFormData({...userFormData, isAdmin: e.target.checked})}
                  />
                  Admin User
                </CheckboxLabel>
              </FormGroup>
              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={userFormData.isActive}
                    onChange={(e) => setUserFormData({...userFormData, isActive: e.target.checked})}
                  />
                  Active Account
                </CheckboxLabel>
              </FormGroup>
              <ButtonGroup>
                <PrimaryButton onClick={handleSaveUser} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spinner" /> : 'Save Changes'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setIsUserModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <DangerButton onClick={() => handleDeleteUser(selectedUser)}>
                  Delete User
                </DangerButton>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Reset Password</h2>
              <CloseButton onClick={() => setIsPasswordModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>Reset password for: <strong>{selectedUser.name} ({selectedUser.email})</strong></p>
              <FormGroup>
                <Label>Temporary Password</Label>
                <PasswordContainer>
                  <Input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                  />
                  <RegenerateButton onClick={() => setTempPassword(generateTempPassword())}>
                    Regenerate
                  </RegenerateButton>
                </PasswordContainer>
                <HelpText>
                  This temporary password will be sent to the user's email. They will be required to change it on their next login.
                </HelpText>
              </FormGroup>
              <ButtonGroup>
                <PrimaryButton onClick={handleResetPasswordConfirm} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spinner" /> : 'Reset Password'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setIsPasswordModalOpen(false)}>
                  Cancel
                </SecondaryButton>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Message User Modal */}
      {isMessageModalOpen && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Message User</h2>
              <CloseButton onClick={() => setIsMessageModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>Send message to: <strong>{selectedUser.name} ({selectedUser.email})</strong></p>
              <FormGroup>
                <Label>Subject</Label>
                <Input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Enter message subject..."
                />
              </FormGroup>
              <FormGroup>
                <Label>Message</Label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter your message..."
                  rows={5}
                />
              </FormGroup>
              <ButtonGroup>
                <PrimaryButton
                  onClick={handleSendMessage}
                  disabled={actionLoading || !messageSubject || !messageBody}
                >
                  {actionLoading ? <FaSpinner className="spinner" /> : 'Send Message'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setIsMessageModalOpen(false)}>
                  Cancel
                </SecondaryButton>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && confirmAction && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Confirm Action</h2>
              <CloseButton onClick={() => setIsConfirmModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>{confirmAction.message}</p>
              <ButtonGroup>
                <DangerButton onClick={handleConfirmAction} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spinner" /> : 'Confirm'}
                </DangerButton>
                <SecondaryButton onClick={() => setIsConfirmModalOpen(false)}>
                  Cancel
                </SecondaryButton>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  p {
    color: ${props => props.theme['--text-secondary'] || '#666'};
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: 600;
    color: ${props => props.theme['--text-color'] || '#333'};
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  tbody tr:hover {
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  }
`;

const SortIcon = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  transform: ${props => props.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'};
  transition: transform 0.2s;
`;

const AdminBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background-color: rgba(156, 39, 176, 0.1);
  color: #9C27B0;
`;

const SubscriptionBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  ${props => {
    switch (props.plan) {
      case 'yearly':
        return `
          background-color: rgba(33, 150, 243, 0.1);
          color: #2196F3;
        `;
      case 'lifetime':
        return `
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        `;
      default:
        return `
          background-color: rgba(158, 158, 158, 0.1);
          color: #9E9E9E;
        `;
    }
  }}
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  ${props => props.active ? `
    background-color: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  ` : `
    background-color: rgba(244, 67, 54, 0.1);
    color: #F44336;
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: none;
  border: 1px solid #ddd;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
    color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  gap: 1rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.div`
  color: ${props => props.theme['--text-secondary'] || '#666'};
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
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;

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
  color: ${props => props.theme['--text-secondary'] || '#666'};

  &:hover {
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

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

const PrimaryButton = styled(Button)`
  background-color: ${props => props.theme['--primary-color'] || '#d95550'};
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background-color: ${props => props.theme['--primary-hover'] || '#c04540'};
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  border: 1px solid #ddd;

  &:hover:not(:disabled) {
    background-color: #f5f5f5;
  }
`;

const DangerButton = styled(Button)`
  background-color: #F44336;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background-color: #D32F2F;
  }
`;

const PasswordContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RegenerateButton = styled.button`
  padding: 0.75rem;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #eee;
  }
`;

const HelpText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
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
  gap: 0.5rem;
`;

export default AdminUserManagement;
