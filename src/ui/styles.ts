// src/ui/styles.ts
import React from 'react';

// カード型コンポーネントの共通スタイル
export const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'box-shadow 0.3s ease-in-out',
};

// 入力欄の共通スタイル
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '16px',
  marginTop: '4px',
};

// ボタンの共通スタイル
export const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: 'white',
  backgroundColor: '#3498db', // プライマリカラー
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '16px',
  transition: 'background-color 0.2s',
};