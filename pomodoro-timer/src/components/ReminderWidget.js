import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { remindersApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';
import { FiBell, FiSun, FiMoon, FiCoffee, FiCloud, FiArchive, FiCalendar } from 'react-icons/fi';

const quickOptions = [
  {
    key: 'laterToday',
    icon: <FiSun size={32} />, label: 'Later Today',
    getTime: () => {
      const now = new Date();
      const later = new Date(now);
      later.setHours(17, 0, 0, 0); // 5PM
      if (now > later) later.setDate(later.getDate() + 1);
      return later;
    },
    sub: '5 PM'
  },
  {
    key: 'thisEvening',
    icon: <FiMoon size={32} />, label: 'This Evening',
    getTime: () => {
      const now = new Date();
      const evening = new Date(now);
      evening.setHours(19, 0, 0, 0); // 7PM
      if (now > evening) evening.setDate(evening.getDate() + 1);
      return evening;
    },
    sub: '7 PM'
  },
  {
    key: 'tomorrow',
    icon: <FiCoffee size={32} />, label: 'Tomorrow',
    getTime: () => {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      tmr.setHours(9, 0, 0, 0); // 9AM
      return tmr;
    },
    sub: 'Mon, 9 AM'
  },
  {
    key: 'nextWeek',
    icon: <FiCloud size={32} />, label: 'Next Week',
    getTime: () => {
      const nw = new Date();
      nw.setDate(nw.getDate() + (7 - nw.getDay() + 1)); // 下周一
      nw.setHours(9, 0, 0, 0);
      return nw;
    },
    sub: () => {
      const nw = new Date();
      nw.setDate(nw.getDate() + (7 - nw.getDay() + 1));
      return nw.toLocaleDateString();
    }
  },
  {
    key: 'someday',
    icon: <FiArchive size={32} />, label: 'Someday',
    getTime: () => null,
    sub: ''
  },
  {
    key: 'custom',
    icon: <FiCalendar size={32} />, label: 'Custom',
    getTime: null,
    sub: ''
  }
];

const ReminderWidget = () => {
  const [reminder, setReminder] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminders, setReminders] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('one');
  const [showCustom, setShowCustom] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [popupTime, setPopupTime] = useState('');
  const [popupLabel, setPopupLabel] = useState('');

  // 请求浏览器通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 加载提醒
  useEffect(() => {
    if (isAuthenticated()) {
      remindersApi.getReminders().then(data => {
        setReminders(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      // 游客本地存储
      const local = localStorage.getItem('pomodoroReminders');
      setReminders(local ? JSON.parse(local) : []);
      setLoading(false);
    }
  }, []);

  // 定时检查提醒
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      reminders.forEach((r, idx) => {
        if (r.time && !r.triggered) {
          const rTime = new Date(r.time);
          if (now >= rTime) {
            // 浏览器通知
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(r.text || 'Reminder', {
                body: r.time ? new Date(r.time).toLocaleString() : '',
                icon: '/favicon.ico',
              });
            }
            setAlertMsg(r.text);
            setShowAlert(true);
            handleTriggerReminder(r, idx);
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [reminders]);

  // 添加提醒
  const handleAddReminder = async (text, time) => {
    if (!text) return;
    const newReminder = {
      text,
      time: time ? new Date(time).toISOString() : '',
      triggered: false
    };
    setReminder('');
    setReminderTime('');
    setShowCustom(false);
    setPopupOpen(false);
    setPopupText('');
    setPopupTime('');
    setPopupLabel('');
    if (isAuthenticated()) {
      const saved = await remindersApi.createReminder(newReminder);
      setReminders([...reminders, saved]);
    } else {
      const updated = [...reminders, newReminder];
      setReminders(updated);
      localStorage.setItem('pomodoroReminders', JSON.stringify(updated));
    }
  };

  // 标记提醒已触发
  const handleTriggerReminder = async (reminderObj, idx) => {
    if (isAuthenticated() && reminderObj._id) {
      await remindersApi.updateReminder(reminderObj._id, { ...reminderObj, triggered: true });
      setReminders(reminders => reminders.map((r, i) => i === idx ? { ...r, triggered: true } : r));
    } else {
      const updated = reminders.map((r, i) => i === idx ? { ...r, triggered: true } : r);
      setReminders(updated);
      localStorage.setItem('pomodoroReminders', JSON.stringify(updated));
    }
  };

  // 删除提醒
  const handleDeleteReminder = async (reminderObj, idx) => {
    if (isAuthenticated() && reminderObj._id) {
      await remindersApi.deleteReminder(reminderObj._id);
      setReminders(reminders.filter((r, i) => i !== idx));
    } else {
      const updated = reminders.filter((r, i) => i !== idx);
      setReminders(updated);
      localStorage.setItem('pomodoroReminders', JSON.stringify(updated));
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    setAlertMsg('');
  };

  const handleQuickOption = (opt) => {
    if (opt.key === 'custom') {
      setPopupLabel('Custom');
      setPopupText('');
      setPopupTime('');
      setPopupOpen(true);
      return;
    }
    if (opt.key === 'someday') {
      setPopupLabel('Someday');
      setPopupText('');
      setPopupTime('');
      setPopupOpen(true);
      return;
    }
    const time = opt.getTime ? opt.getTime() : '';
    setPopupLabel(opt.label);
    setPopupText('');
    setPopupTime(time ? toDatetimeLocal(time) : '');
    setPopupOpen(true);
  };

  // 辅助函数：Date -> yyyy-MM-ddTHH:mm
  function toDatetimeLocal(date) {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }

  return (
    <WidgetContainer>
      <HeaderRow>
        <Title>Add Reminder</Title>
        <BellBtn><FiBell size={28} /></BellBtn>
      </HeaderRow>
      {tab === 'one' && (
        <QuickGrid>
          {quickOptions.map(opt => (
            <QuickBtn key={opt.key} onClick={() => handleQuickOption(opt)}>
              {opt.icon}
              <QuickLabel>{opt.label}</QuickLabel>
              <QuickSub>{typeof opt.sub === 'function' ? opt.sub() : opt.sub}</QuickSub>
            </QuickBtn>
          ))}
        </QuickGrid>
      )}
      {showCustom && (
        <CustomInputRow>
          <ReminderInput
            type="text"
            placeholder="Enter your reminder..."
            value={reminder}
            onChange={e => setReminder(e.target.value)}
          />
          <TimeInput
            type="datetime-local"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
          />
          <AddButton onClick={() => handleAddReminder(reminder, reminderTime)}>Add</AddButton>
        </CustomInputRow>
      )}
      {popupOpen && (
        <PopupOverlay>
          <PopupBox>
            <PopupTitle>{popupLabel}</PopupTitle>
            <PopupInput
              type="text"
              placeholder="Enter reminder..."
              value={popupText}
              onChange={e => setPopupText(e.target.value)}
              autoFocus
            />
            <PopupTimeInput
              type="datetime-local"
              value={popupTime}
              onChange={e => setPopupTime(e.target.value)}
            />
            <PopupBtnRow>
              <PopupBtn onClick={() => setPopupOpen(false)}>Cancel</PopupBtn>
              <PopupBtnPrimary onClick={() => handleAddReminder(popupText, popupTime)}>Add</PopupBtnPrimary>
            </PopupBtnRow>
          </PopupBox>
        </PopupOverlay>
      )}
      {loading ? <div>Loading...</div> : null}
      <RemindersList>
        {reminders.map((r, idx) => (
          <ReminderItem key={r._id || idx} triggered={r.triggered}>
            <span>{r.text}</span>
            {r.time && <TimeTag>{new Date(r.time).toLocaleString()}</TimeTag>}
            {r.triggered && <TriggeredTag>Triggered</TriggeredTag>}
            <DeleteBtn onClick={() => handleDeleteReminder(r, idx)}>Delete</DeleteBtn>
          </ReminderItem>
        ))}
      </RemindersList>
      {showAlert && (
        <AlertBox>
          <span>⏰ {alertMsg}</span>
          <CloseAlert onClick={handleCloseAlert}>Close</CloseAlert>
        </AlertBox>
      )}
    </WidgetContainer>
  );
};

const WidgetContainer = styled.div`
  background: #fffbe6;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 1.5rem 1.2rem 1.2rem 1.2rem;
  margin-top: 2rem;
  width: 100%;
  max-width: 400px;
`;
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
`;
const Title = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
`;
const BellBtn = styled.button`
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px #0001;
  cursor: pointer;
`;
const Tabs = styled.div`
  display: flex;
  background: #f2f2f2;
  border-radius: 1.5rem;
  margin-bottom: 1.2rem;
  overflow: hidden;
`;
const Tab = styled.button`
  flex: 1;
  padding: 0.32rem 0;
  font-size: 0.85rem;
  font-weight: ${props => props.active ? 600 : 400};
  border: none;
  background: ${props => props.active ? '#222' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#888'};
  border-radius: 1.5rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  letter-spacing: 0.01em;
`;
const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.1rem;
  margin-bottom: 1.2rem;
`;
const QuickBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffe066;
  border: 3px solid #ffa500;
  border-radius: 50%;
  width: 110px;
  height: 110px;
  box-shadow: 0 2px 8px #0001;
  cursor: pointer;
  transition: border 0.2s, box-shadow 0.2s, background 0.2s;
  &:hover {
    border: 3px solid #ff8800;
    background: #ffd23f;
    box-shadow: 0 4px 16px #ffa50022;
  }
`;
const QuickLabel = styled.div`
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 0.3rem;
`;
const QuickSub = styled.div`
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.1rem;
`;
const CustomInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;
const ReminderInput = styled.input`
  flex: 2;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;
const TimeInput = styled.input`
  flex: 1.2;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;
const AddButton = styled.button`
  flex: 0.8;
  background: #ffa500;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #ff8800; }
`;
const RemindersList = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const ReminderItem = styled.div`
  background: ${props => props.triggered ? '#ffe0b2' : '#f5f5f5'};
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
`;
const TimeTag = styled.span`
  background: #ffa50022;
  color: #ff8800;
  border-radius: 0.3rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.9rem;
`;
const TriggeredTag = styled.span`
  background: #ff9800;
  color: #fff;
  border-radius: 0.3rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.8rem;
`;
const DeleteBtn = styled.button`
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 0.3rem;
  padding: 0.1rem 0.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 0.5rem;
  &:hover { background: #d9363e; }
`;
const AlertBox = styled.div`
  position: fixed;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fffbe7;
  color: #ff9800;
  border: 2px solid #ff9800;
  border-radius: 1rem;
  padding: 2rem 2.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  z-index: 9999;
  box-shadow: 0 4px 32px #0002;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const CloseAlert = styled.button`
  margin-top: 1.5rem;
  background: #ff9800;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #ffa500; }
`;
const PopupOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const PopupBox = styled.div`
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 4px 32px #0002;
  padding: 2rem 2.2rem 1.5rem 2.2rem;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;
const PopupTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1.1rem;
`;
const PopupInput = styled.input`
  font-size: 1rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  margin-bottom: 1rem;
`;
const PopupTimeInput = styled.input`
  font-size: 1rem;
  padding: 0.5rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  margin-bottom: 1.2rem;
`;
const PopupBtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;
const PopupBtn = styled.button`
  background: #eee;
  color: #333;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
`;
const PopupBtnPrimary = styled(PopupBtn)`
  background: #ffa500;
  color: #fff;
  &:hover { background: #ff8800; }
`;

export default ReminderWidget; 