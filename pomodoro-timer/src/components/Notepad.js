import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const LOCAL_KEY = 'pomodoroNotepad';

const Notepad = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, text);
  }, [text]);

  const handleClear = () => {
    setText('');
    localStorage.removeItem(LOCAL_KEY);
  };

  const handleExport = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notepad.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PadContainer>
      <PadHeader>
        <PadTitle>Notepad</PadTitle>
        <PadActions>
          <PadBtn onClick={handleExport}>Export</PadBtn>
          <PadBtn onClick={handleClear}>Clear</PadBtn>
        </PadActions>
      </PadHeader>
      <PadTextarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write down your thoughts, todos, or anything..."
        rows={12}
      />
    </PadContainer>
  );
};

const PadContainer = styled.div`
  background: #fffbe6;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 1.2rem 1.2rem 1.2rem 1.2rem;
  width: 100%;
  max-width: 400px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
`;
const PadHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
`;
const PadTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
`;
const PadActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;
const PadBtn = styled.button`
  background: #ffe066;
  color: #222;
  border: none;
  border-radius: 0.5rem;
  padding: 0.3rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #ffd23f; }
`;
const PadTextarea = styled.textarea`
  width: 100%;
  min-height: 180px;
  resize: vertical;
  border-radius: 0.7rem;
  border: 1px solid #ffe066;
  padding: 0.8rem;
  font-size: 1.05rem;
  font-family: inherit;
  background: #fff;
  margin-top: 0.2rem;
  box-sizing: border-box;
`;

export default Notepad; 