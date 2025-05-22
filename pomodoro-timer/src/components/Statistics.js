import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaFire, FaTrophy, FaCalendarAlt, FaChartLine,
  FaCheckCircle, FaStar, FaChartBar, FaCalendarCheck
} from 'react-icons/fa';
import {
  calculateLevel,
  levelProgressPercentage,
  experienceForNextLevel,
  achievements,
  getTodayDateString,
  getYesterdayDateString,
  getDateStringDaysAgo,
  processPomodoroDataWithTimezone,
  processDurationsWithTimezone
} from '../utils/statsUtils';
import { statsApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';
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
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Statistics = () => {
  const [activeTab, setActiveTab] = useState('daily');

  // Stats state
  const [stats, setStats] = useState({
    totalPomodoros: 0,
    totalDuration: 0,
    pomodorosByDate: {},
    durationsByDate: {},
    completedTasks: 0,
    experiencePoints: 0,
    unlockedAchievements: ['first_pomodoro'],
    currentStreak: 0,
    longestStreak: 0,
    maxPomodorosInDay: 0
  });

  // Load stats from API or localStorage
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (isAuthenticated()) {
          // Load from API if authenticated
          const userStats = await statsApi.getStats();
          if (userStats) {
            // Debug pomodoro counts
            console.log('Statistics: Stats data received:', userStats);
            console.log('Statistics: pomodorosByDate type:', typeof userStats.pomodorosByDate);
            console.log('Statistics: pomodorosByDate instanceof Map:', userStats.pomodorosByDate instanceof Map);

            if (userStats.pomodorosByDate instanceof Map) {
              console.log('Statistics: pomodorosByDate keys (Map):', Array.from(userStats.pomodorosByDate.keys()));
            } else if (typeof userStats.pomodorosByDate === 'object' && userStats.pomodorosByDate !== null) {
              console.log('Statistics: pomodorosByDate keys (Object):', Object.keys(userStats.pomodorosByDate));
            }

            console.log('Statistics: Raw pomodorosByDate before processing:', userStats.pomodorosByDate);
            console.log('Statistics: Raw durationsByDate before processing:', userStats.durationsByDate);

            // Process pomodoro data with timezone conversion
            const processedPomodoroData = processPomodoroDataWithTimezone(userStats.pomodorosByDate);
            console.log('Statistics: Processed pomodoro data with timezone conversion:', processedPomodoroData);

            // Process durations data with timezone conversion if available
            let processedDurationsData = {};
            if (userStats.durationsByDate) {
              processedDurationsData = processDurationsWithTimezone(userStats.durationsByDate);
              console.log('Statistics: Processed durations data with timezone conversion:', processedDurationsData);
            } else {
              console.log('Statistics: No durations data available, using default values');
            }

            // Update the userStats object with the processed data
            userStats.pomodorosByDate = processedPomodoroData;
            userStats.durationsByDate = processedDurationsData;

            // Check for today's pomodoro count in local timezone
            const today = getTodayDateString();
            console.log(`Statistics: Today's date string: ${today}`);

            const todayCount = processedPomodoroData[today] || 0;
            const todayDuration = processedDurationsData[today] || 0;

            console.log(`Statistics: Today's (${today}) pomodoro count after timezone conversion:`, todayCount);
            console.log(`Statistics: Today's (${today}) duration after timezone conversion:`, todayDuration);

            // If today's count is 0 but we have pomodoros, let's check all dates
            if (todayCount === 0 && Object.keys(processedPomodoroData).length > 0) {
              console.log('Statistics: All dates in processed data:', Object.keys(processedPomodoroData));

              // Check if there's a date that might be today but in a different format
              const allDates = Object.keys(processedPomodoroData);
              const todayDate = new Date();
              console.log(`Statistics: Today's date object:`, todayDate);

              for (const dateStr of allDates) {
                const date = new Date(dateStr);
                console.log(`Statistics: Comparing ${dateStr} (${date}) with today (${todayDate})`);

                // Check if year, month, and day match
                if (date.getFullYear() === todayDate.getFullYear() &&
                    date.getMonth() === todayDate.getMonth() &&
                    date.getDate() === todayDate.getDate()) {
                  console.log(`Statistics: Found matching date: ${dateStr} with count: ${processedPomodoroData[dateStr]}`);
                }
              }
            }

            setStats(userStats);
          }
        } else {
          // Load from localStorage if not authenticated
          const savedStats = localStorage.getItem('pomodoroStats');
          if (savedStats) {
            setStats(JSON.parse(savedStats));
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to localStorage if API fails
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      }
    };

    loadStats();

    // Set up interval to refresh stats with a longer interval
    const intervalId = setInterval(loadStats, 300000); // Refresh every 5 minutes instead of 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Calculate level and progress
  const level = calculateLevel(stats.experiencePoints);
  const levelProgress = levelProgressPercentage(stats.experiencePoints);
  const xpForNextLevel = experienceForNextLevel(level);
  const xpInCurrentLevel = stats.experiencePoints - experienceForNextLevel(level - 1);

  // Calculate time periods
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Get last 7 days for weekly view
  const last7Days = Array.from({ length: 7 }, (_, i) => getDateStringDaysAgo(i)).reverse();

  // Get last 30 days for monthly view
  const last30Days = Array.from({ length: 30 }, (_, i) => getDateStringDaysAgo(i)).reverse();

  // Helper function to get pomodoro count for a date
  const getPomodoroCount = (date) => {
    let count = 0;
    if (stats.pomodorosByDate instanceof Map) {
      count = stats.pomodorosByDate.get(date) || 0;
      console.log(`Getting pomodoro count for ${date} from Map: ${count}`);
    } else if (typeof stats.pomodorosByDate === 'object' && stats.pomodorosByDate !== null) {
      count = stats.pomodorosByDate[date] || 0;
      console.log(`Getting pomodoro count for ${date} from object: ${count}`);

      // If count is 0, let's check all keys to see if there's a date format issue
      if (count === 0 && Object.keys(stats.pomodorosByDate).length > 0) {
        console.log(`Available dates in pomodorosByDate:`, Object.keys(stats.pomodorosByDate));
      }
    }
    return count;
  };

  // Helper function to get duration for a date
  const getDuration = (date) => {
    // Check if durationsByDate exists and has data
    if (stats.durationsByDate) {
      if (stats.durationsByDate instanceof Map && stats.durationsByDate.size > 0) {
        return stats.durationsByDate.get(date) || 0;
      } else if (typeof stats.durationsByDate === 'object' &&
                stats.durationsByDate !== null &&
                Object.keys(stats.durationsByDate).length > 0) {
        return stats.durationsByDate[date] || 0;
      }
    }

    // If we get here, either durationsByDate doesn't exist, is empty, or doesn't have data for this date
    // Fallback to default calculation using the pomodoro count and default duration (25 minutes)
    console.log(`Using fallback duration calculation for ${date}: ${getPomodoroCount(date)} pomodoros * 25 minutes`);
    return getPomodoroCount(date) * 25;
  };

  // Calculate pomodoros for different time periods
  const pomodorosToday = getPomodoroCount(today);
  const pomodorosYesterday = getPomodoroCount(yesterday);

  // Calculate durations for different time periods
  console.log(`Today's date: ${today}`);
  console.log(`Pomodoros today: ${pomodorosToday}`);
  console.log(`Stats durationsByDate:`, stats.durationsByDate);
  const durationToday = getDuration(today);
  console.log(`Duration today: ${durationToday}`);

  // Calculate weekly pomodoros and durations
  const pomodorosThisWeek = last7Days.reduce((sum, date) => {
    return sum + getPomodoroCount(date);
  }, 0);

  const durationThisWeek = last7Days.reduce((sum, date) => {
    return sum + getDuration(date);
  }, 0);

  // Calculate monthly pomodoros and durations
  const pomodorosThisMonth = last30Days.reduce((sum, date) => {
    return sum + getPomodoroCount(date);
  }, 0);

  const durationThisMonth = last30Days.reduce((sum, date) => {
    return sum + getDuration(date);
  }, 0);

  // Calculate average pomodoros per day (this week)
  const avgPomodorosPerDayWeek = pomodorosThisWeek / 7;

  // Calculate average pomodoros per day (this month)
  const avgPomodorosPerDayMonth = pomodorosThisMonth / 30;

  // Calculate most productive day of the week
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat

  // Handle both Map and plain object formats
  if (stats.pomodorosByDate instanceof Map) {
    // If it's a Map, iterate through entries
    stats.pomodorosByDate.forEach((count, dateStr) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayOfWeekCounts[dayOfWeek] += count;
    });
  } else if (typeof stats.pomodorosByDate === 'object' && stats.pomodorosByDate !== null) {
    // If it's a plain object, use Object.entries
    Object.entries(stats.pomodorosByDate).forEach(([dateStr, count]) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayOfWeekCounts[dayOfWeek] += count;
    });
  }

  // Reorder day counts to start with Monday (move Sunday to the end)
  const mondayFirstDayCounts = [...dayOfWeekCounts.slice(1), dayOfWeekCounts[0]];
  const mostProductiveDayIndex = mondayFirstDayCounts.indexOf(Math.max(...mondayFirstDayCounts));
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mostProductiveDay = daysOfWeek[mostProductiveDayIndex];

  // Prepare data for weekly chart
  const weeklyChartData = {
    labels: last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pomodoros',
        data: last7Days.map(date => getPomodoroCount(date)),
        borderColor: '#d95550',
        backgroundColor: 'rgba(217, 85, 80, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Prepare data for monthly chart
  const monthlyChartData = {
    labels: last30Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pomodoros',
        data: last30Days.map(date => getPomodoroCount(date)),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Prepare data for day of week chart
  const dayOfWeekChartData = {
    labels: daysOfWeek,
    datasets: [
      {
        label: 'Pomodoros by Day of Week',
        data: mondayFirstDayCounts,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',  // Monday - Blue
          'rgba(255, 206, 86, 0.7)',  // Tuesday - Yellow
          'rgba(75, 192, 192, 0.7)',  // Wednesday - Teal
          'rgba(153, 102, 255, 0.7)', // Thursday - Purple
          'rgba(255, 159, 64, 0.7)',  // Friday - Orange
          'rgba(199, 199, 199, 0.7)', // Saturday - Gray
          'rgba(255, 99, 132, 0.7)',  // Sunday - Red
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for task completion pie chart
  const taskCompletionChartData = {
    labels: ['Completed Tasks', 'Total Pomodoros'],
    datasets: [
      {
        data: [stats.completedTasks, stats.totalPomodoros],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(217, 85, 80, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
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
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <StatisticsContainer>
      <h2>Statistics Dashboard</h2>

      {/* Summary Cards */}
      <StatCards>
        <StatCard>
          <StatIcon>🍅</StatIcon>
          <StatValue>{pomodorosToday}</StatValue>
          <StatLabel>Today</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaFire />
          </StatIcon>
          <StatValue>{stats.currentStreak}</StatValue>
          <StatLabel>Day Streak</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>⭐</StatIcon>
          <StatValue>{level}</StatValue>
          <StatLabel>Level</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaCalendarAlt />
          </StatIcon>
          <StatValue>{pomodorosThisWeek}</StatValue>
          <StatLabel>This Week</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaCheckCircle />
          </StatIcon>
          <StatValue>{stats.completedTasks}</StatValue>
          <StatLabel>Tasks Done</StatLabel>
        </StatCard>
      </StatCards>

      {/* Level Progress */}
      <LevelSection>
        <LevelInfo>
          <LevelTitle>Level {level}</LevelTitle>
          <LevelXP>{xpInCurrentLevel} / {xpForNextLevel} XP</LevelXP>
        </LevelInfo>
        <ProgressBar>
          <ProgressFill width={levelProgress} />
        </ProgressBar>
      </LevelSection>

      {/* Time Period Tabs */}
      <TabsContainer>
        <Tab
          active={activeTab === 'daily'}
          onClick={() => handleTabChange('daily')}
        >
          Daily
        </Tab>
        <Tab
          active={activeTab === 'weekly'}
          onClick={() => handleTabChange('weekly')}
        >
          Weekly
        </Tab>
        <Tab
          active={activeTab === 'monthly'}
          onClick={() => handleTabChange('monthly')}
        >
          Monthly
        </Tab>
        <Tab
          active={activeTab === 'insights'}
          onClick={() => handleTabChange('insights')}
        >
          Insights
        </Tab>
      </TabsContainer>

      {/* Tab Content */}
      <TabContent>
        {/* Daily Tab */}
        {activeTab === 'daily' && (
          <TabPanel>
            <SectionTitle>
              <FaChartBar /> Today's Progress
            </SectionTitle>

            <StatsGrid>
              <StatsCard>
                <StatsCardTitle>Pomodoros Today</StatsCardTitle>
                <StatsCardValue>{pomodorosToday}</StatsCardValue>
                <StatsCardCompare>
                  {pomodorosToday > pomodorosYesterday
                    ? `+${pomodorosToday - pomodorosYesterday} from yesterday`
                    : pomodorosToday < pomodorosYesterday
                      ? `-${pomodorosYesterday - pomodorosToday} from yesterday`
                      : 'Same as yesterday'}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Focus Time</StatsCardTitle>
                <StatsCardValue>{Math.round(durationToday)} min</StatsCardValue>
                <StatsCardCompare>
                  {durationToday > 0
                    ? `That's ${Math.round(durationToday / 60)} hours of focus!`
                    : 'Start your first pomodoro today!'}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Current Streak</StatsCardTitle>
                <StatsCardValue>{stats.currentStreak} days</StatsCardValue>
                <StatsCardCompare>
                  {stats.currentStreak > 0
                    ? `Best streak: ${stats.longestStreak} days`
                    : 'Start your streak today!'}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Experience Gained</StatsCardTitle>
                <StatsCardValue>{pomodorosToday * 15} XP</StatsCardValue>
                <StatsCardCompare>
                  {`${xpForNextLevel - xpInCurrentLevel} XP to level ${level + 1}`}
                </StatsCardCompare>
              </StatsCard>
            </StatsGrid>
          </TabPanel>
        )}

        {/* Weekly Tab */}
        {activeTab === 'weekly' && (
          <TabPanel>
            <SectionTitle>
              <FaChartLine /> Weekly Progress
            </SectionTitle>

            <ChartContainer>
              <Line data={weeklyChartData} options={chartOptions} />
            </ChartContainer>

            <StatsGrid>
              <StatsCard>
                <StatsCardTitle>Weekly Total</StatsCardTitle>
                <StatsCardValue>{pomodorosThisWeek} 🍅</StatsCardValue>
                <StatsCardCompare>
                  {`${Math.round(durationThisWeek)} minutes of focus`}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Daily Average</StatsCardTitle>
                <StatsCardValue>{avgPomodorosPerDayWeek.toFixed(1)} 🍅</StatsCardValue>
                <StatsCardCompare>
                  {`${Math.round(durationThisWeek / 7)} minutes per day`}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Most Productive Day</StatsCardTitle>
                <StatsCardValue>{mostProductiveDay}</StatsCardValue>
                <StatsCardCompare>
                  {`${dayOfWeekCounts[mostProductiveDayIndex]} pomodoros`}
                </StatsCardCompare>
              </StatsCard>
            </StatsGrid>

            <SectionTitle>
              <FaCalendarCheck /> Day of Week Analysis
            </SectionTitle>

            <ChartContainer>
              <Bar data={dayOfWeekChartData} options={chartOptions} />
            </ChartContainer>
          </TabPanel>
        )}

        {/* Monthly Tab */}
        {activeTab === 'monthly' && (
          <TabPanel>
            <SectionTitle>
              <FaCalendarAlt /> Monthly Overview
            </SectionTitle>

            <ChartContainer>
              <Line data={monthlyChartData} options={chartOptions} />
            </ChartContainer>

            <StatsGrid>
              <StatsCard>
                <StatsCardTitle>Monthly Total</StatsCardTitle>
                <StatsCardValue>{pomodorosThisMonth} 🍅</StatsCardValue>
                <StatsCardCompare>
                  {`${Math.round(durationThisMonth)} minutes of focus`}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Daily Average</StatsCardTitle>
                <StatsCardValue>{avgPomodorosPerDayMonth.toFixed(1)} 🍅</StatsCardValue>
                <StatsCardCompare>
                  {`${Math.round(durationThisMonth / 30)} minutes per day`}
                </StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Most Productive Day</StatsCardTitle>
                <StatsCardValue>{stats.maxPomodorosInDay} 🍅</StatsCardValue>
                <StatsCardCompare>in a single day</StatsCardCompare>
              </StatsCard>

              <StatsCard>
                <StatsCardTitle>Tasks Completed</StatsCardTitle>
                <StatsCardValue>{stats.completedTasks}</StatsCardValue>
                <StatsCardCompare>this month</StatsCardCompare>
              </StatsCard>
            </StatsGrid>
          </TabPanel>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <TabPanel>
            <SectionTitle>
              <FaStar /> Productivity Insights
            </SectionTitle>

            <InsightsGrid>
              <InsightCard>
                <InsightTitle>Task Efficiency</InsightTitle>
                <ChartContainer style={{ height: '200px' }}>
                  <Pie data={taskCompletionChartData} options={chartOptions} />
                </ChartContainer>
                <InsightDescription>
                  You've completed {stats.completedTasks} tasks using {stats.totalPomodoros} pomodoros.
                  {stats.completedTasks > 0
                    ? ` That's an average of ${(stats.totalPomodoros / stats.completedTasks).toFixed(1)} pomodoros per task.`
                    : ''}
                </InsightDescription>
              </InsightCard>

              <InsightCard>
                <InsightTitle>Productivity Patterns</InsightTitle>
                <InsightContent>
                  <InsightItem>
                    <InsightLabel>Most Productive Day:</InsightLabel>
                    <InsightValue>{mostProductiveDay}</InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Longest Streak:</InsightLabel>
                    <InsightValue>{stats.longestStreak} days</InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Current Streak:</InsightLabel>
                    <InsightValue>{stats.currentStreak} days</InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Best Day Record:</InsightLabel>
                    <InsightValue>{stats.maxPomodorosInDay} pomodoros</InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Weekly Average:</InsightLabel>
                    <InsightValue>{avgPomodorosPerDayWeek.toFixed(1)} pomodoros/day</InsightValue>
                  </InsightItem>
                </InsightContent>
              </InsightCard>

              <InsightCard>
                <InsightTitle>Productivity Tips</InsightTitle>
                <InsightContent>
                  <ProductivityTip>
                    <TipIcon>💡</TipIcon>
                    <TipText>Try to maintain a consistent daily schedule for better focus.</TipText>
                  </ProductivityTip>
                  <ProductivityTip>
                    <TipIcon>💡</TipIcon>
                    <TipText>Take proper breaks between pomodoros to maintain productivity.</TipText>
                  </ProductivityTip>
                  <ProductivityTip>
                    <TipIcon>💡</TipIcon>
                    <TipText>Set clear, achievable goals for each pomodoro session.</TipText>
                  </ProductivityTip>
                  <ProductivityTip>
                    <TipIcon>💡</TipIcon>
                    <TipText>Group similar tasks together to reduce context switching.</TipText>
                  </ProductivityTip>
                </InsightContent>
              </InsightCard>
            </InsightsGrid>
          </TabPanel>
        )}
      </TabContent>

      {/* Achievements Section */}
      <SectionTitle>
        <FaTrophy /> Achievements
      </SectionTitle>

      <AchievementsSection>
        <AchievementsList>
          {achievements.map(achievement => {
            const isUnlocked = stats.unlockedAchievements.includes(achievement.id);

            return (
              <AchievementItem key={achievement.id} isUnlocked={isUnlocked}>
                <AchievementIcon isUnlocked={isUnlocked}>
                  {achievement.icon}
                </AchievementIcon>
                <AchievementContent>
                  <AchievementName>{achievement.name}</AchievementName>
                  <AchievementDescription>
                    {achievement.description}
                  </AchievementDescription>
                  {!isUnlocked && (
                    <AchievementProgress>
                      <ProgressBar>
                        <ProgressFill width={30} /> {/* Mock progress - would need actual calculation */}
                      </ProgressBar>
                    </AchievementProgress>
                  )}
                </AchievementContent>
              </AchievementItem>
            );
          })}
        </AchievementsList>
      </AchievementsSection>
    </StatisticsContainer>
  );
};

// Styled components
const StatisticsContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;

  h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    font-size: 2rem;
    color: #333;
  }
`;

const StatCards = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background-color: ${props => props.theme['--card-bg'] || 'white'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #d95550;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: rgba(217, 85, 80, 0.1);
`;

const StatValue = styled.div`
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #777;
  font-weight: 500;
`;

const LevelSection = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: ${props => props.theme['--card-bg'] || 'white'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const LevelInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LevelTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const LevelXP = styled.div`
  font-size: 1rem;
  color: #777;
`;

const ProgressBar = styled.div`
  height: 0.75rem;
  background-color: #f0f0f0;
  border-radius: 1rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background-color: #4caf50;
  border-radius: 1rem;
  transition: width 0.3s ease;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? '#d95550' : 'transparent'};
  color: ${props => props.active ? 'white' : '#555'};
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-radius: 0.5rem 0.5rem 0 0;

  &:hover {
    background-color: ${props => props.active ? '#d95550' : '#f0f0f0'};
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 768px) {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.9rem;
  }
`;

const TabContent = styled.div`
  margin-bottom: 2rem;
`;

const TabPanel = styled.div`
  background-color: ${props => props.theme['--card-bg'] || 'white'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 1.5rem 0 1rem;

  svg {
    margin-right: 0.5rem;
    color: #d95550;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatsCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StatsCardTitle = styled.div`
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 0.5rem;
`;

const StatsCardValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const StatsCardCompare = styled.div`
  font-size: 0.85rem;
  color: #888;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: 1.5rem 0;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InsightCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const InsightTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const InsightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InsightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const InsightLabel = styled.div`
  font-size: 0.9rem;
  color: #555;
`;

const InsightValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
`;

const InsightDescription = styled.div`
  font-size: 0.9rem;
  color: #555;
  margin-top: 1rem;
  text-align: center;
`;

const ProductivityTip = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TipIcon = styled.div`
  font-size: 1.25rem;
  margin-right: 0.75rem;
`;

const TipText = styled.div`
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
`;

const AchievementsSection = styled.section`
  margin: 2rem 0;
  background-color: ${props => props.theme['--card-bg'] || 'white'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const AchievementsList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AchievementItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background-color: ${props => props.isUnlocked ? '#f9f9f9' : '#f5f5f5'};
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  opacity: ${props => props.isUnlocked ? 1 : 0.8};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const AchievementIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: ${props => props.isUnlocked ? '#ffc107' : '#e0e0e0'};
  margin-right: 1rem;
  font-size: 1.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const AchievementContent = styled.div`
  flex: 1;
`;

const AchievementName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
`;

const AchievementDescription = styled.div`
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 0.5rem;
`;

const AchievementProgress = styled.div`
  margin-top: 0.5rem;
`;

export default Statistics;
