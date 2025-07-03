// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { getGoogleClientId } from './utils/auth'; // 【変更】

const googleClientId = getGoogleClientId(); // 【変更】

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (googleClientId) {
  console.log("Google Client ID is found. Initializing with Google OAuth.");
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
} else {
  console.warn("Google Client ID is not found. Initializing without Google OAuth features.");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
