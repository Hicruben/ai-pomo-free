import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaUser, FaCog, FaSignOutAlt, FaProjectDiagram, FaClock, FaChartBar, FaEnvelope, FaCalendarAlt, FaPlay, FaPause, FaRobot, FaCrown, FaShieldAlt, FaBell, FaVolumeUp } from 'react-icons/fa';
import ContactModal from '../ContactModal';
import { useGlobalTimer } from '../../contexts/GlobalTimerContext';
import { useSettings } from '../../context/SettingsContext';

const Header = ({
  user,
  darkMode,
  openSettings,
  onLogout,
  activeTab,
  setActiveTab
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // Get timer state from global context
  const {
    isRunning,
    isPaused,
    timeRemaining,
    currentSession
  } = useGlobalTimer();

  // Get settings from context
  const { settings, saveSettings } = useSettings();

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  // Check if the pomodoro tab is active
  const isPomoPage = activeTab === 'pomodoro';

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Wrap setActiveTab to preserve active task information when switching tabs
  const handleTabChange = (tab) => {
    // Don't do anything if we're already on this tab
    if (tab === activeTab) {
      return;
    }

    console.log(`Header: Attempting to change tab from ${activeTab} to ${tab}`);

    // Dispatch a custom event for tab change
    // This will be intercepted by components that need to show warnings
    const event = new CustomEvent('changeTab', {
      detail: { tab },
      bubbles: true,
      cancelable: true
    });

    // Dispatch the event
    console.log('Header: Dispatching changeTab event');
    const prevented = !window.dispatchEvent(event);

    // Only change the tab if the event wasn't prevented
    if (!prevented) {
      console.log(`Header: Tab change to ${tab} was not prevented, proceeding`);
      // Change the active tab
      setActiveTab(tab);
    } else {
      console.log(`Header: Tab change to ${tab} was prevented by an event handler`);
    }
  };



  // Toggle browser notifications
  const toggleBrowserNotifications = async () => {
    // If notifications are already enabled in settings, disable them
    if (settings.notifications) {
      console.log('Disabling browser notifications');
      await saveSettings({ notifications: false });
      return;
    }

    // If notifications are disabled, check if we have permission
    if ('Notification' in window) {
      // If permission is not granted and not denied, request it
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        console.log('Requesting notification permission');
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        // Only enable notifications if permission was granted
        if (permission === 'granted') {
          console.log('Permission granted, enabling browser notifications');
          await saveSettings({ notifications: true });

          // Show a test notification
          new Notification('Notifications Enabled', {
            body: 'You will now receive notifications when timers complete.',
            icon: '/favicon.ico'
          });
        }
      } else if (Notification.permission === 'granted') {
        // If we already have permission, just enable notifications
        console.log('Permission already granted, enabling browser notifications');
        await saveSettings({ notifications: true });
      } else {
        // If permission is denied, show an alert
        alert('Browser notification permission is denied. Please enable notifications in your browser settings to use this feature.');
      }
    } else {
      alert('Browser notifications are not supported in your browser.');
    }
  };

  // Toggle sound notifications
  const toggleSoundNotifications = async () => {
    console.log('Toggling sound notifications');
    await saveSettings({ completionSound: !settings.completionSound });
  };

  // Check notification permission on mount and when it might change
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Log timer state changes for debugging
  useEffect(() => {
    if (isRunning) {
      console.log('[Header] Timer is running:', {
        timeRemaining,
        currentSession,
        isPaused
      });
    }
  }, [isRunning, isPaused, timeRemaining, currentSession]);

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>AI Pomo</Logo>

        <Navigation>
          <NavButton
            onClick={() => handleTabChange('pomodoro')}
            $isActive={isPomoPage}
            data-nav-button="true"
            data-nav-target="pomodoro"
          >
            <FaClock style={{ marginRight: '0.3rem' }} />
            Pomo
          </NavButton>

          <NavButton
            $isActive={activeTab === 'ai'}
            onClick={() => handleTabChange('ai')}
            data-nav-button="true"
            data-nav-target="ai"
          >
            <FaRobot style={{ marginRight: '0.3rem' }} />
            AI
          </NavButton>

          <NavButton
            $isActive={activeTab === 'projects'}
            onClick={() => handleTabChange('projects')}
            data-nav-button="true"
            data-nav-target="projects"
          >
            <FaProjectDiagram style={{ marginRight: '0.3rem' }} />
            Projects
          </NavButton>



          <NavButton
            $isActive={activeTab === 'calendar'}
            onClick={() => handleTabChange('calendar')}
            data-nav-button="true"
            data-nav-target="calendar"
          >
            <FaCalendarAlt style={{ marginRight: '0.3rem' }} />
            Calendar
          </NavButton>

          <NavButton
            $isActive={activeTab === 'stats'}
            onClick={() => handleTabChange('stats')}
            data-nav-button="true"
            data-nav-target="stats"
          >
            <FaChartBar style={{ marginRight: '0.3rem' }} />
            Stats
          </NavButton>



          {user?.isAdmin && (
            <NavButton
              $isActive={activeTab === 'admin'}
              onClick={() => handleTabChange('admin')}
              $isAdmin
              data-nav-button="true"
              data-nav-target="admin"
            >
              <FaShieldAlt style={{ marginRight: '0.3rem' }} />
              Admin
            </NavButton>
          )}
        </Navigation>

        {/* Timer display - only shown when timer is running or paused */}
        {(isRunning || isPaused) && (
          <HeaderTimerContainer>
            <HeaderTimerContent $session={currentSession} $isPaused={isPaused}>
              <TimerStatusIcon>
                {isPaused ? <FaPause /> : <FaPlay />}
              </TimerStatusIcon>
              <TimerDisplay>
                {formatTime(timeRemaining)}
              </TimerDisplay>
              <TimerSessionLabel>
                {currentSession === 'work' ? 'Focus' :
                 currentSession === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </TimerSessionLabel>
            </HeaderTimerContent>
          </HeaderTimerContainer>
        )}

        <HeaderActions>
          {/* Browser Notification Toggle Switch */}
          <ToggleContainer
            title={
              notificationPermission === 'denied'
                ? 'Browser notifications are blocked. Please update your browser settings to enable them.'
                : settings.notifications
                  ? 'Disable browser notifications'
                  : 'Enable browser notifications'
            }
          >
            <ToggleIcon>
              <FaBell />
            </ToggleIcon>
            <ToggleSwitch
              onClick={toggleBrowserNotifications}
              $active={settings.notifications && notificationPermission === 'granted'}
              $disabled={notificationPermission === 'denied'}
            >
              <ToggleSlider $active={settings.notifications && notificationPermission === 'granted'} />
            </ToggleSwitch>
          </ToggleContainer>

          {/* Sound Notification Toggle Switch */}
          <ToggleContainer
            title={settings.completionSound ? 'Disable sound notifications' : 'Enable sound notifications'}
          >
            <ToggleIcon>
              <FaVolumeUp />
            </ToggleIcon>
            <ToggleSwitch
              onClick={toggleSoundNotifications}
              $active={settings.completionSound}
            >
              <ToggleSlider $active={settings.completionSound} />
            </ToggleSwitch>
          </ToggleContainer>

          <IconButton onClick={openSettings}>
            <FaCog />
          </IconButton>

          <UserMenuContainer>
            <UserButton onClick={toggleUserMenu}>
              <UserAvatar>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <FaUser />
                )}
              </UserAvatar>
              <UserName>{user?.name || 'User'}</UserName>
            </UserButton>

            {showUserMenu && (
              <UserMenu>
                <UserMenuItem as={Link} to="/change-password">
                  <FaCog />
                  <span>Change Password</span>
                </UserMenuItem>
                <UserMenuItem onClick={onLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </UserMenuItem>
              </UserMenu>
            )}
          </UserMenuContainer>

          <ContactButton onClick={openContactModal}>
            <FaEnvelope />
            <span>Contact</span>
          </ContactButton>
        </HeaderActions>
      </HeaderContent>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  background: linear-gradient(to right, ${props => props.theme['--header-bg']}, ${props => props.theme['--header-bg-gradient'] || props.theme['--header-bg']});
  color: ${props => props.theme['--header-text']};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0;
`;

const HeaderContent = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 1.5rem;
  width: 100%;
  margin: 0 auto;
  max-width: 1800px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
`;

const Logo = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  grid-column: 1;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  letter-spacing: 0.02em;

  &::before {
    content: "🍅";
    margin-right: 0.5rem;
    -webkit-text-fill-color: initial;
    text-fill-color: initial;
  }

  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 1;
    margin-bottom: 0.5rem;
    text-align: center;
    justify-content: center;
    font-size: 1.3rem;
  }
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  grid-column: 2;
  min-width: 0;
  position: relative;

  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 2;
    width: 100%;
    margin: 0 0 0.75rem 0;
    justify-content: center;
    overflow-x: auto;
    padding-bottom: 0.25rem;

    /* Hide scrollbar but allow scrolling */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
    &::-webkit-scrollbar {
      display: none;  /* Chrome, Safari, Opera */
    }
  }
