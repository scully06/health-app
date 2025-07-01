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
      // バックエンドサーバー(server.js)のエンドポイントを呼び出す
      const response = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        throw new Error('バックエンドからのアクセストークン取得に失敗しました。');
      }
      const data = await response.json();
      const token = data.access_token;
      setAccessToken(token);
      localStorage.setItem('accessToken', token); // トークンをローカルストレージに保存
    } catch (error) {
      console.error(error);
      setAccessToken(null); // エラー時はトークンをクリア
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => fetchAccessToken(codeResponse.code),
    onError: error => console.error('Googleログインに失敗:', error),
    flow: 'auth-code', // サーバーサイドでトークンを扱うため 'auth-code' フローが必須
    //【重要】scopeプロパティを修正。睡眠データ読み取り権限を追加
    scope: 'https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.body.read',
  });

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    console.log('ログアウトしました。');
  };

  // アプリ起動時にローカルストレージからトークンを読み込む
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  return { accessToken, isLoading, login, logout };
};