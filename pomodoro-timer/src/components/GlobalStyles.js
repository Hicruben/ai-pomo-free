import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --bg-color: #f7f7f8;
    --text-color: #222;
    --card-bg: #fff;
    --header-bg: #f7f7f8;
    --header-text: #222;
    --nav-bg: #f7f7f8;
    --nav-text: #555;
    --nav-hover-bg: #ececec;
    --nav-active-bg: #e3e3e6;
    --nav-active-text: #d95550;
    --accent: #d95550;
  }

  html, body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    transition: background-color 0.3s, color 0.3s;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  ::selection {
    background: #ffe3e3;
  }

  /* Minimal, subtle scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    background: #f0f0f0;
  }
  ::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 4px;
  }
`;

export default GlobalStyles;