`;

const NavButton = styled.button`
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.$isActive ? props.theme['--nav-active-text'] || '#d95550' : props.theme['--nav-text']};
  background: ${props => props.$isActive ? props.theme['--nav-active-bg'] || 'rgba(217, 85, 80, 0.08)' : 'transparent'};
  padding: 0.6rem 1.25rem;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  position: relative;
  margin: 0 0.25rem;
  display: flex;
  align-items: center;
  white-space: nowrap;



  /* Special styling for admin button */
  ${props => props.$isAdmin && `
    background: ${props.$isActive ? 'rgba(33, 150, 243, 0.15)' : 'transparent'};
    color: ${props.$isActive ? '#2196F3' : props.theme['--nav-text']};

    &:hover {
      background: rgba(33, 150, 243, 0.1);
      color: #2196F3;
    }

    ${props.$isActive && `
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);

      &::after {
        background: #2196F3;
      }
    `}
  `}

  &:hover {
    color: ${props => props.$isActive ? props.theme['--nav-active-text'] || '#d95550' : '#d95550'};
    background: ${props => props.$isActive
      ? props.theme['--nav-active-bg'] || 'rgba(217, 85, 80, 0.08)'
      : props.theme['--nav-hover-bg'] || 'rgba(217, 85, 80, 0.05)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  ${props => props.$isActive && `
    box-shadow: 0 2px 8px rgba(217, 85, 80, 0.15);

    &::after {
      content: '';
      position: absolute;
      bottom: -0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 1.5rem;
      height: 0.25rem;
      background: #d95550;
      border-radius: 1rem;
    }
  `}

  svg {
    margin-right: 0.4rem;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  grid-column: 4;
  justify-self: end;
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 4;
    width: 100%;
    justify-content: space-between;
    padding: 0 0.5rem;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: ${props => props.theme['--header-text']};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: currentColor;
    opacity: 0;
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);

    &::before {
      opacity: 0.08;
      transform: scale(1);
    }
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 1.2rem;
    position: relative;
    z-index: 1;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme['--header-text']};
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: currentColor;
    opacity: 0;
    border-radius: 0.5rem;
    transform: scale(0.9);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);

    &::before {
      opacity: 0.08;
      transform: scale(1);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const UserAvatar = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(217, 85, 80, 0.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    font-size: 1.1rem;
    color: #999;
  }
`;

const UserName = styled.span`
  margin-left: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    display: none;
  }
`;

const ContactButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, ${props => props.theme['--primary-color'] || '#d95550'} 0%, ${props => props.theme['--primary-gradient'] || '#eb6b56'} 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(217, 85, 80, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 85, 80, 0.3);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(217, 85, 80, 0.2);
  }

  svg {
    font-size: 1rem;
    position: relative;
    z-index: 1;
  }

  span {
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const UserMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.75rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 10;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 12px;
    width: 12px;
    height: 12px;
    background: ${props => props.theme['--card-bg']};
    transform: rotate(45deg);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    border-left: 1px solid rgba(0, 0, 0, 0.05);
  }
`;

const UserMenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.85rem 1.2rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: ${props => props.theme['--text-color']};
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;

  &:hover {
    background-color: rgba(217, 85, 80, 0.05);
    color: #d95550;
  }

  &:active {
    background-color: rgba(217, 85, 80, 0.1);
  }

  svg {
    margin-right: 0.75rem;
    font-size: 1rem;
    color: #d95550;
  }
`;

// Timer related styled components
const HeaderTimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  grid-column: 3;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 3;
    margin: 0.5rem auto;
    order: 2;
  }
