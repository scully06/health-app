// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
//【変更】AppWrapperをインポート
import AppWrapper from './App.tsx'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/*【変更】AppWrapperをレンダリング */}
    <AppWrapper />
  </React.StrictMode>,
);