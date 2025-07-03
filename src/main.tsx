// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

// 1. 環境変数からクライアントIDを読み込む
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = ReactDOM.createRoot(document.getElementById('root')!);

// 2. クライアントIDが存在するかどうかで、レンダリングする内容を切り替える
if (googleClientId) {
  // --- クライアントIDが存在する場合 ---
  // Google認証を含んだ完全な状態でアプリを起動
  console.log("Google Client ID is found. Initializing with Google OAuth.");
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
} else {
  // --- クライアントIDが存在しない場合 ---
  // Google認証の部品を読み込まずにアプリを起動
  console.warn("Google Client ID is not found. Initializing without Google OAuth features.");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}