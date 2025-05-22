import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import {
  FaUsers, FaMoneyBillWave, FaTasks, FaProjectDiagram,
  FaClock, FaCalendarAlt, FaChartLine, FaSpinner,
  FaUserPlus, FaExclamationTriangle, FaCalendarDay,
  FaCheckCircle, FaHourglassHalf, FaUserClock, FaRegCreditCard,
  FaFilter, FaCalendarWeek, FaHistory, FaAngleDown, FaCalendarPlus
} from 'react-icons/fa';
import { adminApi } from '../../services/apiService';
import { Line, Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Add global styles for the date picker
const GlobalStyle = createGlobalStyle`
  .react-datepicker {
    font-family: inherit;
    border-color: #ddd;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .react-datepicker-popper {
    z-index: 9999 !important;
  }

  .react-datepicker__header {
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .react-datepicker__day--selected {
    background-color: #d95550 !important;
    color: white !important;
  }

  .react-datepicker__day--keyboard-selected {
    background-color: rgba(217, 85, 80, 0.7) !important;
    color: white !important;
  }

  .react-datepicker__day--in-range {
    background-color: rgba(217, 85, 80, 0.2) !important;
  }

  .react-datepicker__day--in-selecting-range {
    background-color: rgba(217, 85, 80, 0.3) !important;
  }

  .react-datepicker__month-select,
  .react-datepicker__year-select {
    padding: 0.25rem;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .react-datepicker__day:hover {
    background-color: rgba(217, 85, 80, 0.1) !important;
  }

  .react-datepicker__triangle {
    display: none !important;
  }
`;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isTodayLoading, setIsTodayLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayError, setTodayError] = useState('');

  // New state for enhanced time range selector
  const [selectedTimeRange, setSelectedTimeRange] = useState('this_week');
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date()
  });
  const timeRangeDropdownRef = useRef(null);

  // Custom input component for date picker
  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <CustomDateInputContainer onClick={onClick} ref={ref}>
      <FaCalendarAlt />
      <span>{value}</span>
    </CustomDateInputContainer>
  ));

  // Display name for debugging
  CustomDateInput.displayName = 'CustomDateInput';

  useEffect(() => {
    // Set default time range and fetch data
    fetchStats();
    fetchTodayStats();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (timeRangeDropdownRef.current && !timeRangeDropdownRef.current.contains(event.target)) {
        setIsTimeRangeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch stats when time range changes
  useEffect(() => {
    if (selectedTimeRange !== 'custom') {
      fetchStats();
    }
  }, [selectedTimeRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');

    try {
      let params = {};

      // Determine the time range parameters based on selection
      switch (selectedTimeRange) {
        case 'all':
          params = { timeRange: 'all' };
          break;
        case 'today':
          params = { timeRange: 'today' };
          break;
        case 'this_week':
          params = { timeRange: 'this_week' };
          break;
        case 'last_week':
          params = { timeRange: 'last_week' };
          break;
        case 'this_month':
          params = { timeRange: 'this_month' };
          break;
        case 'last_month':
          params = { timeRange: 'last_month' };
          break;
        case 'this_year':
          params = { timeRange: 'this_year' };
          break;
        case 'last_year':
          params = { timeRange: 'last_year' };
          break;
        case 'custom':
          params = {
            timeRange: 'custom',
            startDate: customDateRange.startDate.toISOString(),
            endDate: customDateRange.endDate.toISOString()
          };
          break;
        default:
          params = { timeRange: 'this_week' };
      }

      const data = await adminApi.getStats(params);
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayStats = async () => {
    setIsTodayLoading(true);
    setTodayError('');

    try {
      const data = await adminApi.getTodayStats();
      setTodayStats(data);
    } catch (error) {
      console.error('Error fetching today stats:', error);
      setTodayError('Failed to load today\'s statistics. Please try again.');
    } finally {
      setIsTodayLoading(false);
    }
  };

  // Format date for charts
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare chart data for user registrations
  const getUserRegistrationChartData = () => {
    if (!stats || !stats.userRegistrations) return null;

    return {
      labels: stats.userRegistrations.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'New Users',
          data: stats.userRegistrations.map(item => item.count),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        }
      ]
    };
  };

  // Prepare chart data for payments
  const getPaymentChartData = () => {
    if (!stats || !stats.payments) return null;

    return {
      labels: stats.payments.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'Revenue ($)',
          data: stats.payments.map(item => item.amount),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
        }
      ]
    };
  };

  // Prepare chart data for pomodoros
  const getPomodoroChartData = () => {
    if (!stats || !stats.pomodoros) return null;

    return {
      labels: stats.pomodoros.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'Completed Pomodoros',
          data: stats.pomodoros.map(item => item.count),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <FaSpinner className="spinner" />
        <span>Loading statistics...</span>
      </LoadingContainer>
    );
  }

  return (
    <DashboardContainer>
      <GlobalStyle />
      <DashboardHeader>
        <h1>Admin Dashboard</h1>
      </DashboardHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {todayError && <ErrorMessage>{todayError}</ErrorMessage>}

      {/* Today's Activity Section */}
      <SectionHeader>
        <SectionTitle>
          <FaCalendarDay />
          <h2>Today's Activity</h2>
        </SectionTitle>
        <SectionDate>
          {todayStats?.date ? (
            <>
              {new Date(todayStats.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {todayStats.timezone && <TimezoneInfo>({todayStats.timezone})</TimezoneInfo>}
            </>
          ) : 'Loading...'}
        </SectionDate>
      </SectionHeader>

      {isTodayLoading ? (
        <LoadingContainer>
          <FaSpinner className="spinner" />
          <span>Loading today's statistics...</span>
        </LoadingContainer>
      ) : todayStats ? (
        <TodayStatsGrid>
          <TodayStatCard>
            <TodayStatIcon $color="#4CAF50">
              <FaUserPlus />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.newUsers}</TodayStatValue>
              <TodayStatLabel>New Users</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#2196F3">
              <FaUserClock />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.activeUsers}</TodayStatValue>
              <TodayStatLabel>Active Users</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#FF9800">
              <FaClock />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.pomodoros.count}</TodayStatValue>
              <TodayStatLabel>Pomodoros Completed</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#E91E63">
              <FaHourglassHalf />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>
                {Math.floor(todayStats.pomodoros.totalMinutes / 60)}h {todayStats.pomodoros.totalMinutes % 60}m
              </TodayStatValue>
              <TodayStatLabel>Focus Time</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#9C27B0">
              <FaProjectDiagram />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.projects.new}</TodayStatValue>
              <TodayStatLabel>New Projects</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#673AB7">
              <FaCheckCircle />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.projects.completed}</TodayStatValue>
              <TodayStatLabel>Completed Projects</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#00BCD4">
              <FaTasks />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.tasks.new}</TodayStatValue>
              <TodayStatLabel>New Tasks</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard>
            <TodayStatIcon $color="#4CAF50">
              <FaCheckCircle />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>{todayStats.tasks.completed}</TodayStatValue>
              <TodayStatLabel>Completed Tasks</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>

          <TodayStatCard $wide>
            <TodayStatIcon $color="#F44336">
              <FaRegCreditCard />
            </TodayStatIcon>
            <TodayStatContent>
              <TodayStatValue>${todayStats.revenue.amount}</TodayStatValue>
              <TodayStatLabel>Revenue Today ({todayStats.revenue.transactions} transactions)</TodayStatLabel>
            </TodayStatContent>
          </TodayStatCard>
        </TodayStatsGrid>
      ) : null}

      <SectionDivider />

      <SectionHeader>
        <SectionTitle>
          <FaChartLine />
          <h2>Overall Statistics</h2>
        </SectionTitle>

        <TimeRangeContainer>
          <TimeRangeDropdown ref={timeRangeDropdownRef}>
            <TimeRangeButton
              onClick={() => setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen)}
            >
              <FaFilter />
              <span>
                {selectedTimeRange === 'all' && 'All Time'}
                {selectedTimeRange === 'today' && 'Today'}
                {selectedTimeRange === 'this_week' && 'This Week'}
                {selectedTimeRange === 'last_week' && 'Last Week'}
                {selectedTimeRange === 'this_month' && 'This Month'}
                {selectedTimeRange === 'last_month' && 'Last Month'}
                {selectedTimeRange === 'this_year' && 'This Year'}
                {selectedTimeRange === 'last_year' && 'Last Year'}
                {selectedTimeRange === 'custom' && 'Custom Range'}
              </span>
              <FaAngleDown />
            </TimeRangeButton>

            {isTimeRangeDropdownOpen && (
              <TimeRangeOptions>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('all');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'all'}
                >
                  All Time
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('today');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'today'}
                >
                  Today
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('this_week');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'this_week'}
                >
                  This Week
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('last_week');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'last_week'}
                >
                  Last Week
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('this_month');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'this_month'}
                >
                  This Month
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('last_month');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'last_month'}
                >
                  Last Month
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('this_year');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'this_year'}
                >
                  This Year
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('last_year');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'last_year'}
                >
                  Last Year
                </TimeRangeOption>
                <TimeRangeOption
                  onClick={() => {
                    setSelectedTimeRange('custom');
                    setIsTimeRangeDropdownOpen(false);
                  }}
                  $isActive={selectedTimeRange === 'custom'}
                >
                  Custom Range
                </TimeRangeOption>
              </TimeRangeOptions>
            )}
          </TimeRangeDropdown>

          {selectedTimeRange === 'custom' && (
            <DateRangePickerContainer>
              <DatePicker
                selected={customDateRange.startDate}
                onChange={(date) => setCustomDateRange({...customDateRange, startDate: date})}
                selectsStart
                startDate={customDateRange.startDate}
                endDate={customDateRange.endDate}
                maxDate={customDateRange.endDate}
                dateFormat="yyyy/MM/dd"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                customInput={<CustomDateInput />}
              />
              <DateRangeSeparator>-</DateRangeSeparator>
              <DatePicker
                selected={customDateRange.endDate}
                onChange={(date) => setCustomDateRange({...customDateRange, endDate: date})}
                selectsEnd
                startDate={customDateRange.startDate}
                endDate={customDateRange.endDate}
                minDate={customDateRange.startDate}
                maxDate={new Date()}
                dateFormat="yyyy/MM/dd"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                customInput={<CustomDateInput />}
              />
              <ApplyDateRangeButton
                onClick={() => {
                  fetchStats();
                }}
              >
                Apply
              </ApplyDateRangeButton>
            </DateRangePickerContainer>
          )}
        </TimeRangeContainer>
      </SectionHeader>

      {stats && (
        <>
          {/* Summary Stats Cards */}
          <StatCardsContainer>
            <StatCard>
              <StatIconWrapper $color="#4CAF50">
                <FaUsers />
              </StatIconWrapper>
              <StatContent>
                <StatValue>{stats.totalUsers}</StatValue>
                <StatLabel>Total Users</StatLabel>
              </StatContent>
              <StatTrend $positive={true}>
                <FaChartLine />
                <span>+{stats.newUsers} new</span>
              </StatTrend>
            </StatCard>

            <StatCard>
              <StatIconWrapper $color="#2196F3">
                <FaMoneyBillWave />
              </StatIconWrapper>
              <StatContent>
                <StatValue>${stats.totalRevenue}</StatValue>
                <StatLabel>Total Revenue</StatLabel>
              </StatContent>
              <StatTrend $positive={stats.revenueChange >= 0}>
                <FaChartLine />
                <span>{stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%</span>
              </StatTrend>
            </StatCard>

            <StatCard>
              <StatIconWrapper $color="#FF9800">
                <FaClock />
              </StatIconWrapper>
              <StatContent>
                <StatValue>{stats.totalPomodoros}</StatValue>
                <StatLabel>Total Pomodoros</StatLabel>
              </StatContent>
              <StatTrend $positive={true}>
                <FaChartLine />
                <span>+{stats.newPomodoros} new</span>
              </StatTrend>
            </StatCard>

            <StatCard>
              <StatIconWrapper $color="#9C27B0">
                <FaProjectDiagram />
              </StatIconWrapper>
              <StatContent>
                <StatValue>{stats.totalProjects}</StatValue>
                <StatLabel>Total Projects</StatLabel>
              </StatContent>
              <StatTrend $positive={true}>
                <FaChartLine />
                <span>+{stats.newProjects} new</span>
              </StatTrend>
            </StatCard>
          </StatCardsContainer>

          {/* Charts */}
          <ChartsContainer>
            <ChartCard>
              <ChartHeader>
                <h3>User Registrations</h3>
                <FaUserPlus />
              </ChartHeader>
              <ChartContainer>
                {getUserRegistrationChartData() ? (
                  <Line data={getUserRegistrationChartData()} options={chartOptions} />
                ) : (
                  <NoDataMessage>No registration data available</NoDataMessage>
                )}
              </ChartContainer>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <h3>Revenue</h3>
                <FaMoneyBillWave />
              </ChartHeader>
              <ChartContainer>
                {getPaymentChartData() ? (
                  <Bar data={getPaymentChartData()} options={chartOptions} />
                ) : (
                  <NoDataMessage>No payment data available</NoDataMessage>
                )}
              </ChartContainer>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <h3>Pomodoro Activity</h3>
                <FaClock />
              </ChartHeader>
              <ChartContainer>
                {getPomodoroChartData() ? (
                  <Line data={getPomodoroChartData()} options={chartOptions} />
                ) : (
                  <NoDataMessage>No pomodoro data available</NoDataMessage>
                )}
              </ChartContainer>
            </ChartCard>
          </ChartsContainer>
        </>
      )}
    </DashboardContainer>
  );
};

