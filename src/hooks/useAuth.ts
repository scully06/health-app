// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { getGoogleClientId } from '../utils/auth';

interface AuthState {
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const isGoogleAuthEnabled = !!getGoogleClientId();

const disabledAuthState: AuthState = {
  accessToken: null,
  isLoading: false,
  login: () => alert('Google Client IDが設定されていません。設定画面から設定してください。'),
  logout: () => {},
};

export const useAuth = (): AuthState => {
  if (!isGoogleAuthEnabled) {
    return disabledAuthState;
  }

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccessToken = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error('バックエンドからのトークン取得に失敗しました。', data);
        throw new Error(data.error || 'Failed to fetch access token from backend.');
      }

      const token = data.access_token;
      setAccessToken(token);
      localStorage.setItem('accessToken', token);
    } catch (error) {
      console.error(error);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => fetchAccessToken(codeResponse.code),
    onError: error => console.error('Googleログインに失敗:', error),
    flow: 'auth-code',
    // 【変更】Google Driveのスコープを追加
    scope: 'https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/drive.file',
  });

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    console.log('ログアウトしました。');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  return { accessToken, isLoading, login, logout };
};