`;

const HeaderTimerContent = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.8rem;
  border-radius: 1.5rem;
  background-color: ${props => {
    if (props.$session === 'work') return props.$isPaused ? 'rgba(217, 85, 80, 0.1)' : 'rgba(217, 85, 80, 0.15)';
    if (props.$session === 'shortBreak') return props.$isPaused ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.15)';
    return props.$isPaused ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.15)';
  }};
  border: 1px solid ${props => {
    if (props.$session === 'work') return 'rgba(217, 85, 80, 0.2)';
    if (props.$session === 'shortBreak') return 'rgba(76, 175, 80, 0.2)';
    return 'rgba(33, 150, 243, 0.2)';
  }};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: ${props => {
      if (props.$session === 'work') return 'rgba(217, 85, 80, 0.2)';
      if (props.$session === 'shortBreak') return 'rgba(76, 175, 80, 0.2)';
      return 'rgba(33, 150, 243, 0.2)';
    }};
  }
`;

const TimerStatusIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  color: #d95550;
  font-size: 0.8rem;
`;

const TimerDisplay = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  margin-right: 0.5rem;
  color: ${props => props.theme['--text-color']};
`;

const TimerSessionLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme['--text-secondary']};
  font-weight: 500;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 0.5rem;
  padding: 0.25rem;
  position: relative;
`;

const ToggleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  color: ${props => props.theme['--header-text']};

  svg {
    font-size: 1.2rem;
  }
`;

const ToggleSwitch = styled.button`
  position: relative;
  display: inline-block;
  width: 2.5rem;
  height: 1.25rem;
  background-color: ${props => props.$active ? '#4caf50' : '#ccc'};
  border-radius: 1.25rem;
  border: none;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.3s;
  opacity: ${props => props.$disabled ? 0.5 : 1};

  &:hover {
    opacity: ${props => props.$disabled ? 0.5 : 0.9};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.25);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 0.125rem;
  left: ${props => props.$active ? 'calc(100% - 1rem - 0.125rem)' : '0.125rem'};
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.3s;
`;

export default Header;
