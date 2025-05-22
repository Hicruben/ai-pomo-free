import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaChartLine, FaUsers, FaMoneyBillWave, FaCog,
  FaTachometerAlt, FaUserCog, FaFileInvoiceDollar, FaSpinner,
  FaDatabase
} from 'react-icons/fa';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';

import AdminBackupPage from './AdminBackupPage';
import { adminApi } from '../../services/apiService';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: '--',
    totalProjects: '--',
    totalPomodoros: '--'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const quickStats = await adminApi.getQuickStats();
      setStats({
        totalUsers: quickStats.totalUsers || '--',
        totalProjects: quickStats.totalProjects || '--',
        totalPomodoros: quickStats.totalPomodoros || '--'
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUserManagement />;

      case 'backups':
        return <AdminBackupPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminContainer>
      <Sidebar>
        <SidebarHeader>
          <FaCog />
          <h2>Admin Panel</h2>
        </SidebarHeader>

        <SidebarMenu>
          <SidebarMenuItem
            $isActive={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          >
            <FaTachometerAlt />
            <span>Dashboard</span>
          </SidebarMenuItem>

          <SidebarMenuItem
            $isActive={activeSection === 'users'}
            onClick={() => setActiveSection('users')}
          >
            <FaUserCog />
            <span>User Management</span>
          </SidebarMenuItem>



          <SidebarMenuItem
            $isActive={activeSection === 'backups'}
            onClick={() => setActiveSection('backups')}
          >
            <FaDatabase />
            <span>Database Backup</span>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarFooter>
          <AdminStats>
            {isLoading ? (
              <LoadingStats>
                <FaSpinner className="spinner" />
                <span>Loading stats...</span>
              </LoadingStats>
            ) : (
              <>
                <StatItem>
                  <FaUsers />
                  <span>Users</span>
                  <StatValue>{stats.totalUsers}</StatValue>
                </StatItem>
                <StatItem>
                  <FaChartLine />
                  <span>Projects</span>
                  <StatValue>{stats.totalProjects}</StatValue>
                </StatItem>
                <StatItem>
                  <FaMoneyBillWave />
                  <span>Pomodoros</span>
                  <StatValue>{stats.totalPomodoros}</StatValue>
                </StatItem>
              </>
            )}
          </AdminStats>
        </SidebarFooter>
      </Sidebar>

      <MainContent>
        {renderSection()}
      </MainContent>
    </AdminContainer>
  );
};

// Styled Components
const AdminContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 60px); /* Adjust based on your header height */
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  svg {
    color: ${props => props.theme['--primary-color'] || '#d95550'};
    font-size: 1.25rem;
  }
`;

const SidebarMenu = styled.nav`
  flex: 1;
  padding: 1.5rem 0;
`;

const SidebarMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: ${props => props.$isActive ? 'rgba(217, 85, 80, 0.08)' : 'transparent'};
  border: none;
  text-align: left;
  color: ${props => props.$isActive ? props.theme['--primary-color'] || '#d95550' : props.theme['--text-color'] || '#333'};
  font-weight: ${props => props.$isActive ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(217, 85, 80, 0.05);
  }

  svg {
    font-size: 1.1rem;
  }
`;

const SidebarFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #eee;
`;

const AdminStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-size: 0.875rem;

  svg {
    color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const StatValue = styled.span`
  margin-left: auto;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  overflow-y: auto;
`;

const LoadingStats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-size: 0.875rem;

  .spinner {
    margin-bottom: 0.5rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default AdminPage;
