// src/utils/auth.ts

const GOOGLE_CLIENT_ID_KEY = 'googleClientId';

/**
 * Google Client IDをlocalStorageから取得します。
 * @returns {string | null} 保存されているClient ID、またはnull
 */
export const getClientIdFromStorage = (): string | null => {
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
};

/**
 * Google Client IDをlocalStorageに保存します。
 * @param {string} clientId - 保存するClient ID
 */
export const saveClientIdToStorage = (clientId: string): void => {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId);
};

/**
 * アプリケーションで使用するGoogle Client IDを取得します。
 * 優先順位: 1. localStorage, 2. 環境変数
 * @returns {string | null} - 利用可能なClient ID、またはnull
 */
export const getGoogleClientId = (): string | null => {
  const storedId = getClientIdFromStorage();
  if (storedId) {
    return storedId;
  }
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId) {
    return envId;
  }
  return null;
};