// Styled Components
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const DashboardHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  p {
    color: ${props => props.theme['--text-secondary'] || '#666'};
    margin-bottom: 1rem;
  }
`;



const StatCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  position: relative;
`;

const StatIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => `${props.$color}20` || '#f5f5f5'};
  color: ${props => props.$color || '#333'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

const StatTrend = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  color: ${props => props.$positive ? '#4CAF50' : '#F44336'};

  svg {
    margin-right: 0.25rem;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const ChartCard = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    margin: 0;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  svg {
    color: ${props => props.theme['--text-secondary'] || '#666'};
  }
`;

const ChartContainer = styled.div`
  height: 250px;
  position: relative;
`;

const NoDataMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-style: italic;
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

// Today's Activity Styled Components
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h2 {
    font-size: 1.5rem;
    margin: 0;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  svg {
    color: ${props => props.theme['--primary-color'] || '#d95550'};
    font-size: 1.5rem;
  }
`;

const SectionDate = styled.div`
  font-size: 1rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-weight: 500;
`;

const TimezoneInfo = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-weight: 400;
  margin-left: 0.5rem;
  opacity: 0.8;
`;

const SectionDivider = styled.hr`
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 2.5rem 0;
`;

const TodayStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TodayStatCard = styled.div`
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  grid-column: ${props => props.$wide ? 'span 2' : 'span 1'};

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const TodayStatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => `${props.$color}15` || '#f5f5f5'};
  color: ${props => props.$color || '#333'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
`;

const TodayStatContent = styled.div`
  flex: 1;
`;

const TodayStatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
  margin-bottom: 0.25rem;
`;

const TodayStatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

// Time Range Selector Styled Components
const TimeRangeContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TimeRangeDropdown = styled.div`
  position: relative;
`;

const TimeRangeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border: 1px solid #ddd;
  border-radius: 4px;
  color: ${props => props.theme['--text-color'] || '#333'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  }

  svg:last-child {
    margin-left: 0.25rem;
    font-size: 0.75rem;
  }
`;

const TimeRangeOptions = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
`;

const TimeRangeOption = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.$isActive ? 'rgba(217, 85, 80, 0.08)' : 'transparent'};
  color: ${props => props.$isActive ? props.theme['--primary-color'] || '#d95550' : props.theme['--text-color'] || '#333'};
  font-weight: ${props => props.$isActive ? '600' : '400'};

  &:hover {
    background-color: ${props => props.$isActive ? 'rgba(217, 85, 80, 0.12)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

// Date Range Picker Styled Components
const DateRangePickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .react-datepicker-wrapper {
    width: auto;
  }

  .react-datepicker__input-container {
    display: flex;
  }

  .react-datepicker-popper {
    z-index: 9999 !important;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;

    .react-datepicker-wrapper {
      width: 100%;
    }
  }
`;

const CustomDateInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: ${props => props.theme['--card-bg'] || '#fff'};
  border: 1px solid #ddd;
  border-radius: 4px;
  color: ${props => props.theme['--text-color'] || '#333'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  height: 36px;
  box-sizing: border-box;

  &:hover {
    background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  }

  &:active {
    background-color: ${props => props.theme['--bg-color'] || '#f0f0f0'};
  }

  svg {
    color: ${props => props.theme['--text-secondary'] || '#666'};
    font-size: 0.875rem;
    margin-right: 0.25rem;
  }

  span {
    font-size: 0.875rem;
  }
`;

const DateRangeSeparator = styled.div`
  padding: 0 0.25rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

const ApplyDateRangeButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme['--primary-color'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  height: 36px;

  &:hover {
    background-color: ${props => props.theme['--primary-hover'] || '#c04540'};
  }
`;

export default AdminDashboard;
