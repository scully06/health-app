import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface AuthState {
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccessToken = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      //【最重要修正】Viteのプロキシを使わず、直接バックエンドのURLを指定する
      const response = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error('Failed to fetch access token from backend.');
      const data = await response.json();
      const token = data.access_token;
      setAccessToken(token);
      localStorage.setItem('accessToken', token);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => fetchAccessToken(codeResponse.code),
    onError: error => console.error('Login Failed:', error),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.body.read',
  });

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) setAccessToken(storedToken);
  }, []);

  return { accessToken, isLoading, login, logout };
};