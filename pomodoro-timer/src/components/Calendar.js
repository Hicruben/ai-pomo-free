import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
  FaFlag,
  FaCheckSquare,
  FaCalendarAlt,
  FaCalendarWeek,
  FaPlus
} from 'react-icons/fa';
import { projectApi, taskApi, statsApi, milestoneApi } from '../services/apiService';
import DayDetailModal from './DayDetailModal';
import eventBus from '../utils/eventBus';
import { formatDateToLocalTimezone, processPomodoroDataWithTimezone, processDurationsWithTimezone } from '../utils/statsUtils';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ pomodorosByDate: {}, durationsByDate: {} });
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', 'year'

  // Modal states
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  // Removed unused modal states

  // Function to fetch calendar data
  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      console.log('Calendar: Starting data fetch and aggregation');

      // ALWAYS aggregate the pomodoro data first
      console.log('Calendar: Aggregating pomodoro data...');
      try {
        const aggregationResult = await statsApi.aggregatePomodoros();
        console.log('Calendar: Aggregation result:', aggregationResult);
      } catch (aggregationError) {
        console.error('Calendar: Error aggregating pomodoro data:', aggregationError);
        // Continue even if aggregation fails
      }

      // Fetch all projects
      const projectsData = await projectApi.getProjects();
      setProjects(projectsData);

      // Fetch all tasks
      const tasksData = await taskApi.getTasks();
      setTasks(tasksData);

      // Fetch all milestones from all projects
      const milestonesPromises = projectsData.map(project =>
        milestoneApi.getMilestones(project._id)
      );
      const milestonesResults = await Promise.all(milestonesPromises);
      const allMilestones = milestonesResults.flat();
      setMilestones(allMilestones);

      // Fetch stats for pomodoro counts (now with aggregated data)
      const statsData = await statsApi.getStats();

      // Debug pomodoro counts
      console.log('Calendar: Stats data received:', statsData);
      console.log('Calendar: pomodorosByDate type:', typeof statsData.pomodorosByDate);
      console.log('Calendar: pomodorosByDate instanceof Map:', statsData.pomodorosByDate instanceof Map);

      // Log the raw data from the server before processing
      console.log('Raw pomodoro data from server:');
      if (typeof statsData.pomodorosByDate === 'object' && statsData.pomodorosByDate !== null) {
        Object.entries(statsData.pomodorosByDate).forEach(([dateStr, count]) => {
          console.log(`${dateStr}: ${count} pomodoros`);
        });
      }

      // Get the user's timezone offset for debugging
      const timezoneOffset = -new Date().getTimezoneOffset() / 60;
      console.log(`User's timezone offset: UTC${timezoneOffset >= 0 ? '+' + timezoneOffset : timezoneOffset}`);

      // Process pomodoro data with timezone conversion
      console.log('Processing pomodoro data with timezone conversion:');

      // Use our utility function to convert UTC dates to local timezone dates
      const pomodorosObj = processPomodoroDataWithTimezone(statsData.pomodorosByDate);

      // Log all the dates we found after timezone conversion
      console.log('All dates with pomodoro counts after timezone conversion:');
      Object.entries(pomodorosObj).forEach(([date, count]) => {
        console.log(`${date}: ${count} pomodoros`);
      });

      // Process durations data with timezone conversion if available
      let durationsObj = {};
      if (statsData.durationsByDate) {
        console.log('Processing durations data with timezone conversion:');
        durationsObj = processDurationsWithTimezone(statsData.durationsByDate);

        // Log all the dates we found after timezone conversion
        console.log('All dates with durations after timezone conversion:');
        Object.entries(durationsObj).forEach(([date, duration]) => {
          console.log(`${date}: ${duration} minutes`);
        });
      } else {
        console.log('No durations data available, using default values');
      }

      // Replace the original data with our processed objects
      statsData.pomodorosByDate = pomodorosObj;
      statsData.durationsByDate = durationsObj;
      console.log('Calendar: pomodorosByDate keys after processing:', Object.keys(pomodorosObj));
      console.log('Calendar: durationsByDate keys after processing:', Object.keys(durationsObj));

      // Check for today's pomodoro count using our consistent date format
      const today = new Date();
      const todayString = formatDateForStats(today);

      // Also check yesterday's date (for timezone differences)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = formatDateForStats(yesterday);

      // Get today's count (either from today or yesterday due to timezone)
      let todayCount = pomodorosObj[todayString] || pomodorosObj[yesterdayString] || 0;

      console.log(`Calendar: Today's (${todayString}) pomodoro count:`, todayCount);
      console.log(`Calendar: Yesterday's (${yesterdayString}) pomodoro count:`, pomodorosObj[yesterdayString] || 0);

      // We don't need to add test data anymore
      // Only show real pomodoro data from the database
      if (Object.keys(pomodorosObj).length === 0) {
        console.log('Calendar: No pomodoro data found for this user');
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    // Initial data fetch when page loads
    console.log('Calendar: Initial data fetch on page load');
    fetchCalendarData();
  }, []);

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // View switching
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Day detail modal handlers
  const openDayDetailModal = (date) => {
    setSelectedDate(date);
    setIsDayDetailModalOpen(true);
  };

  const closeDayDetailModal = () => {
    setIsDayDetailModalOpen(false);
  };

  // Removed task and milestone edit modal handlers

  // Helper functions for calendar rendering
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // Convert Sunday (0) to 6, and shift other days back by 1 to make Monday (1) become 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  // Format date as YYYY-MM-DD for pomodoro lookup
  const formatDateForStats = (date) => {
    // Use the utility function from statsUtils
    const formatted = formatDateToLocalTimezone(date);

    // Get timezone offset in hours (e.g., +8 for UTC+8) for logging
    const timezoneOffset = -new Date().getTimezoneOffset() / 60;
    const timezoneString = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;

    // Debug log
    console.log(`Formatting date: ${date} -> ${formatted} (Local timezone: UTC${timezoneString})`);

    return formatted;
  };

  // Get pomodoro count for a specific date
  const getPomodoroCount = (date) => {
    if (!date) return 0;

    // If we don't have stats yet, return 0
    if (!stats || !stats.pomodorosByDate || typeof stats.pomodorosByDate !== 'object') {
      return 0;
    }

    // Format the date as YYYY-MM-DD in local timezone
    const dateString = formatDateForStats(date);

    // Log the date we're looking for
    console.log(`Looking for pomodoros on ${dateString}`);

    // Get the timezone offset in hours for logging
    const timezoneOffset = -new Date().getTimezoneOffset() / 60;
    console.log(`Current timezone offset: UTC${timezoneOffset >= 0 ? '+' + timezoneOffset : timezoneOffset}`);

    // Check for exact match in our processed data
    if (stats.pomodorosByDate[dateString]) {
      console.log(`Found exact date match: ${dateString} with ${stats.pomodorosByDate[dateString]} pomodoros`);
      return stats.pomodorosByDate[dateString];
    }

    // Debug: Log all available dates in the stats object
    console.log('Available dates in stats.pomodorosByDate:');
    Object.keys(stats.pomodorosByDate).forEach(key => {
      console.log(`- ${key}: ${stats.pomodorosByDate[key]} pomodoros`);
    });

    // If no match is found, return 0
    return 0;
  };

  // Get pomodoro duration for a specific date
  const getPomodoroDuration = (date) => {
    if (!date) return 0;

    // If we don't have stats yet, return 0
    if (!stats) return 0;

    // Format the date as YYYY-MM-DD in local timezone
    const dateString = formatDateForStats(date);

    // First check if we have duration data for this date
    if (stats.durationsByDate && typeof stats.durationsByDate === 'object') {
      if (stats.durationsByDate[dateString]) {
        console.log(`Found duration for ${dateString}: ${stats.durationsByDate[dateString]} minutes`);
        return stats.durationsByDate[dateString];
      }

      // Debug: Log all available dates in the durations object
      console.log('Available dates in stats.durationsByDate:');
      Object.keys(stats.durationsByDate).forEach(key => {
        console.log(`- ${key}: ${stats.durationsByDate[key]} minutes`);
      });
    } else {
      console.log('No durationsByDate data available, using default calculation');
    }

    // If no duration data is found, calculate based on pomodoro count
    const count = getPomodoroCount(date);
    const defaultDuration = count * 25;
    console.log(`Using default duration calculation for ${dateString}: ${count} pomodoros * 25 = ${defaultDuration} minutes`);
    return defaultDuration;
  };

  // Check if a date has any milestones
  const getMilestonesForDate = (date) => {
    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.dueDate);
      return (
        milestoneDate.getDate() === date.getDate() &&
        milestoneDate.getMonth() === date.getMonth() &&
        milestoneDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Check if a date has any task deadlines
  const getTaskDeadlinesForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Check if a date is a task due date (for styling purposes)
  const isTaskDueDate = (date) => {
    return getTaskDeadlinesForDate(date).length > 0;
  };

  // Check if a date has any project deadlines
  const getProjectDeadlinesForDate = (date) => {
    return projects.filter(project => {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      return (
        deadline.getDate() === date.getDate() &&
        deadline.getMonth() === date.getMonth() &&
        deadline.getFullYear() === date.getFullYear()
      );
    });
  };

  // Debug function to log all dates in the stats object
  const logAllDates = () => {
    if (stats && stats.pomodorosByDate) {
      console.log('All dates in stats.pomodorosByDate:');

      const dateEntries = Object.entries(stats.pomodorosByDate);
      console.log(`Found ${dateEntries.length} date entries`);

      dateEntries.forEach(([date, count]) => {
        console.log(`Date: ${date}, Pomodoros: ${count}`);
      });
    }
  };

  // Call the debug function when stats change
  useEffect(() => {
    if (stats && stats.pomodorosByDate) {
      logAllDates();
    }
  }, [stats]);

  // We don't need to listen for pomodoro completion events anymore
  // The calendar will only update when the page loads or when the refresh button is clicked

  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date();

    // Log today's date in local timezone
    console.log(`Today in local timezone: ${today.toISOString()} (${formatDateForStats(today)})`);

    // Special check for May 2025 - if we're viewing May 2025, log it
    if (year === 2025 && month === 4) { // month is 0-based, so 4 = May
      console.log('Viewing May 2025 - this is where our special dates are!');

      // Special debug for May 10, 2025 - the date in our database
      const may10 = new Date(2025, 4, 10);
      const may10String = formatDateForStats(may10);
      console.log(`Special check for May 10, 2025 (${may10String}): ${stats.pomodorosByDate[may10String] || 0} pomodoros`);

      // Also check for May 11, 2025 - the date we expect to see in local timezone
      const may11 = new Date(2025, 4, 11);
      const may11String = formatDateForStats(may11);
      console.log(`Special check for May 11, 2025 (${may11String}): ${stats.pomodorosByDate[may11String] || 0} pomodoros`);

      // Also check for the direct string format
      console.log(`Checking for '2025-05-10' directly: ${stats.pomodorosByDate['2025-05-10'] || 0} pomodoros`);
      console.log(`Checking for '2025-05-11' directly: ${stats.pomodorosByDate['2025-05-11'] || 0} pomodoros`);

      // Special timezone check for May 10/11
      const timezoneOffset = -new Date().getTimezoneOffset() / 60;
      console.log(`Your timezone offset is UTC${timezoneOffset >= 0 ? '+' + timezoneOffset : timezoneOffset}`);
      console.log(`A UTC time of 2025-05-10T21:31:04 would be displayed as 2025-05-${timezoneOffset > 0 && (21 + timezoneOffset) >= 24 ? '11' : '10'} in your timezone`);
    }

    // Create array of day cells
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<DayCell key={`empty-${i}`} empty />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const milestoneEvents = getMilestonesForDate(date);
      const taskDeadlines = getTaskDeadlinesForDate(date);
      const projectDeadlines = getProjectDeadlinesForDate(date);
      const pomodoroCount = getPomodoroCount(date);

      days.push(
        <DayCell
          key={`day-${day}`}
          isToday={isToday}
          hasMilestones={milestoneEvents.length > 0}
          hasTaskDeadlines={taskDeadlines.length > 0}
          hasProjectDeadlines={projectDeadlines.length > 0}
          isTaskDueDate={taskDeadlines.length > 0}
          onClick={() => openDayDetailModal(date)}
        >
          <DayNumber isToday={isToday} isTaskDueDate={taskDeadlines.length > 0}>{day}</DayNumber>

          {pomodoroCount > 0 && (
            <PomodoroCount>
              🍅 {pomodoroCount}
            </PomodoroCount>
          )}

          <EventContainer>
            {milestoneEvents.length > 0 && (
              <EventIndicator type="milestone">
                <FaFlag /> {milestoneEvents.length}
              </EventIndicator>
            )}

            {taskDeadlines.length > 0 && (
              <EventIndicator type="task">
                <FaCheckSquare /> {taskDeadlines.length}
              </EventIndicator>
            )}

            {projectDeadlines.length > 0 && (
              <EventIndicator type="project">
                <FaCalendarDay /> {projectDeadlines.length}
              </EventIndicator>
            )}
          </EventContainer>
        </DayCell>
      );
    }

    return days;
  };

  // Month names for header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names for header - starting with Monday
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const day = currentDate.getDay();
    // Adjust to make Monday the first day: if it's Sunday (0), go back 6 days, otherwise go back (day - 1) days
    const daysToSubtract = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(currentDate.getDate() - daysToSubtract);

    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      const milestoneEvents = getMilestonesForDate(date);
      const taskDeadlines = getTaskDeadlinesForDate(date);
      const projectDeadlines = getProjectDeadlinesForDate(date);
      const pomodoroCount = getPomodoroCount(date);

      days.push(
        <WeekDayCell
          key={`week-day-${i}`}
          isToday={isToday}
          isTaskDueDate={taskDeadlines.length > 0}
          onClick={() => openDayDetailModal(date)}
        >
          <WeekDayHeader isToday={isToday} isTaskDueDate={taskDeadlines.length > 0}>
            <WeekDayName>{dayNames[i]}</WeekDayName>
            <WeekDayNumber>{date.getDate()}</WeekDayNumber>
          </WeekDayHeader>

          <WeekDayContent>
            {pomodoroCount > 0 && (
              <WeekDayEvent type="pomodoro">
                🍅 {pomodoroCount} Pomodoros
              </WeekDayEvent>
            )}

            {milestoneEvents.map((milestone, idx) => (
              <WeekDayEvent key={`milestone-${idx}`} type="milestone">
                <FaFlag /> {milestone.title}
              </WeekDayEvent>
            ))}

            {taskDeadlines.map((task, idx) => (
              <WeekDayEvent key={`task-${idx}`} type="task">
                <FaCheckSquare /> {task.title}
              </WeekDayEvent>
            ))}

            {projectDeadlines.map((project, idx) => (
              <WeekDayEvent key={`project-${idx}`} type="project">
                <FaCalendarDay /> {project.title}
              </WeekDayEvent>
            ))}
          </WeekDayContent>
        </WeekDayCell>
      );
    }

    return (
      <WeekViewContainer>
        {days}
      </WeekViewContainer>
    );
  };

  // Render year view
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      // Use our adjusted getFirstDayOfMonth function that starts weeks on Monday
      const firstDay = getFirstDayOfMonth(year, month);
      const daysInMonth = getDaysInMonth(year, month);
      const monthDays = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        monthDays.push(<YearDayCell key={`empty-${month}-${i}`} empty />);
      }

      // Add cells for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday =
          date.getDate() === new Date().getDate() &&
          date.getMonth() === new Date().getMonth() &&
          date.getFullYear() === new Date().getFullYear();

        const milestones = getMilestonesForDate(date);
        const taskDeadlines = getTaskDeadlinesForDate(date);
        const projectDeadlines = getProjectDeadlinesForDate(date);
        const pomodoroCount = getPomodoroCount(date);

        const hasEvents =
          milestones.length > 0 ||
          taskDeadlines.length > 0 ||
          projectDeadlines.length > 0 ||
          pomodoroCount > 0;

        monthDays.push(
          <YearDayCell
            key={`day-${month}-${day}`}
            isToday={isToday}
            hasEvents={hasEvents}
            isTaskDueDate={taskDeadlines.length > 0}
            onClick={() => {
              setCurrentDate(date);
              setCurrentView('month');
            }}
          >
            {day}
          </YearDayCell>
        );
      }

      months.push(
        <MonthCard key={`month-${month}`}>
          <MonthCardHeader>
            {monthNames[month]}
          </MonthCardHeader>
          <YearCalendarGrid>
            {dayNames.map(day => (
              <YearDayNameCell key={`${month}-${day}`}>{day.charAt(0)}</YearDayNameCell>
            ))}
            {monthDays}
          </YearCalendarGrid>
        </MonthCard>
      );
    }

    return (
      <YearViewContainer>
        {months}
      </YearViewContainer>
    );
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        {loading && (
          <LoadingIndicator>
            Aggregating pomodoro data...
          </LoadingIndicator>
        )}
        <CalendarTitle>
          <h2>Calendar</h2>
          <AddButton title="Create new item">
            <FaPlus />
          </AddButton>
        </CalendarTitle>

        <CalendarControls>
          <ViewControls>
            <ViewButton
              isActive={currentView === 'month'}
              onClick={() => handleViewChange('month')}
            >
              <FaCalendarAlt />
              <span>Month</span>
            </ViewButton>
            <ViewButton
              isActive={currentView === 'week'}
              onClick={() => handleViewChange('week')}
            >
              <FaCalendarWeek />
              <span>Week</span>
            </ViewButton>
            <ViewButton
              isActive={currentView === 'year'}
              onClick={() => handleViewChange('year')}
            >
              <FaCalendarDay />
              <span>Year</span>
            </ViewButton>
          </ViewControls>

          <NavigationControls>
            <TodayButton onClick={goToToday}>
              Today
            </TodayButton>
            <TodayButton
              onClick={async () => {
                // Refresh the calendar data
                console.log('Manual refresh of calendar data');
                await fetchCalendarData();

                // Navigate to current month
                setCurrentDate(new Date());
                setCurrentView('month');
              }}
              style={{
                marginLeft: '5px',
                backgroundColor: loading ? '#999' : '#ff9800',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Calendar'}
            </TodayButton>
            <NavButton onClick={goToPreviousMonth}>
              <FaChevronLeft />
            </NavButton>
            <MonthDisplay>
              {currentView === 'year' ? currentDate.getFullYear() :
               `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </MonthDisplay>
            <NavButton onClick={goToNextMonth}>
              <FaChevronRight />
            </NavButton>
          </NavigationControls>
        </CalendarControls>
      </CalendarHeader>

      {loading ? (
        <LoadingMessage>Loading calendar data...</LoadingMessage>
      ) : (
        <>
          {currentView === 'month' && (
            <CalendarGrid>
              {/* Day names header */}
              {dayNames.map(day => (
                <DayNameCell key={day}>{day}</DayNameCell>
              ))}

              {/* Calendar days */}
              {renderCalendar()}
            </CalendarGrid>
          )}

          {currentView === 'week' && renderWeekView()}

          {currentView === 'year' && renderYearView()}
        </>
      )}

      <CalendarLegend>
        <LegendItem>
          <LegendColor color="#d95550" /> 🍅 Completed Pomodoros
        </LegendItem>
        <LegendItem>
          <LegendColor color="#4caf50" /> <FaFlag /> Milestones
        </LegendItem>
        <LegendItem>
          <LegendColor color="#2196f3" /> <FaCheckSquare /> Task Deadlines
          <LegendBorder color="#2196f3" />
        </LegendItem>
        <LegendItem>
          <LegendColor color="#ff9800" /> <FaCalendarDay /> Project Deadlines
        </LegendItem>
      </CalendarLegend>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={isDayDetailModalOpen}
          onClose={closeDayDetailModal}
          date={selectedDate}
          milestones={getMilestonesForDate(selectedDate)}
          tasks={getTaskDeadlinesForDate(selectedDate)}
          projects={getProjectDeadlinesForDate(selectedDate)}
          pomodoroCount={getPomodoroCount(selectedDate)}
          pomodoroDuration={getPomodoroDuration(selectedDate)}
        />
      )}

      {/* Removed Task and Milestone Edit Modals */}
    </CalendarContainer>
  );
};

// Styled components
const CalendarContainer = styled.div`
  padding: 1rem;
  background-color: ${props => props.theme['--card-bg']};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const CalendarHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const CalendarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  h2 {
    margin: 0;
    color: ${props => props.theme['--text-color']};
  }
`;

const CalendarControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.5rem;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid ${props => props.theme['--border-color']};
`;

const ViewButton = styled.button`
  background-color: ${props => props.isActive ? props.theme['--primary-color'] : 'transparent'};
  color: ${props => props.isActive ? 'white' : props.theme['--text-color']};
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: ${props => props.isActive ? props.theme['--primary-color'] : props.theme['--hover-bg']};
  }
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${props => props.theme['--text-color']};
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme['--hover-bg']};
  }
`;

const TodayButton = styled.button`
  background-color: ${props => props.theme['--primary-color']};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;

  &:hover {
    background-color: ${props => props.theme['--primary-dark']};
  }
`;

const AddButton = styled.button`
  background-color: ${props => props.theme['--primary-color']};
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme['--primary-dark']};
  }
`;

const MonthDisplay = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 200px;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem; /* Increased gap between cells */
  margin-bottom: 1rem; /* Add some bottom margin */
  border: 1px solid ${props => props.theme['--border-color']};
  border-radius: 8px;
  padding: 0.75rem;
  background-color: ${props => props.theme['--bg-color'] || '#f9f9f9'};
`;

const DayNameCell = styled.div`
  text-align: center;
  padding: 0.75rem; /* Increased padding */
  font-weight: bold;
  font-size: 1.1rem; /* Increased font size */
  color: ${props => props.theme['--text-secondary']};
  margin-bottom: 0.5rem; /* Add some bottom margin */
`;

const DayCell = styled.div`
  min-height: 150px; /* Increased from 100px to 150px */
  padding: 0.75rem; /* Increased padding */
  border-radius: 4px;
  background-color: ${props =>
    props.empty ? 'transparent' :
    props.isToday ? 'rgba(217, 85, 80, 0.1)' : // Explicit light red background for today
    props.theme['--day-bg'] || 'white'};
  border: ${props =>
    props.isToday ? `2px solid ${props.theme['--primary-color'] || '#d95550'}` :
    props.isTaskDueDate ? `2px dashed ${props.theme['--task-due-color'] || '#2196f3'}` :
    `1px solid ${props.theme['--border-color'] || '#ddd'}`};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Subtle shadow for all cells */
  opacity: ${props => props.empty ? 0 : 1};
  position: relative;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const DayNumber = styled.div`
  font-weight: ${props => (props.isToday || props.isTaskDueDate) ? 'bold' : 'normal'};
  font-size: 1.2rem; /* Increased font size */
  color: ${props =>
    props.isToday ? props.theme['--primary-color'] :
    props.isTaskDueDate ? props.theme['--task-due-color'] || '#2196f3' :
    props.theme['--text-color']};
  margin-bottom: 0.75rem; /* Increased margin */
  padding: 0.25rem; /* Added padding */
`;

const PomodoroCount = styled.div`
  font-size: 1.1rem; /* Increased font size */
  font-weight: bold; /* Made it bold */
  color: #d95550;
  margin-bottom: 0.75rem; /* Increased margin */
  padding: 0.25rem 0.5rem; /* Added padding */
  background-color: rgba(217, 85, 80, 0.1); /* Light background */
  border-radius: 4px; /* Rounded corners */
  display: inline-block; /* Make it only as wide as needed */
`;

const EventContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const EventIndicator = styled.div`
  font-size: 0.9rem; /* Increased font size */
  padding: 0.25rem 0.5rem; /* Increased padding */
  border-radius: 4px; /* Increased border radius */
  display: flex;
  align-items: center;
  gap: 0.35rem; /* Increased gap */
  margin-bottom: 0.25rem; /* Added margin between indicators */
  font-weight: 500; /* Made it slightly bold */

  background-color: ${props => {
    switch(props.type) {
      case 'milestone': return 'rgba(76, 175, 80, 0.2)';
      case 'task': return 'rgba(33, 150, 243, 0.2)';
      case 'project': return 'rgba(255, 152, 0, 0.2)';
      default: return 'rgba(0, 0, 0, 0.1)';
    }
  }};

  color: ${props => {
    switch(props.type) {
      case 'milestone': return '#4caf50';
      case 'task': return '#2196f3';
      case 'project': return '#ff9800';
      default: return props.theme['--text-color'];
    }
  }};
`;

// Week view styled components
const WeekViewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem; /* Increased gap to match CalendarGrid */
  min-height: 600px; /* Increased from 500px to 600px */
  border: 1px solid ${props => props.theme['--border-color']};
  border-radius: 8px;
  padding: 0.75rem;
  background-color: ${props => props.theme['--bg-color'] || '#f9f9f9'};
  margin-bottom: 1rem;
`;

const WeekDayCell = styled.div`
  padding: 0.75rem; /* Increased padding */
  border-radius: 4px;
  background-color: ${props =>
    props.isToday ? 'rgba(217, 85, 80, 0.1)' : // Explicit light red background for today
    props.theme['--day-bg'] || 'white'};
  border: ${props =>
    props.isToday ? `2px solid ${props.theme['--primary-color'] || '#d95550'}` :
    props.isTaskDueDate ? `2px dashed ${props.theme['--task-due-color'] || '#2196f3'}` :
    `1px solid ${props.theme['--border-color'] || '#ddd'}`};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Subtle shadow for all cells */
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  height: 100%; /* Make sure it takes full height */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme['--primary-color'] || '#d95550'};
  }
`;

const WeekDayHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid ${props => props.theme['--border-color']};
  color: ${props =>
    props.isToday ? props.theme['--primary-color'] :
    props.isTaskDueDate ? props.theme['--task-due-color'] || '#2196f3' :
    props.theme['--text-color']};
`;

const WeekDayName = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
`;

const WeekDayNumber = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const WeekDayContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
`;

const WeekDayEvent = styled.div`
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  background-color: ${props => {
    switch(props.type) {
      case 'pomodoro': return 'rgba(217, 85, 80, 0.2)';
      case 'milestone': return 'rgba(76, 175, 80, 0.2)';
      case 'task': return 'rgba(33, 150, 243, 0.2)';
      case 'project': return 'rgba(255, 152, 0, 0.2)';
      default: return 'rgba(0, 0, 0, 0.1)';
    }
  }};

  color: ${props => {
    switch(props.type) {
      case 'pomodoro': return '#d95550';
      case 'milestone': return '#4caf50';
      case 'task': return '#2196f3';
      case 'project': return '#ff9800';
      default: return props.theme['--text-color'];
    }
  }};
`;

// Year view styled components
const YearViewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  border: 1px solid ${props => props.theme['--border-color']};
  border-radius: 8px;
  padding: 0.75rem;
  background-color: ${props => props.theme['--bg-color'] || '#f9f9f9'};
  margin-bottom: 1rem;
`;

const MonthCard = styled.div`
  border: 1px solid ${props => props.theme['--border-color']};
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Subtle shadow */
  background-color: white;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const MonthCardHeader = styled.div`
  background-color: ${props => props.theme['--primary-color']};
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
`;

const YearCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 0.5rem;
`;

const YearDayNameCell = styled.div`
  text-align: center;
  font-size: 0.7rem;
  color: ${props => props.theme['--text-secondary']};
  padding: 0.2rem 0;
`;

const YearDayCell = styled.div`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  border-radius: 50%;
  cursor: ${props => props.empty ? 'default' : 'pointer'};
  opacity: ${props => props.empty ? 0 : 1};
  background-color: ${props => {
    if (props.empty) return 'transparent';
    if (props.isToday) return props.theme['--primary-color'];
    if (props.isTaskDueDate) return 'rgba(33, 150, 243, 0.3)'; // Task due date color
    if (props.hasEvents) return 'rgba(217, 85, 80, 0.2)';
    return 'transparent';
  }};
  color: ${props => {
    if (props.isToday) return 'white';
    if (props.isTaskDueDate) return props.theme['--task-due-color'] || '#2196f3';
    return props.theme['--text-color'];
  }};

  &:hover {
    background-color: ${props => {
      if (props.empty) return 'transparent';
      if (props.isToday) return props.theme['--primary-color'];
      if (props.isTaskDueDate) return 'rgba(33, 150, 243, 0.4)'; // Darker on hover
      return props.theme['--hover-bg'];
    }};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary']};
`;

const LoadingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: #4caf50;
  color: white;
  text-align: center;
  padding: 0.5rem;
  font-weight: bold;
  z-index: 10;
  border-radius: 4px 4px 0 0;
`;

const CalendarLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme['--border-color']};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.theme['--text-secondary']};
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

const LegendBorder = styled.div`
  width: 20px;
  height: 10px;
  border: 2px dashed ${props => props.color};
  margin-left: 5px;
  border-radius: 2px;
`;

export default Calendar;
